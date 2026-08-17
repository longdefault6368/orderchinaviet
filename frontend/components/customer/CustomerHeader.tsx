'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  CreditCard,
  Bell,
  User,
  LogOut,
  X,
  Copy,
  Check,
  Sparkles,
  Edit2,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Upload,
  LayoutDashboard,
  Award,
  Menu,
  Wallet,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import { settingsStore, ContactSettings } from '@/lib/settings-store';
import { notificationStore, SystemNotification } from '@/lib/notification-store';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface HeaderProps {
  locale: Locale;
  dict: any;
  pageTitle?: string;
  onToggleMobileSidebar?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export function CustomerHeader({ locale, pageTitle = 'Bảng Chung', onToggleMobileSidebar }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [balanceVnd, setBalanceVnd] = useState(0);
  const [settings, setSettings] = useState<ContactSettings>(settingsStore.getSettings());
  const [depositOpen, setDepositOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
    const handleSettingsUpdate = () => {
      setSettings(settingsStore.getSettings());
    };
    window.addEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
  }, []);

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
    let active = true;

    const cachedUser = authStore.getUser();
    setUser(cachedUser);
    setBalanceVnd(Number(cachedUser?.balanceVnd ?? 0));

    const refreshBalance = async () => {
      try {
        const freshUser = await authStore.refreshProfile();
        if (!active) return;
        setUser(freshUser);
        setBalanceVnd(Number(freshUser.balanceVnd ?? 0));
      } catch {
        // Giữ số dư gần nhất trong phiên nếu API tạm thời không khả dụng.
      }
    };

    void refreshBalance();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshBalance();
    };
    const handleBalanceUpdate = () => void refreshBalance();

    window.addEventListener('focus', handleBalanceUpdate);
    window.addEventListener('orderchinaviet_balance_updated', handleBalanceUpdate);
    window.addEventListener('orderchinaviet_orders_updated', handleBalanceUpdate);
    window.addEventListener('orderchinaviet_exchange_updated', handleBalanceUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('focus', handleBalanceUpdate);
      window.removeEventListener('orderchinaviet_balance_updated', handleBalanceUpdate);
      window.removeEventListener('orderchinaviet_orders_updated', handleBalanceUpdate);
      window.removeEventListener('orderchinaviet_exchange_updated', handleBalanceUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
      setProfileSuccessMsg('Đã cập nhật hồ sơ thành công!');
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (error: any) { setProfileSuccessMsg(error.message || 'Không thể cập nhật hồ sơ'); }
  };

  const copyTransferContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const customerCode = user?.customerCode || 'OCV000001';
  const transferSyntax = `OCV ${customerCode}`;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left Page Title & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Heading hidden on mobile strictly as requested */}
          <h1 className="hidden md:block text-sm sm:text-base font-bold text-slate-800 tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs">
          {/* Trang chủ */}
          <Link
            href={`/${locale}`}
            className="text-slate-600 hover:text-[#fa3131] font-semibold transition-colors hidden sm:inline-block"
          >
            Trang chủ
          </Link>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Role-based Portal Access Link */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'STAFF') && (
            <Link
              href={`/${locale}/admin`}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-full shadow-xs transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Trang Admin</span>
            </Link>
          )}

          {(user?.role === 'AFFILIATE' || user?.customerCode?.startsWith('OCV_AFF')) && (
            <Link
              href={`/${locale}/affiliate/dashboard`}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-full shadow-xs transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Cổng Tiếp Thị</span>
            </Link>
          )}

          {/* Tỷ giá (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-slate-700 font-semibold text-xs">
            <span className="text-slate-500 text-[11px]">Tỷ giá mua hộ:</span>
            <span className="font-bold text-[#fa3131] font-mono">1¥ = {settings.rateBuyForMe.toLocaleString('vi-VN')}đ</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-[11px]">Đổi tiền VNĐ➔¥:</span>
            <span className="font-bold text-sky-600 font-mono">{settings.rateVndToCny.toLocaleString('vi-VN')}đ</span>
          </div>

          <span className="text-slate-300 hidden md:inline">|</span>

          {/* Language Switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher currentLocale={locale} />
          </div>

          {/* Số dư lấy trực tiếp từ tài khoản đăng nhập */}
          <div
            className="hidden md:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-emerald-700"
            title="Số dư khả dụng"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold text-emerald-600">Số dư</span>
            <span className="font-mono text-xs font-bold whitespace-nowrap">
              {balanceVnd.toLocaleString('vi-VN')}đ
            </span>
          </div>

          {/* Nạp tiền Button (Redirect to /finance?action=deposit to open popup) */}
          <button
            onClick={() => router.push(`/${locale}/finance?action=deposit`)}
            className="hidden md:flex items-center gap-1.5 bg-[#fa3131] hover:bg-[#d62828] text-white px-3.5 py-1.5 rounded-full font-bold shadow-sm transition-all transform hover:scale-105 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Nạp tiền</span>
          </button>

          {/* Notification Bell with Interactive Dropdown (Displayed on Mobile & Desktop) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                loadNotifications();
              }}
              className="relative p-2 text-slate-600 hover:text-primary-600 transition-colors rounded-xl hover:bg-slate-100 cursor-pointer"
              title="Thông báo hệ thống"
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
                      <div className="w-7 h-7 rounded-xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
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
                        className="text-[11px] font-bold text-primary-600 hover:underline cursor-pointer"
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
                                ? 'bg-primary-50/60 border-primary-200 shadow-2xs hover:bg-primary-50'
                                : 'bg-slate-50 border-slate-200 opacity-85 hover:opacity-100 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 truncate pr-2 group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
                                <span>{notif.title}</span>
                                {hasLink && <ArrowRight className="w-3 h-3 text-primary-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />}
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
                                  <span className="text-primary-600 font-bold flex items-center gap-0.5 hover:underline">
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

          {/* Clickable User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer group"
              title="Bấm để đổi Avatar &amp; thông tin cá nhân"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0c3ed0] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm relative group-hover:scale-105 transition-transform border border-slate-200">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'V'}</span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-bold text-slate-800 text-xs leading-none flex items-center gap-1">
                  <span>{user?.fullName || 'VÕ VĂN LONG'}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-[#fa3131]" />
                </span>
                <span className="text-[10px] text-[#fa3131] font-mono font-bold mt-0.5">
                  {user?.customerCode || 'OCV000001'} <span className="text-slate-400 font-normal">+cd</span>
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-[#fa3131] p-1.5 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* DEPOSIT MODAL */}
      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] p-6 text-white relative">
              <button
                onClick={() => setDepositOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
                <CreditCard className="w-4 h-4" />
                Ví Dư Nạp Tiền Tự Động 24/7
              </div>
              <h2 className="text-xl font-bold text-white">Nạp Số Dư Tài Khoản</h2>
              <p className="text-xs text-white/80 mt-1">
                Hệ thống tự động cộng số dư vào ví trong 60 giây ngay khi nhận được tiền.
              </p>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">Techcombank / Vietcombank</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800">CÔNG TY LOGISTICS ORDERCHINAVIET</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Số tài khoản:</span>
                  <span className="font-bold text-[#0c3ed0] font-mono text-sm">1903 8888 6886</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between bg-amber-50 p-3 rounded-xl border-amber-200">
                  <div>
                    <div className="text-[10px] text-amber-800 font-bold uppercase">Nội dung chuyển khoản (Bắt buộc):</div>
                    <div className="text-sm font-mono font-bold text-[#fa3131] mt-0.5">{transferSyntax}</div>
                  </div>
                  <button
                    onClick={() => copyTransferContent(transferSyntax)}
                    className="flex items-center gap-1 bg-[#fa3131] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#d62828] transition-colors shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã copy' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-sky-50 p-3 rounded-xl border border-sky-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Sau khi chuyển khoản thành công, hệ thống tự động kiểm tra cú pháp <strong className="text-slate-800">{transferSyntax}</strong> và kích hoạt tiền dư lập tức.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDepositOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE & AVATAR MODAL FOR USER */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đổi Avatar &amp; Thông Tin Cá Nhân</h3>
                  <p className="text-xs text-slate-500 font-mono">Mã Khách Hàng: {user?.customerCode}</p>
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
              <div className="text-xs font-bold text-slate-700">Hình Ảnh Đại Diện (Avatar)</div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#0c3ed0] text-white font-bold text-xl flex items-center justify-center border-2 border-[#0c3ed0] shadow-md shrink-0 relative">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>C</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-[#fa3131]" />
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
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        profileAvatarUrl === url ? 'border-[#fa3131] scale-110 shadow-md ring-2 ring-[#fa3131]/30' : 'border-slate-200 opacity-70 hover:opacity-100'
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên Khách Hàng</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-[#fa3131] focus:bg-white"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#fa3131] focus:bg-white"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#fa3131] focus:bg-white"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#fa3131] focus:bg-white"
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
                  className="flex-1 py-2.5 bg-[#fa3131] hover:bg-[#d62828] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
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
