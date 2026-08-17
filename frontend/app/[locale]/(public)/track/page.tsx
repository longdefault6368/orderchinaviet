'use client';

import { use, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Truck, CheckCircle2, Clock, Shield, Boxes, Package, ArrowRight, Sparkles } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { apiFetch } from '@/lib/api-client';

export default function PublicTrackPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (searchCode: string) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await apiFetch(`/shipments/track/${encodeURIComponent(searchCode.trim())}`, {}, false);
      const data = await res.json();
      if (res.ok && data.success) {
        const parcel = data.data;
        setResult({
          type: 'KIỆN HÀNG LOGISTICS',
          code: parcel.parcelCode,
          domesticTrackingNumber: parcel.trackingCodeChina,
          status: parcel.status,
          weight: `${parcel.chargeableWeight || parcel.weightKg || 0} kg`,
          warehouse: parcel.currentWarehouse?.name || 'Chưa cập nhật kho',
          history: (parcel.scanLogs || []).slice().reverse().map((step: any) => ({
            status: step.statusAfter,
            location: step.warehouse?.name || step.warehouse?.code || 'Kho vận',
            note: step.notes || 'Đã cập nhật trạng thái kiện hàng',
            time: new Date(step.createdAt).toLocaleString('vi-VN'),
          })),
        });
      } else setResult(null);
    } catch (error) {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(code);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale as any} dict={null} />

      <main className="flex-1 pb-16">
        {/* Page Hero Banner */}
        <PageHeroBanner
          badge="Tra Cứu Hành Trình Realtime"
          title="Tra Cứu Mã Vận Đơn &amp; Kiện Hàng"
          summary="Theo dõi từng mốc thời gian luân chuyển của kiện hàng từ Kho Quảng Châu ➔ Cửa Khẩu Hải Quan ➔ Kho Việt Nam 24/7."
          breadcrumbs={[{ label: 'Tra Cứu Vận Đơn' }]}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Search Input Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Nhập Mã Vận Đơn Hoặc Mã Kiện Hàng</span>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Nhập mã vận đơn (SF13498..., PKG-2026-..., YT...)"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-600 focus:bg-white font-mono font-bold transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Đang Tra Cứu...</span>
                ) : (
                  <>
                    <span>Tra Cứu Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-400 font-medium">
              Ví dụ mã tra cứu: <span className="font-mono text-slate-600 font-bold">PKG-2026-000001</span> hoặc <span className="font-mono text-slate-600 font-bold">SF13498192348</span>
            </p>
          </div>

          {/* Results Card Display */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              {/* Top Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-lg">
                      {result.code}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">({result.type})</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium pt-1">
                    Mã vận đơn nội địa Trung Quốc: <span className="font-mono font-bold text-slate-800">{result.domesticTrackingNumber || 'SF13498192348'}</span>
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    {result.status}
                  </span>
                  <p className="text-xs text-slate-500 font-medium">Trọng lượng: <strong className="font-mono font-bold text-slate-800">{result.weight || '12.5 kg'}</strong></p>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  Lịch Sử Hành Trình Vận Chuyển
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {result.history.map((step: any, idx: number) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-[19px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${idx === 0
                            ? 'bg-primary-600 border-primary-500 text-white shadow-md'
                            : 'bg-white border-slate-300 text-slate-400'
                          }`}
                      >
                        {idx === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary-600" />
                            {step.location}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-400">{step.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{step.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {searched && !result && !loading && (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-3xl space-y-3">
              <Shield className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Không tìm thấy thông tin vận đơn</h3>
              <p className="text-xs text-slate-500">Vui lòng kiểm tra lại chính xác mã vận đơn hoặc mã kiện hàng đã nhập.</p>
            </div>
          )}
        </div>
      </main>

      <Footer locale={locale} dict={null} />
    </div>
  );
}


