'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  DollarSign,
  BarChart3,
  FileText,
  TerminalSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Search,
  Bell,
  User,
  Globe,
  Award,
  Edit2,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Camera,
  Upload,
  ShoppingBag,
  ArrowLeftRight,
  CalendarClock,
  ExternalLink,
  ArrowRight,
  Briefcase,
  Headphones,
} from 'lucide-react';
import { authStore, UserSession } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import { notificationStore, SystemNotification } from '@/lib/notification-store';

interface NavItem {
  href: string;
  icon: any;
  label: string;
  badge?: string;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'vi';
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Notifications Center State
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const loadNotifications = () => {
    const list = notificationStore.getNotifications('ADMIN');
    setNotifications(list);
    setUnreadCount(notificationStore.getUnreadCount('ADMIN'));
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    notificationStore.markAsRead(notif.id);
    loadNotifications();
    setShowNotifDropdown(false);

    let target = notif.linkUrl || notif.metadata?.targetUrl;
    if (!target) {
      if (notif.metadata?.orderId) target = '/admin/orders';
      else if (notif.metadata?.requestCode) target = '/admin/shipments';
      else if (notif.metadata?.disputeCode) target = '/admin/support';
      else if ((notif.type as string) === 'DISPUTE') target = '/admin/support';
      else if (notif.type === 'ORDER_CREATED') target = '/admin/orders';
      else if (notif.type === 'FINANCE_DEPOSIT') target = '/admin/finance';
      else if (notif.type === 'FINANCE_EXCHANGE') target = '/admin/exchange';
    }

    if (target) {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        window.open(target, '_blank');
      } else {
        const cleanPath = target.startsWith('/') ? target : `/${target}`;
        const localizedPath = cleanPath.startsWith(`/${locale}`)
          ? cleanPath
          : `/${locale}${cleanPath}`;
        router.push(localizedPath);
      }
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleNotifAdded = () => loadNotifications();
    const handleNotifUpdated = () => loadNotifications();

    window.addEventListener('orderchinaviet_notification_added', handleNotifAdded);
    window.addEventListener('orderchinaviet_notification_updated', handleNotifUpdated);

    return () => {
      window.removeEventListener('orderchinaviet_notification_added', handleNotifAdded);
      window.removeEventListener('orderchinaviet_notification_updated', handleNotifUpdated);
    };
  }, []);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const user = authStore.getUser();
    if (user && authStore.isLoggedIn()) {
      setSession(user);
      const userRole = user.roleCode || user.role || '';
      if (['SUPER_ADMIN', 'ADMIN', 'CHINA_WAREHOUSE', 'VIETNAM_WAREHOUSE', 'ACCOUNTANT', 'STAFF'].includes(userRole)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } else {
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  const handleLogout = async () => {
    await authStore.logoutWithApi();
    router.push(`/${locale}`);
  };

  const handleNavClick = (href: string) => {
    setSidebarOpen(false);
    if (pathname !== href) {
      setIsNavigating(true);
    }
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
      setSession(updatedSession);
      setProfileSuccessMsg('Đã cập nhật thông tin & Avatar cá nhân thành công!');
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (error: any) { setProfileSuccessMsg(error.message || 'Không thể cập nhật hồ sơ'); }
  };

  const navItems: NavItem[] = [
    { href: `/${locale}/admin`, icon: LayoutDashboard, label: 'Tổng Quan Hệ Thống' },
    { href: `/${locale}/admin/orders`, icon: ShoppingBag, label: 'Quản Lý Đơn Mua Hộ', badge: 'Mua Hộ' },
    { href: `/${locale}/admin/exchange`, icon: ArrowLeftRight, label: 'Quản Lý Đổi Tiền', badge: 'Alipay' },
    { href: `/${locale}/admin/shipments`, icon: Package, label: 'Quản Lý Vận Chuyển' },
    { href: `/${locale}/admin/customers`, icon: Users, label: 'Danh Sách Khách Hàng' },
    { href: `/${locale}/admin/support`, icon: Headphones, label: 'Yêu Cầu Hỗ Trợ', badge: 'CSKH' },
    { href: `/${locale}/admin/job-applications`, icon: Briefcase, label: 'Ứng Viên Tuyển Dụng', badge: 'Mới' },
    { href: `/${locale}/admin/affiliates`, icon: Award, label: 'Quản Lý Tiếp Thị (Affiliate)', badge: '250k' },
    { href: `/${locale}/admin/affiliate-payroll`, icon: CalendarClock, label: 'Chấm Công & Lương' },
    { href: `/${locale}/admin/finance`, icon: DollarSign, label: 'Tài Chính & Ví Dư' },
    { href: `/${locale}/admin/reports`, icon: BarChart3, label: 'Báo Cáo & Thống Kê' },
    { href: `/${locale}/admin/cms`, icon: FileText, label: 'Quản Lý CMS & Bài Viết' },
    { href: `/${locale}/admin/logs`, icon: TerminalSquare, label: 'Log Hệ Thống' },
    { href: `/${locale}/admin/settings`, icon: Settings, label: 'Cài Đặt Hệ Thống' },
  ];

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 shadow-2xl text-center space-y-6 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent-500"></div>
          <div className="w-16 h-16 bg-accent-500/10 text-accent-500 rounded-2xl flex items-center justify-center mx-auto border border-accent-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Truy Cập Bị Từ Chối</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Bạn không có quyền quản trị để truy cập trung tâm Admin. Vui lòng đăng nhập với tài khoản Quản Trị Viên OrderChinaViet.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="w-1/2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Trang Chủ
            </button>
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="w-1/2 btn-primary py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Đăng Nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex  relative">
      {/* Topbar Loading Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-gradient-to-r from-[#0c3ed0] via-[#fa3131] to-[#0c3ed0] animate-pulse"></div>
      )}

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 border-r border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div>
          {/* Sidebar Header Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
            <Link
              href={`/${locale}/admin`}
              onClick={() => handleNavClick(`/${locale}/admin`)}
              className="flex items-center gap-3"
            >
              <div className="relative h-9 w-36 overflow-hidden">
                <Image
                  src="/logo-light.png"
                  alt="OrderChinaViet Admin"
                  fill
                  className="object-contain object-left brightness-200"
                  priority
                />
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Quản Trị Hệ Thống ERP
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${active
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold bg-accent-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info — Click Avatar to Edit Profile */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <div
            onClick={openProfileModal}
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer group"
            title="Bấm để đổi Avatar &amp; thông tin cá nhân"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-600/20 border border-primary-500/30 shrink-0 relative group-hover:scale-105 transition-transform">
              {session?.avatarUrl ? (
                <img src={session.avatarUrl} alt="Admin Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-primary-400 text-sm">
                  {session?.fullName ? session.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                <span className="truncate">{session?.fullName}</span>
                <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-primary-400 shrink-0" />
              </div>
              <div className="text-[10px] font-mono text-primary-400 truncate">{session?.roleCode}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/${locale}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-[11px] font-bold transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-accent-500 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-primary-600 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative hidden sm:block w-72 lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã kiện PKG, mã vận đơn SF/YT, tên khách hàng..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-600 font-mono"
              />
            </div>
          </div>

          {/* Right Header Status — Click Avatar to Edit Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>ERP System Online</span>
            </div>

            {/* Admin Real-Time Notifications Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-primary-600 transition-colors cursor-pointer"
                title="Thông báo hệ thống & Gmail"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#fa3131] text-white font-mono font-bold text-[10px] rounded-full min-w-[18px] text-center shadow-xs animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#0c3ed0]" />
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Thông Báo Admin &amp; Gmail</span>
                    </div>
                    <button
                      onClick={() => {
                        notificationStore.markAllAsRead('ADMIN');
                        loadNotifications();
                      }}
                      className="text-[11px] font-bold text-[#0c3ed0] hover:underline cursor-pointer"
                    >
                      Đọc tất cả
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 font-medium">Chưa có thông báo mới nào</div>
                    ) : (
                      notifications.map((notif) => {
                        const hasLink = Boolean(notif.linkUrl || notif.metadata?.targetUrl || notif.metadata?.orderId);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all cursor-pointer group ${!notif.isRead
                                ? 'bg-sky-50/70 border-sky-200 hover:bg-sky-50 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100 hover:bg-slate-100/70'
                              }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
                                <span>{notif.title}</span>
                                {hasLink && <ArrowRight className="w-3 h-3 text-primary-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{notif.message}</p>

                            <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-200/60">
                              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                <Mail className="w-3 h-3 text-emerald-600" />
                                <span>Gmail: {notif.recipientEmail} (Đã gửi)</span>
                              </span>
                              {hasLink && (
                                <span className="text-primary-600 font-bold flex items-center gap-0.5 hover:underline">
                                  <span>Xem trang</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#fa3131]"></span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200"></div>

            {/* Clickable Header Avatar */}
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Chỉnh sửa Avatar &amp; thông tin cá nhân Admin"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-600 text-white font-bold flex items-center justify-center text-xs shadow-xs relative border border-slate-200">
                {session?.avatarUrl ? (
                  <img src={session.avatarUrl} alt="Admin Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{session?.fullName ? session.fullName.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{session?.fullName || 'Admin Control'}</span>
                  <Edit2 className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{session?.customerCode || 'SUPER_ADMIN'}</div>
              </div>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Profile & Avatar Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đổi Avatar &amp; Thông Tin Cá Nhân</h3>
                  <p className="text-xs text-slate-500 font-mono">Tài khoản Quản Trị ({session?.customerCode})</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600"
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

            {/* Avatar Selector Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700">Hình Ảnh Đại Diện (Avatar)</div>

              <div className="flex items-center gap-4">
                {/* Current Avatar Preview */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary-600 text-white font-bold text-xl flex items-center justify-center border-2 border-primary-500 shadow-md shrink-0 relative">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>A</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-primary-600" />
                    <span>Tải Ảnh Tải Lên Mới</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">Hỗ trợ file ảnh JPG, PNG, WEBP từ máy tính của bạn.</p>
                </div>
              </div>

              {/* Preset Avatars Selection */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Hoặc chọn Avatar mẫu có sẵn:</div>
                <div className="flex items-center gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatarUrl(url)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${profileAvatarUrl === url ? 'border-primary-600 scale-110 shadow-md ring-2 ring-primary-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-primary-600 focus:bg-white"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-primary-600 focus:bg-white"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-primary-600 focus:bg-white"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-primary-600 focus:bg-white"
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
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
