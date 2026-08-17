'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { authStore } from '@/lib/auth-store';
import { OrderGuideModal } from '@/components/common/OrderGuideModal';

interface FullServiceOrderWidgetProps {
  locale: string;
  className?: string;
  compact?: boolean;
}

export function FullServiceOrderWidget({ locale, className = '', compact = false }: FullServiceOrderWidgetProps) {
  const router = useRouter();
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const handleCreateOrderClick = () => {
    const user = authStore.getUser();
    if (user && authStore.isLoggedIn()) {
      router.push(`/${locale}/orders`);
    } else {
      router.push(`/${locale}/login`);
    }
  };

  return (
    <>
      {/* ── REUSABLE WIDGET CONTAINER ── */}
      <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800 relative overflow-hidden ${className}`}>
        {/* Decorative background ambient glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Column: Text & Features List */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>DỊCH VỤ MUA HỘ TRỌN GÓI 1688 / TAOBAO / TMALL</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              Ủy Thác Tìm Nguồn Hàng &amp; Mua Hộ Tận Xưởng Trung Quốc
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              Giải pháp mua hộ hàng sỉ trọn gói uy tín: Phí dịch vụ chỉ từ <strong className="text-amber-400 font-mono font-bold">1%</strong>, miễn phí đàm phán giá gốc với chủ shop Trung Quốc và bảo hiểm <strong className="text-amber-400 font-bold">100%</strong> giá trị hàng hóa.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">Tự động bóc tách link 1688 / Taobao</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">Đàm phán giá sỉ trực tiếp xưởng TQ</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">Kiểm đếm &amp; Đóng gỗ bảo vệ 100%</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">Giao hàng tận nhà 63 tỉnh thành</span>
              </div>
            </div>
          </div>

          {/* Right Column: Action Buttons */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={handleCreateOrderClick}
              className="px-6 py-3.5 bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] hover:from-[#d62828] hover:to-[#0a33a8] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer group hover:scale-[1.02]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tạo Đơn Mua Hộ Ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="px-6 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-2xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Xem Hướng Dẫn</span>
            </button>
          </div>
        </div>
      </div>

      {/* GLOBAL REUSABLE GUIDE MODAL */}
      <OrderGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        locale={locale}
      />
    </>
  );
}
