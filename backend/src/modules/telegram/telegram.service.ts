import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  enabled?: boolean;
  notifyOrders?: boolean;
  notifyWithdrawals?: boolean;
  notifyApplications?: boolean;
  notifyDisputes?: boolean;
  notifyRegistrations?: boolean;
}

export class TelegramService {
  /**
   * Lấy cấu hình Telegram từ cơ sở dữ liệu SystemSetting hoặc biến môi trường .env
   */
  public static async getConfig(): Promise<TelegramConfig> {
    try {
      // 1. Kiểm tra cấu hình trong key 'contact' (nơi Admin Settings lưu toàn bộ form)
      const contactRow = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
      if (contactRow?.value) {
        const parsed = JSON.parse(contactRow.value);
        const botToken = parsed.telegramBotToken || parsed.botToken;
        const chatId = parsed.telegramChatId || parsed.chatId;

        if (botToken || chatId) {
          return {
            botToken: botToken || process.env.TELEGRAM_BOT_TOKEN || '',
            chatId: chatId || process.env.TELEGRAM_CHAT_ID || '',
            enabled: parsed.enableTelegramAlerts !== undefined ? Boolean(parsed.enableTelegramAlerts) : (parsed.enabled !== undefined ? Boolean(parsed.enabled) : true),
            notifyOrders: parsed.telegramNotifyOrders !== undefined ? Boolean(parsed.telegramNotifyOrders) : (parsed.notifyOrders !== undefined ? Boolean(parsed.notifyOrders) : true),
            notifyWithdrawals: parsed.telegramNotifyWithdrawals !== undefined ? Boolean(parsed.telegramNotifyWithdrawals) : (parsed.notifyWithdrawals !== undefined ? Boolean(parsed.notifyWithdrawals) : true),
            notifyApplications: parsed.telegramNotifyApplications !== undefined ? Boolean(parsed.telegramNotifyApplications) : (parsed.notifyApplications !== undefined ? Boolean(parsed.notifyApplications) : true),
            notifyDisputes: parsed.telegramNotifyDisputes !== undefined ? Boolean(parsed.telegramNotifyDisputes) : (parsed.notifyDisputes !== undefined ? Boolean(parsed.notifyDisputes) : true),
            notifyRegistrations: parsed.telegramNotifyRegistrations !== undefined ? Boolean(parsed.telegramNotifyRegistrations) : (parsed.notifyRegistrations !== undefined ? Boolean(parsed.notifyRegistrations) : true),
          };
        }
      }

      // 2. Kiểm tra cấu hình trong key 'telegram' (nếu có lưu riêng)
      const telegramRow = await prisma.systemSetting.findUnique({ where: { key: 'telegram' } });
      if (telegramRow?.value) {
        const parsed = JSON.parse(telegramRow.value);
        return {
          botToken: parsed.botToken || parsed.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '',
          chatId: parsed.chatId || parsed.telegramChatId || process.env.TELEGRAM_CHAT_ID || '',
          enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : (parsed.enableTelegramAlerts !== undefined ? Boolean(parsed.enableTelegramAlerts) : true),
          notifyOrders: parsed.notifyOrders !== undefined ? Boolean(parsed.notifyOrders) : (parsed.telegramNotifyOrders !== undefined ? Boolean(parsed.telegramNotifyOrders) : true),
          notifyWithdrawals: parsed.notifyWithdrawals !== undefined ? Boolean(parsed.notifyWithdrawals) : (parsed.telegramNotifyWithdrawals !== undefined ? Boolean(parsed.telegramNotifyWithdrawals) : true),
          notifyApplications: parsed.notifyApplications !== undefined ? Boolean(parsed.notifyApplications) : (parsed.telegramNotifyApplications !== undefined ? Boolean(parsed.telegramNotifyApplications) : true),
          notifyDisputes: parsed.notifyDisputes !== undefined ? Boolean(parsed.notifyDisputes) : (parsed.telegramNotifyDisputes !== undefined ? Boolean(parsed.telegramNotifyDisputes) : true),
          notifyRegistrations: parsed.notifyRegistrations !== undefined ? Boolean(parsed.notifyRegistrations) : (parsed.telegramNotifyRegistrations !== undefined ? Boolean(parsed.telegramNotifyRegistrations) : true),
        };
      }
    } catch (e) {
      console.warn('[TelegramService] Lỗi đọc cấu hình telegram từ database:', e);
    }

    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      notifyOrders: true,
      notifyWithdrawals: true,
      notifyApplications: true,
      notifyDisputes: true,
      notifyRegistrations: true,
    };
  }

  /**
   * Gửi tin nhắn thô tới Telegram Bot API
   */
  public static async sendMessage(
    text: string,
    customConfig?: { botToken: string; chatId: string },
    options: { parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'; replyMarkup?: any } = { parseMode: 'HTML' }
  ): Promise<{ success: boolean; message?: string; error?: any }> {
    try {
      const config = customConfig || (await this.getConfig());
      const botToken = config.botToken?.trim();
      const chatId = config.chatId?.trim();

      if (!botToken || !chatId) {
        return { success: false, message: 'Chưa cấu hình Telegram Bot Token hoặc Chat ID.' };
      }

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: true,
      };

      if (options.replyMarkup) {
        if (options.replyMarkup.inline_keyboard && Array.isArray(options.replyMarkup.inline_keyboard)) {
          const validKeyboard = options.replyMarkup.inline_keyboard
            .map((row: any[]) =>
              row.filter((btn: any) => {
                if (!btn.url) return true;
                const u = String(btn.url).toLowerCase().trim();
                return u.startsWith('https://') && !u.includes('localhost') && !u.includes('127.0.0.1');
              })
            )
            .filter((row: any[]) => row.length > 0);

          if (validKeyboard.length > 0) {
            payload.reply_markup = { inline_keyboard: validKeyboard };
          }
        } else {
          payload.reply_markup = options.replyMarkup;
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as any;
      if (!response.ok || !json.ok) {
        console.error('[TelegramService] Gửi tin nhắn thất bại:', json);
        return { success: false, message: json.description || 'Lỗi gửi tin nhắn qua Telegram Bot API.', error: json };
      }

      return { success: true, message: 'Đã gửi tin nhắn Telegram thành công!' };
    } catch (err: any) {
      console.error('[TelegramService] Lỗi kết nối Telegram:', err.message);
      return { success: false, message: err.message || 'Không thể kết nối tới máy chủ Telegram.', error: err };
    }
  }

  /**
   * Kiểm tra kết nối Telegram Bot
   */
  public static async testConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
    const timeStr = new Date().toLocaleTimeString('vi-VN');
    const dateStr = new Date().toLocaleDateString('vi-VN');

    const testMessage = `
<b>[ORDERCHINAVIET] THỬ NGHIỆM KẾT NỐI TELEGRAM BOT</b>
--------------------------------------------
<b>Trạng thái:</b> Kết nối thành công!
<b>Thời gian:</b> ${timeStr} - ${dateStr}
<b>Hệ thống:</b> OrderChinaViet Logistics Management Platform

<i>Bot thông báo đã sẵn sàng nhận cảnh báo đơn hàng mới, nạp rút tiền và ứng viên tuyển dụng từ website.</i>
    `.trim();

    const result = await this.sendMessage(testMessage, { botToken, chatId });
    if (!result.success) {
      return { success: false, message: result.message || 'Kiểm tra thất bại.' };
    }
    return { success: true, message: 'Kết nối Telegram Bot thành công! Đã gửi tin nhắn thử nghiệm tới nhóm/kênh.' };
  }

  /**
   * Bắn thông báo khi có ĐƠN MUA HỘ MỚI
   */
  public static async notifyNewOrder(order: {
    orderCode: string;
    platform: string;
    customerName?: string;
    customerPhone?: string;
    itemCount: number;
    totalVnd: number;
    depositRequiredVnd: number;
  }): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config.enabled || !config.notifyOrders) return;

      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const message = `
<b>ĐƠN HÀNG MUA HỘ MỚI</b>
--------------------------------------------
<b>Mã đơn:</b> <code>${order.orderCode}</code>
<b>Sàn TMĐT:</b> ${order.platform.toUpperCase()}
<b>Khách hàng:</b> ${order.customerName || 'N/A'} (${order.customerPhone || 'N/A'})
<b>Số lượng:</b> ${order.itemCount} sản phẩm
<b>Tổng giá trị:</b> <b>${order.totalVnd.toLocaleString('vi-VN')} ₫</b>
<b>Đặt cọc (70%):</b> ${order.depositRequiredVnd.toLocaleString('vi-VN')} ₫
<b>Thời gian:</b> ${timeStr}

👉 <i>Vui lòng vào trang Quản trị để duyệt đơn và tiến hành mua hàng.</i>
      `.trim();

      await this.sendMessage(message, undefined, {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: 'Xem Chi Tiết Đơn Hàng',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vi/admin/orders`,
              },
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('[TelegramService] Lỗi thông báo đơn hàng:', e);
    }
  }

  /**
   * Bắn thông báo khi có YÊU CẦU RÚT TIỀN VÍ
   */
  public static async notifyNewWithdrawal(withdrawal: {
    requestCode: string;
    customerName?: string;
    customerPhone?: string;
    amountVnd: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config.enabled || !config.notifyWithdrawals) return;

      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const message = `
<b>YÊU CẦU RÚT TIỀN VÍ MỚI</b>
--------------------------------------------
<b>Mã yêu cầu:</b> <code>${withdrawal.requestCode}</code>
<b>Người rút:</b> ${withdrawal.customerName || 'N/A'} (${withdrawal.customerPhone || 'N/A'})
<b>Số tiền rút:</b> <b>${withdrawal.amountVnd.toLocaleString('vi-VN')} ₫</b>
<b>Ngân hàng:</b> ${withdrawal.bankName}
<b>Số tài khoản:</b> <code>${withdrawal.accountNumber}</code>
<b>Chủ tài khoản:</b> ${withdrawal.accountName}
<b>Thời gian:</b> ${timeStr}

👉 <i>Vui lòng kiểm tra số dư và duyệt chuyển khoản ngân hàng.</i>
      `.trim();

      await this.sendMessage(message, undefined, {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: 'Duyệt Rút Tiền Ngay',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vi/admin/finance`,
              },
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('[TelegramService] Lỗi thông báo rút tiền:', e);
    }
  }

  /**
   * Bắn thông báo khi có ỨNG VIÊN MỚI NỘP HỒ SƠ TUYỂN DỤNG
   */
  public static async notifyNewJobApplication(application: {
    applicationCode: string;
    fullName: string;
    phone: string;
    email?: string;
    position: string;
    city?: string;
    experience?: string;
    note?: string;
  }): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config.enabled || !config.notifyApplications) return;

      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const message = `
<b>HỒ SƠ ỨNG VIÊN MỚI (CAREERS)</b>
--------------------------------------------
<b>Mã hồ sơ:</b> <code>${application.applicationCode}</code>
<b>Họ và tên:</b> <b>${application.fullName}</b>
<b>Số điện thoại / Zalo:</b> <code>${application.phone}</code>
<b>Email:</b> ${application.email || 'Chưa cập nhật'}
<b>Vị trí ứng tuyển:</b> ${application.position}
<b>Khu vực:</b> ${application.city || 'N/A'}
<b>Kinh nghiệm:</b> ${application.experience || 'N/A'}
<b>Thời gian nộp:</b> ${timeStr}
${application.note ? `<b>Ghi chú:</b> <i>${application.note}</i>\n` : ''}
👉 <i>Vào trang Tuyển dụng để xét duyệt và sinh link kích hoạt tài khoản đối tác.</i>
      `.trim();

      await this.sendMessage(message, undefined, {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: 'Duyệt Hồ Sơ & Cấp Link',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vi/admin/job-applications`,
              },
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('[TelegramService] Lỗi thông báo ứng viên:', e);
    }
  }

  /**
   * Bắn thông báo khi có KHIẾU NẠI MỚI TỪ KHÁCH HÀNG
   */
  public static async notifyNewDispute(dispute: {
    disputeCode: string;
    customerName?: string;
    customerEmail?: string;
    category: string;
    title: string;
    description: string;
  }): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config.enabled || !config.notifyDisputes) return;

      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const message = `
<b>KHIẾU NẠI MỚI TỪ KHÁCH HÀNG</b>
--------------------------------------------
<b>Mã khiếu nại:</b> <code>${dispute.disputeCode}</code>
<b>Khách hàng:</b> ${dispute.customerName || 'N/A'} (${dispute.customerEmail || 'N/A'})
<b>Danh mục:</b> [${dispute.category}]
<b>Tiêu đề:</b> <b>${dispute.title}</b>
<b>Nội dung:</b> <i>${dispute.description}</i>
<b>Thời gian:</b> ${timeStr}

👉 <i>Vui lòng phản hồi và xử lý khiếu nại cho khách hàng.</i>
      `.trim();

      await this.sendMessage(message, undefined, {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: 'Xử Lý Khiếu Nại',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vi/admin/orders`,
              },
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('[TelegramService] Lỗi thông báo khiếu nại:', e);
    }
  }

  /**
   * Bắn thông báo khi có THÀNH VIÊN / KHÁCH HÀNG MỚI ĐĂNG KÝ
   */
  public static async notifyNewUserRegistration(user: {
    fullName: string;
    email: string;
    phone?: string;
    customerCode: string;
    roleCode: string;
    referredBy?: string;
    province?: string;
  }): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config.enabled || !config.notifyRegistrations) return;

      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const isAffiliate = user.roleCode === 'AFFILIATE';

      const message = `
<b>${isAffiliate ? 'ĐỐI TÁC TIẾP THỊ (AFFILIATE) MỚI ĐĂNG KÝ' : 'KHÁCH HÀNG MỚI ĐĂNG KÝ TÀI KHOẢN'}</b>
--------------------------------------------
<b>Họ và tên:</b> <b>${user.fullName}</b>
<b>Mã định danh:</b> <code>${user.customerCode}</code>
<b>Số điện thoại:</b> <code>${user.phone || 'Chưa cập nhật'}</code>
<b>Email:</b> ${user.email}
<b>Loại tài khoản:</b> ${isAffiliate ? 'Đối tác Tiếp thị Liên kết' : 'Khách hàng Nhập hàng'}
${user.province ? `<b>Khu vực:</b> ${user.province}\n` : ''}${user.referredBy ? `<b>Người giới thiệu:</b> <code>${user.referredBy}</code>\n` : ''}<b>Thời gian:</b> ${timeStr}

👉 <i>Hệ thống đã tự động kích hoạt tài khoản và sẵn sàng giao dịch.</i>
      `.trim();

      await this.sendMessage(message, undefined, {
        parseMode: 'HTML',
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: isAffiliate ? 'Xem Đối Tác Affiliate' : 'Quản Lý Khách Hàng',
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vi/admin/${isAffiliate ? 'finance' : 'users'}`,
              },
            ],
          ],
        },
      });
    } catch (e) {
      console.warn('[TelegramService] Lỗi thông báo đăng ký thành viên:', e);
    }
  }
}
