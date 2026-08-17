'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Award,
  Phone,
  MapPin,
  Clock,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
  Boxes,
  Send,
  Share2,
  Video,
} from 'lucide-react';
import { Locale, translate } from '@/lib/i18n';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';

export function Footer({ locale, dict }: { locale: Locale; dict: any }) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleUpdate);
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleUpdate);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 2500);
  };

  return (
    <footer className="bg-white text-slate-700 text-xs border-t border-slate-200 antialiased relative">
      {/* 1. NEWSLETTER & LOGISTICS INSIGHTS BANNER */}
      <div className="border-b border-slate-200/80 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 py-10 md:py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-[11px] font-bold tracking-wide">
              <span>Báo Giá Cước & Lịch Trình Tuần</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Đăng Ký Nhận Thông Báo Lịch Tàu &amp; Cước Ưu Đãi
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed font-medium">
              Nhận thông báo cập nhật giá cước vận chuyển Trung - Việt, lịch trình xe container xuất kho Quảng Châu và ưu đãi đặc quyền dành riêng cho chủ hàng kinh doanh.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            {isSubscribed ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl font-bold text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Cảm ơn bạn đã đăng ký! Bảng giá cước ưu đãi sẽ được gửi tới email của bạn.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-lg lg:w-[460px] w-full">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn"
                    className="w-full bg-white border border-slate-300 focus:border-primary-600 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary shrink-0 cursor-pointer"
                >
                  <span>Đăng Ký</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 2. VALUE PROPOSITION BADGES */}
      <div className="border-b border-slate-200/80 bg-slate-100/70">
        <div className="max-w-7xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">100% Bảo Hiểm Hàng Hóa</h4>
              <p className="text-[11px] text-slate-500 font-medium">Bồi Thường Hàng Thất Lạc</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Vận Chuyển Hỏa Tốc</h4>
              <p className="text-[11px] text-slate-500 font-medium">Chính Ngạch Đường Bộ &amp; Bay</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-200">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Kho Quảng Châu 24/7</h4>
              <p className="text-[11px] text-slate-500 font-medium">Ký Nhận &amp; Cân Đo Tự Động</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-200">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Cước Phí Minh Bạch</h4>
              <p className="text-[11px] text-slate-500 font-medium">Không Phí Ẩn Tải Trọng</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MULTI-COLUMN LINKS */}
      <div className="max-w-7xl mx-auto px-5 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 bg-white">
        {/* Column 1: Company Profile & DYNAMIC CONTACT INFORMATION */}
        <div className="lg:col-span-2 space-y-4">
          <Link href={`/${locale}`} className="inline-block">
            <div className="relative h-12 w-48 overflow-hidden">
              <Image
                src="/logo-light.png"
                alt="OrderChinaViet Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <p className="text-slate-600 text-xs leading-relaxed font-medium max-w-md">
            Nền tảng quản lý vận chuyển &amp; mua hàng hộ Trung Quốc - Việt Nam chuyên nghiệp. Giúp các cá nhân và doanh nghiệp tối ưu chi phí logistics và theo dõi hành trình đơn hàng chuẩn xác.
          </p>

          <div className="space-y-2 pt-2 text-slate-600 text-xs font-medium">
            {settings.showAddressChina && settings.addressChina && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#fa3131] shrink-0 mt-0.5" />
                <span><b>Kho Quảng Châu (CN):</b> {settings.addressChina}</span>
              </div>
            )}
            {settings.showAddressVietnam && settings.addressVietnam && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Kho Việt Nam (VN):</b> {settings.addressVietnam}</span>
              </div>
            )}
            {settings.showHotline && settings.hotline && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#fa3131] shrink-0" />
                <span>Hotline Hỗ Trợ: <a href={`tel:${settings.hotline.split('/')[0].trim()}`} className="text-slate-900 font-bold hover:text-primary-600 transition-colors">{settings.hotline}</a></span>
              </div>
            )}
            {settings.showEmail && settings.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0c3ed0] shrink-0" />
                <span>Email: <a href={`mailto:${settings.email}`} className="text-slate-900 font-bold hover:text-primary-600 transition-colors font-mono">{settings.email}</a></span>
              </div>
            )}
            {settings.showWorkingHours && settings.workingHours && (
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Thời gian làm việc: {settings.workingHours}</span>
              </div>
            )}


          </div>
        </div>

        {/* Column 2: Logistics Services */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Dịch Vụ Logistics
          </h4>
          <ul className="space-y-2 text-slate-600 font-medium">
            <li>
              <Link href={`/${locale}/services/van-chuyen`} className="hover:text-primary-600 transition-colors">
                Vận Chuyển Đường Bộ
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/services/van-chuyen`} className="hover:text-primary-600 transition-colors">
                Vận Chuyển Hàng Bay Hỏa Tốc
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/services/1688`} className="hover:text-primary-600 transition-colors">
                Gom Hàng Kho Quảng Châu
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/track`} className="hover:text-primary-600 transition-colors">
                Tra Cứu Vận Đơn Trung Quốc
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/rates`} className="hover:text-primary-600 font-bold transition-colors">
                Dự Toán Cước Phí Tự Động &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Order Solutions */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Giải Pháp Mua Hộ
          </h4>
          <ul className="space-y-2 text-slate-600 font-medium">
            <li>
              <Link href={`/${locale}/services/1688`} className="hover:text-primary-600 transition-colors">
                Đặt Hàng Sỉ 1688.com
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/services/tmall`} className="hover:text-primary-600 transition-colors">
                Mua Hàng Chính Hãng Tmall
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/services/alipay`} className="hover:text-primary-600 transition-colors">
                Thanh Toán Hộ Ví Alipay
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/services/chinh-ngach`} className="hover:text-primary-600 transition-colors">
                Khai Báo Hải Quan Form E
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Customer Support & Portal */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Cổng Thông Tin
          </h4>
          <ul className="space-y-2 text-slate-600 font-medium">
            <li>
              <Link href={`/${locale}/blog`} className="hover:text-primary-600 transition-colors">
                Kinh Nghiệm Nhập Hàng TQ
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/announcements`} className="hover:text-primary-600 transition-colors">
                Bản Tin &amp; Thông Báo Mới
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/affiliate/portal`} className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors">
                Tiếp Thị Liên Kết (Nhận 250k)
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/careers`} className="hover:text-primary-600 font-bold transition-colors">
                Tuyển Dụng
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. COPYRIGHT & LEGAL FOOTER */}
      <div className="border-t border-slate-200 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
          <div>
            &copy; {new Date().getFullYear()} OrderChinaViet Logistics Management Platform. Tất cả quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-6">
            <span>Phiên Bản Hệ Thống: v2.4.0 ERP</span>
            <span>Kho TQ ⇄ Kho VN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
