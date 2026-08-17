import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { FINANCE_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';

const prisma = new PrismaClient();
export const exchangeRouter = Router();
exchangeRouter.use(authenticate);

async function exchangeRates() {
  const row = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
  try { const s = row ? JSON.parse(row.value) : {}; return { VND_TO_CNY: Number(s.rateVndToCny) || 3680, CNY_TO_VND: Number(s.rateCnyToVnd) || 3620 }; }
  catch { return { VND_TO_CNY: 3680, CNY_TO_VND: 3620 }; }
}

exchangeRouter.get('/', async (req, res, next) => {
  try {
    const canReview = FINANCE_ROLES.includes(req.user!.roleCode);
    const data = await prisma.exchangeTransaction.findMany({ where: canReview ? {} : { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, include: canReview ? { user: { select: { fullName: true, customerCode: true, phone: true } } } : undefined });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

exchangeRouter.post('/', async (req, res, next) => {
  try {
    const { direction, recipientInfo } = req.body;
    const proofImage = String(req.body.proofImage || '').trim();
    const fundingMethod = String(req.body.fundingMethod || 'WALLET').trim().toUpperCase();
    const amountCny = Number(req.body.amountCny ?? (direction === 'VND_TO_CNY' ? req.body.targetAmount : req.body.sourceAmount));
    if (!['VND_TO_CNY', 'CNY_TO_VND'].includes(direction) || !Number.isFinite(amountCny) || amountCny <= 0 || !recipientInfo) return res.status(400).json({ success: false, message: 'Thông tin đổi tiền không hợp lệ' });
    if (!['WALLET', 'PAYOS', 'PAYPAL', 'CRYPTO', 'CNY_TRANSFER'].includes(fundingMethod)) return res.status(400).json({ success: false, message: 'Nguồn thanh toán không hợp lệ' });
    if (proofImage && (!/^data:image\/(jpeg|png|webp);base64,/i.test(proofImage) || proofImage.length > 2_800_000)) return res.status(400).json({ success: false, message: 'Ảnh chứng minh phải là JPG, PNG hoặc WEBP và không vượt quá 2 MB' });
    const rates = await exchangeRates(); const exchangeRate = rates[direction as keyof typeof rates]; const amountVnd = Math.round(amountCny * exchangeRate);
    const data = await prisma.$transaction(async (tx) => {
      const transactionCode = `EX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      if (direction === 'VND_TO_CNY' && fundingMethod === 'WALLET') {
        const debited = await tx.user.updateMany({ where: { id: req.user!.id, balance: { gte: amountVnd } }, data: { balance: { decrement: amountVnd } } });
        if (debited.count !== 1) throw Object.assign(new Error('Số dư ví không đủ để giữ tiền cho lệnh đổi'), { statusCode: 409 });
        const user = await tx.user.findUniqueOrThrow({ where: { id: req.user!.id } });
        await tx.financialTransaction.create({ data: { transactionNo: `HOLD-${transactionCode}`, userId: user.id, type: 'EXCHANGE_HOLD', amountVnd: -amountVnd, balanceAfter: user.balance, description: `Giữ tiền lệnh đổi ${transactionCode}` } });
      }
      return tx.exchangeTransaction.create({ data: { transactionCode, userId: req.user!.id, direction, sourceAmount: direction === 'VND_TO_CNY' ? amountVnd : amountCny, targetAmount: direction === 'VND_TO_CNY' ? amountCny : amountVnd, exchangeRate, heldAmountVnd: direction === 'VND_TO_CNY' && fundingMethod === 'WALLET' ? amountVnd : 0, recipientInfo: JSON.stringify(recipientInfo), proofImage: proofImage || null, fundingMethod } });
    });
    await prisma.notification.create({ data: { title: `Yêu cầu đổi tiền ${data.transactionCode}`, message: `${direction}: ${data.sourceAmount} → ${data.targetAmount}`, type: 'FINANCE_EXCHANGE', targetRole: 'ADMIN' } });
    void EmailService.notifyAdminAlert({
      title: `Yêu Cầu Đổi Tiền (Mua/Bán Tệ): ${data.transactionCode}`,
      message: `Khách hàng ${req.user?.fullName || ''} vừa tạo lệnh đổi tiền ${direction === 'VND_TO_CNY' ? 'Mua Nhân Dân Tệ' : 'Bán Nhân Dân Tệ'} (${Number(data.sourceAmount).toLocaleString('vi-VN')} → ${Number(data.targetAmount).toLocaleString('vi-VN')}).`,
      linkUrl: '/admin/exchange',
      metadata: {
        transactionCode: data.transactionCode,
        direction: direction === 'VND_TO_CNY' ? 'Mua Tệ (VNĐ ➔ CNY)' : 'Bán Tệ (CNY ➔ VNĐ)',
        sourceAmount: data.sourceAmount,
        targetAmount: data.targetAmount,
        fundingMethod,
        customerName: req.user?.fullName,
        customerPhone: req.user?.phone,
      },
    });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

exchangeRouter.patch('/:id', authorize(...FINANCE_ROLES), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const reviewNote = String(req.body.reviewNote || rejectionReason || '').trim();
    const reviewImage = String(req.body.reviewImage || '').trim();
    if (!['COMPLETED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    if (reviewImage && (!/^data:image\/(jpeg|png|webp);base64,/i.test(reviewImage) || reviewImage.length > 2_800_000)) return res.status(400).json({ success: false, message: 'Ảnh phản hồi phải là JPG, PNG hoặc WEBP và không vượt quá 2 MB' });
    const data = await prisma.$transaction(async (tx) => {
      const current = await tx.exchangeTransaction.findUnique({ where: { id: req.params.id } });
      if (!current || current.status !== 'PENDING') throw Object.assign(new Error('Giao dịch không tồn tại hoặc đã xử lý'), { statusCode: 409 });
      const amountVnd = Math.round(Number(current.direction === 'VND_TO_CNY' ? current.sourceAmount : current.targetAmount));
      if (status === 'COMPLETED' && current.direction === 'CNY_TO_VND') {
        await tx.user.update({ where: { id: current.userId }, data: { balance: { increment: amountVnd } } });
        const user = await tx.user.findUniqueOrThrow({ where: { id: current.userId } });
        await tx.financialTransaction.create({ data: { transactionNo: current.transactionCode, userId: current.userId, type: 'EXCHANGE', amountVnd, balanceAfter: user.balance, description: `Hoàn tất đổi tiền ${current.transactionCode}` } });
      }
      if (status === 'COMPLETED' && current.direction === 'VND_TO_CNY') {
        const user = await tx.user.findUniqueOrThrow({ where: { id: current.userId } });
        await tx.financialTransaction.create({ data: { transactionNo: current.transactionCode, userId: current.userId, type: 'EXCHANGE_SETTLED', amountVnd: 0, balanceAfter: user.balance, description: `Tất toán tiền giữ ${current.transactionCode}` } });
      }
      if (status === 'REJECTED' && current.heldAmountVnd > 0) {
        await tx.user.update({ where: { id: current.userId }, data: { balance: { increment: current.heldAmountVnd } } });
        const user = await tx.user.findUniqueOrThrow({ where: { id: current.userId } });
        await tx.financialTransaction.create({ data: { transactionNo: `RELEASE-${current.transactionCode}`, userId: current.userId, type: 'EXCHANGE_RELEASE', amountVnd: current.heldAmountVnd, balanceAfter: user.balance, description: `Hoàn tiền giữ ${current.transactionCode}` } });
      }
      await tx.auditLog.create({ data: { userId: req.user!.id, action: `EXCHANGE_${status}`, entity: 'ExchangeTransaction', entityId: current.id } });
      return tx.exchangeTransaction.update({ where: { id: current.id }, data: { status, rejectionReason: status === 'REJECTED' ? reviewNote : null, reviewNote: reviewNote || null, reviewImage: reviewImage || null, reviewedBy: req.user!.id, reviewedAt: new Date() } });
    });
    await prisma.notification.create({ data: { userId: data.userId, title: `Lệnh đổi tiền ${data.transactionCode} đã được xử lý`, message: reviewNote || (status === 'COMPLETED' ? 'Lệnh đã hoàn tất' : 'Lệnh đã bị từ chối'), type: 'FINANCE_EXCHANGE', targetRole: 'CUSTOMER' } });
    const customer = await prisma.user.findUnique({ where: { id: data.userId } });
    if (customer?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: customer.email,
        customerName: customer.fullName,
        title: `Lệnh Đổi Tiền ${data.transactionCode} - ${status === 'COMPLETED' ? 'Đã Hoàn Tất' : 'Bị Từ Chối'}`,
        message: reviewNote || (status === 'COMPLETED' ? `Lệnh đổi tiền ${data.transactionCode} của Quý khách đã được xử lý hoàn tất.` : `Lệnh đổi tiền ${data.transactionCode} đã bị từ chối. Số tiền giữ (nếu có) đã được hoàn lại vào ví.`),
        linkUrl: '/exchange',
        metadata: {
          transactionCode: data.transactionCode,
          status: status === 'COMPLETED' ? 'Hoàn tất' : 'Từ chối',
          direction: data.direction === 'VND_TO_CNY' ? 'Mua Tệ (VNĐ ➔ CNY)' : 'Bán Tệ (CNY ➔ VNĐ)',
          amount: `${data.sourceAmount} → ${data.targetAmount}`,
          note: reviewNote || undefined,
        },
      });
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
