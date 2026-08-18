'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Calculator,
  ShieldCheck,
  Zap,
  Package,
  CheckCircle2,
  ArrowRight,
  Boxes,
  Sparkles,
  MapPin,
  FileText,
  Upload,
  ChevronDown,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { apiFetch } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import { notificationStore } from '@/lib/notification-store';
import {
  settingsStore,
  ContactSettings,
  DEFAULT_CONTACT_SETTINGS,
  DEFAULT_CATEGORY_RATES,
} from '@/lib/settings-store';

const VIETNAM_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Hải Phòng',
  'Đà Nẵng',
  'Cần Thơ',
  'Huế',
  'An Giang',
  'Bắc Ninh',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Tĩnh',
  'Hưng Yên',
  'Khánh Hòa',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Nghệ An',
  'Ninh Bình',
  'Phú Thọ',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sơn La',
  'Tây Ninh',
  'Thái Nguyên',
  'Thanh Hóa',
  'Tuyên Quang',
  'Vĩnh Long',
];

const CHINA_PROVINCES = [
  'Quảng Đông (Guangdong)',
  'Chiết Giang (Zhejiang)',
  'Phúc Kiến (Fujian)',
  'Giang Tô (Jiangsu)',
  'Sơn Đông (Shandong)',
  'Hà Bắc (Hebei)',
  'Hà Nam (Henan)',
  'Bắc Kinh (Beijing)',
  'Thượng Hải (Shanghai)',
  'Hồ Bắc (Hubei)',
  'Hồ Nam (Hunan)',
  'Quảng Tây (Guangxi)',
  'Tứ Xuyên (Sichuan)',
  'Trùng Khánh (Chongqing)',
  'An Huy (Anhui)',
  'Giang Tây (Jiangxi)',
  'Liêu Ninh (Liaoning)',
  'Cát Lâm (Jilin)',
  'Hắc Long Giang (Heilongjiang)',
  'Vân Nam (Yunnan)',
  'Quý Châu (Guizhou)',
  'Thiểm Tây (Shaanxi)',
  'Hải Nam (Hainan)',
];

export default function VanChuyenServicePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [user, setUser] = useState<{ id: string; fullName: string; phone?: string; email?: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    categoryId: 'cat-normal',
    categoryName: '',
    goodsDescription: '',
    quantity: 1,
    weightKg: 5,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 20,
    shippingMethod: 'STANDARD',
    declaredValueVnd: 1000000,
    insurance: false,
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    country: 'VN',
    customCountry: '',
    province: 'Hà Nội',
    district: '',
    ward: '',
    addressLine: '',
    deliveryNote: '',
    pickupContactName: '',
    pickupPhone: '',
    pickupCountry: 'CN',
    pickupCustomCountry: '',
    pickupProvince: 'Quảng Đông (Guangdong)',
    pickupDistrict: '',
    pickupWard: '',
    pickupAddressLine: '',
    pickupNote: '',
    pickupImage: '',
  });

  const [pickupSectionOpen, setPickupSectionOpen] = useState(true);
  const [deliverySectionOpen, setDeliverySectionOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleUpdate);

    const currentUser = authStore.getUser();
    if (currentUser) {
      setUser(currentUser);
      setForm((prev) => ({
        ...prev,
        recipientName: prev.recipientName || currentUser.fullName || '',
        recipientPhone: prev.recipientPhone || currentUser.phone || '',
        recipientEmail: prev.recipientEmail || currentUser.email || '',
      }));
    }
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleUpdate);
  }, []);

  const rates = settings.categoryShippingRates?.length ? settings.categoryShippingRates : DEFAULT_CATEGORY_RATES;
  const currentCategory =
    form.categoryId === 'OTHER'
      ? { id: 'OTHER', categoryName: form.categoryName || 'Phân Loại Khác', priceCnyUnder3kg: 15, priceCnyOver3kg: 12 }
      : rates.find((x) => x.id === form.categoryId) || rates[0];

  const volumetricWeight = (form.lengthCm * form.widthCm * form.heightCm) / 6000;
  const chargeableWeight = Math.max(form.weightKg, volumetricWeight);
  const cnyRate = Number(settings.rateBuyForMe || settings.cnyRate || 3650);

  const priceCnyPerKg = chargeableWeight < 3 ? currentCategory.priceCnyUnder3kg : currentCategory.priceCnyOver3kg;
  const standardFeeVnd = Math.round(chargeableWeight * priceCnyPerKg * cnyRate);

  const economyMultiplier = (settings.economyShippingPercent || 90) / 100;
  const standardMultiplier = (settings.standardShippingPercent || 100) / 100;
  const expressMultiplier = (settings.expressShippingPercent || 120) / 100;

  const currentMultiplier =
    form.shippingMethod === 'ECONOMY'
      ? economyMultiplier
      : form.shippingMethod === 'EXPRESS'
        ? expressMultiplier
        : standardMultiplier;

  const calculatedShippingFeeVnd = Math.round(standardFeeVnd * currentMultiplier);
  const calculatedInsuranceFeeVnd = form.insurance
    ? Math.round((form.declaredValueVnd * (settings.insuranceFeePercent || 10)) / 100)
    : 0;
  const calculatedTotalVnd = calculatedShippingFeeVnd + calculatedInsuranceFeeVnd;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ảnh không được vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, pickupImage: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.goodsDescription.trim()) {
      setErrorMessage('Vui lòng nhập mô tả hoặc tên hàng hóa');
      return;
    }
    if (!form.recipientName.trim() || !form.recipientPhone.trim() || !form.province.trim() || !form.addressLine.trim() || (form.country === 'OTHER' && !form.customCountry.trim())) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin địa điểm nhận hàng (Quốc gia, tỉnh thành, địa chỉ, người nhận)');
      return;
    }
    if (!form.pickupContactName.trim() || !form.pickupPhone.trim() || !form.pickupProvince.trim() || !form.pickupAddressLine.trim() || (form.pickupCountry === 'OTHER' && !form.pickupCustomCountry.trim())) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin địa điểm lấy hàng (Quốc gia, tỉnh thành, địa chỉ, người liên hệ)');
      return;
    }
    if (form.weightKg <= 0 && volumetricWeight <= 0) {
      setErrorMessage('Khối lượng hoặc kích thước kiện hàng phải lớn hơn 0');
      return;
    }

    // Check if user is logged in
    if (!authStore.getUser()) {
      localStorage.setItem('ocv_transport_draft', JSON.stringify(form));
      router.push(`/${locale}/login?redirect=/${locale}/services/van-chuyen`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categoryName: form.categoryId === 'OTHER' ? form.categoryName || 'Phân Loại Khác' : currentCategory.categoryName,
        quantity: Math.max(1, Number(form.quantity)),
        weightKg: Number(form.weightKg),
        lengthCm: Number(form.lengthCm),
        widthCm: Number(form.widthCm),
        heightCm: Number(form.heightCm),
        declaredValueVnd: Number(form.declaredValueVnd),
      };

      const res = await apiFetch('/packages/transport-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Gửi yêu cầu vận chuyển thất bại');
      }

      setSubmitSuccess(resData.data);
      notificationStore.addNotification({
        title: `Yêu cầu vận chuyển ${resData.data.requestCode}`,
        message: `Đã gửi thành công yêu cầu vận chuyển [${payload.categoryName}]. Ban quản trị sẽ xác nhận trong 15 phút.`,
        type: 'ORDER_CREATED',
        targetRole: 'CUSTOMER',
        linkUrl: '/transport-requests',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi gửi yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header locale={locale as any} dict={null} />

      <main className="flex-grow pb-16">
        {/* HERO BANNER */}
        <PageHeroBanner
          badge="VẬN TẢI LOGISTICS CHÍNH NGẠCH"
          title="Dịch Vụ Vận Chuyển Hàng Trung – Việt (Ký Gửi & Bao Thuế)"
          summary="Tuyến xe container đường bộ xuất bến hàng ngày từ Quảng Châu về Hà Nội & TP.HCM. Thời gian 3–7 ngày, cước phí ưu đãi chỉ từ 15.000đ/kg, cam kết bảo hiểm bồi thường 100% hàng hóa."
          breadcrumbs={[
            { label: 'Dịch Vụ', href: `/${locale}/services` },
            { label: 'Vận Chuyển Trung – Việt' },
          ]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: CÔNG CỤ TÍNH CƯỚC VẬN CHUYỂN ƯỚC TÍNH                  */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div id="calculator" className="bg-white border border-slate-200 p-6 sm:p-10 rounded-3xl shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center font-bold shrink-0">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono bg-rose-50 text-[#fa3131] border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                      BẢNG TÍNH THỜI GIAN THỰC
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    Công Cụ Tính Cước Vận Chuyển Ước Tính
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Tự động so sánh giữa trọng lượng thực tế và thể tích quy đổi (DxRxC / 6000) theo từng loại hàng
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs text-slate-600 font-semibold shrink-0">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tỷ giá tính cước: 1 ¥ = {cnyRate.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Column: Calculator Inputs */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Category Selection Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    1. Chọn Phân Loại Hàng Hóa
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#fa3131] shadow-sm cursor-pointer"
                  >
                    {rates.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.categoryName}
                      </option>
                    ))}
                    <option value="OTHER">Hàng hóa khác</option>
                  </select>

                  {form.categoryId === 'OTHER' && (
                    <input
                      type="text"
                      value={form.categoryName}
                      onChange={(e) => setForm((prev) => ({ ...prev, categoryName: e.target.value }))}
                      placeholder="Nhập tên phân loại hàng hóa tùy chọn..."
                      className="w-full px-4 py-2.5 bg-white border border-[#fa3131] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#fa3131] mt-2"
                    />
                  )}
                </div>

                {/* Dimensions & Weight Grid */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>2. Khối Lượng & Kích Thước Kiện Hàng</span>
                    <span className="text-[11px] font-normal text-slate-500 font-mono">
                      Quy đổi: {volumetricWeight.toFixed(2)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Cân nặng (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.weightKg || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, weightKg: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#fa3131]"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Dài (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.lengthCm || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, lengthCm: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#fa3131]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Rộng (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.widthCm || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, widthCm: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#fa3131]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Cao (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.heightCm || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, heightCm: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#fa3131]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      Trọng lượng tính phí áp dụng: <strong>{chargeableWeight.toFixed(2)} kg</strong> (Lấy số lớn hơn giữa cân thực tế và quy đổi thể tích).
                    </span>
                  </div>
                </div>

                {/* Insurance Option */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="insuranceCalc"
                    checked={form.insurance}
                    onChange={(e) => setForm((prev) => ({ ...prev, insurance: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded text-[#fa3131] focus:ring-[#fa3131] border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <label htmlFor="insuranceCalc" className="font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bảo Hiểm Hàng Hóa 100% Giá Trị ({settings.insuranceFeePercent || 10}%)</span>
                    </label>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Đền bù 100% giá trị khai báo nếu xảy ra thất lạc hoặc vỡ hỏng do vận chuyển.
                    </p>
                    {form.insurance && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">Giá trị khai báo:</span>
                        <input
                          type="number"
                          step="100000"
                          value={form.declaredValueVnd || ''}
                          onChange={(e) => setForm((prev) => ({ ...prev, declaredValueVnd: parseFloat(e.target.value) || 0 }))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 w-40"
                          placeholder="VNĐ"
                        />
                        <span className="text-[11px] text-emerald-600 font-bold">
                          + {calculatedInsuranceFeeVnd.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: 3. Shipping Methods Select & Result Summary Box */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Chọn Gói Vận Chuyển & Cước Phí
                  </label>
                  <select
                    value={form.shippingMethod}
                    onChange={(e) => setForm((prev) => ({ ...prev, shippingMethod: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#fa3131] shadow-sm cursor-pointer"
                  >
                    <option value="ECONOMY">
                      Gói Tiết Kiệm — {Math.round(standardFeeVnd * economyMultiplier).toLocaleString('vi-VN')} ₫
                    </option>
                    <option value="STANDARD">
                      Gói Tiêu Chuẩn — {Math.round(standardFeeVnd * standardMultiplier).toLocaleString('vi-VN')} ₫ (Khuyên dùng)
                    </option>
                    <option value="EXPRESS">
                      Gói Hỏa Tốc — {Math.round(standardFeeVnd * expressMultiplier).toLocaleString('vi-VN')} ₫
                    </option>
                  </select>
                </div>

                {/* Result Summary Box (Light theme matching order-china) */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Bảng Tính Chi Tiết</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Minh bạch 100%
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600 font-medium">Phân Loại:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[170px]">
                        {form.categoryId === 'OTHER' ? form.categoryName || 'Khác' : currentCategory.categoryName}
                      </span>
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
                      <span className="text-slate-600 font-medium">Gói Cước Đã Chọn:</span>
                      <span className="font-bold text-slate-900">
                        {form.shippingMethod === 'ECONOMY'
                          ? 'Gói Tiết Kiệm'
                          : form.shippingMethod === 'EXPRESS'
                            ? 'Gói Hỏa Tốc'
                            : 'Gói Tiêu Chuẩn'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600 font-medium">Cước Vận Chuyển:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {calculatedShippingFeeVnd.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    {form.insurance && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <span className="text-slate-600 font-medium">Phí Bảo Hiểm ({settings.insuranceFeePercent || 10}%):</span>
                        <span className="font-mono font-bold text-emerald-700">
                          +{calculatedInsuranceFeeVnd.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total Box */}
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-rose-950 font-bold">Tổng Cước Ước Tính:</span>
                      <span className="text-xl sm:text-2xl font-bold text-[#fa3131] font-mono">
                        {calculatedTotalVnd.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>

                  <a
                    href="#request-form"
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#fa3131] hover:bg-[#d62828] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 block text-center cursor-pointer hover:scale-[1.01]"
                  >
                    <span>Điền Thông Tin Gửi Yêu Cầu Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: FORM GỬI YÊU CẦU VẬN CHUYỂN TRỰC TUYẾN                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div id="request-form" className="bg-white border border-slate-200 p-6 sm:p-10 rounded-3xl shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                      TIẾP NHẬN YÊU CẦU
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    Form Gửi Yêu Cầu Vận Chuyển Ký Gửi
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Điền địa chỉ kho lấy hàng tại Trung Quốc và địa chỉ nhận hàng tại Việt Nam để tạo phiếu yêu cầu
                  </p>
                </div>
              </div>

              {!user && (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Chưa đăng nhập? Bạn vẫn có thể điền form, hệ thống sẽ lưu tạm thông tin!
                  </span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitSuccess ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Tạo Yêu Cầu Vận Chuyển Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                  Mã yêu cầu của bạn là <strong className="text-slate-900 font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-emerald-200">{submitSuccess.requestCode}</strong>. Đội ngũ điều phối OrderChinaViet sẽ liên hệ và cập nhật trạng thái trong 15 phút.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Link
                    href={`/${locale}/transport-requests`}
                    className="px-6 py-3 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <span>Quản Lý Yêu Cầu Trong Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(null)}
                    className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Tạo Yêu Cầu Khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Goods Description & Quantity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-[#fa3131]" />
                    <span>1. Thông Tin Chi Tiết Hàng Hóa</span>
                  </h3>

                  <div className="grid sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên / Mô tả hàng hóa <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.goodsDescription}
                        onChange={(e) => setForm((prev) => ({ ...prev, goodsDescription: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131] focus:bg-white"
                        placeholder="VD: Quần áo thời trang 50 chiếc, linh kiện điện tử bo mạch..."
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng (kiện/hộp)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#fa3131] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pickup Address (China / Other) */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div
                    onClick={() => setPickupSectionOpen(!pickupSectionOpen)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>2. Địa Điểm Lấy Hàng (Pickup Location)</span>
                    </h3>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${pickupSectionOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {pickupSectionOpen && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Người liên hệ lấy hàng <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.pickupContactName}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupContactName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                          placeholder="VD: Chen Wei (Xưởng may)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số điện thoại lấy hàng <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.pickupPhone}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupPhone: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                          placeholder="VD: +86 138 0000 0000"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quốc gia lấy hàng <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={form.pickupCountry}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupCountry: e.target.value, pickupProvince: '' }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="CN">Trung Quốc (China)</option>
                          <option value="VN">Việt Nam</option>
                          <option value="OTHER">Quốc gia khác...</option>
                        </select>
                      </div>

                      {form.pickupCountry === 'OTHER' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Tên quốc gia lấy hàng <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={form.pickupCustomCountry}
                            onChange={(e) => setForm((prev) => ({ ...prev, pickupCustomCountry: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                            placeholder="Nhập tên quốc gia..."
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tỉnh / Thành phố lấy hàng <span className="text-rose-500">*</span>
                        </label>
                        {form.pickupCountry === 'OTHER' ? (
                          <input
                            type="text"
                            required
                            value={form.pickupProvince}
                            onChange={(e) => setForm((prev) => ({ ...prev, pickupProvince: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                            placeholder="Tỉnh/Thành phố..."
                          />
                        ) : (
                          <select
                            required
                            value={form.pickupProvince}
                            onChange={(e) => setForm((prev) => ({ ...prev, pickupProvince: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="">-- Chọn tỉnh / thành phố lấy hàng --</option>
                            {(form.pickupCountry === 'VN' ? VIETNAM_PROVINCES : CHINA_PROVINCES).map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quận / Huyện lấy hàng
                        </label>
                        <input
                          type="text"
                          value={form.pickupDistrict}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupDistrict: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                          placeholder="VD: Quận Bạch Vân (Baiyun)..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phường / Xã lấy hàng
                        </label>
                        <input
                          type="text"
                          value={form.pickupWard}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupWard: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                          placeholder="Phường / Xã..."
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Địa chỉ chi tiết lấy hàng <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.pickupAddressLine}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupAddressLine: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                          placeholder="VD: Số nhà, tòa nhà, tên khu công nghiệp/kho bãi..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh kiện hàng (nếu có)</label>
                        <label className="w-full px-3.5 py-2.5 bg-white border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-medium text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span>{form.pickupImage ? 'Đã chọn 1 ảnh' : 'Tải ảnh kiện hàng'}</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú lấy hàng</label>
                        <input
                          type="text"
                          value={form.pickupNote}
                          onChange={(e) => setForm((prev) => ({ ...prev, pickupNote: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                          placeholder="Ghi chú thêm cho nhân viên lấy hàng (giờ lấy hàng, mã hẹn trước...)"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Delivery Address (Vietnam / Other) */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div
                    onClick={() => setDeliverySectionOpen(!deliverySectionOpen)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#fa3131]" />
                      <span>3. Địa Chỉ Nhận Hàng (Delivery Location)</span>
                    </h3>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${deliverySectionOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {deliverySectionOpen && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Họ tên người nhận <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.recipientName}
                          onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="VD: Nguyễn Văn A"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số điện thoại người nhận <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.recipientPhone}
                          onChange={(e) => setForm((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="VD: 0909 123 456"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quốc gia nhận hàng <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={form.country}
                          onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value, province: '' }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131] cursor-pointer"
                        >
                          <option value="VN">Việt Nam</option>
                          <option value="CN">Trung Quốc (China)</option>
                          <option value="OTHER">Quốc gia khác...</option>
                        </select>
                      </div>

                      {form.country === 'OTHER' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Tên quốc gia nhận <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={form.customCountry}
                            onChange={(e) => setForm((prev) => ({ ...prev, customCountry: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                            placeholder="Nhập tên quốc gia..."
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tỉnh / Thành Phố nhận <span className="text-rose-500">*</span>
                        </label>
                        {form.country === 'OTHER' ? (
                          <input
                            type="text"
                            required
                            value={form.province}
                            onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                            placeholder="Tỉnh/Thành phố..."
                          />
                        ) : (
                          <select
                            required
                            value={form.province}
                            onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131] cursor-pointer"
                          >
                            <option value="">-- Chọn tỉnh / thành phố nhận --</option>
                            {(form.country === 'VN' ? VIETNAM_PROVINCES : CHINA_PROVINCES).map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quận / Huyện nhận
                        </label>
                        <input
                          type="text"
                          value={form.district}
                          onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="VD: Quận 5, Quận Cầu Giấy..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phường / Xã nhận
                        </label>
                        <input
                          type="text"
                          value={form.ward}
                          onChange={(e) => setForm((prev) => ({ ...prev, ward: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="Phường / Xã..."
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Địa chỉ giao tận nơi chi tiết <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.addressLine}
                          onChange={(e) => setForm((prev) => ({ ...prev, addressLine: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="VD: Số 123 Đường Nguyễn Văn Cừ, Tòa nhà Landmark..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email nhận thông báo</label>
                        <input
                          type="email"
                          value={form.recipientEmail}
                          onChange={(e) => setForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú giao hàng</label>
                        <input
                          type="text"
                          value={form.deliveryNote}
                          onChange={(e) => setForm((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#fa3131]"
                          placeholder="Ghi chú cho shipper giao hàng tận nơi..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Action Box (Light theme) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-xs text-slate-500 font-medium">Tổng Cước Ước Tính Cho Đơn Này:</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#fa3131] font-mono">
                      {calculatedTotalVnd.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Gói: {form.shippingMethod === 'ECONOMY' ? 'Tiết Kiệm' : form.shippingMethod === 'EXPRESS' ? 'Hỏa Tốc' : 'Tiêu Chuẩn'} | Trọng lượng: {chargeableWeight.toFixed(2)} kg
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-4 bg-[#fa3131] hover:bg-[#d62828] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <Truck className="w-5 h-5" />
                    <span>{submitting ? 'Đang Xử Lý Gửi Yêu Cầu...' : 'Xác Nhận & Gửi Yêu Cầu Vận Chuyển'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: QUY TRÌNH VẬN CHUYỂN 4 BƯỚC                             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl shadow-sm space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                QUY TRÌNH CHUYÊN NGHIỆP
              </span>
              <h2 className="text-2xl font-bold text-slate-900">4 Bước Vận Chuyển Hàng Trung – Việt</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Minh bạch toàn bộ lộ trình di chuyển của kiện hàng từ lúc nhận tại xưởng TQ đến khi giao tận tay bạn
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {[
                {
                  step: '01',
                  title: 'Gửi Yêu Cầu & Mã Vận Đơn',
                  desc: 'Điền form yêu cầu ký gửi hoặc gửi mã vận đơn CPN Trung Quốc vào hệ thống OrderChinaViet.',
                },
                {
                  step: '02',
                  title: 'Nhập Kho Quảng Châu',
                  desc: 'Hàng về kho TQ được cân đo, chụp ảnh nguyên kiện và cập nhật tự động lên hệ thống dashboard.',
                },
                {
                  step: '03',
                  title: 'Đóng Xe & Thông Quan',
                  desc: 'Hàng đóng container chuyên tuyến đường bộ, làm thủ tục hải quan chính ngạch nhanh chóng.',
                },
                {
                  step: '04',
                  title: 'Nhập Kho VN & Giao Tận Nhà',
                  desc: 'Hàng về kho Hà Nội/TP.HCM, thông báo cho khách hàng và điều phối giao hàng tận nơi theo yêu cầu.',
                },
              ].map((item) => (
                <div key={item.step} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group hover:border-[#fa3131]/40 transition-all">
                  <div className="text-3xl font-mono font-bold text-[#fa3131]/40 group-hover:text-[#fa3131] transition-colors">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale as any} dict={null} />
    </div>
  );
}
