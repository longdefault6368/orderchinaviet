'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Gift,
  AlertCircle,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import logoLight from '@/assets/images/logo-light.png';

export default function AffiliateLoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập Email và Mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await authStore.loginWithApi(email, password);
      if (user.roleCode !== 'AFFILIATE') {
        authStore.clearSession();
        throw new Error('Tài khoản này chưa đăng ký chương trình affiliate.');
      }

      setTimeout(() => {
        router.push(`/${locale}/affiliate/dashboard`);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập không thành công.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Soft Lights */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl pointer-events-none" />

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
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-0.5 rounded-full">
              Partner Portal
            </span>
          </div>
        </Link>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Đăng Nhập Dashboard Đối Tác
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Quản lý link tiếp thị, theo dõi hoa hồng &amp; rút tiền về ngân hàng
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
                Email Đăng Nhập
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doitac@orderchinaviet.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Đang Đăng Nhập...' : 'Vào Dashboard Đối Tác'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Chưa có tài khoản Đối tác?</span>
            <Link
              href={`/${locale}/affiliate/register`}
              className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Đăng ký nhận 250k</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


