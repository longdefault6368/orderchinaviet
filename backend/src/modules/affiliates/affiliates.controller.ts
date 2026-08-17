import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
export const affiliateRouter = Router();

affiliateRouter.post('/track-click', async (req, res, next) => {
  try {
    const affiliateCode = String(req.body.affiliateCode || '').trim().toUpperCase();
    const eventId = String(req.body.eventId || '').trim().slice(0, 100);
    if (!affiliateCode || !eventId) return res.status(400).json({ success: false, message: 'Thiếu mã giới thiệu hoặc mã lượt truy cập' });
    const profile = await prisma.affiliateProfile.findUnique({ where: { affiliateCode } });
    if (!profile || ['REJECTED', 'SUSPENDED'].includes(profile.status)) return res.status(404).json({ success: false, message: 'Mã giới thiệu không hoạt động' });
    await prisma.affiliateClick.upsert({ where: { eventId }, update: {}, create: { eventId, affiliateProfileId: profile.id, ipAddress: req.ip, userAgent: String(req.headers['user-agent'] || '').slice(0, 500) } });
    const clickCount = await prisma.affiliateClick.count({ where: { affiliateProfileId: profile.id } });
    res.json({ success: true, data: { clickCount } });
  } catch (error) { next(error); }
});

affiliateRouter.use(authenticate);

const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const monthRange = (month: string) => ({ start: `${month}-01`, end: `${month}-31` });
const isSunday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
const workingDays = (month: string) => { const [year, value] = month.split('-').map(Number); const days = new Date(Date.UTC(year, value, 0)).getUTCDate(); return Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`).filter((date) => !isSunday(date)).length; };
async function employmentPolicy() {
  const row = await prisma.systemSetting.findUnique({ where: { key: 'affiliateEmploymentPolicy' } });
  try { return { baseSalaryVnd: 2000000, paidLeaveDaysPerMonth: 1, ...(row ? JSON.parse(row.value) : {}) }; } catch { return { baseSalaryVnd: 2000000, paidLeaveDaysPerMonth: 1 }; }
}
async function requireAffiliate(userId: string) {
  const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
  if (!profile) throw Object.assign(new Error('Tài khoản không phải đối tác'), { statusCode: 403 });
  return profile;
}

affiliateRouter.get('/employment-policy', async (_req, res, next) => { try { res.json({ success: true, data: await employmentPolicy() }); } catch (error) { next(error); } });

affiliateRouter.get('/attendance/me', async (req, res, next) => {
  try {
    await requireAffiliate(req.user!.id);
    const month = String(req.query.month || localDate().slice(0, 7)); const range = monthRange(month); const policy = await employmentPolicy();
    const [records, leaves] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { userId: req.user!.id, workDate: { gte: range.start, lte: range.end } }, orderBy: { workDate: 'desc' } }),
      prisma.employeeLeaveRequest.findMany({ where: { userId: req.user!.id, leaveDate: { gte: range.start, lte: range.end } }, orderBy: { leaveDate: 'desc' } }),
    ]);
    const standardDays = workingDays(month); const paidLeaveDays = leaves.filter((item) => item.status === 'APPROVED' && item.leaveType === 'PAID').length; const payableDays = Math.min(standardDays, records.length + paidLeaveDays);
    res.json({ success: true, data: { records, leaves, policy, summary: { standardDays, attendedDays: records.length, paidLeaveDays, payableDays, estimatedSalaryVnd: Math.round(policy.baseSalaryVnd * payableDays / standardDays) } } });
  } catch (error) { next(error); }
});

affiliateRouter.post('/attendance/check-in', async (req, res, next) => {
  try { await requireAffiliate(req.user!.id); const workDate = localDate(); if (isSunday(workDate)) return res.status(409).json({ success: false, message: 'Chủ nhật là ngày nghỉ cố định' }); const data = await prisma.attendanceRecord.create({ data: { userId: req.user!.id, workDate, checkIn: new Date(), note: req.body?.note } }); res.status(201).json({ success: true, data }); }
  catch (error: any) { if (error?.code === 'P2002') return res.status(409).json({ success: false, message: 'Hôm nay đã chấm công vào' }); next(error); }
});

affiliateRouter.post('/attendance/check-out', async (req, res, next) => {
  try { await requireAffiliate(req.user!.id); const record = await prisma.attendanceRecord.findUnique({ where: { userId_workDate: { userId: req.user!.id, workDate: localDate() } } }); if (!record) return res.status(404).json({ success: false, message: 'Chưa chấm công vào hôm nay' }); if (record.checkOut) return res.status(409).json({ success: false, message: 'Hôm nay đã chấm công ra' }); const data = await prisma.attendanceRecord.update({ where: { id: record.id }, data: { checkOut: new Date() } }); res.json({ success: true, data }); }
  catch (error) { next(error); }
});

affiliateRouter.post('/leave-requests', async (req, res, next) => {
  try { await requireAffiliate(req.user!.id); const leaveDate = String(req.body.leaveDate || ''); const reason = String(req.body.reason || '').trim(); const month = leaveDate.slice(0, 7); if (!/^\d{4}-\d{2}-\d{2}$/.test(leaveDate) || !reason) return res.status(400).json({ success: false, message: 'Ngày nghỉ và lý do là bắt buộc' }); if (isSunday(leaveDate)) return res.status(400).json({ success: false, message: 'Chủ nhật đã là ngày nghỉ cố định' }); const policy = await employmentPolicy(); const paidCount = await prisma.employeeLeaveRequest.count({ where: { userId: req.user!.id, leaveType: 'PAID', status: { in: ['PENDING', 'APPROVED'] }, leaveDate: { gte: `${month}-01`, lte: `${month}-31` } } }); const leaveType = paidCount < policy.paidLeaveDaysPerMonth ? 'PAID' : 'UNPAID'; const data = await prisma.employeeLeaveRequest.create({ data: { userId: req.user!.id, leaveDate, reason, leaveType } }); res.status(201).json({ success: true, data }); }
  catch (error: any) { if (error?.code === 'P2002') return res.status(409).json({ success: false, message: 'Ngày này đã có đơn nghỉ' }); next(error); }
});

affiliateRouter.get('/attendance/admin', authorize(...ADMIN_ROLES), async (req, res, next) => {
  try { const month = String(req.query.month || localDate().slice(0, 7)); const range = monthRange(month); const policy = await employmentPolicy(); const profiles = await prisma.affiliateProfile.findMany({ include: { user: { select: { id: true, fullName: true, customerCode: true, email: true } } } }); const [records, leaves] = await Promise.all([prisma.attendanceRecord.findMany({ where: { workDate: { gte: range.start, lte: range.end } } }), prisma.employeeLeaveRequest.findMany({ where: { leaveDate: { gte: range.start, lte: range.end } }, include: { user: { select: { fullName: true, customerCode: true } } }, orderBy: { createdAt: 'desc' } })]); const standardDays = workingDays(month); const payroll = profiles.map((profile) => { const attendedDays = records.filter((item) => item.userId === profile.userId).length; const paidLeaveDays = leaves.filter((item) => item.userId === profile.userId && item.status === 'APPROVED' && item.leaveType === 'PAID').length; const payableDays = Math.min(standardDays, attendedDays + paidLeaveDays); return { ...profile.user, status: profile.status, attendedDays, paidLeaveDays, standardDays, salaryVnd: Math.round(policy.baseSalaryVnd * payableDays / standardDays) }; }); res.json({ success: true, data: { policy, payroll, leaves } }); }
  catch (error) { next(error); }
});

affiliateRouter.put('/attendance/policy', authorize(...ADMIN_ROLES), async (req, res, next) => { try { const baseSalaryVnd = Number(req.body.baseSalaryVnd); if (!Number.isSafeInteger(baseSalaryVnd) || baseSalaryVnd < 0) return res.status(400).json({ success: false, message: 'Lương cơ bản không hợp lệ' }); const data = { baseSalaryVnd, paidLeaveDaysPerMonth: 1 }; await prisma.systemSetting.upsert({ where: { key: 'affiliateEmploymentPolicy' }, update: { value: JSON.stringify(data) }, create: { key: 'affiliateEmploymentPolicy', value: JSON.stringify(data), isPublic: false } }); res.json({ success: true, data }); } catch (error) { next(error); } });

affiliateRouter.patch('/leave-requests/:id', authorize(...ADMIN_ROLES), async (req, res, next) => { try { if (!['APPROVED', 'REJECTED'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' }); const data = await prisma.employeeLeaveRequest.update({ where: { id: req.params.id }, data: { status: req.body.status, reviewNote: req.body.reviewNote, reviewedBy: req.user!.id, reviewedAt: new Date() } }); res.json({ success: true, data }); } catch (error) { next(error); } });

affiliateRouter.get('/me', async (req, res, next) => {
  try {
    const data = await prisma.affiliateProfile.findUnique({ where: { userId: req.user!.id }, include: { user: { select: { fullName: true, email: true, phone: true } }, _count: { select: { referrals: true, clicks: true } } } });
    if (!data) return res.status(404).json({ success: false, message: 'Chưa đăng ký affiliate' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

affiliateRouter.post('/register', async (req, res, next) => {
  try {
    const existing = await prisma.affiliateProfile.findUnique({ where: { userId: req.user!.id } });
    if (existing) return res.status(409).json({ success: false, message: 'Tài khoản đã đăng ký affiliate' });
    const data = await prisma.affiliateProfile.create({ data: { userId: req.user!.id, affiliateCode: `OCV_AFF_${Date.now().toString().slice(-8)}` } });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    // 1. Thông báo cho Admin
    await prisma.notification.create({
      data: {
        title: `Đối tác Affiliate mới: ${user?.fullName || req.user!.email}`,
        message: `${user?.email} - Mã: ${data.affiliateCode}`,
        type: 'AFFILIATE',
        targetRole: 'ADMIN',
      },
    });
    void EmailService.notifyAdminAlert({
      title: `Đối Tác Affiliate Mới: ${user?.fullName || req.user!.email}`,
      message: `Thành viên ${user?.fullName || req.user!.email} vừa đăng ký tham gia chương trình Tiếp thị liên kết với Mã: ${data.affiliateCode}.`,
      linkUrl: '/admin/finance',
      metadata: {
        fullName: user?.fullName,
        email: user?.email,
        phone: user?.phone,
        customerCode: user?.customerCode,
        affiliateCode: data.affiliateCode,
      },
    });

    // 2. Thông báo cho Khách hàng
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Kích hoạt Đối tác Tiếp thị liên kết thành công!',
        message: `Mã đối tác của bạn là ${data.affiliateCode}. Bắt đầu chia sẻ liên kết để nhận hoa hồng!`,
        type: 'AFFILIATE',
        targetRole: 'CUSTOMER',
      },
    });
    if (user?.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: user.email,
        customerName: user.fullName,
        title: 'Kích Hoạt Tài Khoản Đối Tác Tiếp Thị Liên Kết Thành Công!',
        message: `Chúc mừng Quý khách đã kích hoạt thành công tài khoản Đối tác Tiếp thị của OrderChinaViet! Mã giới thiệu cá nhân của Quý khách là: ${data.affiliateCode}.`,
        linkUrl: '/affiliate',
        metadata: {
          affiliateCode: data.affiliateCode,
          customerCode: user.customerCode,
          email: user.email,
          referralLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/?ref=${data.affiliateCode}`,
        },
      });
    }

    // 3. Bắn Telegram thông báo Đối tác Affiliate mới
    if (user) {
      void TelegramService.notifyNewUserRegistration({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || undefined,
        customerCode: data.affiliateCode,
        roleCode: 'AFFILIATE',
      });
    }

    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

affiliateRouter.get('/commissions', async (req, res, next) => {
  try {
    const data = await prisma.affiliateCommission.findMany({ where: { ownerId: req.user!.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

affiliateRouter.get('/referrals', async (req, res, next) => {
  try {
    const profile = await prisma.affiliateProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) return res.status(404).json({ success: false, message: 'Chưa đăng ký affiliate' });
    const referrals = await prisma.affiliateReferral.findMany({ where: { affiliateProfileId: profile.id }, orderBy: { registeredAt: 'desc' } });
    const customers = await prisma.user.findMany({ where: { id: { in: referrals.map((item) => item.customerId) } }, select: { id: true, customerCode: true, fullName: true, phone: true, createdAt: true, parcels: { select: { id: true } }, transactions: { select: { amountVnd: true, type: true } } } });
    const data = customers.map((customer) => ({ id: customer.id, customerCode: customer.customerCode, fullName: customer.fullName, phone: customer.phone, registeredAt: customer.createdAt, totalOrders: customer.parcels.length, totalSpentVnd: Math.abs(customer.transactions.filter((tx) => tx.amountVnd < 0).reduce((sum, tx) => sum + tx.amountVnd, 0)) }));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

affiliateRouter.post('/withdrawals', async (req, res, next) => {
  try {
    const { amountVnd, bankName, accountNumber, accountName } = req.body;
    const amount = Number(amountVnd);
    if (!Number.isSafeInteger(amount) || amount <= 0 || !bankName || !accountNumber || !accountName) return res.status(400).json({ success: false, message: 'Thông tin rút hoa hồng không hợp lệ' });
    const profile = await prisma.affiliateProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile || profile.status !== 'ACTIVE') return res.status(403).json({ success: false, message: 'Affiliate chưa được kích hoạt' });
    const pending = await prisma.withdrawalRequest.aggregate({ where: { userId: req.user!.id, source: 'AFFILIATE', status: 'PENDING' }, _sum: { amountVnd: true } });
    if (profile.totalCommission - (pending._sum.amountVnd || 0) < amount) return res.status(409).json({ success: false, message: 'Hoa hồng khả dụng không đủ' });
    const data = await prisma.withdrawalRequest.create({ data: { requestCode: `AFF-WDR-${Date.now()}`, userId: req.user!.id, source: 'AFFILIATE', amountVnd: amount, bankName, accountNumber, accountName } });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

affiliateRouter.get('/', authorize(...ADMIN_ROLES), async (_req, res, next) => {
  try {
    const data = await prisma.affiliateProfile.findMany({ include: { user: { select: { fullName: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

affiliateRouter.patch('/:id/status', authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'REJECTED', 'SUSPENDED'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    const data = await prisma.affiliateProfile.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
