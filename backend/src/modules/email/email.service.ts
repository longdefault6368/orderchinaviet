import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
  fromEmail?: string;
}

export class EmailService {
  /**
   * Lấy cấu hình SMTP từ CSDL (key: 'smtp' hoặc trong 'contact')
   */
  public static async getSmtpConfig(): Promise<SmtpConfig | null> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'smtp' } });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }

      // Fallback: check in contact settings
      const contactSetting = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
      if (contactSetting && contactSetting.value) {
        const contact = JSON.parse(contactSetting.value);
        if (contact.smtpHost && contact.smtpUser) {
          return {
            host: contact.smtpHost,
            port: Number(contact.smtpPort || 587),
            secure: Boolean(contact.smtpSecure),
            user: contact.smtpUser,
            pass: contact.smtpPass || '',
            fromName: contact.smtpFromName || 'OrderChinaViet',
            fromEmail: contact.smtpFromEmail || contact.smtpUser,
          };
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc cấu hình SMTP từ DB:', e);
    }
    return null;
  }

  /**
   * Tạo Nodemailer Transporter từ cấu hình
   */
  public static createTransporter(config: SmtpConfig) {
    return nodemailer.createTransport({
      host: config.host.trim(),
      port: Number(config.port),
      secure: config.secure === true || Number(config.port) === 465,
      auth: {
        user: config.user.trim(),
        pass: config.pass.trim(),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Kiểm tra kết nối SMTP
   */
  public static async verifyConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.host || !config.user || !config.pass) {
        return {
          success: false,
          message: 'Vui lòng điền đầy đủ SMTP Host, Tên đăng nhập (Email) và Mật khẩu ứng dụng.',
        };
      }

      const transporter = this.createTransporter(config);
      await transporter.verify();
      return {
        success: true,
        message: 'Kết nối máy chủ SMTP thành công!',
      };
    } catch (error: any) {
      console.error('Lỗi kiểm tra kết nối SMTP:', error);
      let msg = error.message || 'Không thể kết nối tới máy chủ SMTP.';
      if (error.code === 'EAUTH') {
        msg = 'Xác thực thất bại! Sai tài khoản hoặc Mật khẩu ứng dụng (App Password). Đối với Gmail, vui lòng sử dụng Mật khẩu ứng dụng 16 ký tự.';
      } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
        msg = `Không thể kết nối đến máy chủ ${config.host}:${config.port}. Vui lòng kiểm tra Host và Cổng (Port).`;
      }
      return {
        success: false,
        message: msg,
      };
    }
  }

  /**
   * Gửi email
   */
  public static async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    config?: SmtpConfig;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = options.config || (await this.getSmtpConfig());
      if (!config || !config.host || !config.user) {
        return {
          success: false,
          error: 'Chưa cấu hình máy chủ SMTP. Vui lòng vào Cài Đặt Hệ Thống để thiết lập.',
        };
      }

      const transporter = this.createTransporter(config);
      const fromAddress = config.fromEmail || config.user;
      const fromName = config.fromName || 'OrderChinaViet';

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('Lỗi gửi email:', error);
      return {
        success: false,
        error: error.message || 'Lỗi không xác định khi gửi email qua SMTP.',
      };
    }
  }

  /**
   * Tự động gửi email cảnh báo cho Quản trị viên (Admin Alert Email)
   */
  public static async notifyAdminAlert(options: {
    title: string;
    message: string;
    type?: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const contactSetting = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
      let adminEmail = 'admin@orderchinaviet.com';
      let enableEmailAlerts = true;

      if (contactSetting && contactSetting.value) {
        const contact = JSON.parse(contactSetting.value);
        if (contact.adminNotificationEmail) adminEmail = contact.adminNotificationEmail;
        else if (contact.email) adminEmail = contact.email;
        if (contact.enableEmailAlerts === false) enableEmailAlerts = false;
      }

      if (!enableEmailAlerts) {
        console.log('[EmailService] Bỏ qua gửi mail admin vì cấu hình enableEmailAlerts = false');
        return;
      }

      const config = await this.getSmtpConfig();
      if (!config || !config.host || !config.user || !config.pass) {
        console.log('[EmailService] Bỏ qua gửi mail admin vì chưa cấu hình đầy đủ SMTP credentials');
        return;
      }

      const clientUrl = (process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const cleanLink = options.linkUrl?.startsWith('/') ? options.linkUrl : `/${options.linkUrl || 'admin'}`;
      const actionUrl = `${clientUrl}/vi${cleanLink}`;

      const metadataRows = options.metadata
        ? Object.entries(options.metadata)
            .filter(([k, v]) => v !== undefined && v !== null && k !== 'targetUrl')
            .map(
              ([k, v]) => `
              <tr>
                <td style="padding: 6px 12px; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 140px; font-size: 12px;">${k}:</td>
                <td style="padding: 6px 12px; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-family: monospace;">${typeof v === 'number' ? v.toLocaleString('vi-VN') : v}</td>
              </tr>
            `
            )
            .join('')
        : '';

      const html = `
        <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
            <h2 style="color: #fa3131; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">OrderChinaViet - Logistics Platform</h2>
            <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 500;">HỆ THỐNG THÔNG BÁO HOẠT ĐỘNG KHÁCH HÀNG REAL-TIME</p>
          </div>

          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #fa3131; padding: 16px; margin-bottom: 20px; border-radius: 10px;">
            <h3 style="color: #9f1239; margin: 0 0 6px 0; font-size: 15px; font-weight: bold;">${options.title}</h3>
            <p style="color: #881337; margin: 0; font-size: 13px; line-height: 1.5;">${options.message}</p>
          </div>

          ${
            metadataRows
              ? `
          <div style="margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #f1f5f9; padding: 8px 12px; font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase;">
              Chi Tiết Hoạt Động
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${metadataRows}
            </table>
          </div>
          `
              : ''
          }

          <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
            <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #fa3131, #0c3ed0); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: bold; box-shadow: 0 4px 12px rgba(250, 49, 49, 0.25);">
              Mở Trang Quản Trị Xử Lý &rarr;
            </a>
          </div>

          <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.4;">
            <p style="margin: 0;">Email này được gửi tự động tới Quản trị viên (${adminEmail}) từ OrderChinaViet Notification Engine.</p>
            <p style="margin: 4px 0 0 0;">Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>
      `;

      void this.sendMail({
        to: adminEmail,
        subject: `[OrderChinaViet Admin Alert] ${options.title}`,
        html,
        text: `${options.title}\n${options.message}\nTruy cập: ${actionUrl}`,
        config,
      });
    } catch (e) {
      console.error('[EmailService] Lỗi gửi email cảnh báo admin:', e);
    }
  }

  /**
   * Tự động gửi email thông báo cập nhật trạng thái cho Khách Hàng (Customer Alert Email)
   */
  public static async notifyCustomerAlert(options: {
    toEmail?: string;
    customerName?: string;
    title: string;
    message: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      if (!options.toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(options.toEmail)) {
        return;
      }

      const contactSetting = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
      let enableEmailAlerts = true;

      if (contactSetting && contactSetting.value) {
        const contact = JSON.parse(contactSetting.value);
        if (contact.enableEmailAlerts === false) enableEmailAlerts = false;
      }

      if (!enableEmailAlerts) return;

      const config = await this.getSmtpConfig();
      if (!config || !config.host || !config.user || !config.pass) return;

      const clientUrl = (process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const cleanLink = options.linkUrl?.startsWith('/') ? options.linkUrl : `/${options.linkUrl || 'orders'}`;
      const actionUrl = `${clientUrl}/vi${cleanLink}`;

      const metadataRows = options.metadata
        ? Object.entries(options.metadata)
            .filter(([k, v]) => v !== undefined && v !== null && k !== 'targetUrl')
            .map(
              ([k, v]) => `
              <tr>
                <td style="padding: 7px 12px; font-weight: bold; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 150px; font-size: 12px;">${k}:</td>
                <td style="padding: 7px 12px; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 500;">${typeof v === 'number' ? v.toLocaleString('vi-VN') : v}</td>
              </tr>
            `
            )
            .join('')
        : '';

      const html = `
        <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
            <h2 style="color: #0c3ed0; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">OrderChinaViet - Logistics Platform</h2>
            <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 500;">THÔNG BÁO CẬP NHẬT TRẠNG THÁI DỊCH VỤ</p>
          </div>

          <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
            Xin chào <strong>${options.customerName || 'Quý khách'}</strong>,
          </p>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #0c3ed0; padding: 16px; margin-bottom: 20px; border-radius: 10px;">
            <h3 style="color: #1e40af; margin: 0 0 6px 0; font-size: 15px; font-weight: bold;">${options.title}</h3>
            <p style="color: #1e3a8a; margin: 0; font-size: 13px; line-height: 1.5;">${options.message}</p>
          </div>

          ${
            metadataRows
              ? `
          <div style="margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #f1f5f9; padding: 8px 12px; font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase;">
              Thông Tin Chi Tiết
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${metadataRows}
            </table>
          </div>
          `
              : ''
          }

          <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
            <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #0c3ed0, #fa3131); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: bold; box-shadow: 0 4px 12px rgba(12, 62, 208, 0.25);">
              Xem Chi Tiết Trên Hệ Thống &rarr;
            </a>
          </div>

          <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.4;">
            <p style="margin: 0;">Nếu Quý khách có bất kỳ câu hỏi nào, vui lòng liên hệ Hotline CSKH hoặc trả lời email này.</p>
            <p style="margin: 4px 0 0 0;">Cảm ơn Quý khách đã tin tưởng sử dụng dịch vụ của OrderChinaViet!</p>
          </div>
        </div>
      `;

      void this.sendMail({
        to: options.toEmail,
        subject: `[OrderChinaViet] ${options.title}`,
        html,
        text: `${options.title}\n${options.message}\nXem chi tiết tại: ${actionUrl}`,
        config,
      });
    } catch (e) {
      console.error('[EmailService] Lỗi gửi email thông báo khách hàng:', e);
    }
  }
}
