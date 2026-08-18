import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
export const cmsRouter = Router();

const repositories: Record<string, any> = {
  services: prisma.service,
  guides: prisma.guide,
  policies: prisma.policy,
  announcements: prisma.announcement,
  blogs: prisma.blogPost,
};

cmsRouter.post('/job-applications', async (req, res, next) => {
  try {
    const { fullName, phone, email, position, city, experience, note } = req.body;
    if (!fullName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Họ tên và số điện thoại là bắt buộc' });
    }
    const appCode = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let createdApp = null;
    try {
      createdApp = await (prisma as any).jobApplication.create({
        data: {
          applicationCode: appCode,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          position: position || 'Cộng tác viên kinh doanh Online (Remote)',
          city: city?.trim() || null,
          experience: experience || null,
          note: note?.trim() || null,
          status: 'PENDING',
          salaryOffer: '2.000.000 ₫ + Hoa hồng',
        },
      });
    } catch (e) {
      console.error('JobApplication save error:', e);
    }

    await prisma.notification.create({
      data: {
        title: `Hồ sơ ứng tuyển mới: ${fullName.trim()} (${position || 'Cộng tác viên'})`,
        message: `Ứng viên ${fullName.trim()} - SĐT: ${phone.trim()} - Vị trí: ${position || 'CTV/Sales'}. Lương cơ bản 2.000.000đ.`,
        type: 'SYSTEM',
        targetRole: 'ADMIN',
      },
    });

    void EmailService.notifyAdminAlert({
      title: `Hồ Sơ Ứng Tuyển Mới: ${fullName.trim()} (${position || 'CTV/Sales'})`,
      message: `Ứng viên ${fullName.trim()} vừa gửi hồ sơ ứng tuyển vị trí ${position || 'Cộng tác viên / Sales Logistics'} (Lương cứng 2.000.000đ).`,
      linkUrl: '/admin/job-applications',
      metadata: {
        applicationCode: appCode,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || 'N/A',
        position: position || 'Cộng tác viên / Sales Online',
        city: city || 'N/A',
        experience: experience || 'N/A',
        note: note || 'N/A',
      },
    });

    void TelegramService.notifyNewJobApplication({
      applicationCode: appCode,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      position: position || 'Cộng tác viên / Sales Online',
      city: city || 'N/A',
      experience: experience || 'N/A',
      note: note?.trim(),
    });

    if (email?.trim()) {
      void EmailService.notifyCustomerAlert({
        toEmail: email.trim(),
        customerName: fullName.trim(),
        title: `Tiếp Nhận Hồ Sơ Ứng Tuyển Thành Công`,
        message: `Cảm ơn bạn đã gửi hồ sơ ứng tuyển vị trí ${position || 'Cộng tác viên / Sales Logistics'} (Lương cơ bản 2.000.000đ/tháng + Hoa hồng) tại OrderChinaViet. Bộ phận nhân sự sẽ liên hệ phỏng vấn trao đổi qua SĐT/Zalo trong vòng 24 giờ làm việc.`,
        linkUrl: '/careers',
        metadata: {
          applicationCode: appCode,
          position: position || 'Cộng tác viên / Sales Online',
          baseSalary: '2.000.000 ₫/tháng + Hoa hồng',
          status: 'Đang xét duyệt',
        },
      });
    }

    res.status(201).json({ success: true, data: createdApp || { applicationCode: appCode } });
  } catch (error) { next(error); }
});

cmsRouter.get('/job-applications/list', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const data = await (prisma as any).jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

cmsRouter.patch('/job-applications/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { status, adminNotes, interviewDate, salaryOffer } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (interviewDate !== undefined) updateData.interviewDate = interviewDate ? new Date(interviewDate) : null;
    if (salaryOffer !== undefined) updateData.salaryOffer = salaryOffer;

    const data = await (prisma as any).jobApplication.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

cmsRouter.delete('/job-applications/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    await (prisma as any).jobApplication.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: 'Đã xóa hồ sơ ứng viên' });
  } catch (error) { next(error); }
});

// Admin generates activation link for candidate
cmsRouter.post('/job-applications/:id/generate-link', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const app = await (prisma as any).jobApplication.findUnique({
      where: { id: req.params.id },
    });
    if (!app) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng viên' });

    const crypto = await import('crypto');
    const token = `act_${crypto.randomBytes(24).toString('hex')}`;
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const updated = await (prisma as any).jobApplication.update({
      where: { id: req.params.id },
      data: {
        activationToken: token,
        tokenExpiresAt,
        isActivated: false,
      },
    });

    const clientUrl =
      (req.headers.origin as string) ||
      (req.headers.host ? `${req.protocol || 'http'}://${req.headers.host}` : '') ||
      process.env.CLIENT_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const activationUrl = `${clientUrl.replace(/\/$/, '')}/vi/affiliate/activate?token=${token}`;

    res.json({
      success: true,
      data: {
        activationUrl,
        token,
        tokenExpiresAt,
        candidate: {
          fullName: updated.fullName,
          phone: updated.phone,
          email: updated.email,
          position: updated.position,
          applicationCode: updated.applicationCode,
        },
      },
    });
  } catch (error) { next(error); }
});

// Public: Candidate views activation page by token
cmsRouter.get('/job-applications/activation/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, message: 'Thiếu mã token kích hoạt' });

    const app = await (prisma as any).jobApplication.findUnique({
      where: { activationToken: token },
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Link kích hoạt không tồn tại hoặc đã bị hủy/thay thế.',
      });
    }

    if (app.isActivated) {
      return res.status(400).json({
        success: false,
        isAlreadyActivated: true,
        message: 'Tài khoản này đã được kích hoạt và đổi mật khẩu thành công trước đó. Bạn có thể đăng nhập ngay.',
      });
    }

    if (app.tokenExpiresAt && new Date(app.tokenExpiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'Link kích hoạt đã hết hạn (quá 7 ngày). Vui lòng liên hệ Admin để nhận link mới.',
      });
    }

    res.json({
      success: true,
      data: {
        applicationCode: app.applicationCode,
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        position: app.position,
        salaryOffer: app.salaryOffer || '2.000.000 ₫ + Hoa hồng',
      },
    });
  } catch (error) { next(error); }
});

// Public: Candidate sets password and completes activation
cmsRouter.post('/job-applications/activation/:token/complete', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, email } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }

    const app = await (prisma as any).jobApplication.findUnique({
      where: { activationToken: token },
    });

    if (!app) {
      return res.status(404).json({ success: false, message: 'Link kích hoạt không tồn tại hoặc không hợp lệ' });
    }

    if (app.isActivated) {
      return res.status(400).json({ success: false, message: 'Tài khoản này đã được kích hoạt thành công trước đó' });
    }

    if (app.tokenExpiresAt && new Date(app.tokenExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Link kích hoạt đã hết hạn sử dụng' });
    }

    const candidateEmail = (app.email || email || '').trim().toLowerCase();
    if (!candidateEmail) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email để làm tài khoản đăng nhập' });
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create or update User
    let user = await prisma.user.findUnique({ where: { email: candidateEmail } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          roleCode: 'AFFILIATE',
          status: 'ACTIVE',
          fullName: app.fullName || user.fullName,
          phone: app.phone || user.phone,
        },
      });
    } else {
      const userCount = await prisma.user.count();
      const customerCode = `OCV${String(userCount + 1).padStart(6, '0')}`;
      user = await prisma.user.create({
        data: {
          customerCode,
          fullName: app.fullName,
          email: candidateEmail,
          phone: app.phone,
          passwordHash,
          roleCode: 'AFFILIATE',
          status: 'ACTIVE',
          balance: 0,
        },
      });
    }

    // 2. Create or activate AffiliateProfile
    const affiliateCode = `OCV_AFF_${Date.now().toString().slice(-6)}`;
    let profile = await prisma.affiliateProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.affiliateProfile.create({
        data: {
          userId: user.id,
          affiliateCode,
          commissionRate: 0.3,
          status: 'ACTIVE',
        },
      });
    } else {
      profile = await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: { status: 'ACTIVE' },
      });
    }

    // 3. Mark JobApplication as activated and consume token
    await (prisma as any).jobApplication.update({
      where: { id: app.id },
      data: {
        isActivated: true,
        activationToken: null, // Consumed! Cannot be reused
        status: 'ACCEPTED',
        activatedUserId: user.id,
      },
    });

    // 4. Notify Admin
    await prisma.notification.create({
      data: {
        title: `Ứng viên kích hoạt tài khoản thành công: ${app.fullName}`,
        message: `Ứng viên ${app.fullName} (${candidateEmail}) đã đổi mật khẩu và kích hoạt tài khoản Đối tác Tiếp thị (Mã: ${profile.affiliateCode}).`,
        type: 'AFFILIATE',
        targetRole: 'ADMIN',
      },
    });

    // 5. Send Welcome Email
    void EmailService.notifyCustomerAlert({
      toEmail: candidateEmail,
      customerName: app.fullName,
      title: 'Chào Mừng Đối Tác Tiếp Thị OrderChinaViet!',
      message: `Chúc mừng bạn đã kích hoạt tài khoản Đối tác Tiếp thị thành công! Mã giới thiệu cá nhân của bạn là: ${profile.affiliateCode}. Lương cơ bản 2.000.000 ₫ + Hoa hồng 30%–50%.`,
      linkUrl: '/affiliate',
      metadata: {
        email: candidateEmail,
        affiliateCode: profile.affiliateCode,
        customerCode: user.customerCode,
        status: 'Đã kích hoạt',
      },
    });

    // 6. Bắn Telegram thông báo Đối tác Affiliate mới kích hoạt
    void TelegramService.notifyNewUserRegistration({
      fullName: app.fullName,
      email: candidateEmail,
      phone: app.phone || undefined,
      customerCode: profile.affiliateCode,
      roleCode: 'AFFILIATE',
      province: app.city || undefined,
    });

    // 7. Generate auth tokens for seamless login
    const jwt = await import('jsonwebtoken');
    const accessSecret = process.env.JWT_SECRET || 'orderchinaviet-secret-key-2026';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'orderchinaviet-refresh-secret-2026';

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, roleCode: user.roleCode, fullName: user.fullName, phone: user.phone },
      accessSecret,
      { expiresIn: '7d' }
    );
    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, refreshSecret, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Kích hoạt tài khoản và thiết lập mật khẩu thành công!',
      data: {
        user: {
          id: user.id,
          customerCode: user.customerCode,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          roleCode: user.roleCode,
          affiliateCode: profile.affiliateCode,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) { next(error); }
});

cmsRouter.get('/:resource', async (req, res, next) => {
  try {
    const repository = repositories[req.params.resource];
    if (!repository) return res.status(404).json({ success: false, message: 'Loại nội dung không tồn tại' });
    const data = await repository.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

cmsRouter.get('/:resource/:slug', async (req, res, next) => {
  try {
    const repository = repositories[req.params.resource];
    if (!repository) return res.status(404).json({ success: false, message: 'Loại nội dung không tồn tại' });
    const data = await repository.findFirst({ where: { slug: req.params.slug, isPublished: true } });
    if (!data) return res.status(404).json({ success: false, message: 'Nội dung không tồn tại' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

cmsRouter.post('/:resource', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const repository = repositories[req.params.resource];
    if (!repository) return res.status(404).json({ success: false, message: 'Loại nội dung không tồn tại' });
    const data = await repository.create({ data: req.body });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

cmsRouter.patch('/:resource/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const repository = repositories[req.params.resource];
    if (!repository) return res.status(404).json({ success: false, message: 'Loại nội dung không tồn tại' });
    const data = await repository.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

cmsRouter.delete('/:resource/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const repository = repositories[req.params.resource];
    if (!repository) return res.status(404).json({ success: false, message: 'Loại nội dung không tồn tại' });
    await repository.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});
