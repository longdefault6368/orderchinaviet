import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
export const settingsRouter = Router();

settingsRouter.get('/public', async (_req, res, next) => {
  try {
    const rows = await prisma.systemSetting.findMany({ where: { isPublic: true } });
    res.json({ success: true, data: Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value)])) });
  } catch (error) { next(error); }
});

settingsRouter.get('/', authenticate, authorize(...ADMIN_ROLES), async (_req, res, next) => {
  try {
    const rows = await prisma.systemSetting.findMany();
    res.json({ success: true, data: Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value)])) });
  } catch (error) { next(error); }
});

settingsRouter.put('/', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const entries = Object.entries(req.body || {});
    if (!entries.length) return res.status(400).json({ success: false, message: 'Không có cấu hình để lưu' });
    const publicKeys = new Set(['contact', 'shippingRates', 'exchangeRates', 'company']);
    await prisma.$transaction(entries.map(([key, value]) => prisma.systemSetting.upsert({ where: { key }, update: { value: JSON.stringify(value), isPublic: publicKeys.has(key) }, create: { key, value: JSON.stringify(value), isPublic: publicKeys.has(key) } })));
    res.json({ success: true });
  } catch (error) { next(error); }
});

settingsRouter.post('/test-smtp', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { host, port, secure, user, pass, fromName, fromEmail, testRecipient } = req.body;
    if (!host || !user || !pass) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ SMTP Host, Tên đăng nhập (Email) và Mật khẩu ứng dụng.' });
    }

    const recipient = testRecipient?.trim() || user.trim();
    const config = {
      host: host.trim(),
      port: Number(port || 587),
      secure: Boolean(secure),
      user: user.trim(),
      pass: pass.trim(),
      fromName: fromName?.trim() || 'OrderChinaViet System',
      fromEmail: fromEmail?.trim() || user.trim(),
    };

    // 1. Kiểm tra kết nối SMTP
    const verifyResult = await EmailService.verifyConnection(config);
    if (!verifyResult.success) {
      return res.status(400).json({ success: false, message: verifyResult.message });
    }

    // 2. Gửi thử 1 email test
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #fa3131; margin: 0; font-size: 22px; font-weight: bold;">OrderChinaViet - Logistics Platform</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Thử Nghiệm Cấu Hình Máy Chủ Gửi Mail (SMTP Test)</p>
        </div>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
          <h3 style="color: #065f46; margin: 0 0 6px 0; font-size: 15px; font-weight: bold;">Kết Nối Máy Chủ SMTP Thành Công!</h3>
          <p style="color: #047857; margin: 0; font-size: 13px; line-height: 1.5;">
            Chúc mừng bạn! Cấu hình máy chủ SMTP trên hệ thống OrderChinaViet đã hoạt động chuẩn xác và sẵn sàng gửi email thông báo tự động tới khách hàng và quản trị viên.
          </p>
        </div>
        <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b; width: 140px;">SMTP Host:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-weight: bold;">${config.host}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Cổng (Port):</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${config.port} (${config.secure ? 'SSL/TLS - 465' : 'STARTTLS - 587'})</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Tài khoản gửi:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${config.user}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Tên người gửi:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${config.fromName} &lt;${config.fromEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Thời gian kiểm tra:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${new Date().toLocaleString('vi-VN')}</td>
          </tr>
        </table>
        <div style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Email tự động được gửi từ trang Quản trị Cài Đặt Hệ Thống OrderChinaViet.
        </div>
      </div>
    `;

    const sendResult = await EmailService.sendMail({
      to: recipient,
      subject: `[OrderChinaViet] Kiểm tra kết nối SMTP thành công (${new Date().toLocaleTimeString('vi-VN')})`,
      html,
      text: `Kết nối máy chủ SMTP thành công! Host: ${config.host}:${config.port}. Gửi tới: ${recipient}`,
      config,
    });

    if (!sendResult.success) {
      return res.status(400).json({ success: false, message: sendResult.error || 'Không thể gửi email thử nghiệm.' });
    }

    res.json({
      success: true,
      message: `Đã gửi email thử nghiệm thành công tới ${recipient}! Vui lòng kiểm tra hộp thư đến hoặc thư mục Spam.`,
    });
  } catch (error: any) {
    next(error);
  }
});

settingsRouter.post('/test-telegram', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { botToken, chatId } = req.body;
    if (!botToken?.trim() || !chatId?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Telegram Bot Token và Chat ID.' });
    }

    const result = await TelegramService.testConnection(botToken.trim(), chatId.trim());
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    next(error);
  }
});
