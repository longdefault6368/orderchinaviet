'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Calculator, ShoppingBag, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { FullServiceOrderWidget } from '@/components/common/FullServiceOrderWidget';
import { settingsStore, DEFAULT_CONTACT_SETTINGS, DEFAULT_CATEGORY_RATES, ContactSettings } from '@/lib/settings-store';

export default function RatesPage({ params }: { params: Promise<{ locale: Locale }> }) {
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
        {/* Global Page Hero Banner */}
        <PageHeroBanner
          badge="BẢNG GIÁ NIÊM YẾT VẬN CHUYỂN TRUNG - VIỆT"
          title="Bảng Giá Cước Vận Chuyển Hàng Trung Quốc"
          summary="Cước phí minh bạch tính theo VNĐ. Không chi phí ẩn, cam kết bồi thường bảo hiểm 100% khi phát sinh sự cố."
          breadcrumbs={[{ label: 'Biểu Phí Vận Chuyển' }]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* ================================================================= */}
          {/* 1. INTERACTIVE RATE CALCULATOR WIDGET */}
          {/* ================================================================= */}
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
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
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

              {/* Bright & Light Theme Result Summary Box */}
              <div className="bg-gradient-to-br from-amber-50/90 via-rose-50/50 to-primary-50/80 rounded-3xl p-6 shadow-md border border-amber-200/80 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary-700 bg-primary-100/80 border border-primary-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  <span>Ước Tính Cước Vận Chuyển</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-slate-600 font-medium">Phân Loại:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{selectedCat.categoryName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-slate-600 font-medium">Cân Nặng Thể Tích (DxRxC/6000):</span>
                    <span className="font-mono font-bold text-slate-700">{volumetricWeight.toFixed(2)} kg</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-slate-600 font-medium">Cân Nặng Tính Cước:</span>
                    <span className="font-mono font-bold text-amber-700">{chargeableWeight.toFixed(2)} kg</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-slate-600 font-medium">Đơn Giá Áp Dụng:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {priceVndPerKg.toLocaleString('vi-VN')} ₫/kg
                    </span>
                  </div>

                  {enableInsurance && (
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                      <span className="text-slate-600 font-medium">Phí Bảo Hiểm (10%):</span>
                      <span className="font-mono font-bold text-rose-600">
                        {insuranceFeeVnd.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-amber-200/80 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Cước Dự Kiến:</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-3xl font-mono font-bold text-primary-700">{totalFeeVnd.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/orders`}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-primary-500 active:scale-[0.99]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Đăng Ký Đặt Hàng Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. OFFICIAL CATEGORY RATE TABLE IN VNĐ */}
          {/* ================================================================= */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bảng Giá Cước Vận Chuyển Chi Tiết (VNĐ)</h2>
                <p className="text-xs text-slate-500">Áp dụng cho tất cả kiện hàng vận chuyển từ kho Quảng Châu (Trung Quốc) về Việt Nam</p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giá Cước Niêm Yết Công Khai</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Loại Hàng Hóa</th>
                    <th className="py-3.5 px-4">Ví Dụ Mặt Hàng Minh Họa</th>
                    <th className="py-3.5 px-4 text-center">Dưới 3kg (&lt; 3kg)</th>
                    <th className="py-3.5 px-4 text-center">Từ 3kg Trở Lên (&ge; 3kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {categoryRates.map((cat, idx) => {
                    const vndUnder = Math.round(cat.priceCnyUnder3kg * cnyRate);
                    const vndOver = Math.round(cat.priceCnyOver3kg * cnyRate);
                    return (
                      <tr key={cat.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                            <span>{cat.categoryName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs">{cat.examples}</td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            {vndUnder.toLocaleString('vi-VN')} ₫/kg
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            {vndOver.toLocaleString('vi-VN')} ₫/kg
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. POLICY & INSURANCE COVERAGE CARD */}
          {/* ================================================================= */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 text-emerald-950">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Chính Sách Bồi Thường &amp; Gói Bảo Hiểm Hàng Hóa Vận Chuyển</h3>
                <p className="text-xs text-emerald-800">Cam kết bảo vệ quyền lợi 100% cho khách hàng khi sử dụng dịch vụ OrderChinaViet</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-4 bg-white/90 rounded-2xl border border-emerald-200 space-y-1.5">
                <span className="font-bold text-emerald-900 block text-sm">1. Chính Sách Bồi Thường Mặc Định</span>
                <span className="text-slate-700 leading-relaxed block">
                  Trường hợp kiện hàng bị thất lạc, mất mát hoặc thu giữ trong quá trình vận chuyển: Hệ thống <strong>đền bù 3 lần phí vận chuyển</strong> của lô hàng đó.
                </span>
              </div>

              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xs space-y-1.5">
                <span className="font-bold block text-sm">2. Gói Bảo Hiểm Hàng Hóa 100% (+10% Giá Trị)</span>
                <span className="text-emerald-100 leading-relaxed block">
                  Khách hàng đăng ký gói bảo hiểm <strong>+10% giá trị lô hàng</strong> sẽ được bồi thường <strong>100% trị giá đơn hàng</strong> ngay khi phát sinh sự cố.
                </span>
              </div>
            </div>
          </div>

          <FullServiceOrderWidget locale={locale} />
        </div>
      </main>

      <FloatingContact />
      <Footer locale={locale} dict={null} />
    </div>
  );
}
