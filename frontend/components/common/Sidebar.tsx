'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Receipt,
  Tag,
  BarChart3,
  Settings,
  Search,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  Boxes,
  LogOut,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Locale, translate } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';

export function Sidebar({ locale, dict, onCloseMobileSidebar }: { locale: Locale; dict: any; onCloseMobileSidebar?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(authStore.getUser());
  }, []);

  const navItems = [
    {
      label: translate(dict, 'common.dashboard'),
      icon: LayoutDashboard,
      href: `/${locale}/dashboard`,
      roles: ['*'],
    },
    {
      label: translate(dict, 'common.customers'),
      icon: Users,
      href: `/${locale}/dashboard/customers`,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER_SUPPORT'],
    },
    {
      label: translate(dict, 'common.packages'),
      icon: Package,
      href: `/${locale}/dashboard/packages`,
      roles: ['*'],
    },
    {
      label: translate(dict, 'common.warehouseScan'),
      icon: ScanLine,
      href: `/${locale}/dashboard/packages/scan`,
      roles: ['SUPER_ADMIN', 'ADMIN', 'CHINA_WAREHOUSE', 'VIETNAM_WAREHOUSE'],
    },
    {
      label: translate(dict, 'common.shipments'),
      icon: Truck,
      href: `/${locale}/dashboard/shipments`,
      roles: ['*'],
    },
    {
      label: translate(dict, 'common.finance'),
      icon: Receipt,
      href: `/${locale}/dashboard/finance`,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER'],
    },
    {
      label: translate(dict, 'common.rates'),
      icon: Tag,
      href: `/${locale}/dashboard/rates`,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER'],
    },
    {
      label: translate(dict, 'common.reports'),
      icon: BarChart3,
      href: `/${locale}/dashboard/reports`,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
    },
    {
      label: translate(dict, 'common.settings'),
      icon: Settings,
      href: `/${locale}/dashboard/settings`,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
  ];

  const allowedItems = navItems.filter((item) => {
    if (item.roles.includes('*')) return true;
    if (!user) return true;
    return item.roles.includes(user.roleCode) || user.roleCode === 'SUPER_ADMIN';
  });

  return (
    <aside
      className={`bg-white/95 backdrop-blur-md border-r border-slate-200 text-slate-700 transition-all duration-300 flex flex-col h-screen sticky top-0 z-40 shadow-xs ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50/80">
        <div
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
        >
          {!collapsed ? (
            <Image
              src="/logo-light.png"
              alt="OrderChinaViet Logo"
              width={140}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>


      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `/${locale}/dashboard`);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all group ${
                isActive
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs font-bold'
                  : 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 font-semibold'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-500 group-hover:text-slate-800'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Public Tracking Link & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-1.5">
        <button
          onClick={() => {
            if (onCloseMobileSidebar) onCloseMobileSidebar();
            router.push(`/${locale}/track`);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 transition-all font-semibold cursor-pointer"
        >
          <Search className="w-4 h-4 text-sky-600 shrink-0" />
          {!collapsed && <span>{translate(dict, 'common.tracking')}</span>}
        </button>

        <button
          onClick={() => {
            authStore.clearSession();
            if (onCloseMobileSidebar) onCloseMobileSidebar();
            router.push(`/${locale}`);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 transition-all font-bold cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
          {!collapsed && <span>Đăng Xuất Admin</span>}
        </button>
      </div>
    </aside>
  );
}
