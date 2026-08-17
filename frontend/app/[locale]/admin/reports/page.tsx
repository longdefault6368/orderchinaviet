'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Boxes, DollarSign } from 'lucide-react';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
          <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900  animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Báo Cáo &amp; Thống Kê Sản Lượng</h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Phân tích biểu đồ tăng trưởng khối lượng vận chuyển và doanh thu cước phí.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Thống Kê Sản Lượng Hàng Tháng</h3>
          <div className="h-48 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 text-slate-400 text-xs font-mono p-4 text-center space-y-1">
            <BarChart3 className="w-8 h-8 text-slate-300 stroke-1.5" />
            <span className="font-bold text-slate-600">Sản lượng xuất kho: 0 kg</span>
            <span className="text-[11px] text-slate-400">Biểu đồ cập nhật tự động khi phát sinh kiện hàng nhập/xuất kho Quảng Châu.</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tỷ Lệ Hoàn Tất Giao Hàng</h3>
          <div className="h-48 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 text-xs font-mono p-4 text-center space-y-1">
            <TrendingUp className="w-8 h-8 text-emerald-500 stroke-1.5" />
            <span className="font-bold text-emerald-600">100% Đúng Tiến Độ (3-7 Ngày)</span>
            <span className="text-[11px] text-slate-400">Tỷ lệ thông quan và giao nhận tiêu chuẩn đường bộ Trung - Việt.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
