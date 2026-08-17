'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  PackageX,
  Compass,
  ArrowLeft,
  Home,
  Truck,
  Phone,
  MessageCircle,
  Send,
  Link2,
  FileText,
  Search,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import logoLight from '@/assets/images/logo-light.png';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between antialiased relative overflow-hidden select-none">
      {/* Background Soft Glow Accents */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoLight}
            alt="OrderChinaViet Logo"
            width={150}
            height={40}
            className="h-8 w-auto object-contain brightness-125"
          />
        </Link>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Về Trang Chủ</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center relative z-10 space-y-8">
        {/* Glowing 404 Badge */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-rose-500/20 via-amber-500/20 to-primary-500/20 border-2 border-amber-400/40 flex items-center justify-center shadow-2xl mx-auto backdrop-blur-sm animate-bounce duration-1000">
            <PackageX className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-full shadow border border-primary-400/40">
            ERR_404
          </div>
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono px-3.5 py-1 rounded-full uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>KHÔNG TÌM THẤY ĐƯỜNG DẪN</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Trang Này Không Tồn Tại Hoặc Đã Bị Di Chuyển
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Đường dẫn bạn truy cập có thể đã hết hạn, đổi tên hoặc bị xóa khỏi hệ thống OrderChinaViet. Hãy kiểm tra lại URL hoặc chọn các lối tắt bên dưới:
          </p>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full text-left pt-2">
          <Link
            href="/"
            className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400/50 rounded-2xl transition-all group block shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold mb-2.5 group-hover:scale-105 transition-transform">
              <Home className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Trang Chủ</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Khám phá dịch vụ nhập hàng &amp; mua hộ 1688</p>
          </Link>

          <Link
            href="/vi/track"
            className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-400/50 rounded-2xl transition-all group block shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold mb-2.5 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Tra Cứu Vận Đơn</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Theo dõi vị trí kiện hàng barcode real-time</p>
          </Link>

          <Link
            href="/vi/rates"
            className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-400/50 rounded-2xl transition-all group block shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold mb-2.5 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Biểu Phí Vận Chuyển</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Bảng giá cước đường bộ từ 18.000 ₫/kg</p>
          </Link>

          <Link
            href="/vi/affiliate/portal"
            className="p-4 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-400/50 rounded-2xl transition-all group block shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold mb-2.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Tiếp Thị Liên Kết</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Nhận hoa hồng lên đến 50% &amp; thưởng 250k</p>
          </Link>
        </div>

        {/* Support Hotline Bar */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-xl w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Cần trợ giúp khẩn cấp? Hotline 24/7: <strong className="text-white font-mono">0909 123 456</strong></span>
          </div>
          <a
            href="https://zalo.me"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat Zalo</span>
          </a>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="h-14 border-t border-slate-800/80 bg-slate-950/60 px-4 sm:px-8 flex items-center justify-center text-slate-500 text-xs font-mono">
        © 2026 OrderChinaViet Logistics Management Platform. All rights reserved.
      </footer>
    </div>
  );
}
