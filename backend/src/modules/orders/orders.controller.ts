import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, OPERATIONS_ROLES, authenticate } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
export const ordersRouter = Router();
ordersRouter.use(authenticate);

const isAdmin = (role: string) => ADMIN_ROLES.includes(role);
const canOperate = (role: string) => OPERATIONS_ROLES.includes(role);
const includeOrder = { items: true, payments: { orderBy: { createdAt: 'desc' as const } }, parcels: true, customer: { select: { fullName: true, phone: true, customerCode: true } } };

async function buyRate() {
  const row = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
  if (!row) return 3650;
  try { return Number(JSON.parse(row.value).rateBuyForMe) || 3650; } catch { return 3650; }
}

function paymentKey(req: any, purpose: string, orderId: string) {
  return String(req.headers['idempotency-key'] || req.body?.idempotencyKey || `${purpose}-${orderId}-${Date.now()}`).slice(0, 160);
}

ordersRouter.get('/', async (req, res, next) => {
  try {
    const where: Prisma.OrderWhereInput = { deletedAt: null, ...(isAdmin(req.user!.roleCode) || canOperate(req.user!.roleCode) ? {} : { customerId: req.user!.id }) };
    const data = await prisma.order.findMany({ where, include: includeOrder, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, deletedAt: null }, include: includeOrder });
    if (!order || (!isAdmin(req.user!.roleCode) && !canOperate(req.user!.roleCode) && order.customerId !== req.user!.id)) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const { platform = '1688', items, notes } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm' });
    const normalized = items.map((item: any) => ({ productName: String(item.productName || '').trim(), productUrl: item.productUrl || null, imageUrl: item.imageUrl || null, attributes: item.attributes || null, quantity: Number(item.quantity), unitPriceCny: Number(item.unitPriceCny ?? item.priceCny ?? item.totalRmb / item.quantity) }));
    if (normalized.some((item) => !item.productName || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPriceCny) || item.unitPriceCny <= 0)) return res.status(400).json({ success: false, message: 'Thông tin sản phẩm không hợp lệ' });
    const exchangeRate = await buyRate();
    const totalCny = normalized.reduce((sum, item) => sum + item.quantity * item.unitPriceCny, 0);
    const subtotalVnd = Math.round(totalCny * exchangeRate);
    const serviceFeeVnd = Math.round(subtotalVnd * 0.02);
    const totalVnd = subtotalVnd + serviceFeeVnd;
    const depositRequiredVnd = Math.round(totalVnd * 0.7);
    const data = await prisma.order.create({ data: { orderCode: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, customerId: req.user!.id, platform, exchangeRate, subtotalVnd, serviceFeeVnd, totalVnd, depositRequiredVnd, remainingVnd: totalVnd, notes, items: { create: normalized.map((item) => ({ ...item, totalCny: item.quantity * item.unitPriceCny })) } }, include: includeOrder });
    await prisma.notification.create({
      data: {
        title: `Đơn mua hộ mới ${data.orderCode}`,
        message: `${data.platform.toUpperCase()} - ${normalized.length} sản phẩm, trị giá ${totalVnd.toLocaleString('vi-VN')} VND`,
        type: 'ORDER_CREATED',
        targetRole: 'ADMIN',
      },
    });
    void EmailService.notifyAdminAlert({
      title: `Đơn Mua Hộ Mới: ${data.orderCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa tạo đơn mua hộ trên sàn ${data.platform.toUpperCase()} gồm ${normalized.length} sản phẩm, tổng giá trị ${totalVnd.toLocaleString('vi-VN')} ₫.`,
      linkUrl: '/admin/orders',
      metadata: {
        orderCode: data.orderCode,
        platform: data.platform.toUpperCase(),
        totalVnd,
        depositRequiredVnd,
        itemCount: normalized.length,
        customerName: req.user?.fullName,
        customerPhone: req.user?.phone,
        customerEmail: req.user?.email,
      },
    });
    void TelegramService.notifyNewOrder({
      orderCode: data.orderCode,
      platform: data.platform,
      customerName: req.user?.fullName,
      customerPhone: req.user?.phone,
      itemCount: normalized.length,
      totalVnd,
      depositRequiredVnd,
    });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

ordersRouter.patch('/:id', async (req, res, next) => {
  try {
    const current = await prisma.order.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!current || (!isAdmin(req.user!.roleCode) && current.customerId !== req.user!.id)) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    if (!isAdmin(req.user!.roleCode) && current.status !== 'PENDING') return res.status(409).json({ success: false, message: 'Chỉ có thể sửa đơn đang chờ xử lý' });
    const status = req.body.status as string | undefined;
    const adminTransitions: Record<string, string[]> = { PENDING: ['CANCELLED'], DEPOSITED: ['PURCHASING', 'CANCELLED'], PURCHASING: ['PURCHASED', 'CANCELLED'], PURCHASED: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
    if (status) {
      if (!isAdmin(req.user!.roleCode) || !adminTransitions[current.status]?.includes(status)) return res.status(409).json({ success: false, message: 'Chuyển trạng thái đơn hàng không hợp lệ' });
      if (status === 'COMPLETED' && current.remainingVnd > 0) return res.status(409).json({ success: false, message: 'Đơn hàng chưa thanh toán đủ' });
      if (status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Dùng thao tác hủy đơn để xử lý hoàn tiền an toàn' });
    }
    const item = req.body.item;
    const data = await prisma.$transaction(async (tx) => {
      if (item && current.status === 'PENDING') {
        const existingItem = await tx.orderItem.findFirst({ where: { orderId: current.id }, orderBy: { id: 'asc' } });
        const quantity = Number(item.quantity); const unitPriceCny = Number(item.unitPriceCny);
        if (!existingItem || !String(item.productName || '').trim() || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isFinite(unitPriceCny) || unitPriceCny <= 0) throw Object.assign(new Error('Thông tin sản phẩm không hợp lệ'), { statusCode: 400 });
        await tx.orderItem.update({ where: { id: existingItem.id }, data: { productName: String(item.productName).trim(), quantity, unitPriceCny, totalCny: quantity * unitPriceCny, attributes: item.attributes || null } });
        const rows = await tx.orderItem.findMany({ where: { orderId: current.id } });
        const subtotalVnd = Math.round(rows.reduce((sum, row) => sum + Number(row.totalCny), 0) * Number(current.exchangeRate));
        const serviceFeeVnd = Math.round(subtotalVnd * 0.02); const totalVnd = subtotalVnd + serviceFeeVnd;
        await tx.order.update({ where: { id: current.id }, data: { subtotalVnd, serviceFeeVnd, totalVnd, depositRequiredVnd: Math.round(totalVnd * 0.7), remainingVnd: totalVnd } });
      }
      return tx.order.update({ where: { id: current.id }, data: { ...(typeof req.body.notes === 'string' ? { notes: req.body.notes } : {}), ...(status ? { status } : {}) }, include: includeOrder });
    });

    if (status && status !== current.status) {
      const statusLabels: Record<string, string> = {
        PURCHASING: 'Đang tiến hành mua hàng',
        PURCHASED: 'Đã mua hàng thành công từ nhà cung cấp',
        COMPLETED: 'Đơn hàng đã hoàn thành',
        CANCELLED: 'Đơn hàng đã bị hủy',
      };
      const label = statusLabels[status] || `Trạng thái: ${status}`;
      await prisma.notification.create({
        data: {
          userId: current.customerId,
          title: `Đơn hàng ${current.orderCode} cập nhật trạng thái`,
          message: label,
          type: 'ORDER_CREATED',
          targetRole: 'CUSTOMER',
        },
      });

      const customer = await prisma.user.findUnique({ where: { id: current.customerId } });
      if (customer?.email) {
        void EmailService.notifyCustomerAlert({
          toEmail: customer.email,
          customerName: customer.fullName,
          title: `Đơn Hàng ${current.orderCode} - ${label}`,
          message: `Đơn hàng mua hộ ${current.orderCode} của Quý khách vừa được cập nhật sang trạng thái: "${label}".`,
          linkUrl: '/orders',
          metadata: {
            orderCode: current.orderCode,
            status: label,
            totalVnd: current.totalVnd,
            paidVnd: current.paidVnd,
            remainingVnd: current.remainingVnd,
          },
        });
      }
    }

    res.json({ success: true, data });
  } catch (error) { next(error); }
});

async function payWallet(req: any, purpose: 'DEPOSIT' | 'BALANCE') {
  const key = paymentKey(req, purpose, req.params.id);
  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.payment.findUnique({ where: { idempotencyKey: key }, include: { order: true } });
    if (duplicate) return { payment: duplicate, order: duplicate.order, duplicate: true };
    const order = await tx.order.findFirst({ where: { id: req.params.id, customerId: req.user!.id, deletedAt: null } });
    if (!order) throw Object.assign(new Error('Đơn hàng không tồn tại'), { statusCode: 404 });
    const requestedDeposit = Number(req.body?.amountVnd);
    const amount = purpose === 'DEPOSIT' && Number.isSafeInteger(requestedDeposit)
      ? requestedDeposit
      : purpose === 'DEPOSIT' ? order.depositRequiredVnd : order.remainingVnd;
    if (purpose === 'DEPOSIT' && (order.status !== 'PENDING' || order.paidVnd > 0)) throw Object.assign(new Error('Tiền cọc đã được xử lý'), { statusCode: 409 });
    if (purpose === 'DEPOSIT' && (!Number.isSafeInteger(amount) || amount < order.depositRequiredVnd || amount > order.totalVnd)) throw Object.assign(new Error('Số tiền thanh toán phải từ 70% đến 100% giá trị đơn hàng'), { statusCode: 400 });
    if (purpose === 'BALANCE' && (!['DEPOSITED', 'PURCHASING', 'PURCHASED'].includes(order.status) || amount <= 0)) throw Object.assign(new Error('Đơn không có khoản còn lại cần thanh toán'), { statusCode: 409 });
    const debited = await tx.user.updateMany({ where: { id: order.customerId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
    if (debited.count !== 1) throw Object.assign(new Error('Số dư ví không đủ'), { statusCode: 409 });
    const user = await tx.user.findUniqueOrThrow({ where: { id: order.customerId } });
    const paidVnd = order.paidVnd + amount; const remainingVnd = Math.max(0, order.totalVnd - paidVnd);
    const updated = await tx.order.update({ where: { id: order.id }, data: { paidVnd, remainingVnd, ...(purpose === 'DEPOSIT' ? { depositPaidVnd: amount, status: 'DEPOSITED' } : {}) }, include: includeOrder });
    const payment = await tx.payment.create({ data: { paymentCode: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`, idempotencyKey: key, orderId: order.id, userId: user.id, purpose, method: 'WALLET', amountVnd: amount, status: 'COMPLETED', completedAt: new Date() } });
    await tx.financialTransaction.create({ data: { transactionNo: payment.paymentCode, userId: user.id, type: purpose === 'DEPOSIT' ? 'ORDER_DEPOSIT' : 'ORDER_BALANCE', amountVnd: -amount, balanceAfter: user.balance, description: `${purpose === 'DEPOSIT' ? 'Đặt cọc' : 'Thanh toán còn lại'} đơn ${order.orderCode}` } });
    await tx.auditLog.create({ data: { userId: user.id, action: `ORDER_${purpose}_PAID`, entity: 'Order', entityId: order.id, details: JSON.stringify({ amountVnd: amount, paymentId: payment.id }) } });
    await tx.notification.create({
      data: {
        title: `${purpose === 'DEPOSIT' ? 'Đặt cọc' : 'Thanh toán'} đơn ${order.orderCode}`,
        message: `Số tiền ${amount.toLocaleString('vi-VN')} VND từ khách hàng ${user.fullName}`,
        type: 'ORDER_DEPOSIT',
        targetRole: 'ADMIN',
      },
    });
    void EmailService.notifyAdminAlert({
      title: `${purpose === 'DEPOSIT' ? 'Đặt Cọc' : 'Thanh Toán'} Đơn Hàng: ${order.orderCode}`,
      message: `Khách hàng ${user.fullName} vừa thanh toán ${purpose === 'DEPOSIT' ? 'tiền cọc' : 'khoản còn lại'} ${amount.toLocaleString('vi-VN')} ₫ qua ví số dư.`,
      linkUrl: '/admin/orders',
      metadata: {
        orderCode: order.orderCode,
        paymentPurpose: purpose === 'DEPOSIT' ? 'Đặt cọc đơn hàng' : 'Thanh toán số dư còn lại',
        amountVnd: amount,
        customerName: user.fullName,
        customerPhone: user.phone,
        customerEmail: user.email,
      },
    });
    return { payment, order: updated, duplicate: false };
  });
}

ordersRouter.post('/:id/deposit', async (req, res, next) => { try { res.json({ success: true, data: await payWallet(req, 'DEPOSIT') }); } catch (error) { next(error); } });
ordersRouter.post('/:id/pay-balance', async (req, res, next) => { try { res.json({ success: true, data: await payWallet(req, 'BALANCE') }); } catch (error) { next(error); } });

ordersRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const data = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { payments: true } });
      if (!order || (!isAdmin(req.user!.roleCode) && order.customerId !== req.user!.id)) throw Object.assign(new Error('Đơn hàng không tồn tại'), { statusCode: 404 });
      if (['COMPLETED', 'CANCELLED'].includes(order.status)) throw Object.assign(new Error('Không thể hủy đơn ở trạng thái hiện tại'), { statusCode: 409 });
      if (!isAdmin(req.user!.roleCode) && order.status !== 'PENDING') throw Object.assign(new Error('Đơn đã thanh toán cần quản trị viên xử lý hủy'), { statusCode: 403 });
      const refundable = order.payments.filter((p) => p.status === 'COMPLETED' && p.method === 'WALLET').reduce((sum, p) => sum + p.amountVnd, 0);
      if (order.payments.some((p) => p.status === 'COMPLETED' && p.method !== 'WALLET')) throw Object.assign(new Error('Đơn có thanh toán ngoài ví, cần hoàn tiền qua nhà cung cấp'), { statusCode: 409 });
      if (refundable > 0) {
        await tx.user.update({ where: { id: order.customerId }, data: { balance: { increment: refundable } } });
        const user = await tx.user.findUniqueOrThrow({ where: { id: order.customerId } });
        await tx.financialTransaction.create({ data: { transactionNo: `REF-${order.orderCode}`, userId: order.customerId, type: 'REFUND', amountVnd: refundable, balanceAfter: user.balance, description: `Hoàn tiền đơn ${order.orderCode}` } });
        await tx.payment.updateMany({ where: { orderId: order.id, status: 'COMPLETED', method: 'WALLET' }, data: { status: 'REFUNDED', refundedAt: new Date() } });
      }
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'ORDER_CANCELLED', entity: 'Order', entityId: order.id, details: JSON.stringify({ refundedVnd: refundable, reason: req.body?.reason }) } });
      return tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', paidVnd: 0, depositPaidVnd: 0, remainingVnd: order.totalVnd }, include: includeOrder });
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

ordersRouter.post('/:id/request-refund', async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, customerId: req.user!.id, deletedAt: null } });
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    if (order.status !== 'DEPOSITED') return res.status(400).json({ success: false, message: 'Chỉ đơn hàng đã đặt cọc mới được gửi yêu cầu hoàn tiền' });
    const reason = req.body?.reason || 'Khách hàng yêu cầu hoàn cọc';
    const notes = order.notes ? `${order.notes} | [YÊU CẦU HOÀN CỌC]: ${reason}` : `[YÊU CẦU HOÀN CỌC]: ${reason}`;
    const updated = await prisma.order.update({ where: { id: order.id }, data: { notes }, include: includeOrder });
    await prisma.notification.create({
      data: {
        title: `Yêu cầu hoàn tiền đơn ${order.orderCode}`,
        message: `Lý do: ${reason}`,
        type: 'REFUND_REQUEST',
        targetRole: 'ADMIN',
      },
    });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Hoàn Tiền Đơn Hàng: ${order.orderCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa gửi yêu cầu hoàn tiền cho đơn ${order.orderCode}. Lý do: ${reason}`,
      linkUrl: '/admin/orders',
      metadata: {
        orderCode: order.orderCode,
        customerName: req.user?.fullName,
        customerPhone: req.user?.phone,
        customerEmail: req.user?.email,
        reason,
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

ordersRouter.post('/:id/approve-refund', async (req, res, next) => {
  try {
    if (!isAdmin(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới được duyệt hoàn tiền' });
    const data = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { payments: true } });
      if (!order) throw Object.assign(new Error('Đơn hàng không tồn tại'), { statusCode: 404 });
      const customer = await tx.user.findUnique({ where: { id: order.customerId } });
      const refundable = order.depositPaidVnd || order.payments.filter((p) => p.status === 'COMPLETED' && p.method === 'WALLET').reduce((sum, p) => sum + p.amountVnd, 0);
      if (refundable > 0) {
        await tx.user.update({ where: { id: order.customerId }, data: { balance: { increment: refundable } } });
        await tx.financialTransaction.create({ data: { transactionNo: `REF-${order.orderCode}`, userId: order.customerId, type: 'REFUND', amountVnd: refundable, balanceAfter: (customer?.balance || 0) + refundable, description: `Đã duyệt hoàn cọc đơn ${order.orderCode}` } });
        await tx.payment.updateMany({ where: { orderId: order.id, status: 'COMPLETED', method: 'WALLET' }, data: { status: 'REFUNDED', refundedAt: new Date() } });
      }
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'DEPOSIT_REFUND_APPROVED', entity: 'Order', entityId: order.id, details: JSON.stringify({ refundedVnd: refundable }) } });
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: `Đã duyệt hoàn tiền cọc đơn ${order.orderCode}`,
          message: `Số tiền ${refundable.toLocaleString('vi-VN')} VND đã được hoàn vào ví của bạn`,
          type: 'ORDER_CREATED',
          targetRole: 'CUSTOMER',
        },
      });
      if (customer?.email) {
        void EmailService.notifyCustomerAlert({
          toEmail: customer.email,
          customerName: customer.fullName,
          title: `Đã Duyệt Hoàn Tiền Cọc Đơn Hàng: ${order.orderCode}`,
          message: `Yêu cầu hoàn cọc cho đơn hàng ${order.orderCode} đã được ban quản trị phê duyệt. Số tiền ${refundable.toLocaleString('vi-VN')} ₫ đã được hoàn về Ví Dư của Quý khách.`,
          linkUrl: '/orders',
          metadata: {
            orderCode: order.orderCode,
            refundedVnd: refundable,
            newBalance: (customer.balance || 0) + refundable,
          },
        });
      }
      return tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', paidVnd: 0, depositPaidVnd: 0, remainingVnd: order.totalVnd, notes: order.notes ? `${order.notes} (ĐÃ ĐỒNG Ý HOÀN CỌC)` : '(ĐÃ ĐỒNG Ý HOÀN CỌC)' }, include: includeOrder });
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

ordersRouter.post('/:id/parcels', async (req, res, next) => {
  try {
    if (!canOperate(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Không có quyền tạo kiện từ đơn' });
    const order = await prisma.order.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!order || !['PURCHASED', 'COMPLETED'].includes(order.status)) return res.status(409).json({ success: false, message: 'Chỉ tạo kiện sau khi đơn đã mua' });
    const trackingCodeChina = String(req.body.trackingCodeChina || '').trim();
    if (!trackingCodeChina) return res.status(400).json({ success: false, message: 'Mã vận đơn Trung Quốc là bắt buộc' });
    const data = await prisma.parcel.create({ data: { trackingCodeChina, parcelCode: `OCV-P-${Date.now()}-${Math.floor(Math.random() * 1000)}`, customerId: order.customerId, orderId: order.id, notes: req.body.notes || `Kiện của đơn ${order.orderCode}` } });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

ordersRouter.delete('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!order || (!isAdmin(req.user!.roleCode) && order.customerId !== req.user!.id)) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    if (order.status !== 'PENDING' || order.paidVnd > 0) return res.status(409).json({ success: false, message: 'Chỉ có thể xóa đơn nháp chưa thanh toán' });
    await prisma.order.update({ where: { id: order.id }, data: { deletedAt: new Date() } });
    res.json({ success: true });
  } catch (error) { next(error); }
});
