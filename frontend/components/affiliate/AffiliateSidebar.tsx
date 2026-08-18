'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Link2,
  Users,
  Wallet,
  ImageIcon,
  Settings,
  Gift,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Globe,
  LogOut,
  X,
  CalendarClock,
  Trophy,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore } from '@/lib/auth-store';
import logoLight from '@/assets/images/logo-light.png';

interface AffiliateSidebarProps {
  locale: Locale;
  onCloseMobileSidebar?: () => void;
}

export function AffiliateSidebar({ locale, onCloseMobileSidebar }: AffiliateSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    authStore.clearSession();
    if (onCloseMobileSidebar) onCloseMobileSidebar();
    router.push(`/${locale}`);
  };

  const navItems: { href: string; icon: any; label: string; badge?: string }[] = [
    {
      href: `/${locale}/affiliate/dashboard`,
      icon: LayoutDashboard,
      label: 'Tổng Quan Hệ Thống',
    },
    {
      href: `/${locale}/affiliate/links`,
      icon: Link2,
      label: 'Tạo Link & Mã QR',
    },
    {
      href: `/${locale}/affiliate/referrals`,
      icon: Users,
      label: 'Khách Hàng Giới Thiệu',
    },
    {
      href: `/${locale}/affiliate/commissions`,
      icon: Wallet,
      label: 'Hoa Hồng & Rút Tiền',
    },
    {
      href: `/${locale}/affiliate/attendance`,
      icon: CalendarClock,
      label: 'Chấm Công',
    },
    {
      href: `/${locale}/affiliate/payroll`,
      icon: Wallet,
      label: 'Lương & Lịch Off',
    },
    {
      href: `/${locale}/affiliate/media`,
      icon: ImageIcon,
      label: 'Banner & Mẫu Báo Bài',
    },
    {
      href: `/${locale}/affiliate/support`,
      icon: Headphones,
      label: 'Hỗ Trợ & Liên Hệ',
      badge: '24/7',
    },
    {
      href: `/${locale}/affiliate/guide`,
      icon: BookOpen,
      label: 'Hướng Dẫn & Chính Sách',
    },
    {
      href: `/${locale}/affiliate/settings`,
      icon: Settings,
      label: 'Cài Đặt Tài Khoản',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full select-none border-r border-slate-800 shadow-xl">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 justify-between bg-slate-950/60">
        <Link
          href={`/${locale}/affiliate/dashboard`}
          onClick={onCloseMobileSidebar}
          className="flex items-center gap-2"
        >
          <Image
            src={logoLight}
            alt="OrderChinaViet Logo"
            width={140}
            height={36}
            className="h-8 w-auto object-contain brightness-125"
          />
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md uppercase">
            Affiliate
          </span>
          {onCloseMobileSidebar && (
            <button
              onClick={onCloseMobileSidebar}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bonus Reward Notification Banner */}
      <div className="m-3 p-3 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Gift className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Thưởng Khuyến Mãi 250k</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-snug">
          Có 3 khách hàng nạp đơn đầu tiên để mở khóa rút 250.000 ₫!
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar text-xs">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          Menu Quản Trị Đối Tác
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== `/${locale}/affiliate/dashboard` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobileSidebar}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all font-bold ${isActive
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation Switcher */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <Link
          href={`/${locale}`}
          onClick={onCloseMobileSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Về Trang Chủ Main</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng Xuất Đối Tác</span>
        </button>
      </div>
    </aside>
  );
}
