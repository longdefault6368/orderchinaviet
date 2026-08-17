import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
function accessSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return process.env.JWT_SECRET;
}

function refreshSecret() {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is required');
  return process.env.JWT_REFRESH_SECRET;
}

function createTokens(user: { id: string; email: string; roleCode: string; fullName?: string | null; phone?: string | null }) {
  return {
    accessToken: jwt.sign({ sub: user.id, email: user.email, roleCode: user.roleCode, fullName: user.fullName || undefined, phone: user.phone || undefined }, accessSecret(), { expiresIn: '15m' }),
    refreshToken: jwt.sign({ sub: user.id, type: 'refresh' }, refreshSecret(), { expiresIn: '7d' }),
  };
}

export const authRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const validPassword = Boolean(user.passwordHash) && await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    const { accessToken, refreshToken } = createTokens(user);

    res.json({
      success: true,
      data: {
        tokens: { accessToken, refreshToken },
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          roleCode: user.roleCode,
          customerCode: user.customerCode,
          balanceVnd: user.balance,
          preferredLanguage: user.preferredLanguage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/register', async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      referralCode,   // optional: mã giới thiệu
      referredByCode, // optional: mã giới thiệu thay thế
      province,       // optional: tỉnh/thành phố giao hàng
      preferredLanguage = 'vi',
      accountType = 'CUSTOMER',
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên, email, số điện thoại và mật khẩu là bắt buộc',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
      });
    }

    // Check email uniqueness
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email này đã được sử dụng' });
    }

    // Check phone uniqueness (find by phone)
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Số điện thoại này đã được đăng ký' });
    }

    const rawRef = String(referralCode || referredByCode || '').trim().toUpperCase();
    const referrer = rawRef
      ? await prisma.affiliateProfile.findUnique({
          where: { affiliateCode: rawRef },
          include: { user: true },
        })
      : null;

    if (rawRef && !referrer) {
      return res.status(400).json({ success: false, message: `Mã giới thiệu "${rawRef}" không tồn tại trên hệ thống.` });
    }
    if (referrer && ['REJECTED', 'SUSPENDED'].includes(referrer.status)) {
      return res.status(400).json({ success: false, message: 'Mã giới thiệu này hiện đang bị tạm khóa hoặc không hoạt động.' });
    }

    // Generate unique customer code: OCV + timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const customerCode = `OCV${timestamp}${random}`;

    const passwordHash = await bcrypt.hash(password, 12);

    const roleCode = accountType === 'AFFILIATE' ? 'AFFILIATE' : 'CUSTOMER';
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        passwordHash,
        customerCode,
        roleCode,
        preferredLanguage,
        balance: 0,
      },
    });

    const affiliateProfile = roleCode === 'AFFILIATE'
      ? await prisma.affiliateProfile.create({ data: { userId: user.id, affiliateCode: `OCV_AFF_${Date.now().toString().slice(-8)}` } })
      : null;

    // ── KẾT NỐI KHÁCH HÀNG VỚI ĐỐI TÁC AFFILIATE (NẾU CÓ MÃ GIỚI THIỆU) ──
    if (referrer && roleCode !== 'AFFILIATE') {
      try {
        // 1. Tạo liên kết Affiliate Referral trong DB
        await prisma.affiliateReferral.create({
          data: {
            affiliateProfileId: referrer.id,
            customerId: user.id,
            registeredAt: new Date(),
          },
        });

        // 2. Tạo thông báo trong Web cho Đối tác Affiliate
        await prisma.notification.create({
          data: {
            userId: referrer.userId,
            title: 'Bạn có thành viên mới đăng ký qua Link giới thiệu!',
            message: `Khách hàng ${user.fullName} (${user.customerCode}) vừa tạo tài khoản thành công qua mã giới thiệu ${referrer.affiliateCode}.`,
            type: 'AFFILIATE',
            targetRole: 'CUSTOMER',
          },
        });

        // 3. Gửi Email thông báo cho Đối tác Affiliate
        if (referrer.user?.email) {
          void EmailService.notifyCustomerAlert({
            toEmail: referrer.user.email,
            customerName: referrer.user.fullName,
            title: 'Chúc Mừng! Có Thành Viên Mới Đăng Ký Qua Link Giới Thiệu Của Bạn',
            message: `Khách hàng ${user.fullName} (${user.phone}) vừa đăng ký tài khoản thành công qua mã giới thiệu ${referrer.affiliateCode}. Bạn sẽ nhận được hoa hồng tự động khi khách hàng phát sinh đơn mua hộ hoặc vận chuyển!`,
            linkUrl: '/affiliate/referrals',
            metadata: {
              customerName: user.fullName,
              customerCode: user.customerCode,
              phone: user.phone,
              affiliateCode: referrer.affiliateCode,
              registeredAt: new Date().toLocaleString('vi-VN'),
            },
          });
        }

        // 4. Bắn Telegram thông báo Admin
        void TelegramService.sendMessage(`
<b>THÀNH VIÊN MỚI ĐĂNG KÝ QUA LINK AFFILIATE</b>
--------------------------------------------
<b>Khách hàng:</b> <b>${user.fullName}</b> (Mã: <code>${user.customerCode}</code>)
<b>SĐT:</b> ${user.phone} | <b>Email:</b> ${user.email}
<b>Đối tác giới thiệu:</b> <b>${referrer.user.fullName}</b> (Mã: <code>${referrer.affiliateCode}</code>)

👉 <i>Hệ thống đã tự động gán khách hàng vào danh sách thành viên của đối tác ${referrer.user.fullName}.</i>
        `.trim());
      } catch (affErr) {
        console.error('[AffiliateReferral] Lỗi khi tạo liên kết giới thiệu:', affErr);
      }
    }

    if (roleCode === 'AFFILIATE' && affiliateProfile) {
      // 1. Thông báo cho Admin
      await prisma.notification.create({
        data: {
          title: `Đối tác Affiliate mới: ${user.fullName}`,
          message: `${user.email} - Mã: ${affiliateProfile.affiliateCode}`,
          type: 'AFFILIATE',
          targetRole: 'ADMIN',
        },
      });
      void EmailService.notifyAdminAlert({
        title: `Đối Tác Affiliate Mới: ${user.fullName}`,
        message: `Thành viên ${user.fullName} (${user.email} - ${user.phone}) vừa đăng ký tài khoản Đối tác Tiếp thị liên kết với Mã: ${affiliateProfile.affiliateCode}.`,
        linkUrl: '/admin/finance',
        metadata: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          customerCode: user.customerCode,
          affiliateCode: affiliateProfile.affiliateCode,
          accountType: 'AFFILIATE',
        },
      });

      // 2. Thông báo cho Người đăng ký Affiliate
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Chào mừng Đối tác Tiếp thị liên kết!',
          message: `Mã đối tác của bạn là ${affiliateProfile.affiliateCode}. Bắt đầu chia sẻ liên kết để nhận hoa hồng ngay hôm nay!`,
          type: 'AFFILIATE',
          targetRole: 'CUSTOMER',
        },
      });
      void EmailService.notifyCustomerAlert({
        toEmail: user.email,
        customerName: user.fullName,
        title: 'Chào Mừng Đối Tác Tiếp Thị Liên Kết (Affiliate Partner)!',
        message: `Chúc mừng Quý khách đã đăng ký thành công tài khoản Đối tác Tiếp thị của OrderChinaViet! Mã giới thiệu cá nhân của Quý khách là: ${affiliateProfile.affiliateCode}.`,
        linkUrl: '/affiliate',
        metadata: {
          affiliateCode: affiliateProfile.affiliateCode,
          customerCode: user.customerCode,
          email: user.email,
          phone: user.phone,
        },
      });

      // 3. Bắn Telegram thông báo Đối tác Affiliate mới
      void TelegramService.notifyNewUserRegistration({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || undefined,
        customerCode: affiliateProfile.affiliateCode,
        roleCode: 'AFFILIATE',
        referredBy: referrer?.affiliateCode,
        province,
      });
    } else {
      // 1. Thông báo cho Admin về Khách hàng mới
      await prisma.notification.create({
        data: {
          title: `Khách hàng mới: ${user.fullName}`,
          message: `${user.email} - Mã KH: ${user.customerCode}`,
          type: 'ORDER_CREATED',
          targetRole: 'ADMIN',
        },
      });
      void EmailService.notifyAdminAlert({
        title: `Khách Hàng Mới Đăng Ký: ${user.fullName}`,
        message: `Khách hàng ${user.fullName} (${user.email} - ${user.phone}) vừa tạo tài khoản thành công với Mã khách hàng: ${user.customerCode}.`,
        linkUrl: '/admin/users',
        metadata: {
          fullName: user.fullName,
          customerCode: user.customerCode,
          email: user.email,
          phone: user.phone,
          referredBy: referrer?.affiliateCode || 'Trực tiếp',
        },
      });

      // 2. Thông báo chào mừng cho Khách hàng
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Chào mừng bạn đến với OrderChinaViet!',
          message: `Mã khách hàng của bạn là ${user.customerCode}. Bắt đầu trải nghiệm dịch vụ nhập hàng Trung Quốc ngay hôm nay!`,
          type: 'ORDER_CREATED',
          targetRole: 'CUSTOMER',
        },
      });
      void EmailService.notifyCustomerAlert({
        toEmail: user.email,
        customerName: user.fullName,
        title: 'Chào Mừng Bạn Đến Với OrderChinaViet Logistics!',
        message: `Cảm ơn Quý khách đã tạo tài khoản tại OrderChinaViet. Mã khách hàng định danh của Quý khách là ${user.customerCode}. Quý khách có thể nạp ví, tạo đơn mua hộ 1688 / Taobao hoặc gửi yêu cầu vận chuyển ký gửi ngay bây giờ!`,
        linkUrl: '/orders',
        metadata: {
          customerCode: user.customerCode,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      });

      // 3. Bắn Telegram thông báo Khách hàng mới đăng ký
      void TelegramService.notifyNewUserRegistration({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || undefined,
        customerCode: user.customerCode || 'N/A',
        roleCode: 'CUSTOMER',
        referredBy: referrer?.affiliateCode,
        province,
      });
    }

    const { accessToken, refreshToken } = createTokens(user);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        tokens: { accessToken, refreshToken },
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          roleCode: user.roleCode,
          customerCode: user.customerCode,
          balance: user.balance,
          preferredLanguage: user.preferredLanguage,
          affiliateCode: affiliateProfile?.affiliateCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────────────────────────
authRouter.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, accessSecret()) as any;

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        roleCode: user.roleCode,
        customerCode: user.customerCode,
        balance: user.balance,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
});

authRouter.patch('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    const payload = jwt.verify(authHeader.slice(7), accessSecret()) as jwt.JwtPayload;
    if (!payload.sub) return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    const { fullName, phone, address, avatarUrl, preferredLanguage, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    let passwordHash: string | undefined;
    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
      passwordHash = await bcrypt.hash(newPassword, 12);
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: { ...(fullName?.trim() && { fullName: fullName.trim() }), ...(phone?.trim() && { phone: phone.trim() }), ...(address !== undefined && { address }), ...(avatarUrl !== undefined && { avatarUrl }), ...(preferredLanguage && { preferredLanguage }), ...(passwordHash && { passwordHash }) } });
    res.json({ success: true, data: { id: updated.id, email: updated.email, fullName: updated.fullName, phone: updated.phone, roleCode: updated.roleCode, customerCode: updated.customerCode, balanceVnd: updated.balance, address: updated.address, avatarUrl: updated.avatarUrl, preferredLanguage: updated.preferredLanguage } });
  } catch { res.status(401).json({ success: false, message: 'Token không hợp lệ' }); }
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Thiếu refresh token' });
    const payload = jwt.verify(refreshToken, refreshSecret()) as jwt.JwtPayload;
    if (payload.type !== 'refresh' || !payload.sub) throw new Error('Invalid refresh token');
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new Error('Inactive user');
    res.json({ success: true, data: { tokens: createTokens(user) } });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
});
