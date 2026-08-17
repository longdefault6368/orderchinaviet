'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CreditCard,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Zap,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Building2,
  Clock,
  Lock,
  Phone,
  Send,
  Headset,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';
import { authStore } from '@/lib/auth-store';

import zaloImg from '@/assets/images/zalo.png';
import telegramImg from '@/assets/images/telegram.webp';
import wechatImg from '@/assets/images/wechat.webp';
import whatsappImg from '@/assets/images/whatsapp.png';
import facebookImg from '@/assets/images/facebook.webp';
import {
  Mail,
  Video,
  Share2,
} from 'lucide-react';

export default function AlipayExchangeServicePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'BUY_CNY' | 'SELL_CNY'>('BUY_CNY'); // BUY_CNY = Mua Tệ (VNĐ -> CNY), SELL_CNY = Bán Tệ (CNY -> VNĐ)

  // Amount states (Bidirectional)
  const [cnyAmount, setCnyAmount] = useState<number>(1000);
  const [vndInputAmount, setVndInputAmount] = useState<number | null>(null);

  const handleExchangeClick = () => {
    if (authStore.isLoggedIn()) {
      router.push(`/${locale}/finance`);
    } else {
      router.push(`/${locale}/login`);
    }
  };

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleUpdate);
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleUpdate);
  }, []);

  // Rates from Admin Settings
  const rateBuyCny = settings.rateVndToCny || 3680; // Mua Tệ (VNĐ ➔ CNY: Nạp Ví Alipay/WeChat)
  const rateSellCny = settings.rateCnyToVnd || 3620; // Bán Tệ (CNY ➔ VNĐ: Rút tiền về Ngân Hàng)

  const activeRate = activeTab === 'BUY_CNY' ? rateBuyCny : rateSellCny;

  const handleCnyChange = (val: number) => {
    setCnyAmount(val);
    setVndInputAmount(null);
  };

  const handleVndChange = (val: number) => {
    setVndInputAmount(val);
    if (activeRate > 0) {
      setCnyAmount(Math.round((val / activeRate) * 100) / 100);
    }
  };

  const vndAmount = vndInputAmount !== null ? vndInputAmount : Math.round(cnyAmount * activeRate);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale as any} dict={null} />

      <main className="flex-1 pb-16">
        {/* Hero Banner */}
        <PageHeroBanner
          badge="DỊCH VỤ TÀI CHÍNH ALIPAY & WECHAT PAY"
          title="Nạp & Bán Tệ Alipay / WeChat Pay Uy Tín Tốc Độ"
          summary="Hỗ trợ 2 chiều: Mua Tệ (Dùng VNĐ nạp Alipay/WeChat) & Bán Tệ (Chuyển CNY rút VNĐ về Ngân Hàng). Xử lý tức thì 24/7 trong 3–5 phút, nguồn tiền sạch 100%."
          breadcrumbs={[{ label: 'Nạp & Bán Tệ Alipay' }]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* ── SECTION 1: CÔNG CỤ QUY ĐỔI TỶ GIÁ & NẠP/BÁN TỆ ── */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Công Cụ Tính Tỷ Giá Mua Tệ &amp; Bán Tệ</h2>
                  <p className="text-xs text-slate-500">Hệ thống tự động tính toán tức thì theo tỷ giá niêm yết thực tế hôm nay</p>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 text-xs">
                <button
                  onClick={() => {
                    setActiveTab('BUY_CNY');
                    setVndInputAmount(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'BUY_CNY'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Mua Tệ (VNĐ ➔ CNY)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('SELL_CNY');
                    setVndInputAmount(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'SELL_CNY'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Bán Tệ (CNY ➔ VNĐ)</span>
                </button>
              </div>
            </div>

            {/* Converter Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Form Inputs (Left Column - 2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-3.5 rounded-2xl border border-primary-200 bg-primary-50/70 flex items-center justify-between text-xs font-semibold text-primary-950">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <span>Tỷ giá {activeTab === 'BUY_CNY' ? 'Mua Tệ (Dùng VNĐ nạp Alipay)' : 'Bán Tệ (Chuyển CNY nhận VNĐ)'}:</span>
                  </div>
                  <span className="font-mono font-bold text-sm sm:text-base text-primary-700">
                    1 ¥ = {activeRate.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {activeTab === 'BUY_CNY' ? '1. Số Nhân Dân Tệ cần mua (CNY ¥)' : '1. Số Nhân Dân Tệ cần bán (CNY ¥)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={cnyAmount || ''}
                        onChange={(e) => handleCnyChange(Math.max(0, Number(e.target.value)))}
                        placeholder="Nhập số tiền RMB (¥)..."
                        className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">¥</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {activeTab === 'BUY_CNY' ? '2. Thành tiền VNĐ phải thanh toán' : '2. Thành tiền VNĐ sẽ nhận được'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={vndAmount || ''}
                        onChange={(e) => handleVndChange(Math.max(0, Number(e.target.value)))}
                        placeholder="Nhập số tiền VNĐ (₫)..."
                        className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-primary-700 focus:outline-none focus:border-primary-500 focus:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₫</span>
                    </div>
                  </div>
                </div>

                {/* ── DANH SÁCH ĐẦY ĐỦ KÊNH LIÊN HỆ CSKH (CỘT TRÁI) ── */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Headset className="w-4 h-4 text-primary-600" />
                      <span>Danh Sách Kênh Liên Hệ Trực Tiếp CSKH OrderChinaViet:</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Trực tuyến 24/7</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Hotline */}
                    {settings.showHotline && settings.hotline && (
                      <a
                        href={`tel:${settings.hotline.split('/')[0].trim()}`}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-400 font-mono">Hotline hỗ trợ 24/7</div>
                          <div className="font-mono font-bold text-slate-800 text-xs truncate group-hover:text-primary-600">
                            {settings.hotline}
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Zalo */}
                    {settings.showZaloLink && settings.zaloLink && (
                      <a
                        href={settings.zaloLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-sky-50 flex items-center justify-center p-1 border border-sky-200">
                          <Image src={zaloImg} alt="Zalo CSKH" width={30} height={30} className="object-contain w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-400 font-mono">Zalo tư vấn nạp/bán tệ</div>
                          <div className="font-bold text-sky-700 text-xs truncate group-hover:underline">
                            Chat Zalo trực tuyến
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Telegram */}
                    {settings.showTelegramLink && settings.telegramLink && (
                      <a
                        href={settings.telegramLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-blue-50 flex items-center justify-center p-1 border border-blue-200">
                          <Image src={telegramImg} alt="Telegram CSKH" width={30} height={30} className="object-contain w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-400 font-mono">Telegram CSKH</div>
                          <div className="font-mono font-bold text-indigo-700 text-xs truncate group-hover:underline">
                            @{settings.telegramLink.split('/').pop() || 'orderchinaviet'}
                          </div>
                        </div>
                      </a>
                    )}

                    {/* WeChat */}
                    {settings.showWechatId && settings.wechatId && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-emerald-50 flex items-center justify-center p-1 border border-emerald-200">
                          <Image src={wechatImg} alt="WeChat CSKH" width={30} height={30} className="object-contain w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-400 font-mono">WeChat kho TQ</div>
                          <div className="font-mono font-bold text-emerald-700 text-xs truncate">
                            ID: {settings.wechatId}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp */}
                    {settings.showWhatsappLink && settings.whatsappLink && (
                      <a
                        href={settings.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-emerald-50 flex items-center justify-center p-1 border border-emerald-200">
                          <Image src={whatsappImg} alt="WhatsApp Business" width={30} height={30} className="object-contain w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-400 font-mono">WhatsApp Business</div>
                          <div className="font-mono font-bold text-emerald-700 text-xs truncate group-hover:underline">
                            {settings.whatsappLink.replace('https://wa.me/', '+')}
                          </div>
                        </div>
                      </a>
                    )}

                    {/* Facebook */}
                    {settings.showFacebookLink && settings.facebookLink && (
                      <a
                        href={settings.facebookLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-blue-50 flex items-center justify-center p-1 border border-blue-200">
                          <Image src={facebookImg} alt="Facebook Fanpage" width={30} height={30} className="object-contain w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-400 font-mono">Facebook Fanpage</div>
                          <div className="font-bold text-blue-700 text-xs truncate group-hover:underline">
                            OrderChinaViet Fanpage
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Card & Submit Button (Right Column - 1 col) */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Chi Tiết Lệnh Giao Dịch</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Xử lý tự động
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Loại giao dịch:</span>
                    <span className="font-bold text-slate-900">
                      {activeTab === 'BUY_CNY' ? 'Mua Tệ (Nạp ví Alipay)' : 'Bán Tệ (Rút VNĐ)'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Tỷ giá niêm yết:</span>
                    <span className="font-mono font-bold text-slate-900">1 ¥ = {activeRate.toLocaleString('vi-VN')} ₫</span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Số tiền Tệ (CNY):</span>
                    <span className="font-mono font-bold text-slate-900">¥{cnyAmount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Grand Total Box */}
                <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl space-y-1">
                  <div className="text-[11px] text-primary-900 font-bold">
                    {activeTab === 'BUY_CNY' ? 'Tổng tiền VNĐ thanh toán:' : 'Tổng tiền VNĐ thực nhận:'}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-primary-700 font-mono">
                    {vndAmount.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium pt-1">
                    * Hoàn tất chuyển khoản trong 3 - 5 phút
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExchangeClick}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>{activeTab === 'BUY_CNY' ? 'Tạo Lệnh Mua Tệ Ngay' : 'Tạo Lệnh Bán Tệ Ngay'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: CAM KẾT VẬN HÀNH DỊCH VỤ ĐỔI TIỀN ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Xử Lý Tốc Độ Trong 3–5 Phút</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Đội ngũ trực tài chính 24/7 tự động xác nhận chuyển khoản và nạp tiền ngay lập tức khi nhận khoản tiền.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cam Kết Nguồn Tiền Sạch 100%</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Nguồn tiền tệ sạch 100% từ tài khoản ngân hàng chính chủ tại Trung Quốc, tuyệt đối không bị khóa tài khoản Alipay.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Hóa Đơn &amp; Hợp Đồng Đầy Đủ</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Cung cấp đầy đủ sao kê ủy nhiệm chi, biên nhận giao dịch chính chủ minh bạch cho cá nhân và doanh nghiệp.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} dict={null} />
    </div>
  );
}


