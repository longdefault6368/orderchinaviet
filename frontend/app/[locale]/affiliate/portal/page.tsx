'use client';

import { use } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  QrCode,
  Zap,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import logoLight from '@/assets/images/logo-light.png';

export default function AffiliatePortalPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col relative overflow-x-hidden">
      {/* Background Soft Glow Accents */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="fixed bottom-1/3 right-10 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

      {/* Header */}
      <Header locale={locale} dict={null} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-8 max-w-6xl mx-auto text-center relative z-10 flex-1">
        {/* Promo Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
          <Gift className="w-4 h-4 text-emerald-600 animate-bounce" />
          <span>TẶNG NGAY 250.000 ₫ KHI ĐĂNG KÝ TÀI KHOẢN ĐỐI TÁC</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6">
          Chương Trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-primary-600">Tiếp Thị Liên Kết</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
          Kiếm thu nhập thụ động bền vững với <strong className="text-emerald-600">hoa hồng lên đến 50%</strong> trên mỗi đơn hàng vận chuyển Trung - Việt. Nhận ngay <strong className="text-primary-700 font-bold">250.000 ₫ thưởng chào mừng</strong> vào tài khoản!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href={`/${locale}/affiliate/register`}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Đăng Ký Ngay — Nhận 250.000 ₫</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={`/${locale}/affiliate/login`}
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Đăng Nhập Dashboard Đối Tác</span>
          </Link>
        </div>

        {/* Rule Highlight Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto text-left shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chính Sách Thưởng 250.000 ₫ &amp; Mở Khóa Rút Tiền</h3>
              <p className="text-xs text-slate-500">Minh bạch, công bằng &amp; dễ dàng rút tiền về tài khoản ngân hàng</p>
            </div>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 border-t border-slate-100 pt-4">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Tặng ngay 250.000 ₫</strong> vào ví tiền thưởng Khuyến mãi khi tạo tài khoản thành công.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Điều kiện rút 250.000 ₫</strong>: Chỉ cần giới thiệu thành công <strong>3 khách hàng đầu tiên</strong> phát sinh đơn hàng tại OrderChinaViet.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Hoa hồng trọn đời</strong>: Nhận <strong>hoa hồng lên đến 50%</strong> trên tổng cước vận chuyển của khách hàng do bạn giới thiệu không giới hạn thời gian.</span>
            </li>
          </ul>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Mã QR &amp; Link Độc Quyền</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi Đối tác được cấp 1 link tiếp thị duy nhất kèm Mã QR Code độc quyền để dễ dàng chia sẻ lên Facebook, Zalo, TikTok, Youtube.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Thống Kê Real-time</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bảng điều khiển Partner Dashboard theo dõi số lượng khách đăng ký, số lượng đơn hàng và số tiền hoa hồng biến động từng giây.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Rút Tiền Siêu Tốc 24/7</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hỗ trợ rút hoa hồng về tất cả các ngân hàng Việt Nam (Vietcombank, MB, Techcombank...) với hạn mức tối thiểu chỉ từ 50.000 ₫.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer locale={locale} dict={null} />
    </div>
  );
}


