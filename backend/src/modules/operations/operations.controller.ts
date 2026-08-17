import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, FINANCE_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
export const operationsRouter = Router();
operationsRouter.use(authenticate);

operationsRouter.get('/disputes', async (req, res, next) => {
  try {
    const where = ADMIN_ROLES.includes(req.user!.roleCode) ? {} : { userId: req.user!.id };
    const data = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: ADMIN_ROLES.includes(req.user!.roleCode)
        ? { user: { select: { id: true, fullName: true, customerCode: true, email: true, phone: true, roleCode: true } } }
        : undefined,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.post('/disputes', async (req, res, next) => {
  try {
    const { parcelId, parcelCode, category, title, description } = req.body;
    if (!category || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Danh mục, tiêu đề và nội dung là bắt buộc' });
    }
    let resolvedParcelId: string | undefined = undefined;
    if (parcelId) {
      const parcel = await prisma.parcel.findUnique({ where: { id: parcelId } });
      if (parcel) resolvedParcelId = parcel.id;
    } else if (parcelCode) {
      const parcel = await prisma.parcel.findFirst({
        where: { OR: [{ parcelCode: parcelCode.trim() }, { trackingCodeChina: parcelCode.trim() }] },
      });
      if (parcel) resolvedParcelId = parcel.id;
    }

    const fullDescription = parcelCode && !resolvedParcelId
      ? `[Mã tham chiếu: ${parcelCode.trim()}]\n${description.trim()}`
      : description.trim();

    const data = await prisma.dispute.create({
      data: {
        disputeCode: `DSP-${Date.now()}`,
        userId: req.user!.id,
        parcelId: resolvedParcelId,
        category,
        title: title.trim(),
        description: fullDescription,
      },
    });

    await prisma.notification.create({
      data: {
        title: `Khiếu nại mới ${data.disputeCode}`,
        message: `${title.trim()} (${category})`,
        type: 'DISPUTE',
        targetRole: 'ADMIN',
      },
    });

    void EmailService.notifyAdminAlert({
      title: `Khiếu Nại Mới: ${data.disputeCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa gửi khiếu nại [${category}]: ${title.trim()}`,
      linkUrl: '/admin/support',
      metadata: {
        disputeCode: data.disputeCode,
        category,
        customerName: req.user?.fullName,
        customerEmail: req.user?.email,
        description: fullDescription,
      },
    });

    void TelegramService.notifyNewDispute({
      disputeCode: data.disputeCode,
      customerName: req.user?.fullName,
      customerEmail: req.user?.email,
      category,
      title: title.trim(),
      description: fullDescription,
    });

    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.patch('/disputes/:id', authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    if (!['OPEN', 'PROCESSING', 'RESOLVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    const data = await prisma.dispute.update({ where: { id: req.params.id }, data: { status, resolution } });
    const disputeStatusLabels: Record<string, string> = {
      PROCESSING: 'Đang được bộ phận CSKH xử lý',
      RESOLVED: 'Đã giải quyết',
      REJECTED: 'Đã bị từ chối',
    };
    const disputeLabel = disputeStatusLabels[status] || `Trạng thái: ${status}`;
    await prisma.notification.create({
      data: {
        userId: data.userId,
        title: `Khiếu nại ${data.disputeCode} đã có phản hồi`,
        message: resolution || disputeLabel,
        type: 'DISPUTE',
        targetRole: 'CUSTOMER',
      },
    });
    const customer = await prisma.user.findUnique({ where: { id: data.userId } });
    if (customer?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: customer.email,
        customerName: customer.fullName,
        title: `Khiếu Nại ${data.disputeCode} - ${disputeLabel}`,
        message: resolution || `Khiếu nại "${data.title}" của Quý khách đã được cập nhật trạng thái: ${disputeLabel}.`,
        linkUrl: '/disputes',
        metadata: {
          disputeCode: data.disputeCode,
          status: disputeLabel,
          resolution: resolution || undefined,
        },
      });
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.get('/withdrawals', async (req, res, next) => {
  try {
    const canReview = FINANCE_ROLES.includes(req.user!.roleCode);
    const data = await prisma.withdrawalRequest.findMany({ where: canReview ? {} : { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, include: canReview ? { user: { select: { fullName: true, customerCode: true, balance: true } } } : undefined });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.post('/withdrawals', async (req, res, next) => {
  try {
    const { amountVnd, bankName, accountNumber, accountName } = req.body;
    const amount = Number(amountVnd);
    if (!Number.isSafeInteger(amount) || amount <= 0 || !bankName || !accountNumber || !accountName) return res.status(400).json({ success: false, message: 'Thông tin rút tiền không hợp lệ' });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || user.balance < amount) return res.status(409).json({ success: false, message: 'Số dư không đủ' });
    const pending = await prisma.withdrawalRequest.aggregate({ where: { userId: user.id, status: 'PENDING' }, _sum: { amountVnd: true } });
    if (user.balance - (pending._sum.amountVnd || 0) < amount) return res.status(409).json({ success: false, message: 'Số dư khả dụng không đủ do có lệnh đang chờ' });
    const data = await prisma.withdrawalRequest.create({ data: { requestCode: `WDR-${Date.now()}`, userId: user.id, amountVnd: amount, bankName, accountNumber, accountName } });
    await prisma.notification.create({ data: { title: `Yêu cầu rút tiền ${data.requestCode}`, message: `${amount.toLocaleString('vi-VN')} VND`, type: 'WITHDRAWAL', targetRole: 'ADMIN' } });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Rút Tiền Mới: ${data.requestCode}`,
      message: `Khách hàng ${user.fullName} vừa yêu cầu rút ${amount.toLocaleString('vi-VN')} ₫ về tài khoản ${bankName} (${accountNumber} - ${accountName}).`,
      linkUrl: '/admin/finance',
      metadata: {
        requestCode: data.requestCode,
        amountVnd: amount,
        customerName: user.fullName,
        customerPhone: user.phone,
        bankName,
        accountNumber,
        accountName,
      },
    });
    void TelegramService.notifyNewWithdrawal({
      requestCode: data.requestCode,
      customerName: user.fullName,
      customerPhone: user.phone || undefined,
      amountVnd: amount,
      bankName,
      accountNumber,
      accountName,
    });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.patch('/withdrawals/:id', authorize(...FINANCE_ROLES), async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({ where: { id: req.params.id } });
      if (!request || request.status !== 'PENDING') throw Object.assign(new Error('Yêu cầu không tồn tại hoặc đã xử lý'), { statusCode: 409 });
      if (status === 'APPROVED') {
        if (request.source === 'AFFILIATE') {
          const profile = await tx.affiliateProfile.findUnique({ where: { userId: request.userId } });
          if (!profile || profile.totalCommission < request.amountVnd) throw Object.assign(new Error('Hoa hồng không đủ'), { statusCode: 409 });
          await tx.affiliateProfile.update({ where: { id: profile.id }, data: { totalCommission: profile.totalCommission - request.amountVnd } });
        } else {
          const user = await tx.user.findUnique({ where: { id: request.userId } });
          if (!user || user.balance < request.amountVnd) throw Object.assign(new Error('Số dư không đủ'), { statusCode: 409 });
          const balance = user.balance - request.amountVnd;
          await tx.user.update({ where: { id: user.id }, data: { balance } });
          await tx.financialTransaction.create({ data: { transactionNo: request.requestCode, userId: user.id, type: 'WITHDRAWAL', amountVnd: -request.amountVnd, balanceAfter: balance, description: `Rút tiền ${request.requestCode}` } });
        }
      }
      return tx.withdrawalRequest.update({ where: { id: request.id }, data: { status, reviewNote, reviewedBy: req.user!.id, reviewedAt: new Date() } });
    });
    await prisma.notification.create({
      data: {
        userId: result.userId,
        title: `Yêu cầu rút tiền ${result.requestCode} đã được xử lý`,
        message: reviewNote || (status === 'APPROVED' ? `Lệnh rút ${result.amountVnd.toLocaleString('vi-VN')} VND đã được duyệt và chuyển khoản thành công` : `Lệnh rút tiền ${result.requestCode} đã bị từ chối`),
        type: 'WITHDRAWAL',
        targetRole: 'CUSTOMER',
      },
    });
    const customer = await prisma.user.findUnique({ where: { id: result.userId } });
    if (customer?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: customer.email,
        customerName: customer.fullName,
        title: `Lệnh Rút Tiền ${result.requestCode} - ${status === 'APPROVED' ? 'Thành Công' : 'Bị Từ Chối'}`,
        message: reviewNote || (status === 'APPROVED' ? `Lệnh rút tiền ${result.requestCode} trị giá ${result.amountVnd.toLocaleString('vi-VN')} ₫ về tài khoản ${result.bankName} (${result.accountNumber}) đã được hoàn tất.` : `Lệnh rút tiền ${result.requestCode} đã bị từ chối. Lý do: ${reviewNote || 'Thông tin không hợp lệ'}.`),
        linkUrl: '/withdrawals',
        metadata: {
          requestCode: result.requestCode,
          status: status === 'APPROVED' ? 'Đã duyệt & Chuyển khoản' : 'Từ chối',
          amountVnd: result.amountVnd,
          bankName: result.bankName,
          accountNumber: result.accountNumber,
          note: reviewNote || undefined,
        },
      });
    }
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

operationsRouter.get('/notifications', async (req, res, next) => {
  try {
    const admin = ADMIN_ROLES.includes(req.user!.roleCode) || FINANCE_ROLES.includes(req.user!.roleCode);
    const data = await prisma.notification.findMany({ where: { OR: [{ userId: req.user!.id }, { userId: null, targetRole: admin ? { in: ['ADMIN', 'ALL'] } : { in: ['CUSTOMER', 'ALL'] } }] }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.post('/notifications', async (req, res, next) => {
  try {
    const { title, message, type, targetRole, linkUrl, metadata } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc' });

    const notif = await prisma.notification.create({
      data: {
        title: String(title).trim(),
        message: String(message).trim(),
        type: type || 'SYSTEM',
        targetRole: targetRole || 'ADMIN',
        userId: targetRole === 'CUSTOMER' ? req.user?.id : null,
      },
    });

    if (targetRole === 'ADMIN' || targetRole === 'ALL') {
      void EmailService.notifyAdminAlert({
        title: String(title).trim(),
        message: String(message).trim(),
        type: type || 'SYSTEM',
        linkUrl: linkUrl || metadata?.targetUrl || (metadata?.orderId ? '/admin/orders' : undefined),
        metadata: {
          ...metadata,
          customerName: metadata?.customerName || req.user?.fullName || 'Khách hàng',
          customerEmail: req.user?.email,
          customerPhone: req.user?.phone,
        },
      });
    }

    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
});

operationsRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!item || (item.userId && item.userId !== req.user!.id)) return res.status(404).json({ success: false, message: 'Thông báo không tồn tại' });
    const data = await prisma.notification.update({ where: { id: item.id }, data: { isRead: true } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

operationsRouter.get('/audit-logs', authorize(...ADMIN_ROLES), async (_req, res, next) => {
  try {
    const data = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { user: { select: { fullName: true, email: true } } } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
