'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Headphones,
  Phone,
  MessageCircle,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import logoLight from '@/assets/images/logo-light.png';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('OrderChinaViet Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between antialiased relative overflow-hidden select-none">
      {/* Background Soft Glow Accents */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
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

        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Về Trang Chủ</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center relative z-10 space-y-6">
        {/* Error Badge */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-rose-500/25 via-amber-500/20 to-slate-800/40 border-2 border-rose-400/50 flex items-center justify-center shadow-2xl mx-auto backdrop-blur-sm">
            <AlertTriangle className="w-12 h-12 sm:w-14 sm:h-14 text-rose-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-full shadow border border-rose-400/40">
            ERR_500
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold font-mono px-3.5 py-1 rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>SỰ CỐ HỆ THỐNG TẠM THỜI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Đã Xảy Ra Lỗi Trong Quá Trình Xử Lý
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Hệ thống ghi nhận sự cố gián đoạn tạm thời. Đội ngũ kỹ thuật đã được thông báo để khắc phục. Bạn có thể bấm thử lại hoặc quay về trang chủ.
          </p>
        </div>

        {/* Error Digest (if available) */}
        {error?.digest && (
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 max-w-md w-full truncate">
            Error ID: <span className="text-amber-300 font-bold">{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-950" />
            <span>Thử Tải Lại Trang (Retry)</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Quay Về Trang Chủ</span>
          </button>
        </div>

        {/* Emergency Hotline Contact Box */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-md w-full flex items-center justify-between gap-3 text-xs text-slate-400 text-left mt-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold">Hỗ Trợ Kỹ Thuật 24/7</div>
              <div className="text-[11px] text-slate-400">Hotline: 0909 123 456</div>
            </div>
          </div>
          <a
            href="https://zalo.me"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat Zalo</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-800/80 bg-slate-950/60 px-4 sm:px-8 flex items-center justify-center text-slate-500 text-xs font-mono">
        © 2026 OrderChinaViet Logistics Management Platform. All rights reserved.
      </footer>
    </div>
  );
}
