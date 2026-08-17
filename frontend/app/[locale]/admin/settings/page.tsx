'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  Share2,
  Video,
  Globe,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  Server,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  SendHorizontal,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Percent,
  Layers,
  HelpCircle,
  Truck,
  Plane,
} from 'lucide-react';
import { settingsStore, ContactSettings, CategoryShippingRate } from '@/lib/settings-store';
import { apiFetch } from '@/lib/api-client';

type SettingsTab = 'RATES' | 'CONTACT' | 'PAYMENT' | 'TELEGRAM' | 'SMTP';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: any; subLabel: string; badge?: string }[] = [
  {
    id: 'RATES',
    label: 'Tỷ Giá & Cước Phí',
    icon: DollarSign,
    subLabel: '3 tỷ giá NDT, cước vận chuyển, giá danh mục',
  },
  {
    id: 'CONTACT',
    label: 'Liên Hệ & Mạng Xã Hội',
    icon: Phone,
    subLabel: 'Hotline, địa chỉ kho TQ & VN, Zalo, Telegram',
  },
  {
    id: 'PAYMENT',
    label: 'Cổng Thanh Toán & Hoa Hồng',
    icon: CreditCard,
    subLabel: 'PayOS VietQR, PayPal USD, Hoa hồng Affiliate',
  },
  {
    id: 'TELEGRAM',
    label: 'Thông Báo Telegram Bot',
    icon: Send,
    subLabel: 'Bắn tin tức thì khi có Đơn hàng, Rút tiền, Ứng viên',
    badge: 'Realtime Alert',
  },
  {
    id: 'SMTP',
    label: 'Máy Chủ Gửi Email (SMTP)',
    icon: Server,
    subLabel: 'Gmail, SendGrid, Mailgun, kiểm tra kết nối live',
    badge: 'Nodemailer',
  },
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('RATES');
  const [form, setForm] = useState<ContactSettings>(settingsStore.getSettings());

  // SMTP Testing State
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Telegram Testing State
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  // Webhook Simulation State (Tự Động Khớp Lệnh VietQR)
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [simulatedAmount, setSimulatedAmount] = useState(50000);
  const [simulatedContent, setSimulatedContent] = useState('OCV 0909123456');
  const [simulatedProvider, setSimulatedProvider] = useState('PAYOS');
  const [webhookSimulationResult, setWebhookSimulationResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  useEffect(() => {
    let active = true;
    settingsStore
      .refreshSettings(true)
      .then((value) => {
        if (active) setForm(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleTestTelegramConnection = async () => {
    if (!form.telegramBotToken?.trim() || !form.telegramChatId?.trim()) {
      setTelegramTestResult({
        success: false,
        message: 'Vui lòng điền đầy đủ Telegram Bot Token và Chat ID trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestResult(null);

    try {
      const response = await apiFetch('/settings/test-telegram', {
        method: 'POST',
        body: JSON.stringify({
          botToken: form.telegramBotToken.trim(),
          chatId: form.telegramChatId.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Kiểm tra kết nối Telegram thất bại.');
      }
      setTelegramTestResult({
        success: true,
        message: json.message || 'Kết nối Telegram Bot thành công! Hãy kiểm tra tin nhắn trong ứng dụng Telegram.',
      });
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: err.message || 'Không thể kết nối tới máy chủ Telegram Bot API.',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!simulatedAmount || simulatedAmount <= 0) {
      setWebhookSimulationResult({ success: false, message: 'Vui lòng nhập số tiền nạp lớn hơn 0 ₫.' });
      return;
    }
    if (!simulatedContent.trim()) {
      setWebhookSimulationResult({
        success: false,
        message: 'Vui lòng nhập nội dung chuyển khoản mô phỏng (VD: OCV 0909123456 hoặc OCV KH001).',
      });
      return;
    }

    setIsSimulatingWebhook(true);
    setWebhookSimulationResult(null);

    try {
      const response = await apiFetch('/payments/simulate-webhook', {
        method: 'POST',
        body: JSON.stringify({
          provider: simulatedProvider,
          amountVnd: simulatedAmount,
          content: simulatedContent.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Lỗi xử lý khớp lệnh webhook mô phỏng.');
      }
      setWebhookSimulationResult({
        success: json.success,
        message: json.message || 'Khớp lệnh webhook thành công!',
        data: json.data,
      });
    } catch (err: any) {
      setWebhookSimulationResult({
        success: false,
        message: err.message || 'Không thể gửi yêu cầu mô phỏng webhook.',
      });
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    if (!form.smtpHost || !form.smtpUser || !form.smtpPass) {
      setSmtpTestResult({
        success: false,
        message: 'Vui lòng nhập đầy đủ Máy chủ SMTP, Email đăng nhập và Mật khẩu ứng dụng trước khi gửi thử nghiệm.',
      });
      return;
    }

    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const response = await apiFetch('/settings/test-smtp', {
        method: 'POST',
        body: JSON.stringify({
          host: form.smtpHost,
          port: form.smtpPort,
          secure: form.smtpSecure,
          user: form.smtpUser,
          pass: form.smtpPass,
          fromName: form.smtpFromName,
          fromEmail: form.smtpFromEmail,
          testRecipient: testRecipientEmail || form.adminNotificationEmail || form.smtpUser,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Kiểm tra kết nối thất bại.');
      }
      setSmtpTestResult({
        success: true,
        message: json.message || 'Gửi email thử nghiệm thành công!',
      });
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Không thể kết nối tới máy chủ SMTP.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const applySmtpPreset = (type: 'GMAIL' | 'SENDGRID' | 'MAILGUN' | 'OUTLOOK') => {
    if (type === 'GMAIL') {
      setForm((prev) => ({
        ...prev,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpFromEmail: prev.smtpUser || prev.email || 'no-reply@orderchinaviet.com',
      }));
    } else if (type === 'SENDGRID') {
      setForm((prev) => ({
        ...prev,
        smtpHost: 'smtp.sendgrid.net',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'apikey',
      }));
    } else if (type === 'MAILGUN') {
      setForm((prev) => ({
        ...prev,
        smtpHost: 'smtp.mailgun.org',
        smtpPort: 587,
        smtpSecure: false,
      }));
    } else if (type === 'OUTLOOK') {
      setForm((prev) => ({
        ...prev,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpSecure: false,
      }));
    }
  };

  const handleAddCategoryRate = () => {
    const updated = [...(form.categoryShippingRates || [])];
    updated.push({
      id: 'cat-' + Date.now(),
      categoryName: 'Mặt Hàng Mới',
      examples: 'Mô tả mặt hàng minh họa...',
      priceCnyUnder3kg: 15,
      priceCnyOver3kg: 12,
      note: 'Áp dụng theo quy chuẩn mới',
    });
    setForm({ ...form, categoryShippingRates: updated });
  };

  const handleDeleteCategoryRate = (index: number) => {
    const updated = [...(form.categoryShippingRates || [])];
    updated.splice(index, 1);
    setForm({ ...form, categoryShippingRates: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      await settingsStore.saveSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900 animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-16 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900 animate-in fade-in duration-200">
      <form onSubmit={handleSave} className="space-y-6">
        {/* TOP BANNER */}
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Cài Đặt Hệ Thống &amp; Cấu Hình</h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tùy chỉnh tỷ giá NDT, cước vận chuyển, thông tin liên hệ, cổng thanh toán và máy chủ gửi mail SMTP.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang Lưu...' : saved ? 'Đã Lưu Cấu Hình!' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cập nhật cấu hình hệ thống thành công!</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            {saveError}
          </div>
        )}

        {/* ── TAB NAVIGATION BAR ── */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-2xs border border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all text-left flex flex-col justify-between cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-white/15 text-white' : 'bg-white border border-slate-200 text-slate-700 shadow-2xs'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {tab.badge && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className={`text-xs sm:text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {tab.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight line-clamp-1 mt-0.5 ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {tab.subLabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TỶ GIÁ NDT & CƯỚC PHÍ VẬN CHUYỂN                                  */}
        {/* ========================================================================= */}
        {activeTab === 'RATES' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 3 LOẠI TỶ GIÁ NDT */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <DollarSign className="w-5 h-5 text-rose-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">1. Cấu Hình 3 Loại Tỷ Giá Nhân Dân Tệ (NDT ¥)</h2>
                  <p className="text-xs text-slate-500 font-medium">Tự động cập nhật 100% trên giao diện Website &amp; Extension Chrome</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* TỶ GIÁ 1: MUA HỘ */}
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#fa3131]" />
                      Tỷ Giá Mua Hộ (1688 / Taobao)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                      1 ¥ = {form.rateBuyForMe.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form.rateBuyForMe}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm({ ...form, rateBuyForMe: val, cnyRate: val });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#fa3131]"
                  />
                  <p className="text-[11px] text-slate-500 italic">Dùng cho công cụ tính cước 1688/Taobao, tiện ích Extension Chrome &amp; đơn hàng mua hộ.</p>
                </div>

                {/* TỶ GIÁ 2: ĐỔI TIỀN (VIỆT SANG TỆ) */}
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0c3ed0]" />
                      Tỷ Giá Mua Tệ (VNĐ ➔ CNY)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full">
                      1 ¥ = {form.rateVndToCny.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form.rateVndToCny}
                    onChange={(e) => setForm({ ...form, rateVndToCny: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0c3ed0]"
                  />
                  <p className="text-[11px] text-slate-500 italic">Áp dụng cho khách chuyển tiền VNĐ để nhận Nhân Dân Tệ (Nạp ví Alipay/WeChat Pay).</p>
                </div>

                {/* TỶ GIÁ 3: ĐỔI TIỀN (TỆ SANG VIỆT) */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Tỷ Giá Bán Tệ (CNY ➔ VNĐ)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      1 ¥ = {form.rateCnyToVnd.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form.rateCnyToVnd}
                    onChange={(e) => setForm({ ...form, rateCnyToVnd: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[11px] text-slate-500 italic">Áp dụng cho khách chuyển Nhân Dân Tệ CNY từ ví Alipay/WeChat để nhận tiền VNĐ.</p>
                </div>
              </div>
            </div>

            {/* CƯỚC PHÍ VẬN CHUYỂN & HỆ SỐ GÓI */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Truck className="w-5 h-5 text-sky-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">2. Cước Phí Vận Chuyển Tuyến Chính (Đường Bộ &amp; Đường Bay)</h2>
                  <p className="text-xs text-slate-500 font-medium">Bảng giá cước cơ sở (VNĐ/kg) áp dụng tính cước tự động trên toàn hệ thống</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-500" />
                      Cước Vận Chuyển Đường Bộ (Chính ngạch)
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {form.landShippingFee.toLocaleString('vi-VN')} ₫ / kg
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form.landShippingFee}
                    onChange={(e) => setForm({ ...form, landShippingFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-[11px] text-slate-500">Mặc định: 22.000 ₫/kg. Tuyến đường bộ tiêu chuẩn từ 3 - 5 ngày.</p>
                </div>

                <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-sky-500" />
                      Cước Vận Chuyển Đường Bay (Hỏa tốc)
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {form.airShippingFee.toLocaleString('vi-VN')} ₫ / kg
                    </span>
                  </div>
                  <input
                    type="number"
                    value={form.airShippingFee}
                    onChange={(e) => setForm({ ...form, airShippingFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-[11px] text-slate-500">Mặc định: 45.000 ₫/kg. Tuyến bay hỏa tốc 2 - 3 ngày nhận hàng.</p>
                </div>
              </div>

              {/* Hệ Số Gói Vận Chuyển */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-primary-600" />
                  <span>Tỷ Lệ Phần Trăm Điều Chỉnh Theo Gói Cước (%):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Gói Tiết Kiệm (5-7 Ngày)</label>
                    <input
                      type="number"
                      value={form.economyShippingPercent}
                      onChange={(e) => setForm({ ...form, economyShippingPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Gói Tiêu Chuẩn (3-5 Ngày)</label>
                    <input
                      type="number"
                      value={form.standardShippingPercent}
                      onChange={(e) => setForm({ ...form, standardShippingPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Gói Hỏa Tốc (2-3 Ngày)</label>
                    <input
                      type="number"
                      value={form.expressShippingPercent}
                      onChange={(e) => setForm({ ...form, expressShippingPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG GIÁ THEO DANH MỤC & BẢO HIỂM */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">3. Bảng Giá Vận Chuyển Theo Phân Loại Mặt Hàng</h2>
                    <p className="text-xs text-slate-500 font-medium">Bảng giá cước tính theo Nhân Dân Tệ (¥/kg) hiển thị trên trang Bảng Giá Cước</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddCategoryRate}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Mặt Hàng Mới</span>
                </button>
              </div>

              <div className="space-y-3">
                {(form.categoryShippingRates || []).map((cat, idx) => (
                  <div key={cat.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{cat.categoryName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryRate(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên Phân Loại</label>
                        <input
                          type="text"
                          value={cat.categoryName}
                          onChange={(e) => {
                            const updated = [...form.categoryShippingRates];
                            updated[idx].categoryName = e.target.value;
                            setForm({ ...form, categoryShippingRates: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Dưới 3kg (¥/kg)</label>
                        <input
                          type="number"
                          value={cat.priceCnyUnder3kg}
                          onChange={(e) => {
                            const updated = [...form.categoryShippingRates];
                            updated[idx].priceCnyUnder3kg = Number(e.target.value);
                            setForm({ ...form, categoryShippingRates: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Trên 3kg (¥/kg)</label>
                        <input
                          type="number"
                          value={cat.priceCnyOver3kg}
                          onChange={(e) => {
                            const updated = [...form.categoryShippingRates];
                            updated[idx].priceCnyOver3kg = Number(e.target.value);
                            setForm({ ...form, categoryShippingRates: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Ví Dụ Mặt Hàng</label>
                        <input
                          type="text"
                          value={cat.examples}
                          onChange={(e) => {
                            const updated = [...form.categoryShippingRates];
                            updated[idx].examples = e.target.value;
                            setForm({ ...form, categoryShippingRates: updated });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chính Sách Bảo Hiểm */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Chính Sách Đền Bù &amp; Bảo Hiểm Hàng Hóa
                  </label>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
                    <span>Phí bảo hiểm:</span>
                    <input
                      type="number"
                      value={form.insuranceFeePercent}
                      onChange={(e) => setForm({ ...form, insuranceFeePercent: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-center"
                    />
                    <span>%</span>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={form.defaultCompensationPolicy}
                  onChange={(e) => setForm({ ...form, defaultCompensationPolicy: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: THÔNG TIN LIÊN HỆ & MẠNG XÃ HỘI                                  */}
        {/* ========================================================================= */}
        {activeTab === 'CONTACT' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Phone className="w-5 h-5 text-primary-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">1. Thông Tin Liên Hệ CSKH &amp; Địa Chỉ Kho Bãi</h2>
                  <p className="text-xs text-slate-500 font-medium">Tự động đồng bộ trên toàn bộ Header, Footer, Trang Dịch Vụ và Popup Hướng Dẫn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Hotline */}
                <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#fa3131]" />
                      Hotline CSKH
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showHotline}
                        onChange={(e) => setForm({ ...form, showHotline: e.target.checked })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span>{form.showHotline ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.hotline}
                    onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                    placeholder="0909 123 456 / 1900 688 888"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Email Hỗ Trợ */}
                <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#fa3131]" />
                      Email Hỗ Trợ
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showEmail}
                        onChange={(e) => setForm({ ...form, showEmail: e.target.checked })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span>{form.showEmail ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="support@orderchinaviet.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Giờ Làm Việc */}
                <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0c3ed0]" />
                      Thời Gian Làm Việc
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showWorkingHours}
                        onChange={(e) => setForm({ ...form, showWorkingHours: e.target.checked })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span>{form.showWorkingHours ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.workingHours}
                    onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                    placeholder="Thứ 2 – Thứ 7: 8:00 AM – 18:00 PM"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Địa Chỉ Kho */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#fa3131]" />
                      Địa Chỉ Kho Quảng Châu (Trung Quốc)
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-rose-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showAddressChina}
                        onChange={(e) => setForm({ ...form, showAddressChina: e.target.checked })}
                        className="rounded text-rose-600"
                      />
                      <span>{form.showAddressChina ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.addressChina}
                    onChange={(e) => setForm({ ...form, addressChina: e.target.value })}
                    placeholder="广东省 广州市 白云区 Logistics Park No. 88"
                    className="w-full px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0c3ed0]" />
                      Địa Chỉ Kho Việt Nam (Hà Nội / TP.HCM)
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-sky-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showAddressVietnam}
                        onChange={(e) => setForm({ ...form, showAddressVietnam: e.target.checked })}
                        className="rounded text-sky-600"
                      />
                      <span>{form.showAddressVietnam ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.addressVietnam}
                    onChange={(e) => setForm({ ...form, addressVietnam: e.target.value })}
                    placeholder="123 Nguyễn Văn Cừ, P. 2, Q. 5, TP. Hồ Chí Minh"
                    className="w-full px-3.5 py-2.5 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CÁC KÊNH MẠNG XÃ HỘI */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">2. Các Kênh Mạng Xã Hội &amp; Hỗ Trợ Trực Tuyến</h2>
                  <p className="text-xs text-slate-500 font-medium">Hiển thị trên Footer, thanh Floating Action Bar và các nút liên hệ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Zalo */}
                <div className="space-y-1.5 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#0068FF]" />
                      Zalo CSKH Link / SĐT
                    </label>
                    <input
                      type="checkbox"
                      checked={form.showZaloLink}
                      onChange={(e) => setForm({ ...form, showZaloLink: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.zaloLink}
                    onChange={(e) => setForm({ ...form, zaloLink: e.target.value })}
                    placeholder="https://zalo.me/0909123456"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                {/* Telegram */}
                <div className="space-y-1.5 p-3.5 bg-sky-50/60 border border-sky-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#24A1DE]" />
                      Telegram Channel / CSKH
                    </label>
                    <input
                      type="checkbox"
                      checked={form.showTelegramLink}
                      onChange={(e) => setForm({ ...form, showTelegramLink: e.target.checked })}
                      className="rounded text-sky-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.telegramLink}
                    onChange={(e) => setForm({ ...form, telegramLink: e.target.value })}
                    placeholder="https://t.me/orderchinaviet"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                {/* WeChat */}
                <div className="space-y-1.5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#07C160]" />
                      WeChat ID Kho TQ
                    </label>
                    <input
                      type="checkbox"
                      checked={form.showWechatId}
                      onChange={(e) => setForm({ ...form, showWechatId: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.wechatId}
                    onChange={(e) => setForm({ ...form, wechatId: e.target.value })}
                    placeholder="OCV_Logistics_CN"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5 p-3.5 bg-green-50/60 border border-green-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-green-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                      WhatsApp Business Link
                    </label>
                    <input
                      type="checkbox"
                      checked={form.showWhatsappLink}
                      onChange={(e) => setForm({ ...form, showWhatsappLink: e.target.checked })}
                      className="rounded text-green-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.whatsappLink}
                    onChange={(e) => setForm({ ...form, whatsappLink: e.target.value })}
                    placeholder="https://wa.me/84909123456"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                {/* Facebook */}
                <div className="space-y-1.5 p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#1877F2]" />
                      Fanpage Facebook
                    </label>
                    <input
                      type="checkbox"
                      checked={form.showFacebookLink}
                      onChange={(e) => setForm({ ...form, showFacebookLink: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.facebookLink}
                    onChange={(e) => setForm({ ...form, facebookLink: e.target.value })}
                    placeholder="https://facebook.com/orderchinaviet"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                {/* TikTok & YouTube */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-rose-600" />
                      TikTok &amp; YouTube
                    </label>
                    <input
                      type="checkbox"
                      checked={form.showTiktokLink || form.showYoutubeLink}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setForm({ ...form, showTiktokLink: val, showYoutubeLink: val });
                      }}
                      className="rounded text-rose-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.tiktokLink}
                    onChange={(e) => setForm({ ...form, tiktokLink: e.target.value })}
                    placeholder="https://tiktok.com/@orderchinaviet"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CỔNG THANH TOÁN & HOA HỒNG TIẾP THỊ                              */}
        {/* ========================================================================= */}
        {activeTab === 'PAYMENT' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* CỔNG PAYOS VIETQR */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">1. Cấu Hình Cổng Thanh Toán PayOS (Quét Mã VietQR Tự Động 24/7)</h2>
                    <p className="text-xs text-slate-500 font-medium">Tự động tạo mã QR VietQR đúng số tiền, tự động xác nhận số dư ví khi khách chuyển khoản</p>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enablePayos !== false}
                    onChange={(e) => setForm({ ...form, enablePayos: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className={form.enablePayos !== false ? 'text-emerald-700' : 'text-slate-400'}>
                    {form.enablePayos !== false ? 'Bật Cổng PayOS' : 'Tắt'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PayOS Client ID</label>
                  <input
                    type="text"
                    value={form.payosClientId}
                    onChange={(e) => setForm({ ...form, payosClientId: e.target.value })}
                    placeholder="VD: cd123456-7890-abcd-ef01-23456789abcd"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PayOS API Key</label>
                  <input
                    type="text"
                    value={form.payosApiKey}
                    onChange={(e) => setForm({ ...form, payosApiKey: e.target.value })}
                    placeholder="VD: 550e8400-e29b-41d4-a716-446655440000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PayOS Checksum Key (Tạo Chữ Ký Bảo Mật)</label>
                  <input
                    type="password"
                    value={form.payosChecksumKey}
                    onChange={(e) => setForm({ ...form, payosChecksumKey: e.target.value })}
                    placeholder="Checksum secret key từ bảng điều khiển PayOS..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PayOS Webhook URL</label>
                  <input
                    type="text"
                    value={form.payosWebhookUrl}
                    onChange={(e) => setForm({ ...form, payosWebhookUrl: e.target.value })}
                    placeholder="https://api.orderchinaviet.com/api/payment/payos/webhook"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Thông Tin Tài Khoản Nhận */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-emerald-900">Thông Tin Tài Khoản Ngân Hàng Nhận Tiền VietQR:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngân Hàng (Tên / BIN)</label>
                    <input
                      type="text"
                      value={form.payosBankName}
                      onChange={(e) => setForm({ ...form, payosBankName: e.target.value })}
                      placeholder="MB Bank (970422)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Tài Khoản</label>
                    <input
                      type="text"
                      value={form.payosAccountNumber}
                      onChange={(e) => setForm({ ...form, payosAccountNumber: e.target.value })}
                      placeholder="0386 9183 43"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản</label>
                    <input
                      type="text"
                      value={form.payosAccountName}
                      onChange={(e) => setForm({ ...form, payosAccountName: e.target.value })}
                      placeholder="DOAN CAT NGUYEN"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* ── WEBHOOK RECONCILIATION ENGINE & LIVE SIMULATOR ── */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 border border-emerald-300/80 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/70">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Cổng Webhook Khớp Lệnh VietQR Tự Động 24/7 (Auto Reconciliation)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    3 Giây Tự Động Cộng Tiền Ví
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Webhook PayOS:</span>
                    <code className="text-[11px] font-mono font-bold text-emerald-700 block truncate">
                      /api/v1/payments/webhook/payos
                    </code>
                  </div>
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Webhook SePay / MBBank:</span>
                    <code className="text-[11px] font-mono font-bold text-emerald-700 block truncate">
                      /api/v1/payments/webhook/sepay
                    </code>
                  </div>
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Webhook VietQR Universal:</span>
                    <code className="text-[11px] font-mono font-bold text-emerald-700 block truncate">
                      /api/v1/payments/webhook/vietqr
                    </code>
                  </div>
                </div>

                {/* Cú pháp chuyển khoản */}
                <div className="p-3 bg-white/90 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block">Cú pháp chuyển khoản được hệ thống tự động nhận diện:</span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-slate-100 px-2 py-1 rounded-md font-mono">
                      <strong className="text-emerald-700 font-bold">OCV &lt;SĐT&gt;</strong> (VD: OCV 0909123456)
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md font-mono">
                      <strong className="text-emerald-700 font-bold">OCV &lt;Mã_KH&gt;</strong> (VD: OCV KH001)
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md font-mono">
                      <strong className="text-emerald-700 font-bold">OCV &lt;Mã_Lệnh_Nạp&gt;</strong> (VD: OCV DEP-1723...)
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md font-mono">
                      <strong className="text-emerald-700 font-bold">OCV &lt;Mã_Đơn&gt;</strong> (VD: OCV ORD-1723...)
                    </span>
                  </div>
                </div>

                {/* ── LIVE SIMULATOR FORM ── */}
                <div className="pt-2 border-t border-emerald-200/70 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                    <SendHorizontal className="w-4 h-4 text-emerald-600" />
                    <span>Bộ Thử Nghiệm &amp; Giả Lập Khớp Lệnh Webhook (Live Webhook Simulator):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cổng Webhook:</label>
                      <select
                        value={simulatedProvider}
                        onChange={(e) => setSimulatedProvider(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="PAYOS">PayOS Webhook</option>
                        <option value="SEPAY">SePay Webhook</option>
                        <option value="VIETQR">Universal VietQR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Số Tiền Nạp (₫):</label>
                      <input
                        type="number"
                        min="10000"
                        step="10000"
                        value={simulatedAmount}
                        onChange={(e) => setSimulatedAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Nội Dung Chuyển Khoản Mô Phỏng:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={simulatedContent}
                          onChange={(e) => setSimulatedContent(e.target.value)}
                          placeholder="VD: OCV 0909123456 hoặc OCV KH001"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleSimulateWebhook}
                          disabled={isSimulatingWebhook}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
                        >
                          {isSimulatingWebhook ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Đang Xử Lý...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Giả Lập Khớp Lệnh</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Simulation Result Box */}
                  {webhookSimulationResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 animate-in fade-in zoom-in-95 ${
                        webhookSimulationResult.success
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {webhookSimulationResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{webhookSimulationResult.success ? 'Khớp Lệnh Webhook Thành Công' : 'Khớp Lệnh Thất Bại'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed pl-6">{webhookSimulationResult.message}</p>
                      {webhookSimulationResult.data && (
                        <div className="pl-6 pt-1 font-mono text-[11px] text-slate-700">
                          {webhookSimulationResult.data.fullName && (
                            <div>Khách hàng: <strong>{webhookSimulationResult.data.fullName}</strong></div>
                          )}
                          {webhookSimulationResult.data.newBalance !== undefined && (
                            <div>Số dư mới: <strong className="text-emerald-700">{webhookSimulationResult.data.newBalance.toLocaleString('vi-VN')} ₫</strong></div>
                          )}
                          {webhookSimulationResult.data.transactionNo && (
                            <div>Mã giao dịch: <code>{webhookSimulationResult.data.transactionNo}</code></div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CỔNG PAYPAL QUỐC TẾ */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">2. Cấu Hình Cổng Thanh Toán PayPal USD (Thẻ Visa/Mastercard)</h2>
                    <p className="text-xs text-slate-500 font-medium">Hỗ trợ khách hàng quốc tế thanh toán thẻ tín dụng và số dư PayPal</p>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enablePaypal !== false}
                    onChange={(e) => setForm({ ...form, enablePaypal: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600"
                  />
                  <span className={form.enablePaypal !== false ? 'text-sky-700' : 'text-slate-400'}>
                    {form.enablePaypal !== false ? 'Bật Cổng PayPal' : 'Tắt'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môi Trường Hoạt Động</label>
                  <select
                    value={form.paypalMode}
                    onChange={(e) => setForm({ ...form, paypalMode: e.target.value as 'sandbox' | 'live' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="sandbox">Sandbox (Môi trường thử nghiệm)</option>
                    <option value="live">Live (Môi trường thực tế)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PayPal Client ID</label>
                  <input
                    type="text"
                    value={form.paypalClientId}
                    onChange={(e) => setForm({ ...form, paypalClientId: e.target.value })}
                    placeholder="sb-paypal-client-id..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tỷ Giá Quy Đổi (1 USD ➔ VNĐ)</label>
                  <input
                    type="number"
                    value={form.exchangeRateUsdToVnd}
                    onChange={(e) => setForm({ ...form, exchangeRateUsdToVnd: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-sky-700"
                  />
                </div>
              </div>
            </div>

            {/* HOA HỒNG AFFILIATE */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Percent className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">3. Chính Sách Hoa Hồng Tiếp Thị Liên Kết (Affiliate)</h2>
                  <p className="text-xs text-slate-500 font-medium">Tỷ lệ chiết khấu hoa hồng mặc định cho các đối tác giới thiệu khách hàng mới</p>
                </div>
              </div>

              <div className="max-w-md space-y-1.5 p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl">
                <label className="block text-xs font-bold text-indigo-950">
                  Tỷ Lệ Hoa Hồng Mặc Định (% trên doanh thu đơn hàng)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.defaultAffiliateCommissionRate || 5}
                    onChange={(e) => setForm({ ...form, defaultAffiliateCommissionRate: Number(e.target.value) })}
                    className="w-24 px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-center"
                  />
                  <span className="text-xs font-bold text-indigo-900">%</span>
                </div>
                <p className="text-[11px] text-indigo-700">Mặc định: 5%. Tự động tính khi đơn hàng của khách giới thiệu được hoàn tất.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: THÔNG BÁO TỨC THÌ QUA TELEGRAM BOT (REAL-TIME ALERTS)             */}
        {/* ========================================================================= */}
        {activeTab === 'TELEGRAM' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Cấu Hình Thông Báo Tức Thì Qua Telegram Bot</span>
                      <span className="text-[10px] font-mono font-bold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full uppercase">
                        Telegram Bot API
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Bắn tin cảnh báo tức thì về nhóm quản trị khi có Đơn hàng mới, Yêu cầu rút tiền, Ứng viên nộp hồ sơ hoặc Khiếu nại.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.enableTelegramAlerts !== false}
                    onChange={(e) => setForm({ ...form, enableTelegramAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className={form.enableTelegramAlerts !== false ? 'text-sky-700 font-bold' : 'text-slate-500'}>
                    {form.enableTelegramAlerts !== false ? 'Bật Cảnh Báo Telegram' : 'Đang Tắt Telegram'}
                  </span>
                </label>
              </div>

              {/* Step-by-step Guide Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  <span>Hướng dẫn nhanh 3 bước tạo Telegram Bot nhận thông báo:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                  <li>
                    Mở ứng dụng Telegram, tìm kiếm <strong>@BotFather</strong> và gửi lệnh <code className="bg-white px-1.5 py-0.5 rounded border text-sky-700 font-bold">/newbot</code> để tạo Bot mới và nhận <strong>Bot Token</strong>.
                  </li>
                  <li>
                    Tạo một nhóm Telegram cho Ban quản trị OrderChinaViet, thêm Bot vừa tạo vào nhóm và cấp quyền Administrator.
                  </li>
                  <li>
                    Lấy <strong>Chat ID</strong> của nhóm (thường có dấu trừ ở đầu, ví dụ: <code className="bg-white px-1.5 py-0.5 rounded border text-slate-800 font-bold">-1001987654321</code>) bằng cách thêm bot <strong>@userinfobot</strong> hoặc <strong>@raw_data_bot</strong> vào nhóm.
                  </li>
                </ol>
              </div>

              {/* Bot Credentials Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-1">
                {/* Telegram Bot Token */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    1. Telegram Bot Token <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showTelegramToken ? 'text' : 'password'}
                      value={form.telegramBotToken || ''}
                      onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
                      placeholder="VD: 7123456789:AAHq_m7Xk9abcdef..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowTelegramToken((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Mã Token bí mật do @BotFather cấp sau khi tạo bot.</p>
                </div>

                {/* Telegram Chat ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Chat ID / Group ID Nhận Thông Báo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.telegramChatId || ''}
                      onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                      placeholder="VD: -1001987654321 hoặc 987654321"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                    <Send className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-500">ID của nhóm Admin hoặc ID cá nhân của bạn.</p>
                </div>
              </div>

              {/* Event Notification Toggles */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Chọn Sự Kiện Gửi Thông Báo Về Telegram:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Đơn Mua Hộ Mới</span>
                      <span className="block text-[11px] text-slate-500">Bắn tin khi khách tạo đơn 1688 / Taobao / Tmall</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.telegramNotifyOrders !== false}
                      onChange={(e) => setForm({ ...form, telegramNotifyOrders: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Yêu Cầu Rút Tiền Ví</span>
                      <span className="block text-[11px] text-slate-500">Bắn tin khi khách/đối tác yêu cầu rút tiền về ngân hàng</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.telegramNotifyWithdrawals !== false}
                      onChange={(e) => setForm({ ...form, telegramNotifyWithdrawals: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Hồ Sơ Tuyển Dụng Mới (Careers)</span>
                      <span className="block text-[11px] text-slate-500">Bắn tin khi có ứng viên nộp hồ sơ CTV / Sales</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.telegramNotifyApplications !== false}
                      onChange={(e) => setForm({ ...form, telegramNotifyApplications: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition-colors">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Khiếu Nại Đơn Hàng</span>
                      <span className="block text-[11px] text-slate-500">Bắn tin khi khách gửi khiếu nại kiện hàng / dịch vụ</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.telegramNotifyDisputes !== false}
                      onChange={(e) => setForm({ ...form, telegramNotifyDisputes: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition-colors sm:col-span-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Thành Viên &amp; Đối Tác Mới Đăng Ký</span>
                      <span className="block text-[11px] text-slate-500">Bắn tin khi có khách hàng hoặc đối tác affiliate tạo tài khoản mới trên hệ thống</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.telegramNotifyRegistrations !== false}
                      onChange={(e) => setForm({ ...form, telegramNotifyRegistrations: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>

              {/* ── LIVE TELEGRAM TESTER SECTION ── */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-sky-50/40 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <SendHorizontal className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Kiểm Tra Kết Nối &amp; Gửi Tin Nhắn Thử Nghiệm (Live Telegram Connection Test)
                  </h3>
                </div>

                <p className="text-xs text-slate-600">
                  Nhấn nút bên dưới để hệ thống gửi ngay 1 tin nhắn thử nghiệm tới nhóm/kênh Telegram theo cấu hình vừa điền:
                </p>

                <div>
                  <button
                    type="button"
                    onClick={handleTestTelegramConnection}
                    disabled={isTestingTelegram}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isTestingTelegram ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang Kiểm Tra...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi Tin Nhắn Thử Nghiệm Telegram (Test Bot)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Alert */}
                {telegramTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 animate-in fade-in zoom-in-95 ${
                      telegramTestResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {telegramTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{telegramTestResult.success ? 'Kết Nối Telegram Hoàn Tất' : 'Lỗi Kết Nối Telegram'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed pl-6">{telegramTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MÁY CHỦ GỬI EMAIL (SMTP MAIL SERVER) & GMAIL                      */}
        {/* ========================================================================= */}
        {activeTab === 'SMTP' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Cấu Hình Máy Chủ Gửi Email (SMTP Mail Server)</span>
                      <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                        Nodemailer SMTP
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Thiết lập thông số máy chủ gửi email tự động (Gmail, SendGrid, Mailgun, Outlook hoặc SMTP Riêng) để gửi email thông báo đơn hàng, nạp tiền và xác thực.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.enableEmailAlerts !== false}
                    onChange={(e) => setForm({ ...form, enableEmailAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className={form.enableEmailAlerts !== false ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                    {form.enableEmailAlerts !== false ? 'Bật Gửi Mail Tự Động' : 'Đang Tắt Gửi Mail'}
                  </span>
                </label>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chọn Nhanh Mẫu Cấu Hình (Provider Presets):</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Click để tự động điền Host &amp; Cổng</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('GMAIL')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.smtpHost === 'smtp.gmail.com'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Google Gmail (smtp.gmail.com)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('OUTLOOK')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.smtpHost === 'smtp.office365.com'
                        ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Microsoft Outlook (Office 365)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('SENDGRID')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.smtpHost === 'smtp.sendgrid.net'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    SendGrid (smtp.sendgrid.net)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('MAILGUN')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.smtpHost === 'smtp.mailgun.org'
                        ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Mailgun (smtp.mailgun.org)
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SMTP Host */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    1. Máy Chủ SMTP (SMTP Host) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.smtpHost || ''}
                    onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                    placeholder="VD: smtp.gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500">Đối với Gmail dùng: <code className="text-rose-600 font-bold">smtp.gmail.com</code></p>
                </div>

                {/* SMTP Port & Security */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Cổng Kết Nối (Port) &amp; Bảo Mật <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.smtpPort || 587}
                      onChange={(e) => {
                        const portNum = Number(e.target.value);
                        setForm({
                          ...form,
                          smtpPort: portNum,
                          smtpSecure: portNum === 465,
                        });
                      }}
                      placeholder="587 hoặc 465"
                      className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                    />
                    <select
                      value={form.smtpSecure ? 'SSL' : 'TLS'}
                      onChange={(e) => setForm({ ...form, smtpSecure: e.target.value === 'SSL' })}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                    >
                      <option value="TLS">STARTTLS (Khuyên dùng cổng 587)</option>
                      <option value="SSL">SSL / TLS (Khuyên dùng cổng 465)</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500">Cổng 587 (STARTTLS) hoặc 465 (SSL/TLS trực tiếp).</p>
                </div>

                {/* SMTP User / Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    3. Tài Khoản Đăng Nhập (Email / Username) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.smtpUser || ''}
                      onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                      placeholder="VD: orderchinaviet.cskh@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-500">Tài khoản hòm thư dùng để xác thực và bắn email ra ngoài.</p>
                </div>

                {/* SMTP Password / App Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    4. Mật Khẩu Ứng Dụng (App Password / API Key) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={form.smtpPass || ''}
                      onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                      placeholder="Mật khẩu ứng dụng 16 ký tự..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-rose-600 font-medium">
                    Với Gmail: Dùng <strong>Mật khẩu ứng dụng (App Password 16 chữ cái)</strong> từ trang Google Account Bảo mật 2 bước.
                  </p>
                </div>

                {/* Sender From Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    5. Tên Người Gửi Hiển Thị (From Name)
                  </label>
                  <input
                    type="text"
                    value={form.smtpFromName || 'OrderChinaViet System'}
                    onChange={(e) => setForm({ ...form, smtpFromName: e.target.value })}
                    placeholder="VD: OrderChinaViet Logistics"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>

                {/* Sender From Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    6. Địa Chỉ Email Người Gửi (From Email)
                  </label>
                  <input
                    type="email"
                    value={form.smtpFromEmail || form.smtpUser || ''}
                    onChange={(e) => setForm({ ...form, smtpFromEmail: e.target.value })}
                    placeholder="VD: no-reply@orderchinaviet.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>

                {/* Admin Notification Receiver */}
                <div className="md:col-span-2 space-y-1.5 p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <label className="block text-xs font-bold text-rose-900">
                    7. Địa Chỉ Gmail Nhận Thông Báo Của Admin (Notification Receiver)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={form.adminNotificationEmail || form.email}
                      onChange={(e) => setForm({ ...form, adminNotificationEmail: e.target.value })}
                      placeholder="admin@orderchinaviet.com"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-xs font-mono font-bold text-rose-900 focus:outline-none focus:border-rose-600"
                    />
                  </div>
                  <p className="text-[11px] text-rose-700 font-medium">
                    Mọi đơn hàng mới, nạp tiền ví, đổi tệ Alipay và yêu cầu rút tiền sẽ tự động gửi email thông báo tới hòm thư này.
                  </p>
                </div>
              </div>

              {/* ── LIVE SMTP TESTER SECTION ── */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-rose-50/40 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <SendHorizontal className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Kiểm Tra Kết Nối &amp; Gửi Email Thử Nghiệm (Live SMTP Connection Test)
                  </h3>
                </div>

                <p className="text-xs text-slate-600">
                  Nhập email người nhận và nhấn nút kiểm tra để hệ thống gửi 1 email mẫu qua cấu hình SMTP vừa điền:
                </p>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-xl">
                  <input
                    type="email"
                    value={testRecipientEmail}
                    onChange={(e) => setTestRecipientEmail(e.target.value)}
                    placeholder={form.adminNotificationEmail || form.smtpUser || 'Nhập email nhận mail test...'}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestSmtpConnection}
                    disabled={isTestingSmtp}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    {isTestingSmtp ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang Thử Nghiệm...</span>
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="w-4 h-4" />
                        <span>Kiểm Tra &amp; Gửi Mail Test</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Alert */}
                {smtpTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 animate-in fade-in zoom-in-95 ${
                      smtpTestResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {smtpTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{smtpTestResult.success ? 'Kết Nối SMTP Hoàn Tất' : 'Lỗi Kết Nối SMTP'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed pl-6">{smtpTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
