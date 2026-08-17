'use client';

import { use, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { apiFetch } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';

export default function AffiliateActivatePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyActivated, setIsAlreadyActivated] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage('Không tìm thấy mã token kích hoạt trong đường dẫn.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await apiFetch(`/cms/job-applications/activation/${token}`, {}, false);
        const resData = await res.json();
        if (!res.ok) {
          if (resData.isAlreadyActivated) {
            setIsAlreadyActivated(true);
          }
          throw new Error(resData.message || 'Link kích hoạt không hợp lệ');
        }
        setCandidateInfo(resData.data);
        setEmail(resData.data.email || '');
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi kiểm tra link kích hoạt');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/cms/job-applications/activation/${token}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          password,
          email: email.trim(),
        }),
      }, false);

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Kích hoạt tài khoản thất bại');
      }

      // Auto login user into session
      if (resData.data?.user && resData.data?.tokens) {
        authStore.setSession(resData.data.tokens, resData.data.user);
      }

      setActivationSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/affiliate/login`);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between antialiased relative">
      <Header locale={locale as any} dict={null} />

      <main className="flex-grow pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full flex items-center justify-center">
        <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-10 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium font-mono">Đang xác thực link kích hoạt tài khoản...</p>
            </div>
          ) : isAlreadyActivated ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Tài Khoản Đã Được Kích Hoạt</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Tài khoản Đối tác của bạn đã được thiết lập mật khẩu thành công. Link này đã hết hiệu lực. Bạn có thể đăng nhập ngay vào hệ thống.
              </p>
              <div className="pt-2">
                <Link
                  href={`/${locale}/affiliate/login`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  <span>Đăng Nhập Dashboard Đối Tác</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : errorMessage && !candidateInfo ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Link Kích Hoạt Không Khả Dụng</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {errorMessage}
              </p>
              <div className="pt-2">
                <Link
                  href={`/${locale}/careers`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  <span>Về Trang Tuyển Dụng</span>
                </Link>
              </div>
            </div>
          ) : activationSuccess ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Kích Hoạt Tài Khoản Thành Công!</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Chào mừng <strong className="text-slate-900">{candidateInfo?.fullName}</strong> gia nhập đội ngũ Đối tác Affiliate OrderChinaViet. Đang chuyển hướng bạn đến trang đăng nhập đối tác...
              </p>
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>XÁC NHẬN GIA NHẬP ĐỐI TÁC AFFILIATE</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Thiết Lập Mật Khẩu &amp; Kích Hoạt Tài Khoản
                </h1>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Chào mừng <strong>{candidateInfo?.fullName}</strong>! Vui lòng tạo mật khẩu mới để kích hoạt tài khoản và nhận quyền lợi hoa hồng đối tác.
                </p>
              </div>

              {/* Candidate Pre-filled Info Badge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Họ Và Tên:</span>
                    <strong className="text-slate-900 font-bold">{candidateInfo?.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Số Điện Thoại:</span>
                    <strong className="text-slate-900 font-mono">{candidateInfo?.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vị Trí:</span>
                    <span className="text-slate-800 font-medium">{candidateInfo?.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Mức Đãi Ngộ:</span>
                    <span className="text-amber-700 font-bold font-mono">{candidateInfo?.salaryOffer}</span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Password Setup Form */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doitac@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận lại mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu vừa tạo"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{submitting ? 'Đang Kích Hoạt...' : 'Kích Hoạt Tài Khoản & Bắt Đầu'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer locale={locale as any} dict={null} />
    </div>
  );
}
