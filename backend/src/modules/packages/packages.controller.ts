import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { OPERATIONS_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';

const prisma = new PrismaClient();
export const packageRouter = Router();

const PARCEL_STATUSES = ['CREATED', 'RECEIVED_CHINA', 'IN_TRANSIT', 'RECEIVED_VIETNAM', 'DELIVERED', 'CANCELLED'] as const;
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ['RECEIVED_CHINA', 'CANCELLED'],
  RECEIVED_CHINA: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED_VIETNAM'],
  RECEIVED_VIETNAM: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function isOperations(roleCode: string) {
  return OPERATIONS_ROLES.includes(roleCode);
}

function chargeableWeight(weightKg: number, lengthCm: number, widthCm: number, heightCm: number) {
  return Math.max(weightKg, (lengthCm * widthCm * heightCm) / 6000);
}

const DEFAULT_CATEGORY_RATES = [
  { id: 'cat-normal', categoryName: 'Hàng hóa thông thường', priceCnyUnder3kg: 15, priceCnyOver3kg: 10 },
  { id: 'cat-snacks', categoryName: 'Đồ ăn vặt & que cay', priceCnyUnder3kg: 15, priceCnyOver3kg: 15 },
  { id: 'cat-cosmetics', categoryName: 'Mỹ phẩm, thịt, rượu', priceCnyUnder3kg: 17, priceCnyOver3kg: 17 },
  { id: 'cat-medicine', categoryName: 'Thuốc tây & dược phẩm', priceCnyUnder3kg: 20, priceCnyOver3kg: 20 },
  { id: 'cat-electronics', categoryName: 'Điện tử & thiết bị gia dụng', priceCnyUnder3kg: 14, priceCnyOver3kg: 14 },
  { id: 'cat-fragile', categoryName: 'Hàng dễ vỡ', priceCnyUnder3kg: 18, priceCnyOver3kg: 16 },
  { id: 'cat-battery', categoryName: 'Pin & hàng có từ tính', priceCnyUnder3kg: 18, priceCnyOver3kg: 18 },
  { id: 'cat-bulky', categoryName: 'Hàng cồng kềnh', priceCnyUnder3kg: 15, priceCnyOver3kg: 11 },
  { id: 'cat-machinery', categoryName: 'Máy móc & linh kiện', priceCnyUnder3kg: 16, priceCnyOver3kg: 13 },
  { id: 'cat-branded', categoryName: 'Hàng thương hiệu', priceCnyUnder3kg: 17, priceCnyOver3kg: 15 },
  { id: 'cat-books', categoryName: 'Sách, giấy & văn phòng phẩm', priceCnyUnder3kg: 13, priceCnyOver3kg: 10 },
  { id: 'cat-household', categoryName: 'Đồ gia dụng không điện', priceCnyUnder3kg: 14, priceCnyOver3kg: 12 },
];

async function calculateTransportFee(categoryId: string, categoryName: string, chargeable: number, declaredValueVnd: number, insurance: boolean) {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
  let contact: any = {};
  try { contact = setting ? JSON.parse(setting.value) : {}; } catch { contact = {}; }
  const savedRates = Array.isArray(contact.categoryShippingRates) ? contact.categoryShippingRates : [];
  const rates = [...savedRates, ...DEFAULT_CATEGORY_RATES.filter((item) => !savedRates.some((saved: any) => saved.id === item.id))];
  const category = categoryId === 'OTHER'
    ? { id: 'OTHER', categoryName: categoryName || 'Hàng hóa khác', priceCnyUnder3kg: 15, priceCnyOver3kg: 12 }
    : rates.find((item: any) => item.id === categoryId);
  if (!category) throw Object.assign(new Error('Phân loại hàng hóa không hợp lệ'), { statusCode: 400 });
  const cnyRate = Number(contact.rateBuyForMe || contact.cnyRate || 3650);
  const priceCnyPerKg = chargeable < 3 ? Number(category.priceCnyUnder3kg) : Number(category.priceCnyOver3kg);
  const shippingFeeVnd = Math.round(chargeable * priceCnyPerKg * cnyRate);
  const insuranceFeeVnd = insurance ? Math.round(declaredValueVnd * Number(contact.insuranceFeePercent || 10) / 100) : 0;
  return { categoryName: category.categoryName, shippingFeeVnd, insuranceFeeVnd, estimatedTotalVnd: shippingFeeVnd + insuranceFeeVnd, economyShippingPercent: Number(contact.economyShippingPercent || 90), standardShippingPercent: Number(contact.standardShippingPercent || 100), expressShippingPercent: Number(contact.expressShippingPercent || 120) };
}

packageRouter.use(authenticate);

packageRouter.get('/', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !isOperations(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem kiện hàng' });
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '');
    const where: any = {};
    if (req.user!.roleCode === 'CUSTOMER') where.customerId = req.user!.id;
    if (status && status !== 'ALL') {
      if (!PARCEL_STATUSES.includes(status as any)) return res.status(400).json({ success: false, message: 'Trạng thái kiện không hợp lệ' });
      where.status = status;
    }
    if (search) where.OR = [
      { parcelCode: { contains: search } },
      { trackingCodeChina: { contains: search } },
      { notes: { contains: search } },
    ];
    const parcels = await prisma.parcel.findMany({
      where,
      include: { customer: { select: { id: true, fullName: true, customerCode: true } }, currentWarehouse: true, order: { select: { id: true, orderCode: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: parcels });
  } catch (error) { next(error); }
});

packageRouter.get('/delivery-requests/mine', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !isOperations(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem yêu cầu giao hàng' });
    const where = req.user!.roleCode === 'CUSTOMER' ? { customerId: req.user!.id } : {};
    const data = await prisma.deliveryRequest.findMany({ where, include: { parcels: true, customer: { select: { fullName: true, customerCode: true, phone: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

packageRouter.patch('/delivery-requests/:id/status', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const status = String(req.body.status || ''); const reviewNote = String(req.body.reviewNote || '').trim();
    if (!['PENDING', 'APPROVED', 'DELIVERING', 'COMPLETED', 'CANCELLED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái yêu cầu giao hàng không hợp lệ' });
    const existing = await prisma.deliveryRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu giao hàng' });
    const data = await prisma.deliveryRequest.update({ where: { id: existing.id }, data: { status } });
    const deliveryLabels: Record<string, string> = {
      APPROVED: 'Đã duyệt yêu cầu giao hàng',
      DELIVERING: 'Đang vận chuyển giao tận nơi',
      COMPLETED: 'Đã giao hàng thành công',
      CANCELLED: 'Yêu cầu giao hàng đã bị hủy',
    };
    const deliveryLabel = deliveryLabels[status] || `Trạng thái: ${status}`;
    await prisma.notification.create({ data: { userId: existing.customerId, title: `Yêu cầu giao hàng ${existing.requestCode} - ${deliveryLabel}`, message: reviewNote || deliveryLabel, type: 'DELIVERY_REQUEST', targetRole: 'CUSTOMER' } });
    const customer = await prisma.user.findUnique({ where: { id: existing.customerId } });
    if (customer?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: customer.email,
        customerName: customer.fullName,
        title: `Yêu Cầu Giao Hàng ${existing.requestCode} - ${deliveryLabel}`,
        message: reviewNote || `Yêu cầu giao hàng ${existing.requestCode} của Quý khách đã được cập nhật sang trạng thái: "${deliveryLabel}".`,
        linkUrl: '/deliveries',
        metadata: {
          requestCode: existing.requestCode,
          status: deliveryLabel,
          deliveryAddress: existing.address,
          contactPhone: existing.contactPhone,
          shippingMethod: existing.shippingMethod,
          feeVnd: existing.feeVnd,
          note: reviewNote || undefined,
        },
      });
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

packageRouter.post('/delivery-requests', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Chỉ khách hàng được tạo yêu cầu giao' });
    const parcelIds: string[] = Array.isArray(req.body.parcelIds) ? [...new Set<string>(req.body.parcelIds.map((value: unknown) => String(value)))] : [];
    const address = String(req.body.address || '').trim(); const contactPhone = String(req.body.contactPhone || '').trim(); const shippingMethod = String(req.body.shippingMethod || 'STANDARD');
    if (!parcelIds.length || !address || !contactPhone) return res.status(400).json({ success: false, message: 'Kiện hàng, địa chỉ và số điện thoại là bắt buộc' });
    if (!['STANDARD', 'EXPRESS', 'PICKUP'].includes(shippingMethod)) return res.status(400).json({ success: false, message: 'Phương thức giao không hợp lệ' });
    const parcels = await prisma.parcel.findMany({ where: { id: { in: parcelIds }, customerId: req.user!.id }, include: { deliveryRequests: { where: { status: { in: ['PENDING', 'APPROVED', 'DELIVERING'] } } } } });
    if (parcels.length !== parcelIds.length) return res.status(400).json({ success: false, message: 'Danh sách kiện không hợp lệ' });
    if (parcels.some((item) => item.status !== 'RECEIVED_VIETNAM')) return res.status(409).json({ success: false, message: 'Chỉ kiện đã về kho Việt Nam mới được yêu cầu giao' });
    if (parcels.some((item) => item.deliveryRequests.length > 0)) return res.status(409).json({ success: false, message: 'Có kiện đã nằm trong yêu cầu giao đang xử lý' });
    const totalWeight = parcels.reduce((sum, item) => sum + item.chargeableWeight, 0); const feeVnd = shippingMethod === 'PICKUP' ? 0 : Math.round(30000 + totalWeight * (shippingMethod === 'EXPRESS' ? 8000 : 5000));
    const data = await prisma.deliveryRequest.create({ data: { requestCode: `DLV-${Date.now()}-${Math.floor(Math.random() * 1000)}`, customerId: req.user!.id, address, contactPhone, shippingMethod, feeVnd, parcels: { connect: parcelIds.map((id) => ({ id })) } }, include: { parcels: true } });
    await prisma.notification.create({ data: { title: `Yêu cầu giao hàng ${data.requestCode}`, message: `${parcels.length} kiện đến ${address}`, type: 'DELIVERY_REQUEST', targetRole: 'ADMIN' } });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Giao Hàng Nội Địa: ${data.requestCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa yêu cầu giao ${parcels.length} kiện hàng về địa chỉ: ${address}.`,
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: data.requestCode,
        parcelCount: parcels.length,
        deliveryAddress: address,
        contactPhone,
        shippingMethod,
        feeVnd,
        customerName: req.user?.fullName,
      },
    });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

packageRouter.get('/transport-requests/mine', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !isOperations(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem yêu cầu vận chuyển' });
    const where = req.user!.roleCode === 'CUSTOMER' ? { customerId: req.user!.id } : {};
    const data = await prisma.transportRequest.findMany({ where, include: { customer: { select: { id: true, fullName: true, customerCode: true, phone: true, email: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

packageRouter.patch('/transport-requests/:id/status', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const status = req.body.status ? String(req.body.status) : undefined;
    const adminNote = req.body.adminNote != null ? String(req.body.adminNote).trim() : undefined;
    const trackingCodeChina = req.body.trackingCodeChina != null ? String(req.body.trackingCodeChina).trim() : undefined;
    const depositRefundStatus = req.body.depositRefundStatus ? String(req.body.depositRefundStatus) : undefined;

    if (status && !['PENDING', 'DEPOSITED', 'APPROVED', 'PICKING_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái yêu cầu vận chuyển không hợp lệ' });
    }

    const existing = await prisma.transportRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu vận chuyển' });

    let updated: any;

    // Handle deposit refund approval if requested
    if (depositRefundStatus === 'REFUNDED' && existing.depositPaidVnd > 0 && existing.depositRefundStatus !== 'REFUNDED') {
      updated = await prisma.$transaction(async (tx) => {
        const refundable = existing.depositPaidVnd;
        await tx.user.update({
          where: { id: existing.customerId },
          data: { balance: { increment: refundable } },
        });
        const user = await tx.user.findUniqueOrThrow({ where: { id: existing.customerId } });
        await tx.financialTransaction.create({
          data: {
            transactionNo: `REF-TRQ-${existing.requestCode}`,
            userId: existing.customerId,
            type: 'REFUND',
            amountVnd: refundable,
            balanceAfter: user.balance,
            description: `Hoàn tiền cọc yêu cầu vận chuyển ${existing.requestCode}`,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: req.user!.id,
            action: 'TRANSPORT_DEPOSIT_REFUNDED',
            entity: 'TransportRequest',
            entityId: existing.id,
            details: JSON.stringify({ refundedVnd: refundable, reason: adminNote || 'Admin duyệt hoàn cọc' }),
          },
        });
        return tx.transportRequest.update({
          where: { id: existing.id },
          data: {
            depositRefundStatus: 'REFUNDED',
            status: status || 'CANCELLED',
            adminNote: adminNote ?? existing.adminNote,
            ...(trackingCodeChina !== undefined ? { trackingCodeChina } : {}),
          },
        });
      });
    } else {
      updated = await prisma.transportRequest.update({
        where: { id: existing.id },
        data: {
          ...(status ? { status } : {}),
          ...(adminNote !== undefined ? { adminNote } : {}),
          ...(trackingCodeChina !== undefined ? { trackingCodeChina } : {}),
          ...(depositRefundStatus !== undefined ? { depositRefundStatus } : {}),
        },
      });
    }

    const newStatus = status || updated.status;
    const transportLabels: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      DEPOSITED: 'Đã đặt cọc yêu cầu vận chuyển',
      APPROVED: 'Đã duyệt yêu cầu vận chuyển',
      PICKING_UP: 'Đang lấy hàng tại kho gửi',
      IN_TRANSIT: 'Hàng đang trên đường vận chuyển',
      COMPLETED: 'Đã hoàn thành vận chuyển',
      CANCELLED: 'Yêu cầu vận chuyển đã bị hủy',
    };
    const transportLabel = transportLabels[newStatus] || `Trạng thái: ${newStatus}`;

    await prisma.notification.create({
      data: {
        userId: existing.customerId,
        title: `Yêu cầu vận chuyển ${existing.requestCode} - ${transportLabel}`,
        message: adminNote || transportLabel,
        type: 'TRANSPORT_REQUEST',
        targetRole: 'CUSTOMER',
      },
    });

    const customer = await prisma.user.findUnique({ where: { id: existing.customerId } });
    if (customer?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: customer.email,
        customerName: customer.fullName,
        title: `Yêu Cầu Vận Chuyển ${existing.requestCode} - ${transportLabel}`,
        message: adminNote || `Yêu cầu vận chuyển ${existing.requestCode} [${existing.categoryName}] của Quý khách đã được cập nhật sang trạng thái: "${transportLabel}".`,
        linkUrl: '/transport-requests',
        metadata: {
          requestCode: existing.requestCode,
          status: transportLabel,
          categoryName: existing.categoryName,
          chargeableWeight: `${existing.chargeableWeight} kg`,
          estimatedTotalVnd: existing.estimatedTotalVnd,
          chinaTrackingCode: updated.trackingCodeChina || undefined,
          adminNote: adminNote || undefined,
        },
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

packageRouter.post('/transport-requests/:id/deposit', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !isOperations(req.user!.roleCode)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thanh toán này' });
    }
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.transportRequest.findFirst({
        where: { id: req.params.id, ...(req.user!.roleCode === 'CUSTOMER' ? { customerId: req.user!.id } : {}) },
      });
      if (!existing) {
        throw Object.assign(new Error('Không tìm thấy yêu cầu vận chuyển'), { statusCode: 404 });
      }
      if (existing.status !== 'PENDING') {
        throw Object.assign(new Error('Yêu cầu vận chuyển này đã được xử lý hoặc đã đặt cọc trước đó'), { statusCode: 409 });
      }

      const totalVnd = existing.estimatedTotalVnd;
      const minDeposit = Math.round(totalVnd * 0.7);
      const requestedDeposit = Number(req.body?.amountVnd);
      const reqPercentage = Number(req.body?.percentage || 70);
      const percentage = Math.max(70, Math.min(100, reqPercentage));
      const amount = Number.isSafeInteger(requestedDeposit) && requestedDeposit >= minDeposit && requestedDeposit <= totalVnd
        ? requestedDeposit
        : Math.round((totalVnd * percentage) / 100);

      const debited = await tx.user.updateMany({
        where: { id: existing.customerId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (debited.count !== 1) {
        throw Object.assign(new Error('Số dư ví không đủ để thanh toán tiền cọc'), { statusCode: 409 });
      }

      const user = await tx.user.findUniqueOrThrow({ where: { id: existing.customerId } });
      const depositPercentage = Math.round((amount / totalVnd) * 100);

      const updated = await tx.transportRequest.update({
        where: { id: existing.id },
        data: {
          status: 'DEPOSITED',
          depositPaidVnd: amount,
          depositPercentage: depositPercentage,
        },
      });

      const txNo = `PAY-TRQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.financialTransaction.create({
        data: {
          transactionNo: txNo,
          userId: user.id,
          type: 'TRANSPORT_DEPOSIT',
          amountVnd: -amount,
          balanceAfter: user.balance,
          description: `Đặt cọc ${depositPercentage}% yêu cầu vận chuyển ${existing.requestCode}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'TRANSPORT_DEPOSIT_PAID',
          entity: 'TransportRequest',
          entityId: existing.id,
          details: JSON.stringify({ amountVnd: amount, depositPercentage }),
        },
      });

      await tx.notification.create({
        data: {
          title: `Đặt cọc yêu cầu vận chuyển ${existing.requestCode}`,
          message: `Khách hàng ${user.fullName} đã thanh toán cọc ${amount.toLocaleString('vi-VN')} ₫ (${depositPercentage}%)`,
          type: 'FINANCE_DEPOSIT',
          targetRole: 'ADMIN',
        },
      });

      void EmailService.notifyAdminAlert({
        title: `Đặt Cọc Yêu Cầu Vận Chuyển: ${existing.requestCode}`,
        message: `Khách hàng ${user.fullName} vừa thanh toán cọc ${amount.toLocaleString('vi-VN')} ₫ (${depositPercentage}%) cho yêu cầu vận chuyển [${existing.categoryName} - ${existing.chargeableWeight.toFixed(2)} kg].`,
        linkUrl: '/admin/shipments',
        metadata: {
          requestCode: existing.requestCode,
          categoryName: existing.categoryName,
          chargeableWeight: `${existing.chargeableWeight.toFixed(2)} kg`,
          estimatedTotalVnd: totalVnd,
          depositPaidVnd: amount,
          depositPercentage: `${depositPercentage}%`,
          customerName: user.fullName,
          customerPhone: user.phone || undefined,
          customerEmail: user.email,
        },
      });

      return { request: updated, amountVnd: amount, balance: user.balance };
    });

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

packageRouter.post('/transport-requests/:id/request-refund', async (req, res, next) => {
  try {
    const existing = await prisma.transportRequest.findFirst({
      where: { id: req.params.id, customerId: req.user!.id },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu vận chuyển' });
    if (existing.status !== 'DEPOSITED') {
      return res.status(400).json({ success: false, message: 'Chỉ yêu cầu đã đặt cọc mới được gửi yêu cầu hoàn tiền' });
    }
    const reason = String(req.body?.reason || 'Khách hàng yêu cầu hoàn cọc').trim();
    const updated = await prisma.transportRequest.update({
      where: { id: existing.id },
      data: {
        depositRefundStatus: 'PENDING',
        depositRefundReason: reason,
        adminNote: existing.adminNote ? `${existing.adminNote} | [YÊU CẦU HOÀN CỌC]: ${reason}` : `[YÊU CẦU HOÀN CỌC]: ${reason}`,
      },
    });
    await prisma.notification.create({
      data: {
        title: `Yêu cầu hoàn tiền cọc ${existing.requestCode}`,
        message: `Lý do: ${reason}`,
        type: 'REFUND_REQUEST',
        targetRole: 'ADMIN',
      },
    });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Hoàn Cọc Vận Chuyển: ${existing.requestCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa gửi yêu cầu hoàn tiền cọc cho yêu cầu ${existing.requestCode}. Lý do: ${reason}`,
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: existing.requestCode,
        depositPaidVnd: existing.depositPaidVnd || 0,
        reason,
        customerName: req.user?.fullName,
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

packageRouter.post('/transport-requests', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Chỉ khách hàng được gửi yêu cầu vận chuyển' });
    const categoryId = String(req.body.categoryId || '').trim();
    const requestedCategoryName = String(req.body.categoryName || '').trim();
    const goodsDescription = String(req.body.goodsDescription || '').trim();
    const shippingMethod = String(req.body.shippingMethod || 'STANDARD');
    const recipientName = String(req.body.recipientName || '').trim();
    const recipientPhone = String(req.body.recipientPhone || '').trim();
    const recipientEmail = String(req.body.recipientEmail || '').trim();
    const country = String(req.body.country || 'VN').trim(); const customCountry = String(req.body.customCountry || '').trim();
    const province = String(req.body.province || '').trim(); const district = String(req.body.district || '').trim();
    const ward = String(req.body.ward || '').trim(); const addressLine = String(req.body.addressLine || '').trim();
    const deliveryNote = String(req.body.deliveryNote || '').trim();
    const pickupContactName = String(req.body.pickupContactName || '').trim(); const pickupPhone = String(req.body.pickupPhone || '').trim();
    const pickupCountry = String(req.body.pickupCountry || 'CN').trim(); const pickupCustomCountry = String(req.body.pickupCustomCountry || '').trim();
    const pickupProvince = String(req.body.pickupProvince || '').trim(); const pickupDistrict = String(req.body.pickupDistrict || '').trim();
    const pickupWard = String(req.body.pickupWard || '').trim(); const pickupAddressLine = String(req.body.pickupAddressLine || '').trim();
    const pickupNote = String(req.body.pickupNote || '').trim();
    const pickupImage = String(req.body.pickupImage || '').trim();
    const quantity = Number(req.body.quantity);
    const weightKg = Number(req.body.weightKg); const lengthCm = Number(req.body.lengthCm);
    const widthCm = Number(req.body.widthCm); const heightCm = Number(req.body.heightCm);
    const declaredValueVnd = Number(req.body.declaredValueVnd || 0); const insurance = req.body.insurance === true;
    if (!categoryId || !goodsDescription || !recipientName || !recipientPhone || !province || !district || !ward || !addressLine) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ hàng hóa và thông tin người nhận' });
    if (!['VN', 'CN', 'OTHER'].includes(country) || (country === 'OTHER' && !customCountry)) return res.status(400).json({ success: false, message: 'Quốc gia nhận hàng không hợp lệ' });
    if (!pickupContactName || !pickupPhone || !pickupProvince || !pickupDistrict || !pickupWard || !pickupAddressLine) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin và địa điểm lấy hàng' });
    if (!['VN', 'CN', 'OTHER'].includes(pickupCountry) || (pickupCountry === 'OTHER' && !pickupCustomCountry)) return res.status(400).json({ success: false, message: 'Quốc gia lấy hàng không hợp lệ' });
    if (!['ECONOMY', 'STANDARD', 'EXPRESS'].includes(shippingMethod)) return res.status(400).json({ success: false, message: 'Gói vận chuyển không hợp lệ' });
    if (!/^[0-9+(). -]{8,20}$/.test(recipientPhone)) return res.status(400).json({ success: false, message: 'Số điện thoại người nhận không hợp lệ' });
    if (!/^[0-9+(). -]{8,20}$/.test(pickupPhone)) return res.status(400).json({ success: false, message: 'Số điện thoại lấy hàng không hợp lệ' });
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return res.status(400).json({ success: false, message: 'Email người nhận không hợp lệ' });
    if (pickupImage && (!/^data:image\/(jpeg|png|webp);base64,/i.test(pickupImage) || pickupImage.length > 2_800_000)) return res.status(400).json({ success: false, message: 'Ảnh lấy hàng phải là JPG, PNG hoặc WEBP và không vượt quá 2 MB' });
    if (![quantity, weightKg, lengthCm, widthCm, heightCm, declaredValueVnd].every(Number.isFinite) || quantity < 1 || weightKg <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0 || declaredValueVnd < 0) return res.status(400).json({ success: false, message: 'Số lượng, cân nặng, kích thước hoặc giá trị hàng không hợp lệ' });
    const chargeable = chargeableWeight(weightKg, lengthCm, widthCm, heightCm);
    const fee = await calculateTransportFee(categoryId, requestedCategoryName, chargeable, declaredValueVnd, insurance);
    const serviceMultiplier = (shippingMethod === 'ECONOMY' ? fee.economyShippingPercent : shippingMethod === 'EXPRESS' ? fee.expressShippingPercent : fee.standardShippingPercent) / 100;
    fee.shippingFeeVnd = Math.round(fee.shippingFeeVnd * serviceMultiplier);
    fee.estimatedTotalVnd = fee.shippingFeeVnd + fee.insuranceFeeVnd;
    const data = await prisma.transportRequest.create({ data: {
      requestCode: `TRQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`, customerId: req.user!.id,
      categoryId, categoryName: categoryId === 'OTHER' ? requestedCategoryName : fee.categoryName,
      goodsDescription, quantity: Math.floor(quantity), weightKg, lengthCm, widthCm, heightCm,
      chargeableWeight: chargeable, shippingMethod, declaredValueVnd, insurance,
      recipientName, recipientPhone, recipientEmail: recipientEmail || null, country, customCountry: country === 'OTHER' ? customCountry : null, province, district, ward, addressLine, deliveryNote: deliveryNote || null,
      pickupContactName, pickupPhone, pickupCountry, pickupCustomCountry: pickupCountry === 'OTHER' ? pickupCustomCountry : null,
      pickupProvince, pickupDistrict, pickupWard, pickupAddressLine, pickupNote: pickupNote || null, pickupImage: pickupImage || null,
      estimatedShippingFeeVnd: fee.shippingFeeVnd, insuranceFeeVnd: fee.insuranceFeeVnd, estimatedTotalVnd: fee.estimatedTotalVnd,
    }});
    await prisma.notification.create({ data: { title: `Yêu cầu vận chuyển ${data.requestCode}`, message: `${data.categoryName} - ${data.chargeableWeight.toFixed(2)} kg`, type: 'TRANSPORT_REQUEST', targetRole: 'ADMIN' } });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Vận Chuyển Mới: ${data.requestCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa tạo yêu cầu vận chuyển [${data.categoryName} - ${data.chargeableWeight.toFixed(2)} kg] từ ${data.pickupProvince || 'TQ'} đến ${data.province || 'VN'}.`,
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: data.requestCode,
        categoryName: data.categoryName,
        chargeableWeight: `${data.chargeableWeight.toFixed(2)} kg`,
        shippingMethod: data.shippingMethod,
        estimatedTotalVnd: data.estimatedTotalVnd,
        customerName: req.user?.fullName,
        customerPhone: req.user?.phone,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
      },
    });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

packageRouter.put('/transport-requests/:id', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Chỉ khách hàng được sửa yêu cầu của mình' });
    const existing = await prisma.transportRequest.findFirst({ where: { id: req.params.id, customerId: req.user!.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu vận chuyển' });
    if (existing.status !== 'PENDING') return res.status(409).json({ success: false, message: 'Chỉ yêu cầu đang chờ duyệt mới được sửa' });
    const text = (key: string) => String(req.body[key] || '').trim();
    const categoryId = text('categoryId'); const requestedCategoryName = text('categoryName'); const goodsDescription = text('goodsDescription');
    const shippingMethod = text('shippingMethod') || 'STANDARD'; const recipientName = text('recipientName'); const recipientPhone = text('recipientPhone'); const recipientEmail = text('recipientEmail');
    const country = text('country') || 'VN'; const customCountry = text('customCountry'); const province = text('province'); const district = text('district'); const ward = text('ward'); const addressLine = text('addressLine'); const deliveryNote = text('deliveryNote');
    const pickupContactName = text('pickupContactName'); const pickupPhone = text('pickupPhone'); const pickupCountry = text('pickupCountry') || 'CN'; const pickupCustomCountry = text('pickupCustomCountry'); const pickupProvince = text('pickupProvince'); const pickupDistrict = text('pickupDistrict'); const pickupWard = text('pickupWard'); const pickupAddressLine = text('pickupAddressLine'); const pickupNote = text('pickupNote'); const pickupImage = text('pickupImage');
    const quantity = Number(req.body.quantity); const weightKg = Number(req.body.weightKg); const lengthCm = Number(req.body.lengthCm); const widthCm = Number(req.body.widthCm); const heightCm = Number(req.body.heightCm); const declaredValueVnd = Number(req.body.declaredValueVnd || 0); const insurance = req.body.insurance === true;
    if (!categoryId || !goodsDescription || !recipientName || !recipientPhone || !province || !district || !ward || !addressLine || !pickupContactName || !pickupPhone || !pickupProvince || !pickupDistrict || !pickupWard || !pickupAddressLine) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin hàng, lấy hàng và nhận hàng' });
    if (!['ECONOMY', 'STANDARD', 'EXPRESS'].includes(shippingMethod) || !['VN', 'CN', 'OTHER'].includes(country) || !['VN', 'CN', 'OTHER'].includes(pickupCountry)) return res.status(400).json({ success: false, message: 'Gói vận chuyển hoặc quốc gia không hợp lệ' });
    if ((country === 'OTHER' && !customCountry) || (pickupCountry === 'OTHER' && !pickupCustomCountry)) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên quốc gia' });
    if (!/^[0-9+(). -]{8,20}$/.test(recipientPhone) || !/^[0-9+(). -]{8,20}$/.test(pickupPhone) || (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))) return res.status(400).json({ success: false, message: 'Thông tin liên hệ không hợp lệ' });
    if (![quantity, weightKg, lengthCm, widthCm, heightCm, declaredValueVnd].every(Number.isFinite) || quantity < 1 || weightKg <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0 || declaredValueVnd < 0) return res.status(400).json({ success: false, message: 'Thông tin cân nặng hoặc kích thước không hợp lệ' });
    if (pickupImage && (!/^data:image\/(jpeg|png|webp);base64,/i.test(pickupImage) || pickupImage.length > 2_800_000)) return res.status(400).json({ success: false, message: 'Ảnh lấy hàng không hợp lệ' });
    const chargeable = chargeableWeight(weightKg, lengthCm, widthCm, heightCm); const fee = await calculateTransportFee(categoryId, requestedCategoryName, chargeable, declaredValueVnd, insurance); const multiplier = (shippingMethod === 'ECONOMY' ? fee.economyShippingPercent : shippingMethod === 'EXPRESS' ? fee.expressShippingPercent : fee.standardShippingPercent) / 100; fee.shippingFeeVnd = Math.round(fee.shippingFeeVnd * multiplier); fee.estimatedTotalVnd = fee.shippingFeeVnd + fee.insuranceFeeVnd;
    const data = await prisma.transportRequest.update({ where: { id: existing.id }, data: { categoryId, categoryName: categoryId === 'OTHER' ? requestedCategoryName : fee.categoryName, goodsDescription, quantity: Math.floor(quantity), weightKg, lengthCm, widthCm, heightCm, chargeableWeight: chargeable, shippingMethod, declaredValueVnd, insurance, recipientName, recipientPhone, recipientEmail: recipientEmail || null, country, customCountry: country === 'OTHER' ? customCountry : null, province, district, ward, addressLine, deliveryNote: deliveryNote || null, pickupContactName, pickupPhone, pickupCountry, pickupCustomCountry: pickupCountry === 'OTHER' ? pickupCustomCountry : null, pickupProvince, pickupDistrict, pickupWard, pickupAddressLine, pickupNote: pickupNote || null, pickupImage: pickupImage || null, estimatedShippingFeeVnd: fee.shippingFeeVnd, insuranceFeeVnd: fee.insuranceFeeVnd, estimatedTotalVnd: fee.estimatedTotalVnd } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

packageRouter.delete('/transport-requests/:id', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Chỉ khách hàng được xóa yêu cầu của mình' });
    const existing = await prisma.transportRequest.findFirst({ where: { id: req.params.id, customerId: req.user!.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu vận chuyển' });
    if (existing.status !== 'PENDING') return res.status(409).json({ success: false, message: 'Chỉ yêu cầu đang chờ duyệt mới được xóa' });
    await prisma.transportRequest.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Đã xóa yêu cầu vận chuyển' });
  } catch (error) { next(error); }
});

packageRouter.get('/:id', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !isOperations(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem kiện hàng' });
    const parcel = await prisma.parcel.findUnique({
      where: { id: req.params.id },
      include: { customer: { select: { id: true, fullName: true, customerCode: true } }, currentWarehouse: true, order: { select: { id: true, orderCode: true, status: true } }, scanLogs: { orderBy: { createdAt: 'asc' } } },
    });
    if (!parcel) return res.status(404).json({ success: false, message: 'Kiện hàng không tồn tại' });
    if (req.user!.roleCode === 'CUSTOMER' && parcel.customerId !== req.user!.id) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem kiện này' });
    res.json({ success: true, data: parcel });
  } catch (error) { next(error); }
});

packageRouter.post('/', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !isOperations(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo kiện hàng' });
    const { trackingCodeChina, customerId, weightKg = 0, lengthCm = 0, widthCm = 0, heightCm = 0, notes } = req.body;
    if (!trackingCodeChina?.trim()) return res.status(400).json({ success: false, message: 'Mã vận đơn Trung Quốc là bắt buộc' });
    const ownerId = req.user!.roleCode === 'CUSTOMER' ? req.user!.id : customerId;
    if (!ownerId) return res.status(400).json({ success: false, message: 'Khách hàng là bắt buộc' });
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.roleCode !== 'CUSTOMER') return res.status(400).json({ success: false, message: 'Khách hàng không hợp lệ' });
    const dimensions = [weightKg, lengthCm, widthCm, heightCm].map(Number);
    if (dimensions.some((value) => !Number.isFinite(value) || value < 0)) return res.status(400).json({ success: false, message: 'Khối lượng hoặc kích thước không hợp lệ' });
    const [weight, length, width, height] = dimensions;
    const parcel = await prisma.parcel.create({ data: {
      trackingCodeChina: trackingCodeChina.trim(),
      parcelCode: `PKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: ownerId,
      weightKg: weight,
      lengthCm: length,
      widthCm: width,
      heightCm: height,
      chargeableWeight: chargeableWeight(weight, length, width, height),
      notes: notes?.trim() || null,
    }});
    await prisma.notification.create({ data: { title: `Kiện hàng mới ${parcel.parcelCode}`, message: `Mã vận đơn ${parcel.trackingCodeChina}`, type: 'ORDER_CREATED', targetRole: 'ADMIN' } });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'CREATE_PARCEL', entity: 'Parcel', entityId: parcel.id } });
    res.status(201).json({ success: true, data: parcel });
  } catch (error) { next(error); }
});

packageRouter.patch('/:id', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const parcel = await prisma.parcel.findUnique({ where: { id: req.params.id } });
    if (!parcel) return res.status(404).json({ success: false, message: 'Kiện hàng không tồn tại' });
    const { trackingCodeChina, status, weightKg, lengthCm, widthCm, heightCm, notes } = req.body;
    if (status && (!PARCEL_STATUSES.includes(status) || !TRANSITIONS[parcel.status]?.includes(status))) {
      return res.status(409).json({ success: false, message: `Không thể chuyển trạng thái từ ${parcel.status} sang ${status}` });
    }
    const weight = weightKg === undefined ? parcel.weightKg : Number(weightKg);
    const length = lengthCm === undefined ? parcel.lengthCm : Number(lengthCm);
    const width = widthCm === undefined ? parcel.widthCm : Number(widthCm);
    const height = heightCm === undefined ? parcel.heightCm : Number(heightCm);
    if ([weight, length, width, height].some((value) => !Number.isFinite(value) || value < 0)) return res.status(400).json({ success: false, message: 'Khối lượng hoặc kích thước không hợp lệ' });
    const updated = await prisma.parcel.update({ where: { id: parcel.id }, data: {
      ...(trackingCodeChina?.trim() && { trackingCodeChina: trackingCodeChina.trim() }),
      ...(status && { status }),
      weightKg: weight, lengthCm: length, widthCm: width, heightCm: height,
      chargeableWeight: chargeableWeight(weight, length, width, height),
      ...(notes !== undefined && { notes }),
    }});

    if (status && status !== parcel.status) {
      const parcelLabels: Record<string, string> = {
        RECEIVED_CHINA: 'Đã nhập kho Quảng Châu (Trung Quốc)',
        IN_TRANSIT: 'Đang trên đường vận chuyển về Việt Nam',
        RECEIVED_VIETNAM: 'Đã về kho Việt Nam (Sẵn sàng yêu cầu giao)',
        DELIVERED: 'Đã giao hàng thành công',
        CANCELLED: 'Kiện hàng đã bị hủy',
      };
      const pLabel = parcelLabels[status] || `Trạng thái: ${status}`;
      await prisma.notification.create({
        data: {
          userId: parcel.customerId,
          title: `Kiện hàng ${parcel.parcelCode} - ${pLabel}`,
          message: `Mã vận đơn TQ: ${parcel.trackingCodeChina}`,
          type: 'ORDER_CREATED',
          targetRole: 'CUSTOMER',
        },
      });
      const customer = await prisma.user.findUnique({ where: { id: parcel.customerId } });
      if (customer?.email) {
        void EmailService.notifyCustomerAlert({
          toEmail: customer.email,
          customerName: customer.fullName,
          title: `Kiện Hàng ${parcel.parcelCode} - ${pLabel}`,
          message: `Kiện hàng của Quý khách với mã vận đơn Trung Quốc ${parcel.trackingCodeChina} hiện: "${pLabel}".`,
          linkUrl: '/packages',
          metadata: {
            parcelCode: parcel.parcelCode,
            trackingCodeChina: parcel.trackingCodeChina,
            status: pLabel,
            chargeableWeight: `${updated.chargeableWeight} kg`,
          },
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

packageRouter.delete('/:id', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const parcel = await prisma.parcel.findUnique({ where: { id: req.params.id } });
    if (!parcel) return res.status(404).json({ success: false, message: 'Kiện hàng không tồn tại' });
    if (parcel.status !== 'CREATED' && parcel.status !== 'CANCELLED') return res.status(409).json({ success: false, message: 'Chỉ được xóa kiện mới tạo hoặc đã hủy' });
    await prisma.parcel.delete({ where: { id: parcel.id } });
    res.json({ success: true, message: 'Đã xóa kiện hàng' });
  } catch (error) { next(error); }
});

packageRouter.post('/scan/warehouse', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const { trackingCodeChina, warehouseCode, customerId, customerCode, weightKg, lengthCm, widthCm, heightCm, notes } = req.body;
    if (!trackingCodeChina || !warehouseCode) return res.status(400).json({ success: false, message: 'Mã vận đơn và mã kho là bắt buộc' });
    const warehouse = await prisma.warehouse.findUnique({ where: { code: warehouseCode } });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Kho không tồn tại' });
    let parcel = await prisma.parcel.findUnique({ where: { trackingCodeChina } });
    const owner = customerId ? await prisma.user.findUnique({ where: { id: customerId } }) : customerCode ? await prisma.user.findUnique({ where: { customerCode } }) : null;
    const status = warehouse.type === 'CHINA' ? 'RECEIVED_CHINA' : 'RECEIVED_VIETNAM';
    if (!parcel && (!owner || owner.roleCode !== 'CUSTOMER')) return res.status(400).json({ success: false, message: 'Cần mã khách hàng hợp lệ khi tiếp nhận kiện mới' });
    if (parcel && parcel.status !== status && !TRANSITIONS[parcel.status]?.includes(status)) return res.status(409).json({ success: false, message: `Không thể quét kiện từ ${parcel.status} sang ${status}` });
    const weight = Number(weightKg ?? parcel?.weightKg ?? 0);
    const length = Number(lengthCm ?? parcel?.lengthCm ?? 0);
    const width = Number(widthCm ?? parcel?.widthCm ?? 0);
    const height = Number(heightCm ?? parcel?.heightCm ?? 0);
    if ([weight, length, width, height].some((value) => !Number.isFinite(value) || value < 0)) return res.status(400).json({ success: false, message: 'Khối lượng hoặc kích thước không hợp lệ' });
    parcel = await prisma.$transaction(async (tx) => {
      const saved = parcel
        ? await tx.parcel.update({ where: { id: parcel.id }, data: { currentWarehouseId: warehouse.id, status, weightKg: weight, lengthCm: length, widthCm: width, heightCm: height, chargeableWeight: chargeableWeight(weight, length, width, height), notes: notes ?? parcel.notes } })
        : await tx.parcel.create({ data: { trackingCodeChina, parcelCode: `PKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, customerId: owner!.id, currentWarehouseId: warehouse.id, status, weightKg: weight, lengthCm: length, widthCm: width, heightCm: height, chargeableWeight: chargeableWeight(weight, length, width, height), notes } });
      await tx.parcelScanLog.create({ data: { parcelId: saved.id, warehouseId: warehouse.id, staffId: req.user!.id, statusAfter: status, notes } });
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'SCAN_PARCEL', entity: 'Parcel', entityId: saved.id, details: JSON.stringify({ warehouseCode, status }) } });
      return saved;
    });

    const parcelLabels: Record<string, string> = {
      RECEIVED_CHINA: `Đã nhập kho Quảng Châu (${warehouse.name})`,
      RECEIVED_VIETNAM: `Đã về kho Việt Nam (${warehouse.name})`,
    };
    const pLabel = parcelLabels[status] || `Trạng thái: ${status}`;
    await prisma.notification.create({
      data: {
        userId: parcel.customerId,
        title: `Kiện hàng ${parcel.parcelCode} - ${pLabel}`,
        message: `Mã vận đơn TQ: ${parcel.trackingCodeChina}`,
        type: 'ORDER_CREATED',
        targetRole: 'CUSTOMER',
      },
    });
    const customer = await prisma.user.findUnique({ where: { id: parcel.customerId } });
    if (customer?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: customer.email,
        customerName: customer.fullName,
        title: `Kiện Hàng ${parcel.parcelCode} - ${pLabel}`,
        message: `Kiện hàng của Quý khách với mã vận đơn Trung Quốc ${parcel.trackingCodeChina} vừa được tiếp nhận tại kho: "${pLabel}".`,
        linkUrl: '/packages',
        metadata: {
          parcelCode: parcel.parcelCode,
          trackingCodeChina: parcel.trackingCodeChina,
          warehouseName: warehouse.name,
          status: pLabel,
          chargeableWeight: `${parcel.chargeableWeight} kg`,
        },
      });
    }

    res.json({ success: true, data: parcel });
  } catch (error) { next(error); }
});
