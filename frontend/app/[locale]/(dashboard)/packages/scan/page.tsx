'use client';

import { use, useState } from 'react';
import {
  ScanLine,
  Camera,
  PackagePlus,
  CheckCircle2,
  QrCode,
  Scale,
  Ruler,
  User,
  Barcode,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';

const SHELF_ZONES = ['A (Quảng Châu)', 'B (Quảng Châu)', 'C (Quảng Châu)', 'D (Quảng Châu)'];

const recentScans: Array<{ id: string; waybill: string; customer: string; weight: string; shelf: string; time: string }> = [];

export default function WarehouseScanPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [waybillCode, setWaybillCode] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [weight, setWeight] = useState('');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [shelf, setShelf] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const volumeWeight = dimL && dimW && dimH
    ? (parseFloat(dimL) * parseFloat(dimW) * parseFloat(dimH) / 6000).toFixed(2)
    : null;

  const finalWeight = weight && volumeWeight
    ? Math.max(parseFloat(weight), parseFloat(volumeWeight)).toFixed(2)
    : weight || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/packages/scan/warehouse', {
        method: 'POST',
        body: JSON.stringify({
          trackingCodeChina: waybillCode.trim(), warehouseCode: 'W-GZ-01', customerCode: customerCode.trim(),
          weightKg: Number(weight), lengthCm: Number(dimL), widthCm: Number(dimW), heightCm: Number(dimH),
          notes: [note.trim(), shelf ? `Kệ: ${shelf}` : ''].filter(Boolean).join(' | '),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không thể nhận kiện');
      setSubmitted(json.data.parcelCode);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối máy chủ');
      return;
    } finally {
      setLoading(false);
    }
    setTimeout(() => {
      setSubmitted(null);
      setWaybillCode('');
      setCustomerCode('');
      setWeight('');
      setDimL('');
      setDimW('');
      setDimH('');
      setShelf('');
      setNote('');
    }, 3000);
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/dashboard/packages`)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#fa3131]" />
              Quét Nhận Hàng Tại Kho Quảng Châu
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Kho Quảng Châu (W-GZ-01) — Terminal Nhận Hàng Nhanh</p>
          </div>
        </div>
      </div>
      {error && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Scan Form */}
        <div className="space-y-4">
          {/* Success Banner */}
          {submitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Nhận Hàng Thành Công!</p>
                <p className="text-xs text-emerald-600 font-mono mt-0.5">Mã Kiện: <strong>{submitted}</strong> — đã gán vào kệ {shelf}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-2xs">
            {/* Waybill */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mã Vận Đơn Nội Địa Trung Quốc (CN) <span className="text-[#fa3131]">*</span>
              </label>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={waybillCode}
                  onChange={(e) => setWaybillCode(e.target.value)}
                  placeholder="SF..., YT..., ZTO..., JD..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                  autoFocus
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#fa3131]">
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mã Khách Hàng (OCV...) <span className="text-[#fa3131]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                  placeholder="OCV000001"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#0c3ed0] font-bold focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cân Nặng Thực Tế (kg) <span className="text-[#fa3131]">*</span>
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="12.50"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-emerald-700 font-bold focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kích Thước (cm) — <span className="text-slate-500 font-medium">Dài × Rộng × Cao</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: dimL, set: setDimL, placeholder: 'Dài' },
                  { val: dimW, set: setDimW, placeholder: 'Rộng' },
                  { val: dimH, set: setDimH, placeholder: 'Cao' },
                ].map((dim, i) => (
                  <input
                    key={i}
                    type="number"
                    step="0.1"
                    min="0"
                    value={dim.val}
                    onChange={(e) => dim.set(e.target.value)}
                    placeholder={dim.placeholder}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#fa3131] text-center"
                  />
                ))}
              </div>
              {volumeWeight && (
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
                  <span className="text-slate-500">Cân thể tích:</span>
                  <span className="text-amber-700 font-mono font-bold">{volumeWeight} kg</span>
                  {finalWeight && (
                    <>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">Cước tính theo:</span>
                      <span className="text-[#fa3131] font-mono font-bold">{finalWeight} kg</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Shelf */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Vị Trí Kệ <span className="text-[#fa3131]">*</span></label>
              <input
                type="text"
                required
                value={shelf}
                onChange={(e) => setShelf(e.target.value.toUpperCase())}
                placeholder="A-03-12"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0c3ed0] focus:outline-none focus:border-[#fa3131] transition-all"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ảnh Kiện Hàng</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-[#fa3131]/60 p-4 rounded-xl text-center cursor-pointer transition-all bg-slate-50 hover:bg-rose-50/30">
                <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-500 font-medium">Chụp ảnh mặt trước / nhãn kiện hàng</span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi Chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú đặc biệt (hàng dễ vỡ, lưu ý đặc biệt...)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#fa3131] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fa3131] hover:bg-[#d62828] disabled:bg-slate-300 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <PackagePlus className="w-4 h-4" />
              )}
              {loading ? 'Đang lưu...' : 'Xác Nhận Nhận Hàng & Lưu Hệ Thống'}
            </button>
          </form>
        </div>

        {/* Recent Scans */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-800 text-sm">Kiện Hàng Vừa Quét Hôm Nay</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {recentScans.map((s, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#fa3131] text-xs">{s.id}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{s.waybill}</div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
                      <span className="text-[#0c3ed0] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono">{s.customer}</span>
                      <span className="text-slate-600">{s.weight}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-amber-700 font-mono font-bold">Kệ {s.shelf}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{s.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Thống Kê Kho Hôm Nay (10/08/2026)</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Kiện đã nhận', value: '23', color: 'text-[#fa3131]', bg: 'bg-rose-50 border-rose-200' },
                { label: 'Tổng cân nặng', value: '384.2 kg', color: 'text-[#0c3ed0]', bg: 'bg-blue-50 border-blue-200' },
                { label: 'Kho trống còn lại', value: '~1,200 m²', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                { label: 'Nhân viên trực', value: '4 người', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl border p-3.5 ${stat.bg}`}>
                  <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
                  <p className={`font-bold font-mono mt-0.5 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


