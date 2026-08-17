'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight, ArrowUpRight, Award, BarChart3, CalendarClock, Clock3,
  DollarSign, FileText, Package, Settings, ShieldCheck, ShoppingBag,
  TerminalSquare, Truck, Users, Wallet, Briefcase,
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { userStore, UserRecord } from '@/lib/user-store';

type DashboardData = {
  customers: UserRecord[];
  orders: any[];
  exchanges: any[];
  deposits: any[];
  withdrawals: any[];
  transports: any[];
  deliveries: any[];
  packages: any[];
};

const emptyData: DashboardData = { customers: [], orders: [], exchanges: [], deposits: [], withdrawals: [], transports: [], deliveries: [], packages: [] };
const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const pending = (items: any[]) => items.filter((item) => ['PENDING', 'CREATED'].includes(String(item.status).toUpperCase())).length;
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý', CREATED: 'Mới tạo', APPROVED: 'Đã duyệt',
  PICKING_UP: 'Đang lấy hàng', IN_TRANSIT: 'Đang vận chuyển',
  COMPLETED: 'Đã hoàn tất', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy',
};

async function readList(response: Response) {
  if (!response.ok) return [];
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return [];
  return (await response.json()).data || [];
}

export default function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [customers, ordersRes, exchangesRes, depositsRes, withdrawalsRes, transportsRes, deliveriesRes, packagesRes] = await Promise.all([
          userStore.fetchCustomersFromApi(), apiFetch('/orders'), apiFetch('/exchange'),
          apiFetch('/finance/deposit-requests'), apiFetch('/operations/withdrawals'),
          apiFetch('/packages/transport-requests/mine'), apiFetch('/packages/delivery-requests/mine'), apiFetch('/packages'),
        ]);
        const [orders, exchanges, deposits, withdrawals, transports, deliveries, packages] = await Promise.all([
          readList(ordersRes), readList(exchangesRes), readList(depositsRes), readList(withdrawalsRes),
          readList(transportsRes), readList(deliveriesRes), readList(packagesRes),
        ]);
        setData({ customers, orders, exchanges, deposits, withdrawals, transports, deliveries, packages });
        setUpdatedAt(new Date());
      } finally { setLoading(false); }
    };
    void load();
  }, []);

  const affiliates = userStore.searchUsers('', 'AFFILIATE').length;
  const totalBalance = data.customers.reduce((sum, user) => sum + Number(user.balanceVnd || 0), 0);
  const transportActive = data.transports.filter((item) => ['PICKING_UP', 'IN_TRANSIT'].includes(item.status)).length;
  const packageActive = data.packages.filter((item) => ['RECEIVED_CHINA', 'IN_TRANSIT', 'RECEIVED_VIETNAM'].includes(item.status)).length;
  const financePending = pending(data.deposits) + pending(data.withdrawals) + pending(data.exchanges);
  const operationsPending = pending(data.orders) + pending(data.transports) + pending(data.deliveries);

  const stats = [
    { label: 'Khách hàng', value: data.customers.length.toLocaleString('vi-VN'), detail: `${affiliates} đối tác affiliate`, icon: Users, style: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Đơn mua hộ', value: data.orders.length.toLocaleString('vi-VN'), detail: `${pending(data.orders)} đơn chờ xử lý`, icon: ShoppingBag, style: 'bg-violet-50 text-violet-700 border-violet-200' },
    { label: 'Vận chuyển', value: (transportActive + packageActive).toLocaleString('vi-VN'), detail: 'Đang lấy hàng hoặc di chuyển', icon: Truck, style: 'bg-sky-50 text-sky-700 border-sky-200' },
    { label: 'Lệnh tài chính chờ', value: financePending.toLocaleString('vi-VN'), detail: 'Nạp, rút và đổi tiền', icon: DollarSign, style: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Tổng số dư ví', value: money(totalBalance), detail: 'Số dư khả dụng của khách hàng', icon: Wallet, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Công việc chờ xử lý', value: (financePending + operationsPending).toLocaleString('vi-VN'), detail: 'Toàn bộ nghiệp vụ cần kiểm tra', icon: Clock3, style: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  const queues = [
    { label: 'Đơn hàng chờ xử lý', count: pending(data.orders), href: `/${locale}/admin/orders`, icon: ShoppingBag, color: 'text-violet-700 bg-violet-50' },
    { label: 'Lệnh đổi tiền chờ duyệt', count: pending(data.exchanges), href: `/${locale}/admin/exchange`, icon: ArrowLeftRight, color: 'text-blue-700 bg-blue-50' },
    { label: 'Lệnh nạp/rút chờ duyệt', count: pending(data.deposits) + pending(data.withdrawals), href: `/${locale}/admin/finance`, icon: Wallet, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Yêu cầu vận chuyển chờ', count: pending(data.transports) + pending(data.deliveries), href: `/${locale}/admin/shipments`, icon: Truck, color: 'text-sky-700 bg-sky-50' },
  ];

  const shortcuts = [
    { label: 'Quản lý đơn mua hộ', href: `/${locale}/admin/orders`, icon: ShoppingBag },
    { label: 'Quản lý đổi tiền', href: `/${locale}/admin/exchange`, icon: ArrowLeftRight },
    { label: 'Quản lý vận chuyển', href: `/${locale}/admin/shipments`, icon: Package },
    { label: 'Danh sách khách hàng', href: `/${locale}/admin/customers`, icon: Users },
    { label: 'Ứng viên tuyển dụng', href: `/${locale}/admin/job-applications`, icon: Briefcase },
    { label: 'Tiếp thị liên kết', href: `/${locale}/admin/affiliates`, icon: Award },
    { label: 'Chấm công & lương', href: `/${locale}/admin/affiliate-payroll`, icon: CalendarClock },
    { label: 'Tài chính & ví dư', href: `/${locale}/admin/finance`, icon: DollarSign },
    { label: 'Báo cáo & thống kê', href: `/${locale}/admin/reports`, icon: BarChart3 },
    { label: 'CMS & bài viết', href: `/${locale}/admin/cms`, icon: FileText },
    { label: 'Log hệ thống', href: `/${locale}/admin/logs`, icon: TerminalSquare },
    { label: 'Cài đặt hệ thống', href: `/${locale}/admin/settings`, icon: Settings },
  ];

  const recentTransports = [...data.transports].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  if (loading) return <div className="space-y-5 animate-pulse"><div className="h-36 rounded-3xl bg-slate-200"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map(x=><div key={x} className="h-28 rounded-2xl bg-slate-200"/>)}</div></div>;

  return <div className="space-y-6 text-slate-800 animate-in fade-in duration-200">
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
      <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-blue-200"><ShieldCheck className="h-3.5 w-3.5"/>TRUNG TÂM ĐIỀU HÀNH ORDERCHINAVIET</div><h1 className="text-2xl font-bold sm:text-3xl">Tổng Quan Hệ Thống</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300">Theo dõi công việc cần xử lý, dòng tiền, đơn hàng và hoạt động vận chuyển trên một màn hình.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300"><span className="block text-[10px] uppercase text-slate-500">Cập nhật gần nhất</span><b className="mt-1 block font-mono text-white">{updatedAt?.toLocaleString('vi-VN')}</b></div></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(item=>{const Icon=item.icon;return <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-bold font-mono text-slate-950">{item.value}</p><p className="mt-1 text-[11px] text-slate-400">{item.detail}</p></div><div className={`rounded-xl border p-2.5 ${item.style}`}><Icon className="h-5 w-5"/></div></div></div>})}</section>

    <section className="grid gap-6 xl:grid-cols-3"><div className="space-y-4 xl:col-span-2"><div><h2 className="font-bold text-slate-950">Hàng đợi cần xử lý</h2><p className="text-xs text-slate-500">Các nghiệp vụ đang chờ Admin kiểm tra hoặc phê duyệt.</p></div><div className="grid gap-3 sm:grid-cols-2">{queues.map(item=>{const Icon=item.icon;return <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"><div className={`rounded-xl p-2.5 ${item.color}`}><Icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700">{item.label}</p><p className="mt-1 text-xl font-bold font-mono text-slate-950">{item.count}</p></div><ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600"/></Link>})}</div></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"><h2 className="font-bold text-slate-950">Truy cập nhanh</h2><p className="mb-4 mt-1 text-xs text-slate-500">Đầy đủ chức năng theo menu quản trị.</p><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{shortcuts.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Icon className="h-4 w-4"/><span className="flex-1">{item.label}</span><ArrowUpRight className="h-3.5 w-3.5"/></Link>})}</div></div>
    </section>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-5"><div><h2 className="font-bold text-slate-950">Yêu cầu vận chuyển gần đây</h2><p className="text-xs text-slate-500">Dữ liệu mới nhất do khách hàng gửi lên.</p></div><Link href={`/${locale}/admin/shipments`} className="flex items-center gap-1 text-xs font-bold text-blue-700">Xem tất cả <ArrowUpRight className="h-4 w-4"/></Link></div>{recentTransports.length===0?<div className="p-10 text-center text-sm text-slate-500">Chưa có yêu cầu vận chuyển.</div>:<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="px-5 py-3">Mã yêu cầu</th><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Hàng hóa</th><th className="px-5 py-3">Tuyến</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Ngày tạo</th></tr></thead><tbody className="divide-y divide-slate-100">{recentTransports.map(item=><tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-3.5 font-mono font-bold text-blue-700">{item.requestCode}</td><td className="px-5 py-3.5">{item.customer?.fullName||item.recipientName||'—'}</td><td className="max-w-xs truncate px-5 py-3.5">{item.categoryName||item.goodsDescription}</td><td className="px-5 py-3.5">{item.pickupProvince||'—'} → {item.province||'—'}</td><td className="px-5 py-3.5"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold">{STATUS_LABELS[item.status]||item.status}</span></td><td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
