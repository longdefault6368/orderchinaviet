'use client';

import { useState, useEffect } from 'react';
import { Boxes, Plus, Search, Filter, QrCode } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

export interface AdminPackageItem {
  code: string;
  tracking: string;
  customer: string;
  weight: string;
  dims: string;
  status: string;
  wh: string;
}

export default function AdminPackagesPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [parcels, setParcels] = useState<AdminPackageItem[]>([]);

  useEffect(() => {
    apiFetch('/packages').then(async (response) => {
      if (!response.ok) return;
      const json = await response.json();
      setParcels(json.data.map((item: any) => ({ code: item.parcelCode, tracking: item.trackingCodeChina, customer: `${item.customer?.customerCode || ''} ${item.customer?.fullName || ''}`, weight: `${item.chargeableWeight} kg`, dims: `${item.lengthCm}×${item.widthCm}×${item.heightCm} cm`, status: item.status, wh: item.currentWarehouse?.name || '—' })));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = parcels.filter(
    (p) =>
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.tracking.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900  animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Quản Lý Kiện Hàng Quảng Châu &amp; TP.HCM</h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Danh sách kiện hàng ký nhận tự động từ máy quét barcode kho bãi.</p>
        </div>
        <Link href="/vi/packages/scan" className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0">
          <QrCode className="w-4 h-4" />
          <span>Mở Máy Quét Mã Kho</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập mã vận đơn SF/YT hoặc mã PKG..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có kiện hàng mới quét mã nào</p>
              <p className="text-xs text-slate-400 mt-0.5">Sử dụng tính năng "Mở Máy Quét Mã Kho" để ký nhận và đo cân nặng kiện hàng.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-3">
              {filtered.map((p, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-primary-600">{p.code}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </div>

                  <div className="font-mono font-bold text-slate-900">Vận đơn TQ: {p.tracking}</div>
                  <div className="text-slate-800">{p.customer}</div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>Cân nặng: <strong className="font-mono">{p.weight}</strong></div>
                    <div>Kích thước: <strong className="font-mono">{p.dims}</strong></div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 font-bold text-slate-700">
                    Vị trí kho: {p.wh}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Mã Kiện PKG</th>
                    <th className="pb-3">Vận Đơn Trung Quốc</th>
                    <th className="pb-3">Khách Hàng Owning</th>
                    <th className="pb-3">Cân Nặng</th>
                    <th className="pb-3">Kích Thước (DxRxC)</th>
                    <th className="pb-3">Vị Trí Kho Hiện Tại</th>
                    <th className="pb-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filtered.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-primary-600">{p.code}</td>
                      <td className="py-3.5 font-mono text-slate-900 font-bold">{p.tracking}</td>
                      <td className="py-3.5 text-slate-800">{p.customer}</td>
                      <td className="py-3.5 font-mono font-bold text-slate-900">{p.weight}</td>
                      <td className="py-3.5 font-mono text-slate-500">{p.dims}</td>
                      <td className="py-3.5 text-slate-800 font-bold">{p.wh}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
