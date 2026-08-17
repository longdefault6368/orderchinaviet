'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Gift,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore } from '@/lib/affiliate-store';
import { authStore } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import logoLight from '@/assets/images/logo-light.png';
import { apiFetch } from '@/lib/api-client';

export default function AffiliateRegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin để nhận 250.000 ₫ tiền thưởng.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password, accountType: 'AFFILIATE', preferredLanguage: locale }),
      }, false);
      const json = await response.json();
      if (!response.ok || !json.data?.tokens || !json.data?.user) throw new Error(json.message || 'Không thể đăng ký affiliate');
      const user = json.data.user;
      authStore.setSession(json.data.tokens, {
        id: user.id, email: user.email, fullName: user.fullName, phone: user.phone,
        roleCode: user.roleCode, customerCode: user.affiliateCode || user.customerCode, balanceVnd: user.balanceVnd ?? user.balance ?? 0,
      });

      setTimeout(() => {
        router.push(`/${locale}/affiliate/dashboard?signup_bonus=true`);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi tạo tài khoản đối tác.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Soft Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Company Logo redirecting to homepage */}
        <Link href={`/${locale}`} className="inline-block mb-4 hover:scale-105 transition-transform cursor-pointer">
          <div className="flex flex-col items-center justify-center gap-2">
            <Image
              src={logoLight}
              alt="OrderChinaViet"
              width={180}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Affiliate Partner Program
            </span>
          </div>
        </Link>

        {/* Bonus Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-4 py-2 rounded-full mb-3 shadow-xs">
          <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
          <span>TẶNG NGAY 250.000 ₫ KHI HOÀN TẤT ĐĂNG KÝ</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Đăng Ký Tài Khoản Tiếp Thị Liên Kết
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Trở thành Đối tác tiếp thị, kiếm hoa hồng lên đến 50% / đơn hàng trọn đời
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-3xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ Và Tên Đối Tác <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Liên Hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doitac@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số Điện Thoại Zalo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909888999"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật Khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xác Nhận Mật Khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Benefit Box */}
            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 text-[11px] text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Quyền lợi tài khoản Đối tác:</span>
              </div>
              <p>• Nhận 250.000 ₫ thưởng vào Ví Khuyến mãi ngay khi tạo tài khoản.</p>
              <p>• Không cần cọc hay bất cứ khoản phí nào, được ăn chia đến 50%.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Tạo Tài Khoản...' : 'Tạo Tài Khoản & Nhận 250.000 ₫'}</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Đã có tài khoản Đối tác tiếp thị?{' '}
            <Link
              href={`/${locale}/affiliate/login`}
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


