import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { FINANCE_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';

const prisma = new PrismaClient();
export const financeRouter = Router();

financeRouter.use(authenticate);

financeRouter.get('/transactions', async (req, res, next) => {
  try {
    const requestedUserId = String(req.query.userId || '');
    const canViewAll = FINANCE_ROLES.includes(req.user!.roleCode);
    const userId = canViewAll ? requestedUserId || undefined : req.user!.id;
    const transactions = await prisma.financialTransaction.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      include: canViewAll ? { user: { select: { id: true, fullName: true, customerCode: true, email: true, phone: true } } } : undefined,
    });
    res.json({ success: true, data: transactions });
  } catch (error) { next(error); }
});

financeRouter.get('/deposit-requests', async (req, res, next) => {
  try {
    const canReview = FINANCE_ROLES.includes(req.user!.roleCode);
    const data = await prisma.depositRequest.findMany({ where: canReview ? {} : { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, include: canReview ? { user: { select: { fullName: true, customerCode: true, phone: true, email: true, balance: true } } } : undefined });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

financeRouter.post('/deposit-requests', async (req, res, next) => {
  try {
    const amountVnd = Number(req.body.amountVnd);
    const method = String(req.body.method || '').trim();
    if (!Number.isSafeInteger(amountVnd) || amountVnd < 50000 || !method) return res.status(400).json({ success: false, message: 'Số tiền nạp tối thiểu 50.000 ₫ và phương thức là bắt buộc' });
    const data = await prisma.depositRequest.create({ data: { requestCode: `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, userId: req.user!.id, amountVnd, method, proofImage: req.body.proofImage || null } });
    await prisma.notification.create({ data: { title: `Yêu cầu nạp tiền ${data.requestCode}`, message: `${amountVnd.toLocaleString('vi-VN')} VND qua ${method}`, type: 'FINANCE_DEPOSIT', targetRole: 'ADMIN' } });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Nạp Tiền Ví: ${data.requestCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa gửi yêu cầu nạp ${amountVnd.toLocaleString('vi-VN')} ₫ qua phương thức ${method}.`,
      linkUrl: '/admin/finance',
      metadata: {
        requestCode: data.requestCode,
        amountVnd,
        paymentMethod: method,
        customerName: req.user?.fullName,
        customerPhone: req.user?.phone,
        customerEmail: req.user?.email,
      },
    });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

financeRouter.patch('/deposit-requests/:id', authorize(...FINANCE_ROLES), async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    const data = await prisma.$transaction(async (tx) => {
      const request = await tx.depositRequest.findUnique({ where: { id: req.params.id } });
      if (!request || request.status !== 'PENDING') throw Object.assign(new Error('Lệnh nạp không tồn tại hoặc đã xử lý'), { statusCode: 409 });
      if (status === 'APPROVED') {
        await tx.user.update({ where: { id: request.userId }, data: { balance: { increment: request.amountVnd } } });
        const user = await tx.user.findUniqueOrThrow({ where: { id: request.userId } });
        await tx.financialTransaction.create({ data: { transactionNo: request.requestCode, userId: request.userId, type: 'DEPOSIT', amountVnd: request.amountVnd, balanceAfter: user.balance, description: `Nạp tiền qua ${request.method}` } });
      }
      await tx.auditLog.create({ data: { userId: req.user!.id, action: `DEPOSIT_${status}`, entity: 'DepositRequest', entityId: request.id, details: JSON.stringify({ amountVnd: request.amountVnd, reviewNote }) } });
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: `Lệnh nạp tiền ${request.requestCode} đã được xử lý`,
          message: reviewNote || (status === 'APPROVED' ? `Đã cộng ${request.amountVnd.toLocaleString('vi-VN')} VND vào ví của bạn` : `Lệnh nạp tiền ${request.requestCode} đã bị từ chối`),
          type: 'FINANCE_DEPOSIT',
          targetRole: 'CUSTOMER',
        },
      });
      const customer = await tx.user.findUnique({ where: { id: request.userId } });
      if (customer?.email) {
        void EmailService.notifyCustomerAlert({
          toEmail: customer.email,
          customerName: customer.fullName,
          title: `Lệnh Nạp Tiền ${request.requestCode} - ${status === 'APPROVED' ? 'Thành Công' : 'Bị Từ Chối'}`,
          message: reviewNote || (status === 'APPROVED' ? `Lệnh nạp tiền ${request.requestCode} trị giá ${request.amountVnd.toLocaleString('vi-VN')} ₫ qua phương thức ${request.method} đã được phê duyệt thành công.` : `Lệnh nạp tiền ${request.requestCode} đã bị từ chối. Lý do: ${reviewNote || 'Thông tin chuyển khoản không khớp'}.`),
          linkUrl: '/finance',
          metadata: {
            requestCode: request.requestCode,
            status: status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối',
            amountVnd: request.amountVnd,
            paymentMethod: request.method,
            note: reviewNote || undefined,
          },
        });
      }
      return tx.depositRequest.update({ where: { id: request.id }, data: { status, reviewNote, reviewedBy: req.user!.id, reviewedAt: new Date() } });
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

financeRouter.post('/deposit', authorize(...FINANCE_ROLES), async (req, res, next) => {
  try {
    const { customerId, amountVnd, description, reference } = req.body;
    const amount = Number(amountVnd);
    if (!customerId || !Number.isSafeInteger(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'Khách hàng và số tiền VND nguyên dương là bắt buộc' });
    const transactionNo = reference?.trim() || `FT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = await prisma.financialTransaction.findUnique({ where: { transactionNo } });
    if (existing) return res.status(409).json({ success: false, message: 'Giao dịch với mã tham chiếu này đã được xử lý' });
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: customerId } });
      if (!user) throw Object.assign(new Error('Khách hàng không tồn tại'), { statusCode: 404 });
      const newBalance = user.balance + amount;
      const updatedUser = await tx.user.update({ where: { id: customerId }, data: { balance: newBalance } });
      const transaction = await tx.financialTransaction.create({ data: { transactionNo, userId: customerId, type: 'DEPOSIT', amountVnd: amount, balanceAfter: newBalance, description: description?.trim() || 'Nạp tiền ví cước' } });
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'DEPOSIT', entity: 'FinancialTransaction', entityId: transaction.id, details: JSON.stringify({ customerId, amountVnd: amount, transactionNo }) } });
      return { user: updatedUser, transaction };
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});
