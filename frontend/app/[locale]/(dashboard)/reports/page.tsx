'use client';

import { use } from 'react';

import {
  BarChart3,
  Download,
  TrendingUp,
  Package,
  Truck,
  Wallet,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

const monthlyRevenue = [
  { month: 'T3/2026', revenue: 89500000, parcels: 820 },
  { month: 'T4/2026', revenue: 102300000, parcels: 940 },
  { month: 'T5/2026', revenue: 115600000, parcels: 1050 },
  { month: 'T6/2026', revenue: 98700000, parcels: 890 },
  { month: 'T7/2026', revenue: 125400000, parcels: 1150 },
  { month: 'T8/2026', revenue: 145800000, parcels: 1420 },
];

const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));

const topCustomers = [
  { code: 'OCV000012', name: 'Nguyễn Thị Hoa', totalOrders: 38, totalSpent: 28450000 },
  { code: 'OCV000007', name: 'Trần Văn Đức', totalOrders: 31, totalSpent: 22100000 },
  { code: 'OCV000023', name: 'Lê Thị Mai', totalOrders: 27, totalSpent: 19870000 },
  { code: 'OCV000031', name: 'Phạm Công Minh', totalOrders: 24, totalSpent: 16500000 },
  { code: 'OCV000019', name: 'Vũ Thanh Tùng', totalOrders: 19, totalSpent: 13200000 },
];

const summaryKPIs = [
  { label: 'Doanh Thu Tháng Này', value: '145,800,000 ₫', change: '+18.5%', up: true, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { label: 'Tổng Kiện Hàng Nhận Được', value: '1,420 Kiện', change: '+23.5%', up: true, icon: Package, color: 'text-[#0c3ed0]', bg: 'bg-blue-50 border-blue-200' },
  { label: 'Đơn Mua Hộ Trong Tháng', value: '87 Đơn', change: '+8.2%', up: true, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { label: 'Khách Hàng Hoạt Động', value: '312 Tài Khoản', change: '+5.1%', up: true, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
];

export default function ReportsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  return (
    <div className="space-y-4 text-slate-800">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0c3ed0]" />
            Báo Cáo Thống Kê & Phân Tích Kinh Doanh
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Doanh thu, khối lượng vận chuyển, top khách hàng — tháng 08/2026.</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-3 py-2 rounded-xl transition-all cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryKPIs.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                <div className={`p-2 rounded-xl border ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
              <div className={`flex items-center gap-1 text-[10px] font-bold mt-1.5 ${kpi.up ? 'text-emerald-600' : 'text-[#fa3131]'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change} so với tháng trước
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Bar Chart (CSS-based) */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 text-sm mb-5">Doanh Thu 6 Tháng Gần Nhất</h2>
        <div className="flex items-end gap-3 h-40">
          {monthlyRevenue.map((m, i) => {
            const barHeight = Math.round((m.revenue / maxRevenue) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono font-bold text-slate-600">{(m.revenue / 1000000).toFixed(0)}M</span>
                <div className="w-full relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0c3ed0] to-sky-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-500 text-center">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm">Top 5 Khách Hàng Doanh Thu Cao Nhất Tháng</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Hạng</th>
                <th className="py-3 px-4">Mã KH</th>
                <th className="py-3 px-4">Tên Khách Hàng</th>
                <th className="py-3 px-4">Số Đơn</th>
                <th className="py-3 px-4">Tổng Chi Tiêu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {topCustomers.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                    }`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131]">{c.code}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{c.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0c3ed0]">{c.totalOrders} đơn</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{c.totalSpent.toLocaleString('vi-VN')} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


