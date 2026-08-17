'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Calculator,
  ShieldCheck,
  Zap,
  Truck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Clock,
  Boxes,
  Award,
  Sparkles,
  RefreshCw,
  Search,
  PlayCircle,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { OrderProcessGuideSection } from '@/components/common/OrderProcessGuideSection';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS, DEFAULT_CATEGORY_RATES } from '@/lib/settings-store';

export default function OrderChinaServicePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  const [selectedCatId, setSelectedCatId] = useState<string>('cat-normal');
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [weight, setWeight] = useState<number>(5);
  const [length, setLength] = useState<number>(30);
  const [width, setWidth] = useState<number>(20);
  const [height, setHeight] = useState<number>(20);
  const [declaredValueVnd, setDeclaredValueVnd] = useState<number>(1000000);
  const [enableInsurance, setEnableInsurance] = useState<boolean>(false);

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleUpdate);
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleUpdate);
  }, []);

  const cnyRate = settings.rateBuyForMe || settings.cnyRate || 3650;
  const categoryRates = settings.categoryShippingRates && settings.categoryShippingRates.length > 0
    ? settings.categoryShippingRates
    : DEFAULT_CATEGORY_RATES;

  const selectedCat = selectedCatId === 'OTHER'
    ? {
      id: 'OTHER',
      categoryName: customCategoryName.trim() || 'Hàng Hóa Khác (Mặt Hàng Tùy Chọn)',
      examples: 'Mặt hàng tùy chọn nhập thủ công bởi khách hàng',
      priceCnyUnder3kg: 15,
      priceCnyOver3kg: 12,
      note: 'Tùy chọn thỏa thuận theo tính chất lô hàng',
    }
    : categoryRates.find((c) => c.id === selectedCatId) || categoryRates[0];

  const volumetricWeight = (length * width * height) / 6000;
  const chargeableWeight = Math.max(weight || 0, volumetricWeight);

  const priceCnyPerKg = chargeableWeight < 3 ? selectedCat.priceCnyUnder3kg : selectedCat.priceCnyOver3kg;
  const priceVndPerKg = Math.round(priceCnyPerKg * cnyRate);

  const shippingFeeVnd = Math.round(chargeableWeight * priceVndPerKg);
  const insuranceFeeVnd = enableInsurance ? Math.round((declaredValueVnd || 0) * 0.1) : 0;
  const totalFeeVnd = shippingFeeVnd + insuranceFeeVnd;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale as any} dict={null} />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <PageHeroBanner
          badge="DỊCH VỤ MUA HỘ TRỌN GÓI"
          title="Đặt Hàng Trung Quốc Sỉ & Lẻ Tận Gốc (1688 / Taobao / Tmall)"
          summary="Công cụ tìm kiếm xưởng sản xuất uy tín, thương lượng giá sỉ tận gốc, thanh toán an toàn 100% và vận chuyển container trọn gói về Việt Nam."
          breadcrumbs={[{ label: 'Đặt Hàng Trung Quốc' }]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* ── SECTION 0: VIDEO HƯỚNG DẪN ĐẶT HÀNG TRỌN GÓI ── */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center font-bold shrink-0">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Video Hướng Dẫn Đặt Hàng Trung Quốc Trọn Gói</h2>
                  <p className="text-xs text-slate-500">Xem video 60 giây để nắm rõ quy trình dán link, tính giá và đặt mua hàng nhanh chóng</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200 shrink-0">
                <Sparkles className="w-4 h-4" />
                <span>Hướng Dẫn Trực Quan</span>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <VideoPlayer src="/huong-dan-dat-hang.mp4" />
            </div>
          </div>

          {/* ── SECTION 1: CÔNG CỤ ƯỚC TÍNH CƯỚC VẬN CHUYỂN ── */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Công Cụ Ước Tính Cước Vận Chuyển</h2>
                  <p className="text-xs text-slate-500">Dự toán cước phí chính xác theo chủng loại hàng hóa và cân nặng (VNĐ)</p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giá Cước Niêm Yết Minh Bạch</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Form Inputs */}
              <div className="lg:col-span-2 space-y-4">
                {/* Category Select Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">1. Chọn Phân Loại Hàng Hóa</label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                  >
                    {categoryRates.map((cat) => {
                      const vndRateOver = Math.round(cat.priceCnyOver3kg * cnyRate);
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.categoryName} ({vndRateOver.toLocaleString('vi-VN')} ₫/kg)
                        </option>
                      );
                    })}
                    <option value="OTHER">Hàng Hóa Khác (Nhập tùy chọn...)</option>
                  </select>

                  {/* Custom Category Input if OTHER is selected */}
                  {selectedCatId === 'OTHER' && (
                    <div className="mt-2.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="Nhập tên chủng loại hàng hóa của bạn (VD: Linh kiện nhựa, vải cuộn...)..."
                        className="w-full px-3.5 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1 italic font-medium">
                    {selectedCat.examples}
                  </div>
                </div>

                {/* Weight & Dimension Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">2. Cân Nặng Thực Tế (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      placeholder="VD: 5"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Kiện dưới 3kg: <strong className="text-amber-700 font-mono">{(Math.round(selectedCat.priceCnyUnder3kg * cnyRate)).toLocaleString('vi-VN')} ₫/kg</strong>. Trên 3kg: <strong className="text-emerald-700 font-mono">{(Math.round(selectedCat.priceCnyOver3kg * cnyRate)).toLocaleString('vi-VN')} ₫/kg</strong>.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kích Thước Dài x Rộng x Cao (cm)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Dài"
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900"
                      />
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        placeholder="Rộng"
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900"
                      />
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                        placeholder="Cao"
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Insurance Package */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={enableInsurance}
                      onChange={(e) => setEnableInsurance(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Đăng Ký Gói Bảo Hiểm Hàng Hóa 100% (Phí 10% Giá Trị Hàng)</span>
                      </span>
                      <span className="text-[10px] text-amber-800 block leading-relaxed">
                        Được bồi thường 100% trị giá lô hàng khi xảy ra sự cố thất lạc, hư hỏng hoặc thu giữ trong quá trình vận chuyển.
                      </span>
                      {enableInsurance && (
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-700">Khai giá trị lô hàng (VNĐ ₫):</span>
                          <input
                            type="number"
                            value={declaredValueVnd}
                            onChange={(e) => setDeclaredValueVnd(parseFloat(e.target.value) || 0)}
                            className="w-40 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Result Summary Box */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Bảng Tính Chi Tiết</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Minh bạch 100%
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Phân Loại:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{selectedCat.categoryName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Cân Nặng Thể Tích:</span>
                    <span className="font-mono font-bold text-slate-700">{volumetricWeight.toFixed(2)} kg</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Cân Nặng Tính Cước:</span>
                    <span className="font-mono font-bold text-amber-700">{chargeableWeight.toFixed(2)} kg</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-600 font-medium">Đơn Giá Áp Dụng:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {priceVndPerKg.toLocaleString('vi-VN')} ₫/kg
                    </span>
                  </div>

                  {enableInsurance && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600 font-medium">Phí Bảo Hiểm (10%):</span>
                      <span className="font-mono font-bold text-rose-600">
                        {insuranceFeeVnd.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  )}
                </div>

                {/* Grand Total Box */}
                <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-primary-950 font-bold">Tổng cước dự kiến:</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-700 font-mono">
                      {totalFeeVnd.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <Link
                  href={`/${locale}/orders`}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Đăng Ký Đặt Hàng Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: 6 BƯỚC ĐẶT HÀNG CHUYÊN NGHIỆP TRỌN GÓI ── */}
          <OrderProcessGuideSection locale={locale} />

          {/* ── SECTION 3: CAM KẾT VÀ BẢO HIỂM HÀNG HÓA ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Đền Bù 100% Giá Trị Hàng</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Cam kết hoàn tiền 100% khi hàng hóa xảy ra sự cố vỡ hỏng, thất lạc hoặc sai mẫu mã so với yêu cầu ban đầu.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Thời Gian Vận Chuyển 3–7 Ngày</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Đội xe container đường bộ chạy liên tục mỗi ngày từ kho Quảng Châu về Hà Nội và TP.HCM đúng cam kết.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Kho Bãi 2.000m² Quảng Châu</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Hệ thống máy quét barcode tự động, kiểm đếm kỹ lưỡng và hỗ trợ quay video đóng gói nguyên kiện trước khi xuất kho.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} dict={null} />
    </div>
  );
}


