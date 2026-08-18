'use client';

import { use, useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  User,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Gift,
  ShieldCheck,
  Truck,
  Warehouse,
  Globe,
  Home,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, getCookie, setCookie, removeCookie } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { apiFetch } from '@/lib/api-client';

const VIETNAM_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắc Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

const CHINA_PROVINCES = [
  '广东省 (Quảng Đông - Guangzhou/Shenzhen)',
  '浙江省 (Chiết Giang - Yiwu/Hangzhou)',
  '福建省 (Phúc Kiến)',
  '广西壮族自治区 (Quảng Tây - Pingxiang/Nanning)',
  '云南省 (Vân Nam - Hekou/Kunming)',
  '上海市 (Thượng Hải)',
  '北京市 (Bắc Kinh)',
  '江苏省 (Giang Tô)',
  '山东省 (Sơn Đông)',
  '辽宁省 (Liêu Ninh)',
  '海南省 (Hải Nam)',
  '四川省 (Tứ Xuyên)',
  '重庆市 (Trùng Khánh)',
  '湖北省 (Hồ Bắc)',
  '湖南省 (Hồ Nam)',
  '河南省 (Hà Nam)',
  '河北省 (Hà Bắc)',
  '江西省 (Giang Tây)',
  '安徽省 (An Huy)',
  '陕西省 (Thiểm Tây)',
  '山西省 (Sơn Tây)',
  '黑龙江省 (Hắc Long Giang)',
  '吉林省 (Cát Lâm)',
  '贵州省 (Quý Châu)',
  '甘肃省 (Cam Túc)',
  '青海省 (Thanh Hải)',
  '内蒙古自治区 (Nội Mông)',
  '新疆维吾尔自治区 (Tân Cương)',
  '西藏自治区 (Tây Tạng)',
  '宁夏回族自治区 (Ninh Hạ)',
  '香港特别行政区 (Hồng Kông)',
  '澳门特别行政区 (Ma Cao)',
  '台湾省 (Đài Loan)',
];

function RegisterFormContent({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clickEventId = useRef<string | null>(null);

  const [country, setCountry] = useState<'VN' | 'CN' | 'OTHER'>('VN');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    customAddress: '',
    referralCode: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-capture ?ref= or ?referralCode= from URL, localStorage or 30-day Cookie
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('referralCode');
    if (refCode) {
      clickEventId.current ||= typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `click-${Date.now()}-${Math.random()}`;
      void apiFetch('/affiliates/track-click', { method: 'POST', body: JSON.stringify({ affiliateCode: refCode, eventId: clickEventId.current }) }, false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ocv_pending_ref_code', refCode);
        setCookie('ocv_pending_ref_code', refCode, 30);
      }
      setForm((prev) => ({ ...prev, referralCode: refCode }));
    } else if (typeof window !== 'undefined') {
      const savedRef = localStorage.getItem('ocv_pending_ref_code') || getCookie('ocv_pending_ref_code');
      if (savedRef) {
        setForm((prev) => ({ ...prev, referralCode: savedRef }));
      }
    }
  }, [searchParams]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  // Password strength
  const passwordStrength = (() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'][passwordStrength];
  const strengthColor = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.agreeTerms) {
      setError('Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (form.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    const finalProvinceOrAddress =
      country === 'OTHER' ? form.customAddress.trim() : form.province;

    const finalRefCode = form.referralCode.trim() || (typeof window !== 'undefined' ? localStorage.getItem('ocv_pending_ref_code') || getCookie('ocv_pending_ref_code') || '' : '');

    setLoading(true);
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          province: finalProvinceOrAddress,
          preferredLanguage: locale,
          referredByCode: finalRefCode,
          referralCode: finalRefCode,
        }),
      }, false);
      const json = await response.json();
      if (!response.ok || !json.data?.tokens || !json.data?.user) throw new Error(json.message || 'Đăng ký không thành công');
      const newUser = json.data.user;
      authStore.setSession(json.data.tokens, {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        roleCode: newUser.roleCode,
        customerCode: newUser.customerCode,
        balanceVnd: newUser.balanceVnd ?? newUser.balance ?? 0,
      });

      if (finalRefCode) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ocv_pending_ref_code');
          removeCookie('ocv_pending_ref_code');
        }
      }

      setSuccess(`Đăng ký thành công! Chào mừng ${newUser.fullName}. Mã KH: ${newUser.customerCode}`);
      setTimeout(() => router.push(`/${locale}/dashboard`), 1000);
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden text-slate-800">
      {/* ── Left panel: branding & benefits (Background Image with Soft Dark Overlay) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 relative overflow-hidden text-white border-r border-slate-800 px-10 py-12">
        {/* Background Image Underneath */}
        <Image
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Logistics Background"
          fill
          className="object-cover"
        />
        {/* Soft Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/85 backdrop-blur-[2px]" />
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-red-500/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Link href={`/${locale}`} className="inline-block mb-10 hover:scale-105 transition-transform cursor-pointer">
            <Image
              src="/logo-light.png"
              alt="OrderChinaViet Logo"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Mở tài khoản<br />
            <span className="gradient-text">miễn phí ngay hôm nay</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Hàng chục nghìn chủ hàng tại Việt Nam, Trung Quốc và quốc tế đang tin dùng OrderChinaViet để vận chuyển an toàn.
          </p>

          <div className="space-y-4">
            {[
              { icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />, title: 'Bảo Hiểm Hàng Hóa 100%', desc: 'Toàn bộ lô hàng được bảo hiểm từ khi nhập kho Quảng Châu đến khi giao tận tay.' },
              { icon: <Warehouse className="w-5 h-5 text-sky-400" />, title: 'Kho Quảng Châu 2,000m²', desc: 'Nhân viên ký nhận, chụp ảnh, cân đo và xếp kệ theo mã khách OCVxxxxxx.' },
              { icon: <Truck className="w-5 h-5 text-amber-400" />, title: 'Cước Phí Tối Ưu', desc: 'Container đường bộ 3-7 Ngày. Máy bay 1-3 ngày. Tối ưu chi phí nhập sỉ.' },
              { icon: <Gift className="w-5 h-5 text-rose-400" />, title: 'Giới Thiệu Có Thưởng', desc: 'Giới thiệu bạn bè đăng ký nhận ngay ưu đãi cước phí cho cả hai.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3.5 bg-slate-900/60 backdrop-blur-xs p-3 rounded-2xl border border-slate-800/80 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="text-white text-xs font-bold mb-0.5">{item.title}</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800/80">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-white font-mono">50K+</div>
              <div className="text-slate-400 text-[10px] font-semibold">Kiện hàng</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-2xl font-bold text-white font-mono">3,500+</div>
              <div className="text-slate-400 text-[10px] font-semibold">Chủ hàng</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-2xl font-bold text-white font-mono">99.8%</div>
              <div className="text-slate-400 text-[10px] font-semibold">Đúng hẹn</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: register form (Bright Light Mode) ── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
          <Link href={`/${locale}`} className="flex items-center gap-2 lg:hidden hover:opacity-90 transition-opacity cursor-pointer">
            <div className="w-7 h-7 rounded-xl bg-[#fa3131] flex items-center justify-center">
              <Boxes className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 text-sm font-bold">OrderChinaViet</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-slate-600 text-xs font-medium">Đã có tài khoản?</span>
            <Link
              href={`/${locale}/login`}
              className="text-xs font-bold text-[#fa3131] hover:text-[#d62828] transition-colors border border-rose-200 bg-rose-50/50 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl"
            >
              Đăng nhập
            </Link>
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start justify-center py-8 px-4 sm:px-8">
          <div className="w-full max-w-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Tạo tài khoản mới</h2>
              <p className="text-slate-600 text-sm">Điền đầy đủ thông tin để nhận mã khách hàng OCVxxxxxx</p>
            </div>

            {/* Error / Success banners */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {form.referralCode && (
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Đăng ký qua liên kết giới thiệu: <strong className="font-mono font-bold text-emerald-700">{form.referralCode}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                  Đã Áp Dụng
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row: Full name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Họ và tên <span className="text-[#fa3131]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="Nguyễn Văn A / 张伟"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                  />
                </div>
              </div>

              {/* Row: Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email <span className="text-[#fa3131]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={set('email')}
                      placeholder="email@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại <span className="text-[#fa3131]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="0901 234 567 / +86 138..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ── Quốc Gia (Country Selector) ── */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quốc gia hiện tại <span className="text-[#fa3131]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'VN', label: 'Việt Nam', flag: '/vietnam.webp' },
                    { id: 'CN', label: 'Trung Quốc', flag: '/china.jpg' },
                    { id: 'OTHER', label: 'Khác', flag: null },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCountry(item.id as any);
                        setForm((prev) => ({ ...prev, province: '', customAddress: '' }));
                      }}
                      className={`py-2.5 px-3 rounded-2xl text-xs transition-all border flex items-center justify-center gap-2 cursor-pointer ${country === item.id
                          ? 'bg-slate-100/90 border border-slate-300 text-slate-900 font-bold shadow-2xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                        }`}
                    >
                      {item.flag && (
                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                          <Image src={item.flag} alt={item.label} fill sizes="16px" className="object-cover" />
                        </div>
                      )}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Location Field based on Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {country === 'VN' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tỉnh / Thành phố tại Việt Nam
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={form.province}
                        onChange={set('province')}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all appearance-none"
                      >
                        <option value="" className="text-slate-400">-- Chọn tỉnh thành VN --</option>
                        {VIETNAM_PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {country === 'CN' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tỉnh / Thành phố tại Trung Quốc (省/市)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={form.province}
                        onChange={set('province')}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all appearance-none"
                      >
                        <option value="" className="text-slate-400">-- Chọn tỉnh thành TQ --</option>
                        {CHINA_PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {country === 'OTHER' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nhập địa chỉ hiện tại <span className="text-[#fa3131]">*</span>
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required={country === 'OTHER'}
                        value={form.customAddress}
                        onChange={set('customAddress')}
                        placeholder="Nhập quốc gia / địa chỉ hiện tại (Mỹ, Nhật, Úc...)"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Mã giới thiệu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã giới thiệu (nếu có)
                  </label>
                  <div className="relative">
                    <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.referralCode}
                      onChange={set('referralCode')}
                      placeholder="OCVxxxxxx"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu <span className="text-[#fa3131]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Ít nhất 8 ký tự"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold ${['', 'text-red-500', 'text-amber-500', 'text-sky-600', 'text-emerald-600'][passwordStrength]}`}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Row: Confirm password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xác nhận mật khẩu <span className="text-[#fa3131]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 focus:bg-white border rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${form.confirmPassword && form.confirmPassword !== form.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                        : form.confirmPassword && form.confirmPassword === form.password
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/50'
                          : 'border-slate-200 focus:border-[#fa3131] focus:ring-[#fa3131]'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="mt-1.5 text-[11px] text-red-500 font-medium">Mật khẩu không khớp</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p className="mt-1.5 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mật khẩu khớp
                  </p>
                )}
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group pt-1">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={set('agreeTerms')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${form.agreeTerms ? 'bg-[#fa3131] border-[#fa3131]' : 'border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}>
                    {form.agreeTerms && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                </div>
                <span className="text-xs text-slate-600 leading-relaxed font-medium">
                  Tôi đồng ý với{' '}
                  <span className="text-[#fa3131] hover:text-[#d62828] cursor-pointer font-bold">Điều khoản sử dụng</span>
                  {' '}và{' '}
                  <span className="text-[#fa3131] hover:text-[#d62828] cursor-pointer font-bold">Chính sách bảo mật</span>
                  {' '}của OrderChinaViet.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-[#fa3131] hover:bg-[#d62828] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#fa3131]/20 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Tạo tài khoản miễn phí
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-600 pt-2 font-medium">
                Đã có tài khoản?{' '}
                <Link href={`/${locale}/login`} className="text-[#fa3131] hover:text-[#d62828] font-bold transition-colors">
                  Đăng nhập tại đây
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-sm">Loading...</div>}>
      <RegisterFormContent locale={locale} />
    </Suspense>
  );
}
