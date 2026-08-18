'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  Wallet,
  Users,
  MousePointerClick,
  Copy,
  Check,
  Gift,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Link2,
  Share2,
  DollarSign,
  CheckCircle2,
  Clock,
  Trophy,
  Crown,
  Medal,
  MessageCircle,
  Send,
  BookOpen,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, AffiliateAccount, ReferredCustomer, buildReferralLink } from '@/lib/affiliate-store';
import { authStore } from '@/lib/auth-store';

export default function AffiliateDashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSignupBonus = searchParams.get('signup_bonus') === 'true';

  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [referrals, setReferrals] = useState<ReferredCustomer[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSession = authStore.getUser();
      const data = affiliateStore.getAffiliate();
      const list = affiliateStore.getReferredCustomers();

      if (currentSession) {
        data.fullName = currentSession.fullName || data.fullName;
        data.email = currentSession.email || data.email;
        data.phone = currentSession.phone || data.phone;
        if (currentSession.customerCode && currentSession.customerCode.startsWith('OCV_AFF')) {
          data.affiliateCode = currentSession.customerCode;
        }
      }

      setAffiliate(data);
      setReferrals(list);
      setLoading(false);
    }, 400);

    const refresh = () => { setAffiliate(affiliateStore.getAffiliate()); setReferrals(affiliateStore.getReferredCustomers()); };
    const refreshOnFocus = () => { setAffiliate(affiliateStore.refreshAffiliate()); setReferrals(affiliateStore.getReferredCustomers()); };
    window.addEventListener('orderchinaviet_affiliate_updated', refresh);
    window.addEventListener('focus', refreshOnFocus);
    return () => { clearTimeout(timer); window.removeEventListener('orderchinaviet_affiliate_updated', refresh); window.removeEventListener('focus', refreshOnFocus); };
  }, []);

  const referralLink = affiliate ? buildReferralLink(affiliate.affiliateCode, locale) : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCustomerCount = referrals.filter((r) => (r.totalOrders || 0) >= 1).length;
  const isUnlocked = activeCustomerCount >= 3;
  const progressPercent = Math.min(100, Math.round((activeCustomerCount / 3) * 100));

  // Render Skeleton Loading UI if loading dynamic data
  if (loading) {
    return (
      <div className="space-y-6 text-slate-800  animate-pulse">
        {/* Banner Skeleton */}
        <div className="bg-slate-200 h-36 rounded-2xl sm:rounded-3xl w-full" />

        {/* Bonus Progress Bar Skeleton */}
        <div className="bg-slate-200 h-48 rounded-2xl sm:rounded-3xl w-full" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-200 h-32 rounded-2xl sm:rounded-3xl w-full" />
          ))}
        </div>

        {/* Actions Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 h-40 rounded-2xl sm:rounded-3xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800  animate-in fade-in duration-200">
      {/* Banner 250k Signup Bonus Alert */}
      {showSignupBonus && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-600 text-white rounded-2xl sm:rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Chúc Mừng Bạn Đã Đăng Ký Thành Công!</h3>
              <p className="text-xs text-white/90">
                Tài khoản đối tác của bạn đã được cộng ngay <strong className="font-mono text-amber-200">250.000 ₫</strong> tiền thưởng khuyến mãi ban đầu.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.replace(`/${locale}/affiliate/dashboard`)}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-100 transition-colors shrink-0 cursor-pointer text-center"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Mã Đối Tác: {affiliate?.affiliateCode || 'OCV_AFF_888888'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            Xin Chào, {affiliate?.fullName || 'Đối Tác Tiếp Thị'}!
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Chào mừng bạn đến với Trung Tâm Đối Tác Tiếp Thị Liên Kết OrderChinaViet. Nhận hoa hồng lên đến 50% trọn đời trên mọi đơn hàng phát sinh từ khách hàng do bạn giới thiệu.
          </p>
        </div>

        {/* Quick Link Copy Box */}
        <div className="w-full lg:w-96 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 space-y-2.5 relative z-10 shrink-0">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Link Giới Thiệu Cá Nhân</span>
            <span className="text-slate-300 font-mono text-[10px]">Hoa hồng lên đến 50%</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-white/10 font-mono text-xs text-slate-200">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent border-none w-full focus:outline-none truncate text-amber-200 font-bold px-1"
            />
            <button
              onClick={copyLink}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã Copy' : 'Copy Link'}</span>
            </button>
          </div>

          {/* 1-Click Social Share Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                const msg = `Xin chào! Mình gửi bạn link đăng ký tài khoản OrderChinaViet: ${referralLink} (Mã đối tác: ${affiliate?.affiliateCode})`;
                navigator.clipboard.writeText(msg);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                window.open('https://chat.zalo.me', '_blank');
              }}
              className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Gửi link qua Zalo"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Gửi Zalo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
                window.open(url, '_blank', 'width=600,height=500');
              }}
              className="py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Chia sẻ lên Facebook"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = `Dịch vụ nhập hàng Trung - Việt uy tín OrderChinaViet: ${referralLink}`;
                const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
              }}
              className="py-1.5 bg-[#229ed9] hover:bg-[#1e8dbf] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Gửi vào Telegram"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
          </div>
        </div>
      </div>

      {/* 250k Bonus Unlocking Rules Widget */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
                <span>Tiến Độ Mở Khóa Rút Tiền Thưởng 250.000 ₫</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${isUnlocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  {isUnlocked ? 'ĐÃ ĐỦ ĐIỀU KIỆN RÚT' : `${activeCustomerCount}/3 KHÁCH HÀNG`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Chỉ cần có <strong className="text-slate-800">3 khách hàng đăng ký &amp; hoàn thành ít nhất 1 đơn hàng</strong> thành công, bạn sẽ được tự do rút 250.000 ₫ về ngân hàng!
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/affiliate/commissions`}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Rút Tiền Ngay</span>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600">Đã có {activeCustomerCount} / 3 khách hàng đăng ký &amp; hoàn thành 1 đơn</span>
            <span className="font-mono text-emerald-600">{progressPercent}% Hoàn thành</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Requirements Checklist — 3 Customer Slots with 2 Sub-Checkpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
          {[0, 1, 2].map((idx) => {
            const cust = referrals[idx];
            const isRegistered = Boolean(cust);
            const isOrderCompleted = Boolean(cust && (cust.totalOrders || 0) >= 1);
            const isFullyUnlocked = isRegistered && isOrderCompleted;

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${isFullyUnlocked
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-2xs'
                    : isRegistered
                      ? 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${isFullyUnlocked
                          ? 'bg-emerald-600 text-white'
                          : isRegistered
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                    >
                      {idx + 1}
                    </span>
                    <span>Khách Hàng {idx + 1}</span>
                  </div>
                  {cust ? (
                    <span className="font-mono text-[10px] font-bold text-amber-700 bg-white/90 px-2 py-0.5 rounded-full border border-amber-200">
                      {cust.customerCode || 'Mã Khách'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">Chờ Đăng Ký</span>
                  )}
                </div>

                {/* 2 Sub-items / Sub-checkpoints */}
                <div className="space-y-2 text-xs">
                  {/* Mục 1: Đã Đăng Ký */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isRegistered ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className={isRegistered ? 'font-bold text-slate-900' : 'text-slate-500'}>
                        1. Đã Đăng Ký
                      </span>
                    </div>
                    {isRegistered ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đã ĐK
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Chưa</span>
                    )}
                  </div>

                  {/* Mục 2: Hoàn Thành Đơn */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isOrderCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className={isOrderCompleted ? 'font-bold text-slate-900' : 'text-slate-500'}>
                        2. Hoàn Thành Đơn
                      </span>
                    </div>
                    {isOrderCompleted ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {cust.totalOrders} đơn
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">0 đơn</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: 'Tổng Số Lượt Click Link',
            value: (affiliate?.clickCount || 0).toLocaleString('vi-VN'),
            sub: 'Lượt truy cập qua link giới thiệu',
            icon: MousePointerClick,
            color: 'text-sky-600',
            bg: 'bg-sky-50 border-sky-200',
          },
          {
            title: 'Tổng Khách Hàng Giới Thiệu',
            value: `${referrals.length} Khách Hàng`,
            sub: 'Đã tạo tài khoản OCV thành công',
            icon: Users,
            color: 'text-primary-600',
            bg: 'bg-primary-50 border-primary-200',
          },
          {
            title: 'Ví Thưởng Khuyến Mãi',
            value: `${(affiliate?.promoBalanceVnd || 250000).toLocaleString('vi-VN')} ₫`,
            sub: isUnlocked ? 'Đã đủ điều kiện rút về ngân hàng' : 'Cần 3 khách nạp đơn để mở khóa',
            icon: Gift,
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-200',
          },
          {
            title: 'Hoa Hồng Rút Khả Dụng',
            value: `${(affiliate?.withdrawableBalanceVnd || 0).toLocaleString('vi-VN')} ₫`,
            sub: 'Số dư hoa hồng phát sinh có thể rút',
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-200',
          },
        ].map((st, idx) => {
          const Icon = st.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{st.title}</span>
                <div className={`p-2.5 rounded-2xl border ${st.bg}`}>
                  <Icon className={`w-5 h-5 ${st.color}`} />
                </div>
              </div>
              <div>
                <h3 className={`text-xl font-bold font-mono ${st.color}`}>{st.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{st.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: 'Hướng Dẫn Tìm Khách',
            desc: 'Cẩm nang đào tạo CTV, 4 nhóm khách hàng, quy trình 4 bước và poster',
            href: `/${locale}/affiliate/guide`,
            icon: BookOpen,
            btnText: 'Đọc Cẩm Nang',
            color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          },
          {
            title: 'Tạo Link & Mã QR Code',
            desc: 'Tự tạo link quảng cáo & QR code để chia sẻ lên Facebook, Zalo, TikTok',
            href: `/${locale}/affiliate/links`,
            icon: Link2,
            btnText: 'Tạo Link Ngay',
            color: 'bg-primary-50 text-primary-600 border-primary-200',
          },
          {
            title: 'Danh Sách Khách Giới Thiệu',
            desc: 'Xem chi tiết danh sách khách hàng đã đăng ký & hoa hồng phát sinh',
            href: `/${locale}/affiliate/referrals`,
            icon: Users,
            btnText: 'Xem Danh Sách',
            color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          },
          {
            title: 'Tải Banner Quảng Cáo',
            desc: 'Tải mẫu banner & bài viết hướng dẫn chuyên nghiệp để tư vấn khách',
            href: `/${locale}/affiliate/media`,
            icon: Share2,
            btnText: 'Tải Banner',
            color: 'bg-amber-50 text-amber-600 border-amber-200',
          },
        ].map((act, idx) => {
          const Icon = act.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-2xl border ${act.color} flex items-center justify-center font-bold`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{act.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{act.desc}</p>
              </div>
              <Link
                href={act.href}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <span>{act.btnText}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

