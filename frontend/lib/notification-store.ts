'use client';

import { settingsStore } from './settings-store';
import { apiFetch } from './api-client';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER_CREATED' | 'FINANCE_DEPOSIT' | 'FINANCE_EXCHANGE' | 'SYSTEM';
  targetRole: 'ADMIN' | 'CUSTOMER' | 'ALL';
  recipientEmail?: string;
  recipientPhone?: string;
  linkUrl?: string;
  metadata?: {
    orderId?: string;
    amountVnd?: number;
    amountCny?: number;
    paymentMethod?: string;
    customerName?: string;
    accountInfo?: string;
    targetUrl?: string;
    requestCode?: string;
    disputeCode?: string;
    packageCode?: string;
  };
  isRead: boolean;
  gmailStatus: 'SENT' | 'PENDING' | 'SIMULATED';
  createdAt: string;
}

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-2026-9001',
    title: 'Đơn hàng mới tạo: #ORD-2026-8809',
    message: 'Khách hàng Nguyễn Văn Hùng vừa tạo đơn hàng mua hộ 1688 giá trị 12,500,000 ₫',
    type: 'ORDER_CREATED',
    targetRole: 'ADMIN',
    recipientEmail: 'admin@orderchinaviet.com',
    linkUrl: '/admin/orders',
    metadata: {
      orderId: 'ORD-2026-8809',
      amountVnd: 12500000,
      customerName: 'Nguyễn Văn Hùng',
      targetUrl: '/admin/orders',
    },
    isRead: false,
    gmailStatus: 'SENT',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'NOTIF-2026-9002',
    title: 'Yêu cầu nạp ví mới: 1,000,000 ₫ qua PayOS VietQR',
    message: 'Khách hàng vừa gửi yêu cầu nạp 1,000,000 ₫ vào Ví Dư qua PayOS (STK: 0386 9183 43 - DOAN CAT NGUYEN)',
    type: 'FINANCE_DEPOSIT',
    targetRole: 'ADMIN',
    recipientEmail: 'admin@orderchinaviet.com',
    linkUrl: '/admin/finance',
    metadata: {
      amountVnd: 1000000,
      paymentMethod: 'PayOS VietQR',
      customerName: 'Nguyễn Văn Hùng',
      targetUrl: '/admin/finance',
    },
    isRead: false,
    gmailStatus: 'SENT',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'NOTIF-2026-9003',
    title: 'Chào mừng bạn đến với OrderChinaViet',
    message: 'Tài khoản của bạn đã được kích hoạt thành công. Hãy khám phá công cụ đặt hàng 1688, Taobao và nạp ví cước tự động.',
    type: 'SYSTEM',
    targetRole: 'CUSTOMER',
    linkUrl: '/orders',
    metadata: {
      targetUrl: '/orders',
    },
    isRead: false,
    gmailStatus: 'SENT',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'NOTIF-2026-9004',
    title: 'Cập nhật tỷ giá Nhân Dân Tệ hôm nay',
    message: 'Tỷ giá mua hộ và nạp ví Alipay đã được cập nhật tự động theo thời gian thực trên hệ thống.',
    type: 'FINANCE_EXCHANGE',
    targetRole: 'CUSTOMER',
    linkUrl: '/rates',
    metadata: {
      targetUrl: '/rates',
    },
    isRead: false,
    gmailStatus: 'SENT',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'NOTIF-2026-9005',
    title: 'Tiện ích Extension OrderChinaViet đã sẵn sàng',
    message: 'Cài đặt Extension trên Chrome/Cốc Cốc để thêm sản phẩm trực tiếp từ Taobao, 1688, Tmall vào giỏ hàng 1-click.',
    type: 'SYSTEM',
    targetRole: 'CUSTOMER',
    linkUrl: '/extension/orderchinaviet-extension.zip',
    metadata: {
      targetUrl: '/extension/orderchinaviet-extension.zip',
    },
    isRead: false,
    gmailStatus: 'SENT',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

class NotificationStoreService {
  private cache: SystemNotification[] = [...INITIAL_NOTIFICATIONS];
  private loading = false;

  private async load() {
    try {
      const response = await apiFetch('/operations/notifications');
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const apiItems = json.data.map((item: any) => ({
            ...item,
            targetRole: item.targetRole || 'ALL',
            gmailStatus: 'SENT',
            linkUrl: item.linkUrl || item.metadata?.targetUrl || (item.metadata?.orderId ? '/admin/orders' : undefined),
          }));
          this.cache = [...apiItems, ...INITIAL_NOTIFICATIONS.filter((init) => !apiItems.some((a: any) => a.id === init.id))];
        }
      }
    } catch (e) {
      console.warn('Failed to load API notifications, using cache', e);
    }
    window.dispatchEvent(new Event('orderchinaviet_notification_updated'));
  }

  public getNotifications(role: 'ADMIN' | 'CUSTOMER' | 'ALL' = 'ALL'): SystemNotification[] {
    if (typeof window !== 'undefined' && !this.loading) {
      this.loading = true;
      void this.load().finally(() => {
        this.loading = false;
      });
    }
    if (role === 'ALL') return this.cache;
    return this.cache.filter((item) => item.targetRole === role || item.targetRole === 'ALL');
  }

  public getUnreadCount(role: 'ADMIN' | 'CUSTOMER' | 'ALL' = 'CUSTOMER'): number {
    const list = this.getNotifications(role);
    return list.filter((n) => !n.isRead).length;
  }

  public addNotification(notification: Omit<SystemNotification, 'id' | 'createdAt' | 'isRead' | 'gmailStatus'>): SystemNotification {
    const settings = settingsStore.getSettings();
    const adminEmail = settings.adminNotificationEmail || settings.email || 'admin@orderchinaviet.com';

    const newNotif: SystemNotification = {
      ...notification,
      id: `NOTIF-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      recipientEmail: notification.recipientEmail || adminEmail,
      isRead: false,
      gmailStatus: settings.enableEmailAlerts !== false ? 'SENT' : 'SIMULATED',
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        this.cache = [newNotif, ...this.cache];
        window.dispatchEvent(new CustomEvent('orderchinaviet_notification_added', { detail: newNotif }));

        // Trigger backend API to persist in database & send automated SMTP alert to Admin
        void apiFetch('/operations/notifications', {
          method: 'POST',
          body: JSON.stringify({
            title: newNotif.title,
            message: newNotif.message,
            type: newNotif.type,
            targetRole: newNotif.targetRole,
            linkUrl: newNotif.linkUrl,
            metadata: newNotif.metadata,
          }),
        }).catch((err) => {
          console.warn('Backend notification sync:', err);
        });
      } catch (e) {
        console.error('Failed to add notification', e);
      }
    }

    return newNotif;
  }

  public markAsRead(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      this.cache = this.cache.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      void apiFetch(`/operations/notifications/${id}/read`, { method: 'PATCH' });
      window.dispatchEvent(new Event('orderchinaviet_notification_updated'));
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  }

  public markAllAsRead(role: 'ADMIN' | 'CUSTOMER' | 'ALL' = 'CUSTOMER'): void {
    if (typeof window === 'undefined') return;
    try {
      const updated = this.cache.map((n) => {
        if (role === 'ALL' || n.targetRole === role || n.targetRole === 'ALL') {
          return { ...n, isRead: true };
        }
        return n;
      });
      this.cache = updated;
      updated
        .filter((item) => item.isRead)
        .forEach((item) => {
          void apiFetch(`/operations/notifications/${item.id}/read`, { method: 'PATCH' });
        });
      window.dispatchEvent(new Event('orderchinaviet_notification_updated'));
    } catch (e) {
      console.error('Failed to mark all notifications as read', e);
    }
  }

  // 1. Đơn Hàng Mua Hộ Mới
  public notifyNewOrder(orderData: { id: string; customerName: string; amountVnd: number; itemsCount?: number }): void {
    this.addNotification({
      title: `Đơn Hàng Mới: ${orderData.id}`,
      message: `Khách hàng ${orderData.customerName} vừa tạo đơn hàng mua hộ (${orderData.itemsCount || 1} sản phẩm) trị giá ${orderData.amountVnd.toLocaleString('vi-VN')} ₫.`,
      type: 'ORDER_CREATED',
      targetRole: 'ADMIN',
      linkUrl: '/admin/orders',
      metadata: {
        orderId: orderData.id,
        amountVnd: orderData.amountVnd,
        customerName: orderData.customerName,
        targetUrl: '/admin/orders',
      },
    });
  }

  // 2. Đặt Cọc Đơn Hàng Mua Hộ
  public notifyOrderDeposit(data: { orderId: string; customerName: string; amountVnd: number; paymentMethod: string }): void {
    this.addNotification({
      title: `Đặt Cọc Đơn Hàng: ${data.orderId}`,
      message: `Khách hàng ${data.customerName} vừa thanh toán cọc ${data.amountVnd.toLocaleString('vi-VN')} ₫ cho đơn hàng ${data.orderId} qua ${data.paymentMethod}.`,
      type: 'FINANCE_DEPOSIT',
      targetRole: 'ADMIN',
      linkUrl: '/admin/orders',
      metadata: {
        orderId: data.orderId,
        amountVnd: data.amountVnd,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        targetUrl: '/admin/orders',
      },
    });
  }

  // 3. Yêu Cầu Vận Chuyển Mới
  public notifyTransportRequest(data: { requestCode: string; customerName: string; categoryName: string; estimatedTotalVnd: number; weight: number }): void {
    this.addNotification({
      title: `Yêu Cầu Vận Chuyển Mới: ${data.requestCode}`,
      message: `Khách hàng ${data.customerName} vừa gửi yêu cầu vận chuyển ${data.categoryName} (${data.weight.toFixed(1)} kg) trị giá ước tính ${data.estimatedTotalVnd.toLocaleString('vi-VN')} ₫.`,
      type: 'SYSTEM',
      targetRole: 'ADMIN',
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: data.requestCode,
        amountVnd: data.estimatedTotalVnd,
        customerName: data.customerName,
        targetUrl: '/admin/shipments',
      },
    });
  }

  // 4. Yêu Cầu Giao Hàng Tại Việt Nam
  public notifyDeliveryRequest(data: { requestCode: string; customerName: string; parcelsCount: number; address: string }): void {
    this.addNotification({
      title: `Yêu Cầu Giao Hàng Mới: ${data.requestCode}`,
      message: `Khách hàng ${data.customerName} vừa yêu cầu giao ${data.parcelsCount} kiện hàng đến địa chỉ: ${data.address}.`,
      type: 'SYSTEM',
      targetRole: 'ADMIN',
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: data.requestCode,
        customerName: data.customerName,
        targetUrl: '/admin/shipments',
      },
    });
  }

  // 5. Nạp Tiền Vào Ví Dư
  public notifyWalletDeposit(data: { amountVnd: number; customerName: string; paymentMethod: string; transactionId?: string }): void {
    this.addNotification({
      title: `Yêu Cầu Nạp Ví: ${data.amountVnd.toLocaleString('vi-VN')} ₫`,
      message: `Khách hàng ${data.customerName} vừa gửi yêu cầu nạp ${data.amountVnd.toLocaleString('vi-VN')} ₫ vào Ví Dư qua ${data.paymentMethod}.`,
      type: 'FINANCE_DEPOSIT',
      targetRole: 'ADMIN',
      linkUrl: '/admin/finance',
      metadata: {
        amountVnd: data.amountVnd,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        targetUrl: '/admin/finance',
      },
    });
  }

  // 6. Yêu Cầu Rút Tiền Từ Ví
  public notifyWithdrawalRequest(data: { requestCode: string; customerName: string; amountVnd: number; bankName: string; accountNumber: string; accountName: string }): void {
    this.addNotification({
      title: `Yêu Cầu Rút Tiền: ${data.requestCode}`,
      message: `Khách hàng ${data.customerName} vừa gửi yêu cầu rút ${data.amountVnd.toLocaleString('vi-VN')} ₫ về ${data.bankName} (${data.accountNumber} - ${data.accountName}).`,
      type: 'FINANCE_DEPOSIT',
      targetRole: 'ADMIN',
      linkUrl: '/admin/finance',
      metadata: {
        requestCode: data.requestCode,
        amountVnd: data.amountVnd,
        customerName: data.customerName,
        targetUrl: '/admin/finance',
      },
    });
  }

  // 7. Yêu Cầu Đổi Tiền / Nạp Alipay
  public notifyExchangeRequest(txData: {
    id: string;
    typeLabel: string;
    customerName: string;
    amountVnd: number;
    amountCny?: number;
    paymentMethod: string;
  }): void {
    this.addNotification({
      title: `Yêu Cầu Đổi Tiền Mới: ${txData.typeLabel}`,
      message: `Khách hàng ${txData.customerName} vừa gửi yêu cầu ${txData.typeLabel} (${txData.amountCny ? `${txData.amountCny} ¥ = ` : ''}${txData.amountVnd.toLocaleString('vi-VN')} ₫) qua ${txData.paymentMethod}.`,
      type: 'FINANCE_EXCHANGE',
      targetRole: 'ADMIN',
      linkUrl: '/admin/exchange',
      metadata: {
        amountVnd: txData.amountVnd,
        amountCny: txData.amountCny,
        paymentMethod: txData.paymentMethod,
        customerName: txData.customerName,
        targetUrl: '/admin/exchange',
      },
    });
  }

  // 8. Khiếu Nại & Hỗ Trợ
  public notifyDisputeCreated(data: { disputeCode: string; customerName: string; packageCode: string; typeLabel: string; description: string }): void {
    this.addNotification({
      title: `Khiếu Nại Mới: ${data.disputeCode}`,
      message: `Khách hàng ${data.customerName} vừa tạo khiếu nại [${data.typeLabel}] cho kiện ${data.packageCode}: "${data.description}".`,
      type: 'SYSTEM',
      targetRole: 'ADMIN',
      linkUrl: '/admin/orders',
      metadata: {
        disputeCode: data.disputeCode,
        packageCode: data.packageCode,
        customerName: data.customerName,
        targetUrl: '/admin/orders',
      },
    });
  }

  // 9. Yêu Cầu Hoàn Tiền Cọc Đơn Hàng
  public notifyRefundRequest(data: { orderId: string; customerName: string; amountVnd: number; reason: string }): void {
    this.addNotification({
      title: `Yêu Cầu Hoàn Tiền Cọc: ${data.orderId}`,
      message: `Khách hàng ${data.customerName} yêu cầu hoàn ${data.amountVnd.toLocaleString('vi-VN')} ₫ tiền cọc đơn hàng ${data.orderId}. Lý do: ${data.reason || 'Không cung cấp'}`,
      type: 'SYSTEM',
      targetRole: 'ADMIN',
      linkUrl: '/admin/orders',
      metadata: {
        orderId: data.orderId,
        amountVnd: data.amountVnd,
        customerName: data.customerName,
        targetUrl: '/admin/orders',
      },
    });
  }

  // 10. Đặt Cọc Yêu Cầu Vận Chuyển
  public notifyTransportDeposit(data: { requestCode: string; customerName: string; amountVnd: number; paymentMethod: string; percentage?: number }): void {
    this.addNotification({
      title: `Đặt Cọc Vận Chuyển: ${data.requestCode}`,
      message: `Khách hàng ${data.customerName} vừa thanh toán cọc ${data.amountVnd.toLocaleString('vi-VN')} ₫ (${data.percentage || 70}%) cho yêu cầu ${data.requestCode} qua ${data.paymentMethod}.`,
      type: 'FINANCE_DEPOSIT',
      targetRole: 'ADMIN',
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: data.requestCode,
        amountVnd: data.amountVnd,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        targetUrl: '/admin/shipments',
      },
    });
  }

  // 11. Yêu Cầu Hoàn Cọc Vận Chuyển
  public notifyTransportRefundRequest(data: { requestCode: string; customerName: string; amountVnd: number; reason: string }): void {
    this.addNotification({
      title: `Yêu Cầu Hoàn Cọc Vận Chuyển: ${data.requestCode}`,
      message: `Khách hàng ${data.customerName} yêu cầu hoàn ${data.amountVnd.toLocaleString('vi-VN')} ₫ tiền cọc cho yêu cầu ${data.requestCode}. Lý do: ${data.reason || 'Không cung cấp'}`,
      type: 'SYSTEM',
      targetRole: 'ADMIN',
      linkUrl: '/admin/shipments',
      metadata: {
        requestCode: data.requestCode,
        amountVnd: data.amountVnd,
        customerName: data.customerName,
        targetUrl: '/admin/shipments',
      },
    });
  }
}

export const notificationStore = new NotificationStoreService();
