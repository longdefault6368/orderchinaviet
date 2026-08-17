'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  ArrowDownToLine,
  BookOpen,
  ChevronDown,
  X,
  FileText,
  Send,
  Sparkles,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { orderStore, OrderItem } from '@/lib/order-store';
import { apiFetch } from '@/lib/api-client';

interface SidebarProps {
  locale: Locale;
  dict: any;
  onCloseMobileSidebar?: () => void;
}

export function CustomerSidebar({ locale, onCloseMobileSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [menuCounts, setMenuCounts] = useState({
    transportRequests: 0,
    shipments: 0,
    deliveryRequests: 0,
    deposits: 0,
    exchanges: 0,
  });

  useEffect(() => {
    setUser(authStore.getUser());
    orderStore.fetchOrdersFromApi().then(setOrders).catch(() => setOrders(orderStore.getOrders()));
    const handleUpdate = () => {
      setOrders(orderStore.getOrders());
    };
    window.addEventListener('orderchinaviet_orders_updated', handleUpdate);
    return () => window.removeEventListener('orderchinaviet_orders_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const loadMenuCounts = async () => {
      try {
        const [transportRes, packagesRes, deliveryRes, depositsRes, exchangesRes] = await Promise.all([
          apiFetch('/packages/transport-requests/mine'),
          apiFetch('/packages'),
          apiFetch('/packages/delivery-requests/mine'),
          apiFetch('/finance/deposit-requests'),
          apiFetch('/exchange'),
        ]);
        const responses = [transportRes, packagesRes, deliveryRes, depositsRes, exchangesRes];
        const payloads = await Promise.all(responses.map(async (response) => response.ok ? response.json() : { data: [] }));
        const packages = payloads[1].data || [];
        setMenuCounts({
          transportRequests: (payloads[0].data || []).length,
          shipments: packages.filter((item: any) => ['RECEIVED_CHINA', 'IN_TRANSIT', 'RECEIVED_VIETNAM'].includes(item.status)).length
            + (payloads[0].data || []).filter((item: any) => item.status === 'IN_TRANSIT').length,
          deliveryRequests: (payloads[2].data || []).length,
          deposits: (payloads[3].data || []).length,
          exchanges: (payloads[4].data || []).length,
        });
      } catch (error) {
        console.error('Không thể tải số đếm menu:', error);
      }
    };
    const refresh = () => void loadMenuCounts();
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('orderchinaviet_exchange_updated', refresh);
    window.addEventListener('orderchinaviet_balance_updated', refresh);
    window.addEventListener('orderchinaviet_finance_updated', refresh);
    window.addEventListener('orderchinaviet_transport_updated', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('orderchinaviet_exchange_updated', refresh);
      window.removeEventListener('orderchinaviet_balance_updated', refresh);
      window.removeEventListener('orderchinaviet_finance_updated', refresh);
      window.removeEventListener('orderchinaviet_transport_updated', refresh);
    };
  }, []);

  const getStatusCount = (key: string): number => {
    if (key === 'ALL') return orders.length;
    return orders.filter((ord) => {
      const st = (ord.status || '').toUpperCase();
      if (key === 'PENDING') return st === 'PENDING' || st === 'CREATED';
      if (key === 'DEPOSITED') return st === 'DEPOSITED' || st === 'RECEIVED';
      if (key === 'PURCHASING') return st === 'PURCHASING' || st === 'BUYING';
      if (key === 'PURCHASED') return st === 'PURCHASED' || st === 'RECEIVED_CHINA';
      if (key === 'COMPLETED') return st === 'COMPLETED' || st === 'DELIVERED';
      if (key === 'CANCELLED') return st === 'CANCELLED';
      return st === key;
    }).length;
  };

  // Accordion expansion state for sub-menus
  const [ordersOpen, setOrdersOpen] = useState(pathname.includes('/orders'));
  const [transportOpen, setTransportOpen] = useState(['/transport-requests', '/shipments', '/deliveries'].some((path) => pathname.includes(path)));
  const [financeOpen, setFinanceOpen] = useState(pathname.includes('/finance'));

  const isCurrent = (href: string) => {
    if (href === `/${locale}/dashboard` && pathname === `/${locale}/dashboard`) return true;
    if (href !== `/${locale}/dashboard` && pathname.startsWith(href)) return true;
    return false;
  };

  const handleNavClick = (href: string) => {
    if (onCloseMobileSidebar) onCloseMobileSidebar();
    router.push(href);
  };

  const activeBg = 'bg-[#fa3131] text-white shadow-sm font-bold';
  const inactiveBg = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold';
  const subActiveBg = 'bg-rose-50 text-[#fa3131] font-bold border-l-2 border-[#fa3131]';
  const subInactiveBg = 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium';
  const transportTotal = menuCounts.transportRequests + menuCounts.shipments + menuCounts.deliveryRequests;
  const financeTotal = menuCounts.deposits + menuCounts.exchanges;
  const countBadge = (count: number, active = false) => (
    <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold ${active ? 'bg-[#fa3131] text-white' : 'bg-slate-100 text-slate-500'}`}>
      ({count})
    </span>
  );

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-200 flex flex-col h-full select-none shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 justify-between bg-slate-50/80">
        <div
          onClick={() => handleNavClick(`/${locale}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Image
            src="/logo-light.png"
            alt="OrderChinaViet Logo"
            width={140}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
        {onCloseMobileSidebar && (
          <button
            onClick={onCloseMobileSidebar}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar text-xs">
        {/* Prominent Deposit Button in Sidebar (Mobile Only) */}
        <button
          onClick={() => handleNavClick(`/${locale}/finance?action=deposit`)}
          className="lg:hidden w-full flex items-center justify-center gap-2 px-3.5 py-2.5 mb-2 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Nạp Tiền Vào Ví Dư</span>
        </button>

        {/* 1. Bảng Chung */}
        <button
          onClick={() => handleNavClick(`/${locale}/dashboard`)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            isCurrent(`/${locale}/dashboard`) && !pathname.includes('/packages') && !pathname.includes('/shipments') && !pathname.includes('/waybills') && !pathname.includes('/orders') && !pathname.includes('/consignments') && !pathname.includes('/deliveries') && !pathname.includes('/transactions') && !pathname.includes('/disputes') && !pathname.includes('/withdrawals') && !pathname.includes('/guides')
              ? activeBg
              : inactiveBg
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Bảng Chung</span>
        </button>

        {/* 2. Đơn Hàng (Expandable) */}
        <div>
          <button
            onClick={() => setOrdersOpen(!ordersOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              pathname.includes('/orders') ? 'text-[#fa3131] font-bold bg-rose-50/80' : inactiveBg
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Đơn Hàng</span>
              {countBadge(orders.length)}
            </div>
            <ChevronDown
              className={`ml-2 w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                ordersOpen ? 'rotate-180 text-[#fa3131]' : 'text-slate-400'
              }`}
            />
          </button>

          {ordersOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5 animate-in fade-in duration-150">
              {[
                { key: 'ALL', label: 'Tất Cả Đơn Hàng', href: `/${locale}/orders` },
                { key: 'PENDING', label: 'Chờ đặt cọc', href: `/${locale}/orders?status=PENDING` },
                { key: 'DEPOSITED', label: 'Đã đặt cọc', href: `/${locale}/orders?status=DEPOSITED` },
                { key: 'PURCHASING', label: 'Đang mua', href: `/${locale}/orders?status=PURCHASING` },
                { key: 'PURCHASED', label: 'Đã mua', href: `/${locale}/orders?status=PURCHASED` },
                { key: 'COMPLETED', label: 'Hoàn thành', href: `/${locale}/orders?status=COMPLETED` },
                { key: 'CANCELLED', label: 'Đã hủy', href: `/${locale}/orders?status=CANCELLED` },
              ].map((sub, i) => {
                const count = getStatusCount(sub.key);
                const isActive = pathname === sub.href;
                return (
                  <button
                    key={i}
                    onClick={() => handleNavClick(sub.href)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                      isActive ? subActiveBg : subInactiveBg
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-[#fa3131] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Vận Chuyển (luồng thống nhất) */}
        <div>
          <button
            onClick={() => setTransportOpen(!transportOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              ['/transport-requests', '/shipments', '/deliveries'].some((path) => pathname.includes(path)) ? 'text-[#fa3131] font-bold bg-rose-50/80' : inactiveBg
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 shrink-0" />
              <span>Vận Chuyển</span>
              {countBadge(transportTotal)}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                transportOpen ? 'rotate-180 text-[#fa3131]' : 'text-slate-400'
              }`}
            />
          </button>

          {transportOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5 animate-in fade-in duration-150">
              {[
                { label: 'Gửi Yêu Cầu', href: `/${locale}/transport-requests`, count: menuCounts.transportRequests },
                { label: 'Đang Vận Chuyển', href: `/${locale}/shipments`, count: menuCounts.shipments },
                { label: 'Yêu Cầu Giao Hàng', href: `/${locale}/deliveries`, count: menuCounts.deliveryRequests },
              ].map((sub, i) => (
                <button
                  key={i}
                  onClick={() => handleNavClick(sub.href)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-all text-left ${
                    pathname.startsWith(sub.href) ? subActiveBg : subInactiveBg
                  }`}
                >
                  <span>{sub.label}</span>
                  {countBadge(sub.count, pathname.startsWith(sub.href))}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Tài Chính & Ví Dư */}
        <div><button onClick={() => setFinanceOpen(!financeOpen)} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${pathname.includes('/finance') ? 'text-[#fa3131] font-bold bg-rose-50/80' : inactiveBg}`}><div className="flex min-w-0 flex-1 items-center gap-3"><CreditCard className="w-4 h-4 shrink-0"/><span>Tài Chính &amp; Ví Dư</span>{countBadge(financeTotal)}</div><ChevronDown className={`ml-2 w-3.5 h-3.5 shrink-0 transition-transform ${financeOpen ? 'rotate-180 text-[#fa3131]' : 'text-slate-400'}`}/></button>{financeOpen&&<div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5"><button onClick={()=>handleNavClick(`/${locale}/finance?view=deposit`)} className={`flex w-full items-center px-3 py-2 rounded-lg text-[11px] text-left ${subInactiveBg}`}><span>Nạp Tiền Vào Ví</span>{countBadge(menuCounts.deposits)}</button><button onClick={()=>handleNavClick(`/${locale}/finance?view=exchange`)} className={`flex w-full items-center px-3 py-2 rounded-lg text-[11px] text-left ${subInactiveBg}`}><span>Đổi Tiền</span>{countBadge(menuCounts.exchanges)}</button></div>}</div>

        {/* 7. Hỗ Trợ & Khiếu Nại */}
        <button
          onClick={() => handleNavClick(`/${locale}/disputes`)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            isCurrent(`/${locale}/disputes`) ? activeBg : inactiveBg
          }`}
        >
          <LifeBuoy className="w-4 h-4 shrink-0" />
          <span>Hỗ Trợ &amp; Khiếu Nại</span>
        </button>

        {/* 8. Yêu cầu rút tiền */}
        <button
          onClick={() => handleNavClick(`/${locale}/withdrawals`)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            isCurrent(`/${locale}/withdrawals`) ? activeBg : inactiveBg
          }`}
        >
          <ArrowDownToLine className="w-4 h-4 shrink-0" />
          <span>Yêu Cầu Rút Tiền</span>
        </button>

        {/* 9. Hướng dẫn */}
        <button
          onClick={() => handleNavClick(`/${locale}/guides`)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            isCurrent(`/${locale}/guides`) ? activeBg : inactiveBg
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Hướng Dẫn</span>
        </button>
      </nav>

      {/* Customer Quick Profile Card & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2">
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#fa3131] to-[#0c3ed0] flex items-center justify-center text-white text-xs font-bold shrink-0 relative border border-slate-200">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'C'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {user?.fullName || 'Khách Hàng'}
            </div>
            <div className="text-[10px] text-[#fa3131] font-mono font-bold flex items-center gap-1">
              <span>{user?.customerCode || 'OCV000001'}</span>
              <span className="text-[9px] bg-blue-50 text-blue-700 px-1 rounded border border-blue-200">+cd</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            authStore.clearSession();
            if (onCloseMobileSidebar) onCloseMobileSidebar();
            router.push(`/${locale}`);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng Xuất Tài Khoản</span>
        </button>
      </div>
    </aside>
  );
}
