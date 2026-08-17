'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, ArrowLeftRight, ArrowUpRight, Clock3, CreditCard, MapPin,
  Package, Search, Send, ShoppingBag, Truck, Wallet,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api-client';

type DashboardData = {
  orders: any[]; transports: any[]; parcels: any[]; deliveries: any[];
  deposits: any[]; exchanges: any[]; withdrawals: any[];
};
const emptyData: DashboardData = { orders: [], transports: [], parcels: [], deliveries: [], deposits: [], exchanges: [], withdrawals: [] };
const pending = (items: any[]) => items.filter(item => ['PENDING', 'CREATED'].includes(String(item.status).toUpperCase())).length;
const STATUS_LABELS: Record<string,string> = {
  PENDING: 'Chờ xử lý', CREATED: 'Mới tạo', DEPOSITED: 'Đã đặt cọc',
  PURCHASING: 'Đang mua', PURCHASED: 'Đã mua', APPROVED: 'Đã duyệt',
  PICKING_UP: 'Đang lấy hàng', RECEIVED_CHINA: 'Đã nhận tại Trung Quốc',
  IN_TRANSIT: 'Đang vận chuyển', RECEIVED_VIETNAM: 'Đã về Việt Nam',
  COMPLETED: 'Đã hoàn tất', DELIVERED: 'Đã giao', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy',
};
const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
async function readList(response: Response) { if (!response.ok || !(response.headers.get('content-type')||'').includes('application/json')) return []; return (await response.json()).data || []; }

export default function DashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params); const router = useRouter();
  const [user,setUser] = useState<UserSession|null>(null); const [data,setData] = useState<DashboardData>(emptyData);
  const [loading,setLoading] = useState(true); const [trackingCode,setTrackingCode] = useState('');

  useEffect(()=>{const load=async()=>{setLoading(true);try{const[profile,ordersRes,transportsRes,parcelsRes,deliveriesRes,depositsRes,exchangesRes,withdrawalsRes]=await Promise.all([
    authStore.refreshProfile(),apiFetch('/orders'),apiFetch('/packages/transport-requests/mine'),apiFetch('/packages'),apiFetch('/packages/delivery-requests/mine'),apiFetch('/finance/deposit-requests'),apiFetch('/exchange'),apiFetch('/operations/withdrawals'),
  ]);const[orders,transports,parcels,deliveries,deposits,exchanges,withdrawals]=await Promise.all([readList(ordersRes),readList(transportsRes),readList(parcelsRes),readList(deliveriesRes),readList(depositsRes),readList(exchangesRes),readList(withdrawalsRes)]);setUser(profile);setData({orders,transports,parcels,deliveries,deposits,exchanges,withdrawals})}catch(error){console.error('Không thể tải dashboard:',error);setUser(authStore.getUser())}finally{setLoading(false)}};void load()},[]);

  const activeTransportRequests=data.transports.filter(x=>['PICKING_UP','IN_TRANSIT'].includes(x.status)).length;
  const activeParcels=data.parcels.filter(x=>['RECEIVED_CHINA','IN_TRANSIT','RECEIVED_VIETNAM'].includes(x.status)).length;
  const financePending=pending(data.deposits)+pending(data.exchanges)+pending(data.withdrawals);
  const balance=Number(user?.balanceVnd||0);
  const stats=[
    {title:'Tổng đơn hàng',value:data.orders.length.toLocaleString('vi-VN'),sub:`${pending(data.orders)} đơn chờ xử lý`,icon:ShoppingBag,style:'bg-violet-50 text-violet-700 border-violet-200',href:`/${locale}/orders`},
    {title:'Đang vận chuyển',value:(activeTransportRequests+activeParcels).toLocaleString('vi-VN'),sub:'Yêu cầu và kiện đang di chuyển',icon:Truck,style:'bg-sky-50 text-sky-700 border-sky-200',href:`/${locale}/shipments`},
    {title:'Số dư khả dụng',value:money(balance),sub:'Dùng để thanh toán và đổi tiền',icon:Wallet,style:'bg-emerald-50 text-emerald-700 border-emerald-200',href:`/${locale}/finance`},
    {title:'Lệnh tài chính chờ',value:financePending.toLocaleString('vi-VN'),sub:'Nạp, rút và đổi tiền',icon:Clock3,style:'bg-amber-50 text-amber-700 border-amber-200',href:`/${locale}/finance`},
  ];
  const actions=[
    {label:'Quản lý đơn hàng',desc:'Theo dõi và thanh toán đơn mua hộ',icon:ShoppingBag,href:`/${locale}/orders`,color:'bg-violet-600'},
    {label:'Gửi yêu cầu vận chuyển',desc:'Khai báo hàng, địa chỉ lấy và nhận hàng',icon:Send,href:`/${locale}/transport-requests`,color:'bg-blue-600'},
    {label:'Theo dõi vận chuyển',desc:'Kiểm tra các yêu cầu và kiện đang đi',icon:Truck,href:`/${locale}/shipments`,color:'bg-sky-600'},
    {label:'Yêu cầu giao hàng',desc:'Tạo và theo dõi giao hàng từ kho Việt Nam',icon:MapPin,href:`/${locale}/deliveries`,color:'bg-orange-600'},
    {label:'Nạp tiền vào ví',desc:'Xem danh sách các lệnh nạp tiền',icon:CreditCard,href:`/${locale}/finance?view=deposit`,color:'bg-emerald-600'},
    {label:'Quản lý đổi tiền',desc:'Theo dõi lệnh mua và bán CNY',icon:ArrowLeftRight,href:`/${locale}/finance?view=exchange`,color:'bg-cyan-600'},
  ];
  const activities=[
    ...data.orders.map(x=>({id:x.id,code:x.orderCode||x.code||x.id,type:'Đơn hàng',detail:x.shopName||x.note||'Yêu cầu mua hộ',status:x.status,createdAt:x.createdAt,href:`/${locale}/orders`})),
    ...data.transports.map(x=>({id:x.id,code:x.requestCode,type:'Vận chuyển',detail:x.goodsDescription||x.categoryName,status:x.status,createdAt:x.createdAt,href:`/${locale}/transport-requests`})),
    ...data.exchanges.map(x=>({id:x.id,code:x.transactionCode||x.id,type:'Đổi tiền',detail:`${Number(x.sourceAmount||0).toLocaleString('vi-VN')} ${x.sourceCurrency||''}`,status:x.status,createdAt:x.createdAt,href:`/${locale}/finance?view=exchange`})),
  ].sort((a,b)=>+new Date(b.createdAt)-+new Date(a.createdAt)).slice(0,8);
  const track=(event:React.FormEvent)=>{event.preventDefault();if(trackingCode.trim())router.push(`/${locale}/track?code=${encodeURIComponent(trackingCode.trim())}`)};

  if(loading)return <div className="space-y-5 animate-pulse"><div className="h-32 rounded-3xl bg-slate-200"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(x=><div key={x} className="h-28 rounded-2xl bg-slate-200"/>)}</div><div className="h-64 rounded-3xl bg-slate-200"/></div>;

  return <div className="space-y-6 text-slate-800 animate-in fade-in duration-200">
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">{user?.customerCode||'KHÁCH HÀNG'}</span><h1 className="mt-3 text-2xl font-bold">Xin chào, {user?.fullName||'Quý khách'}!</h1><p className="mt-2 text-xs text-slate-300">Quản lý đơn hàng, vận chuyển và tài chính của bạn tại một nơi.</p></div><form onSubmit={track} className="flex w-full gap-2 lg:w-[390px]"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={trackingCode} onChange={e=>setTrackingCode(e.target.value)} placeholder="Nhập mã kiện hoặc vận đơn" className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-400"/></div><button className="rounded-xl bg-[#fa3131] px-4 text-xs font-bold">Tra cứu</button></form></div></section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(item=>{const Icon=item.icon;return <button key={item.title} onClick={()=>router.push(item.href)} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"><div><p className="text-xs font-bold text-slate-500">{item.title}</p><p className="mt-2 text-xl font-bold font-mono text-slate-950">{item.value}</p><p className="mt-1 text-[10px] text-slate-400">{item.sub}</p></div><div className={`rounded-xl border p-2.5 ${item.style}`}><Icon className="h-5 w-5"/></div></button>})}</section>

    <section><div className="mb-3"><h2 className="font-bold text-slate-950">Truy cập nhanh</h2><p className="text-xs text-slate-500">Các chức năng chính theo menu của bạn.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{actions.map(item=>{const Icon=item.icon;return <button key={item.href} onClick={()=>router.push(item.href)} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:shadow-md"><div className={`rounded-xl p-3 text-white ${item.color}`}><Icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{item.label}</h3><p className="mt-1 text-[11px] text-slate-500">{item.desc}</p></div><ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600"/></button>})}</div></section>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-5"><div><h2 className="font-bold text-slate-950">Hoạt động gần đây</h2><p className="text-xs text-slate-500">Đơn hàng, yêu cầu vận chuyển và lệnh đổi tiền mới nhất.</p></div><Package className="h-5 w-5 text-blue-600"/></div>{activities.length===0?<div className="p-10 text-center"><AlertCircle className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-2 text-sm font-semibold">Chưa có hoạt động nào</p><p className="mt-1 text-xs text-slate-500">Các giao dịch và yêu cầu mới sẽ xuất hiện tại đây.</p></div>:<div className="divide-y divide-slate-100">{activities.map(item=><button key={`${item.type}-${item.id}`} onClick={()=>router.push(item.href)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="font-mono text-xs text-blue-700">{item.code}</b><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{item.type}</span></div><p className="mt-1 truncate text-xs text-slate-600">{item.detail}</p></div><div className="text-right"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{STATUS_LABELS[item.status]||item.status}</span><p className="mt-1.5 font-mono text-[10px] text-slate-400">{item.createdAt?new Date(item.createdAt).toLocaleString('vi-VN'):'—'}</p></div></button>)}</div>}</section>
  </div>;
}
