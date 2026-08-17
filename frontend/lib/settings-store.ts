'use client';
import { apiFetch } from './api-client';

export interface CategoryShippingRate {
  id: string;
  categoryName: string;
  examples: string;
  priceCnyUnder3kg: number;
  priceCnyOver3kg: number;
  note?: string;
}

export interface ContactSettings {
  hotline: string;
  showHotline: boolean;
  email: string;
  showEmail: boolean;
  workingHours: string;
  showWorkingHours: boolean;
  addressChina: string;
  showAddressChina: boolean;
  addressVietnam: string;
  showAddressVietnam: boolean;
  zaloLink: string;
  showZaloLink: boolean;
  telegramLink: string;
  showTelegramLink: boolean;
  wechatId: string;
  showWechatId: boolean;
  whatsappLink: string;
  showWhatsappLink: boolean;
  facebookLink: string;
  showFacebookLink: boolean;
  tiktokLink: string;
  showTiktokLink: boolean;
  youtubeLink: string;
  showYoutubeLink: boolean;

  // ─── SYSTEM EXCHANGE RATES ───
  cnyRate: number; // Fallback / legacy rate (3,650)
  rateBuyForMe: number; // Tỷ giá Mua Hộ 1688/Taobao (3,650)
  rateVndToCny: number; // Tỷ giá Đổi Tiền (Việt sang Tệ: 3,680)
  rateCnyToVnd: number; // Tỷ giá Đổi Tiền (Tệ sang Việt: 3,620)

  // ─── SHIPPING RATES ───
  landShippingFee: number; // Cước đường bộ (22,000đ/kg)
  airShippingFee: number; // Cước đường bay (45,000đ/kg)
  economyShippingPercent: number;
  standardShippingPercent: number;
  expressShippingPercent: number;
  categoryShippingRates: CategoryShippingRate[];
  highValueThresholdCny?: number;
  insuranceFeePercent: number;
  defaultCompensationPolicy: string;

  // ─── PAYMENT GATEWAY SETTINGS (PAYOS & PAYPAL) ───
  enablePayos: boolean;
  payosClientId: string;
  payosApiKey: string;
  payosChecksumKey: string;
  payosWebhookUrl: string;
  payosBankName: string;
  payosBankBin: string;
  payosAccountNumber: string;
  payosAccountName: string;

  enablePaypal: boolean;
  paypalClientId: string;
  paypalSecret: string;
  paypalMode: 'sandbox' | 'live';
  exchangeRateUsdToVnd: number; // Tỷ giá quy đổi USD -> VNĐ (25,400)

  // ─── AFFILIATE COMMISSION SETTINGS ───
  defaultAffiliateCommissionRate: number; // Tỷ lệ hoa hồng tiếp thị mặc định (% - default: 5%)

  // ─── SMTP EMAIL CONFIGURATION ───
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFromName: string;
  smtpFromEmail: string;

  // ─── GMAIL & ADMIN NOTIFICATION ALERTS ───
  adminNotificationEmail: string;
  enableEmailAlerts: boolean;

  // ─── TELEGRAM BOT CONFIGURATION ───
  telegramBotToken: string;
  telegramChatId: string;
  enableTelegramAlerts: boolean;
  telegramNotifyOrders: boolean;
  telegramNotifyWithdrawals: boolean;
  telegramNotifyApplications: boolean;
  telegramNotifyDisputes: boolean;
  telegramNotifyRegistrations: boolean;
}

export const DEFAULT_CATEGORY_RATES: CategoryShippingRate[] = [
  {
    id: 'cat-normal',
    categoryName: 'Hàng Hóa Thông Thường',
    examples: 'Quần áo, giày dép, túi xách, trái cây, thực phẩm khô, bánh kẹo',
    priceCnyUnder3kg: 15,
    priceCnyOver3kg: 10,
    note: 'Gửi dưới 3kg tính 15 tệ/kg. Trên 3kg tính 10 tệ/kg.',
  },
  {
    id: 'cat-snacks',
    categoryName: 'Đồ Ăn Vặt & Que Cay',
    examples: 'Đồ ăn vặt, que cay, đồ hộp',
    priceCnyUnder3kg: 15,
    priceCnyOver3kg: 15,
    note: 'Đồng giá 15 tệ/kg',
  },
  {
    id: 'cat-cosmetics',
    categoryName: 'Mỹ Phẩm, Thịt, Rượu',
    examples: 'Mỹ phẩm, son môi, kem dưỡng, thực phẩm thịt, rượu ngoại',
    priceCnyUnder3kg: 17,
    priceCnyOver3kg: 17,
    note: 'Đồng giá 17 tệ/kg',
  },
  {
    id: 'cat-medicine',
    categoryName: 'Thuốc Tây & Dược Phẩm',
    examples: 'Thuốc tây, dược phẩm, thực phẩm chức năng',
    priceCnyUnder3kg: 20,
    priceCnyOver3kg: 20,
    note: 'Đồng giá 20 tệ/kg',
  },
  {
    id: 'cat-electronics',
    categoryName: 'Sản Phẩm Điện Tử & Thiết Bị Gia Dụng',
    examples: 'Thiết bị gia dụng, đồ điện tử, quạt điện, máy móc nhỏ',
    priceCnyUnder3kg: 14,
    priceCnyOver3kg: 14,
    note: 'Đồng giá 14 tệ/kg',
  },
  { id: 'cat-fragile', categoryName: 'Hàng Dễ Vỡ', examples: 'Thủy tinh, gốm sứ, đèn trang trí, đồ trưng bày', priceCnyUnder3kg: 18, priceCnyOver3kg: 16, note: 'Cần đóng gỗ hoặc gia cố theo thực tế' },
  { id: 'cat-battery', categoryName: 'Pin & Hàng Có Từ Tính', examples: 'Pin rời, sạc dự phòng, thiết bị có pin, nam châm', priceCnyUnder3kg: 18, priceCnyOver3kg: 18, note: 'Áp dụng tuyến vận chuyển chuyên biệt' },
  { id: 'cat-bulky', categoryName: 'Hàng Cồng Kềnh', examples: 'Nội thất, đồ nhựa lớn, kiện nhẹ kích thước lớn', priceCnyUnder3kg: 15, priceCnyOver3kg: 11, note: 'Tính theo khối lượng quy đổi nếu lớn hơn cân nặng thực' },
  { id: 'cat-machinery', categoryName: 'Máy Móc & Linh Kiện', examples: 'Máy công nghiệp nhỏ, phụ tùng, linh kiện cơ khí', priceCnyUnder3kg: 16, priceCnyOver3kg: 13, note: 'Kiểm tra dầu, pin và từ tính trước khi nhận' },
  { id: 'cat-branded', categoryName: 'Hàng Thương Hiệu', examples: 'Quần áo, giày dép, túi xách có thương hiệu', priceCnyUnder3kg: 17, priceCnyOver3kg: 15, note: 'Phụ thuộc mức độ kiểm tra và chính sách từng thời kỳ' },
  { id: 'cat-books', categoryName: 'Sách, Giấy & Văn Phòng Phẩm', examples: 'Sách, vở, giấy in, dụng cụ học tập', priceCnyUnder3kg: 13, priceCnyOver3kg: 10, note: 'Không nhận nội dung thuộc danh mục cấm' },
  { id: 'cat-household', categoryName: 'Đồ Gia Dụng Không Điện', examples: 'Dụng cụ bếp, đồ nhựa, vật dụng gia đình', priceCnyUnder3kg: 14, priceCnyOver3kg: 12, note: 'Giá tiêu chuẩn cho hàng gia dụng thông thường' },
];

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  hotline: '0909 123 456 / 1900 688 888',
  showHotline: true,
  email: 'support@orderchinaviet.com',
  showEmail: true,
  workingHours: 'Thứ 2 – Thứ 7: 8:00 AM – 18:00 PM',
  showWorkingHours: true,
  addressChina: '广东省 广州市 白云区 Logistics Park No. 88',
  showAddressChina: true,
  addressVietnam: '123 Nguyễn Văn Cừ, P. 2, Q. 5, TP. Hồ Chí Minh',
  showAddressVietnam: true,
  zaloLink: 'https://zalo.me',
  showZaloLink: true,
  telegramLink: 'https://t.me/orderchinaviet',
  showTelegramLink: true,
  wechatId: 'OCV_Logistics_CN',
  showWechatId: true,
  whatsappLink: 'https://wa.me/84900000001',
  showWhatsappLink: true,
  facebookLink: 'https://facebook.com/orderchinaviet',
  showFacebookLink: true,
  tiktokLink: 'https://tiktok.com/@orderchinaviet',
  showTiktokLink: true,
  youtubeLink: 'https://youtube.com/@orderchinaviet',
  showYoutubeLink: true,

  // Rates Default
  cnyRate: 3650,
  rateBuyForMe: 3650,
  rateVndToCny: 3680,
  rateCnyToVnd: 3620,

  landShippingFee: 22000,
  airShippingFee: 45000,
  economyShippingPercent: 90,
  standardShippingPercent: 100,
  expressShippingPercent: 120,
  categoryShippingRates: DEFAULT_CATEGORY_RATES,
  highValueThresholdCny: 300,
  insuranceFeePercent: 10,
  defaultCompensationPolicy: 'Trường hợp hàng mất, thất lạc hoặc bị bắt: Đền 3 lần phí vận chuyển. Quý khách mua bảo hiểm (+10% giá trị) sẽ được đền bù 100% trị giá đơn hàng.',

  // PayOS Real Credentials (Cấu Hình Thực Tế từ PayOS)
  enablePayos: true,
  payosClientId: '',
  payosApiKey: '',
  payosChecksumKey: '',
  payosWebhookUrl: '',
  payosBankName: 'MB Bank',
  payosBankBin: '970422',
  payosAccountNumber: '0386 9183 43',
  payosAccountName: 'DOAN CAT NGUYEN',

  // PayPal Default
  enablePaypal: true,
  paypalClientId: '',
  paypalSecret: '',
  paypalMode: 'sandbox',
  exchangeRateUsdToVnd: 25400,

  // Affiliate Default Rate (5%)
  defaultAffiliateCommissionRate: 5,

  // SMTP Email Server Default (Gmail / Custom)
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  smtpFromName: 'OrderChinaViet System',
  smtpFromEmail: 'no-reply@orderchinaviet.com',

  // Gmail & Admin Alerts Default
  adminNotificationEmail: 'admin@orderchinaviet.com',
  enableEmailAlerts: true,

  // ─── TELEGRAM BOT DEFAULTS ───
  telegramBotToken: '',
  telegramChatId: '',
  enableTelegramAlerts: true,
  telegramNotifyOrders: true,
  telegramNotifyWithdrawals: true,
  telegramNotifyApplications: true,
  telegramNotifyDisputes: true,
  telegramNotifyRegistrations: true,
};

class SettingsStoreService {
  private cache: ContactSettings = { ...DEFAULT_CONTACT_SETTINGS };
  private loaded = false;
  private lastFetchedAt = 0;
  private inFlight: Promise<ContactSettings> | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  public async refreshSettings(force = false): Promise<ContactSettings> {
    const cacheIsFresh = this.loaded && Date.now() - this.lastFetchedAt < this.cacheTtlMs;
    if (!force && cacheIsFresh) return this.cache;
    if (this.inFlight) return this.inFlight;

    this.inFlight = apiFetch('/settings/public', {}, false)
      .then(async (response) => {
        if (!response.ok) throw new Error('Không thể tải cấu hình công khai');
        const json = await response.json();
        const incoming = json.data.contact || {};
        const savedRates: CategoryShippingRate[] = Array.isArray(incoming.categoryShippingRates) ? incoming.categoryShippingRates : [];
        const mergedRates = [...savedRates, ...DEFAULT_CATEGORY_RATES.filter((item) => !savedRates.some((saved) => saved.id === item.id))];
        this.cache = { ...this.cache, ...incoming, categoryShippingRates: mergedRates };
        this.loaded = true;
        this.lastFetchedAt = Date.now();
        window.dispatchEvent(new Event('orderchinaviet_settings_updated'));
        return this.cache;
      })
      .catch(() => this.cache)
      .finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  public getSettings(): ContactSettings {
    if (typeof window !== 'undefined') void this.refreshSettings();
    return this.cache;
  }

  public async saveSettings(newSettings: Partial<ContactSettings>): Promise<ContactSettings> {
    if (typeof window === 'undefined') return DEFAULT_CONTACT_SETTINGS;
    try {
      const updated = { ...this.cache, ...newSettings, cnyRate: newSettings.rateBuyForMe || newSettings.cnyRate || this.cache.rateBuyForMe };
      this.cache = updated;
      this.loaded = true;
      this.lastFetchedAt = Date.now();
      const { payosClientId, payosApiKey, payosChecksumKey, paypalClientId, paypalSecret, ...publicSettings } = updated;
      const response = await apiFetch('/settings', { method: 'PUT', body: JSON.stringify({ contact: publicSettings, payment: { payosClientId, payosApiKey, payosChecksumKey, paypalClientId, paypalSecret } }) });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
      if (!response.ok) throw new Error(result.message || 'Không thể lưu cấu hình hệ thống');

      // Dispatch event for website real-time sync
      window.dispatchEvent(new Event('orderchinaviet_settings_updated'));

      // Sync to Chrome Extension storage if extension API is available
      const win = window as any;
      if (typeof win !== 'undefined' && win.chrome && win.chrome.storage && win.chrome.storage.local) {
        win.chrome.storage.local.set({
          ocv_exrate: updated.rateBuyForMe,
          ocv_exrate_vnd_cny: updated.rateVndToCny,
          ocv_exrate_cny_vnd: updated.rateCnyToVnd,
        });
      }

      return this.cache;
    } catch (e) {
      console.error('Failed to save system settings', e);
      throw e;
    }
  }
}

export const settingsStore = new SettingsStoreService();
