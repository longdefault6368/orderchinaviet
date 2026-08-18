'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Wallet,
  Copy,
  Check,
  Bell,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  Edit2,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Upload,
  X,
  Menu,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { affiliateStore, AffiliateAccount, buildReferralLink } from '@/lib/affiliate-store';
import { userStore } from '@/lib/user-store';
import { notificationStore, SystemNotification } from '@/lib/notification-store';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface AffiliateHeaderProps {
  locale: Locale;
  onToggleMobileSidebar?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export function AffiliateHeader({ locale, onToggleMobileSidebar }: AffiliateHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const loadNotifications = () => {
    const list = notificationStore.getNotifications('CUSTOMER');
    setNotifications(list);
    setUnreadNotifCount(notificationStore.getUnreadCount('CUSTOMER'));
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    notificationStore.markAsRead(notif.id);
    loadNotifications();
    setShowNotifDropdown(false);

    let target = notif.linkUrl || notif.metadata?.targetUrl;
    if (!target && notif.metadata?.orderId) {
      target = `/orders`;
    }

    if (target) {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        window.open(target, '_blank');
      } else if (target.endsWith('.zip') || target.endsWith('.pdf')) {
        window.location.href = target;
      } else {
        const localizedPath = target.startsWith(`/${locale}`)
          ? target
          : `/${locale}${target.startsWith('/') ? target : `/${target}`}`;
        router.push(localizedPath);
      }
    }
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('orderchinaviet_notification_added', loadNotifications);
    window.addEventListener('orderchinaviet_notification_updated', loadNotifications);
    return () => {
      window.removeEventListener('orderchinaviet_notification_added', loadNotifications);
      window.removeEventListener('orderchinaviet_notification_updated', loadNotifications);
    };
  }, []);

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  useEffect(() => {
    const current = authStore.getUser();
    setUser(current);
    if (current) {
      const aff = affiliateStore.getAffiliate();
      setAffiliate(aff);
    }
  }, []);

  const partnerCode = affiliate?.affiliateCode || user?.customerCode || '';
  const referralLink = partnerCode ? buildReferralLink(partnerCode, locale) : (affiliate?.referralLink || '');

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    authStore.clearSession();
    router.push(`/${locale}`);
  };

  const openProfileModal = () => {
    const current = authStore.getUser();
    if (current) {
      const live = userStore.getUserById(current.id) || userStore.getUserByCustomerCode(current.customerCode || '');
      setProfileFullName(live?.fullName || current.fullName || '');
      setProfileEmail(live?.email || current.email || '');
      setProfilePhone(live?.phone || current.phone || '');
      setProfileAvatarUrl(live?.avatarUrl || current.avatarUrl || PRESET_AVATARS[0]);
      setProfilePassword('');
      setProfileSuccessMsg('');
    }
    setShowProfileModal(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfileAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = authStore.getUser();
    if (!current) return;

    try {
      const updatedSession = await authStore.updateProfile({ fullName: profileFullName.trim(), phone: profilePhone.trim(), avatarUrl: profileAvatarUrl });
      setUser(updatedSession);

      const aff = affiliateStore.getAffiliate();
      aff.fullName = profileFullName.trim();
      aff.email = profileEmail.trim();
      aff.phone = profilePhone.trim();
      affiliateStore.saveAffiliate(aff);
      setAffiliate(aff);

      setProfileSuccessMsg('Đã cập nhật thông tin & Avatar đối tác thành công!');
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (error: any) { setProfileSuccessMsg(error.message || 'Không thể cập nhật hồ sơ'); }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left Mobile Menu Toggle + Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] sm:text-xs font-bold font-mono">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-none">{affiliate?.affiliateCode || 'OCV_AFF_888888'}</span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {/* Live Wallet Balances */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500  text-[11px]">Ví thưởng:</span>
              <span className="font-bold text-amber-600">{(affiliate?.promoBalanceVnd || 250000).toLocaleString('vi-VN')} ₫</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500  text-[11px]">Hoa hồng khả dụng:</span>
              <span className="font-bold text-emerald-600">{(affiliate?.withdrawableBalanceVnd || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          {/* Copy Referral Link Button */}
          <button
            onClick={copyReferralLink}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer text-[11px] sm:text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Đã Sao Chép Link' : 'Copy Link Giới Thiệu'}</span>
            <span className="inline sm:hidden">{copied ? 'Đã Copy' : 'Copy Link'}</span>
          </button>

          {/* Language Switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher currentLocale={locale} />
          </div>

          {/* Notification Bell with Interactive Dropdown (Displayed on Mobile & Desktop) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                loadNotifications();
              }}
              className="relative p-2 text-slate-600 hover:text-amber-600 transition-colors rounded-xl hover:bg-slate-100 cursor-pointer"
              title="Thông báo đối tác"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#fa3131] text-white font-mono font-bold text-[10px] rounded-full min-w-[18px] text-center shadow-xs animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Thông Báo Hệ Thống</span>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={() => {
                          notificationStore.markAllAsRead('CUSTOMER');
                          loadNotifications();
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                      >
                        Đọc tất cả ({unreadNotifCount})
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        Chưa có thông báo mới nào
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const hasLink = Boolean(notif.linkUrl || notif.metadata?.targetUrl || notif.metadata?.orderId);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all cursor-pointer group ${
                              !notif.isRead
                                ? 'bg-amber-50/60 border-amber-200 shadow-2xs hover:bg-amber-50'
                                : 'bg-slate-50 border-slate-200 opacity-85 hover:opacity-100 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 truncate pr-2 group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                                <span>{notif.title}</span>
                                {hasLink && <ArrowRight className="w-3 h-3 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{notif.message}</p>

                            <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-200/60">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">
                                  {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                {hasLink && (
                                  <span className="text-amber-600 font-bold flex items-center gap-0.5 hover:underline">
                                    <span>Xem chi tiết</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                              {!notif.isRead ? (
                                <span className="inline-flex items-center gap-1 text-[#fa3131] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#fa3131]"></span>
                                  <span>Chưa đọc</span>
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Đã đọc</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Partner Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
              title="Bấm để đổi Avatar &amp; thông tin cá nhân"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-xs relative border border-slate-200 group-hover:scale-105 transition-transform shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Partner Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'P'}</span>
                )}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-bold text-slate-800 text-xs truncate max-w-[120px] flex items-center gap-1">
                  <span>{user?.fullName || 'Đối Tác Tiếp Thị'}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                </span>
                <span className="text-[10px] text-amber-600 font-mono font-bold">VIP AFFILIATE</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'Đối Tác Tiếp Thị'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openProfileModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-amber-600" />
                  <span>Đổi Avatar &amp; Thông Tin</span>
                </button>

                <Link
                  href={`/${locale}/affiliate/settings`}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Cài Đặt Ngân Hàng</span>
                </Link>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* EDIT PROFILE & AVATAR MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đổi Avatar &amp; Thông Tin Đối Tác</h3>
                  <p className="text-xs text-slate-500 font-mono">Mã Đối Tác: {affiliate?.affiliateCode}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Avatar Selection Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700">Hình Ảnh Đại Diện Đối Tác</div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-amber-500 text-white font-bold text-xl flex items-center justify-center border-2 border-amber-500 shadow-md shrink-0 relative">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>P</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tải Ảnh Từ Máy Tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">Hỗ trợ file JPG, PNG, WEBP từ thiết bị của bạn.</p>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Hoặc chọn Avatar mẫu có sẵn:</div>
                <div className="flex items-center gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatarUrl(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${profileAvatarUrl === url ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên Đối Tác</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đổi Mật Khẩu Mới (Tùy chọn)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Bỏ trống nếu không muốn đổi mật khẩu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
