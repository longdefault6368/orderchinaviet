'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  KeyRound,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Locale, getDictionary, translate } from '@/lib/i18n';
import { authStore } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export default function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const dict = getDictionary(locale);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userSession = await authStore.loginWithApi(email, password);

      const userRole = userSession.role || userSession.roleCode;
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'STAFF') {
        router.push(`/${locale}/admin`);
      } else if (userRole === 'AFFILIATE') {
        router.push(`/${locale}/affiliate/dashboard`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher top-right */}
      <div className="absolute top-5 right-5 z-10">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* Logo redirecting to homepage */}
        <Link href={`/${locale}`} className="inline-block mx-auto mb-4 hover:scale-105 transition-transform cursor-pointer">
          <Image
            src="/logo-light.png"
            alt="OrderChinaViet Logo"
            width={180}
            height={56}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {translate(dict, 'auth.title')}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {translate(dict, 'auth.subtitle')}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4.5" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {translate(dict, 'auth.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all disabled:opacity-75"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {translate(dict, 'auth.passwordLabel')}
                </label>
                <span className="text-[11px] font-bold text-[#fa3131] hover:text-[#d62828] cursor-pointer transition-colors">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fa3131] focus:ring-1 focus:ring-[#fa3131] transition-all disabled:opacity-75"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login button with active Loading Spinner */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-[#fa3131] hover:bg-[#d62828] disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-md shadow-[#fa3131]/20 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang Xác Thực Đăng Nhập...</span>
                </>
              ) : (
                <>
                  {translate(dict, 'auth.loginBtn')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-medium">hoặc</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Register CTA */}
          <Link
            href={`/${locale}/register`}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#fa3131]" />
            Tạo tài khoản mới miễn phí
          </Link>
        </div>
      </div>
    </div>
  );
}


