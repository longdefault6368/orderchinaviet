'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Truck,
  Package,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit3,
  CreditCard,
  RotateCcw,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  X,
  ChevronRight,
  Filter,
  Check,
  Building2,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { notificationStore } from '@/lib/notification-store';

export interface Customer {
  fullName: string;
  customerCode?: string;
  phone?: string;
  email: string;
}

export interface TransportRequestItem {
  id: string;
  requestCode: string;
  customerId: string;
  customer: Customer;
  categoryName: string;
  goodsDescription: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  chargeableWeight: number;
  shippingMethod: string;
  insurance: boolean;
  declaredValueVnd: number;
  estimatedTotalVnd: number;
  depositPaidVnd: number;
  depositPercentage: number;
  depositRefundStatus?: string | null;
  depositRefundReason?: string | null;
  trackingCodeChina?: string | null;
  adminNote?: string | null;
  pickupContactName: string;
  pickupPhone: string;
  pickupCountry: string;
  pickupCustomCountry?: string;
  pickupProvince: string;
  pickupDistrict: string;
  pickupWard: string;
  pickupAddressLine: string;
  pickupNote?: string;
  pickupImage?: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  country: string;
  customCountry?: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  deliveryNote?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryParcelItem {
  id: string;
  parcelCode: string;
  chargeableWeight: number;
  status?: string;
}

export interface DeliveryRequestItem {
  id: string;
  requestCode: string;
  customerId: string;
  customer: Customer;
  parcels: DeliveryParcelItem[];
  address: string;
  contactPhone: string;
  shippingMethod: string;
  feeVnd: number;
  status: string;
  reviewNote?: string;
  createdAt: string;
}

const formatMoney = (v: number) => `${Math.round(v || 0).toLocaleString('vi-VN')} ₫`;

const TRANSPORT_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  PENDING: {
    label: 'Chờ xử lý',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  DEPOSITED: {
    label: 'Đã đặt cọc',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: CreditCard,
  },
  APPROVED: {
    label: 'Đã duyệt yêu cầu',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: CheckCircle2,
  },
  PICKING_UP: {
    label: 'Đang lấy hàng (TQ)',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Package,
  },
  IN_TRANSIT: {
    label: 'Đang vận chuyển',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Hoàn tất',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: ShieldCheck,
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

const DELIVERY_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  PENDING: {
    label: 'Chờ duyệt giao',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt giao hàng',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: CheckCircle2,
  },
  DELIVERING: {
    label: 'Đang giao tận nơi',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    icon: Truck,
  },
  COMPLETED: {
    label: 'Giao thành công',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: ShieldCheck,
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

const resolveCountryName = (code: string, custom?: string) =>
  code === 'VN' ? 'Việt Nam' : code === 'CN' ? 'Trung Quốc' : custom || 'Khác';

export default function AdminShipmentsPage() {
  const [tab, setTab] = useState<'transport' | 'delivery'>('transport');
  const [transports, setTransports] = useState<TransportRequestItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals State
  const [detailTransport, setDetailTransport] = useState<TransportRequestItem | null>(null);
  const [statusModalTransport, setStatusModalTransport] = useState<TransportRequestItem | null>(null);
  const [refundModalTransport, setRefundModalTransport] = useState<TransportRequestItem | null>(null);
  const [detailDelivery, setDetailDelivery] = useState<DeliveryRequestItem | null>(null);
  const [statusModalDelivery, setStatusModalDelivery] = useState<DeliveryRequestItem | null>(null);

  // Form State inside modals
  const [newStatus, setNewStatus] = useState('APPROVED');
  const [adminNote, setAdminNote] = useState('');
  const [trackingCodeChina, setTrackingCodeChina] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        apiFetch('/packages/transport-requests/mine'),
        apiFetch('/packages/delivery-requests/mine'),
      ]);
      const [tJson, dJson] = await Promise.all([tRes.json(), dRes.json()]);
      if (tRes.ok) setTransports(tJson.data || []);
      if (dRes.ok) setDeliveries(dJson.data || []);
    } catch (e) {
      console.error('Failed to load admin shipments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const handleUpdate = () => {
      void load();
    };

    window.addEventListener('orderchinaviet_transport_updated', handleUpdate);
    return () => {
      window.removeEventListener('orderchinaviet_transport_updated', handleUpdate);
    };
  }, [load]);

  // Status counters for Transport Requests
  const transportStats = useMemo(() => {
    const total = transports.length;
    const pending = transports.filter((x) => x.status === 'PENDING').length;
    const deposited = transports.filter((x) => x.status === 'DEPOSITED').length;
    const inTransit = transports.filter((x) => ['APPROVED', 'PICKING_UP', 'IN_TRANSIT'].includes(x.status)).length;
    const completed = transports.filter((x) => x.status === 'COMPLETED').length;
    const refundPending = transports.filter((x) => x.depositRefundStatus === 'PENDING').length;
    return { total, pending, deposited, inTransit, completed, refundPending };
  }, [transports]);

  // Status counters for Delivery Requests
  const deliveryStats = useMemo(() => {
    const total = deliveries.length;
    const pending = deliveries.filter((x) => x.status === 'PENDING').length;
    const delivering = deliveries.filter((x) => ['APPROVED', 'DELIVERING'].includes(x.status)).length;
    const completed = deliveries.filter((x) => x.status === 'COMPLETED').length;
    return { total, pending, delivering, completed };
  }, [deliveries]);

  // Filtered Transports
  const filteredTransports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transports.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'REFUND_PENDING') {
          if (item.depositRefundStatus !== 'PENDING') return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }
      if (!q) return true;
      return (
        item.requestCode.toLowerCase().includes(q) ||
        (item.customer?.fullName || '').toLowerCase().includes(q) ||
        (item.customer?.customerCode || '').toLowerCase().includes(q) ||
        (item.customer?.phone || '').toLowerCase().includes(q) ||
        (item.customer?.email || '').toLowerCase().includes(q) ||
        (item.categoryName || '').toLowerCase().includes(q) ||
        (item.goodsDescription || '').toLowerCase().includes(q) ||
        (item.pickupProvince || '').toLowerCase().includes(q) ||
        (item.province || '').toLowerCase().includes(q) ||
        (item.trackingCodeChina || '').toLowerCase().includes(q)
      );
    });
  }, [transports, search, statusFilter]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deliveries.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!q) return true;
      const matchParcels = item.parcels?.some((p) => p.parcelCode.toLowerCase().includes(q));
      return (
        item.requestCode.toLowerCase().includes(q) ||
        (item.customer?.fullName || '').toLowerCase().includes(q) ||
        (item.customer?.customerCode || '').toLowerCase().includes(q) ||
        (item.customer?.phone || '').toLowerCase().includes(q) ||
        (item.address || '').toLowerCase().includes(q) ||
        (item.contactPhone || '').toLowerCase().includes(q) ||
        matchParcels
      );
    });
  }, [deliveries, search, statusFilter]);

  // Open Status Modal for Transport
  const handleOpenStatusModal = (item: TransportRequestItem) => {
    setStatusModalTransport(item);
    setNewStatus(item.status);
    setAdminNote(item.adminNote || '');
    setTrackingCodeChina(item.trackingCodeChina || '');
    setActionSuccessMsg(null);
  };

  // Submit Transport Status & Notes
  const handleUpdateTransportStatus = async () => {
    if (!statusModalTransport) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/packages/transport-requests/${statusModalTransport.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote.trim(),
          trackingCodeChina: trackingCodeChina.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại');

      await load();
      window.dispatchEvent(new Event('orderchinaviet_transport_updated'));
      setActionSuccessMsg('Đã cập nhật trạng thái và gửi thông báo tới khách hàng thành công!');
      setTimeout(() => {
        setStatusModalTransport(null);
        setActionSuccessMsg(null);
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process Deposit Refund
  const handleProcessRefund = async (approve: boolean) => {
    if (!refundModalTransport) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/packages/transport-requests/${refundModalTransport.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          depositRefundStatus: approve ? 'REFUNDED' : 'REJECTED',
          status: approve ? 'CANCELLED' : refundModalTransport.status,
          adminNote: adminNote.trim() || (approve ? 'Admin đã duyệt hoàn cọc vào ví' : 'Admin từ chối yêu cầu hoàn cọc'),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không thể xử lý hoàn tiền cọc');

      await load();
      window.dispatchEvent(new Event('orderchinaviet_transport_updated'));
      window.dispatchEvent(new Event('orderchinaviet_balance_updated'));
      setActionSuccessMsg(
        approve
          ? `Đã hoàn tiền ${formatMoney(refundModalTransport.depositPaidVnd)} vào ví của khách hàng ${refundModalTransport.customer?.fullName}!`
          : 'Đã từ chối yêu cầu hoàn cọc và gửi thông báo cho khách hàng.'
      );
      setTimeout(() => {
        setRefundModalTransport(null);
        setActionSuccessMsg(null);
      }, 2000);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xử lý hoàn cọc');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delivery Status & Notes
  const handleUpdateDeliveryStatus = async () => {
    if (!statusModalDelivery) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/packages/delivery-requests/${statusModalDelivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          reviewNote: adminNote.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại');

      await load();
      setActionSuccessMsg('Đã cập nhật trạng thái giao hàng thành công!');
      setTimeout(() => {
        setStatusModalDelivery(null);
        setActionSuccessMsg(null);
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 pb-16">
      {/* ── TOP BANNER ── */}
      <div className="rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md mb-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trung Tâm Vận Hành &amp; Điều Phối Logistics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản Lý Vận Chuyển &amp; Giao Hàng</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tiếp nhận, kiểm duyệt cọc tiền, cấp mã vận đơn Trung Quốc và điều phối giao hàng chặng cuối tại Việt Nam.
            </p>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all backdrop-blur-md border border-white/10 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Yêu Cầu</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{transportStats.total + deliveryStats.total}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
            {transportStats.total} Vận chuyển • {deliveryStats.total} Giao hàng
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Chờ Xử Lý / Cọc</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950">{transportStats.pending + deliveryStats.pending}</p>
          <p className="mt-0.5 text-[11px] text-amber-700 font-medium">Cần duyệt &amp; hướng dẫn cọc</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Đã Đặt Cọc</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-950">{transportStats.deposited}</p>
          <p className="mt-0.5 text-[11px] text-indigo-700 font-medium">Sẵn sàng điều phối lấy hàng</p>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">Đang Vận Chuyển</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-cyan-950">{transportStats.inTransit + deliveryStats.delivering}</p>
          <p className="mt-0.5 text-[11px] text-cyan-700 font-medium">Chặng TQ-VN &amp; Giao nội địa</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Hoàn Tất</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950">{transportStats.completed + deliveryStats.completed}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">Đã giao tận tay khách</p>
        </div>
      </div>

      {/* ── MAIN NAVIGATION TABS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTab('transport');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tab === 'transport'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>1. Yêu Cầu Vận Chuyển (TQ ➔ VN)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] ${
                tab === 'transport' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 font-bold'
              }`}
            >
              {transports.length}
            </span>
          </button>

          <button
            onClick={() => {
              setTab('delivery');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tab === 'delivery'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>2. Yêu Cầu Giao Hàng Nội Địa (VN)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] ${
                tab === 'delivery' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 font-bold'
              }`}
            >
              {deliveries.length}
            </span>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative min-w-[260px] sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === 'transport'
                ? 'Tìm mã yêu cầu, khách, SĐT, loại hàng...'
                : 'Tìm mã yêu cầu, khách, mã kiện...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── SUB-STATUS FILTER PILLS ── */}
      {tab === 'transport' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'ALL', label: 'Tất cả', count: transports.length },
            { id: 'PENDING', label: 'Chờ xử lý', count: transportStats.pending },
            { id: 'DEPOSITED', label: 'Đã đặt cọc', count: transportStats.deposited },
            {
              id: 'REFUND_PENDING',
              label: 'Yêu cầu hoàn cọc',
              count: transportStats.refundPending,
              highlight: transportStats.refundPending > 0,
            },
            {
              id: 'APPROVED',
              label: 'Đã duyệt',
              count: transports.filter((x) => x.status === 'APPROVED').length,
            },
            {
              id: 'PICKING_UP',
              label: 'Đang lấy hàng',
              count: transports.filter((x) => x.status === 'PICKING_UP').length,
            },
            {
              id: 'IN_TRANSIT',
              label: 'Đang vận chuyển',
              count: transports.filter((x) => x.status === 'IN_TRANSIT').length,
            },
            { id: 'COMPLETED', label: 'Hoàn tất', count: transportStats.completed },
            {
              id: 'CANCELLED',
              label: 'Đã hủy',
              count: transports.filter((x) => x.status === 'CANCELLED').length,
            },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white'
                  : pill.highlight
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === pill.id
                    ? 'bg-white/20 text-white'
                    : pill.highlight
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === 'delivery' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'ALL', label: 'Tất cả', count: deliveries.length },
            { id: 'PENDING', label: 'Chờ duyệt', count: deliveryStats.pending },
            {
              id: 'APPROVED',
              label: 'Đã duyệt',
              count: deliveries.filter((x) => x.status === 'APPROVED').length,
            },
            {
              id: 'DELIVERING',
              label: 'Đang giao',
              count: deliveries.filter((x) => x.status === 'DELIVERING').length,
            },
            { id: 'COMPLETED', label: 'Giao thành công', count: deliveryStats.completed },
            {
              id: 'CANCELLED',
              label: 'Đã hủy',
              count: deliveries.filter((x) => x.status === 'CANCELLED').length,
            },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === pill.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── CONTENT BODY ── */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đang tải dữ liệu đơn vận chuyển...</p>
        </div>
      ) : tab === 'transport' ? (
        /* ═════════════════════════════════════════════════════════════════════
           TAB 1: TRANSPORT REQUESTS (CHẶNG TQ - VN)
           ═════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {filteredTransports.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">Không tìm thấy yêu cầu vận chuyển phù hợp</h3>
              <p className="mt-1 text-xs text-slate-400">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            filteredTransports.map((item) => {
              const statusCfg = TRANSPORT_STATUS_MAP[item.status] || {
                label: item.status,
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                border: 'border-slate-200',
                icon: AlertCircle,
              };
              const StatusIcon = statusCfg.icon;
              const hasRefundRequest = item.depositRefundStatus === 'PENDING';

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-slate-300 relative ${
                    hasRefundRequest ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
                  }`}
                >
                  {/* Top Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-blue-700">{item.requestCode}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusCfg.label}</span>
                        </span>
                        {item.shippingMethod === 'EXPRESS' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                            HỎA TỐC
                          </span>
                        )}
                        {item.insurance && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>BẢO HIỂM 100%</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span>Ngày tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                        {item.trackingCodeChina && (
                          <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-bold">
                            Mã TQ: {item.trackingCodeChina}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasRefundRequest && (
                        <button
                          onClick={() => {
                            setRefundModalTransport(item);
                            setAdminNote('');
                            setActionSuccessMsg(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Xử Lý Hoàn Cọc</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenStatusModal(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Cập Nhật &amp; Báo Khách</span>
                      </button>

                      <button
                        onClick={() => setDetailTransport(item)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Chi Tiết</span>
                      </button>
                    </div>
                  </div>

                  {/* Refund Pending Notice Banner */}
                  {hasRefundRequest && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Khách hàng yêu cầu hoàn cọc {formatMoney(item.depositPaidVnd)}:</span>
                        <p className="mt-0.5 text-amber-900 italic">"{item.depositRefundReason || 'Không ghi rõ lý do'}"</p>
                      </div>
                    </div>
                  )}

                  {/* Grid 4 Columns Breakdown */}
                  <div className="mt-4 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    {/* 1. Customer */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Khách Hàng</span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">
                        {item.customer?.fullName || 'N/A'}{' '}
                        {item.customer?.customerCode && (
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                            {item.customer.customerCode}
                          </span>
                        )}
                      </p>
                      <p className="text-slate-600 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.customer?.phone || 'Chưa có SĐT'}</span>
                      </p>
                      <p className="text-slate-500 font-medium truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{item.customer?.email}</span>
                      </p>
                    </div>

                    {/* 2. Goods & Weight */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>Hàng Hóa &amp; Trọng Lượng</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{item.categoryName}</p>
                      <p className="text-slate-600 line-clamp-1 italic">"{item.goodsDescription}"</p>
                      <p className="text-slate-700 font-bold font-mono">
                        {item.quantity || 1} kiện • {Number(item.chargeableWeight || item.weightKg || 0).toFixed(2)} kg
                        {item.lengthCm && item.widthCm && item.heightCm ? (
                          <span className="text-slate-400 font-normal text-[10px] ml-1">
                            ({item.lengthCm}x{item.widthCm}x{item.heightCm}cm)
                          </span>
                        ) : null}
                      </p>
                    </div>

                    {/* 3. Route */}
                    <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] uppercase tracking-wide">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lộ Trình Thu / Nhận</span>
                      </div>
                      <div className="text-slate-700 space-y-1">
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span>Lấy: {item.pickupProvince}, {resolveCountryName(item.pickupCountry)}</span>
                        </p>
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span>Nhận: {item.recipientName} • {item.province}</span>
                        </p>
                      </div>
                    </div>

                    {/* 4. Financials */}
                    <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px] uppercase tracking-wide">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tài Chính &amp; Đặt Cọc</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Cước tạm tính:</span>
                        <span className="font-bold text-slate-900">{formatMoney(item.estimatedTotalVnd)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-700 font-medium">
                          Đã cọc ({item.depositPercentage || 70}%):
                        </span>
                        <span className="font-bold text-indigo-700 font-mono">
                          {formatMoney(item.depositPaidVnd || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                        <span className="text-slate-600 font-bold">Còn lại:</span>
                        <span className="font-bold text-rose-700 font-mono">
                          {formatMoney(Math.max(0, item.estimatedTotalVnd - (item.depositPaidVnd || 0)))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Note display if exists */}
                  {item.adminNote && (
                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-700 flex items-center gap-2">
                      <span className="font-bold text-slate-900 shrink-0">Ghi chú quản trị:</span>
                      <span className="italic truncate">{item.adminNote}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════
           TAB 2: DELIVERY REQUESTS (GIAO HÀNG NỘI ĐỊA VN)
           ═════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {filteredDeliveries.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">Không tìm thấy yêu cầu giao hàng nào</h3>
              <p className="mt-1 text-xs text-slate-400">Thử thay đổi bộ lọc hoặc kiểm tra lại danh sách</p>
            </div>
          ) : (
            filteredDeliveries.map((item) => {
              const statusCfg = DELIVERY_STATUS_MAP[item.status] || {
                label: item.status,
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                border: 'border-slate-200',
                icon: AlertCircle,
              };
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-blue-700">{item.requestCode}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusCfg.label}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                          {item.shippingMethod === 'PICKUP'
                            ? 'Lấy tại kho'
                            : item.shippingMethod === 'EXPRESS'
                            ? 'Giao Hỏa Tốc'
                            : 'Giao Tiêu Chuẩn'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Ngày tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setStatusModalDelivery(item);
                          setNewStatus(item.status);
                          setAdminNote(item.reviewNote || '');
                          setActionSuccessMsg(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Cập Nhật Tiến Độ</span>
                      </button>

                      <button
                        onClick={() => setDetailDelivery(item)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Kiện Hàng</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Columns Delivery Info */}
                  <div className="grid gap-4 text-xs sm:grid-cols-3">
                    {/* Customer */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Người Nhận</span>
                      </div>
                      <p className="font-bold text-slate-900">
                        {item.customer?.fullName || 'N/A'}{' '}
                        {item.customer?.customerCode && (
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                            {item.customer.customerCode}
                          </span>
                        )}
                      </p>
                      <p className="text-slate-600 font-medium">{item.contactPhone || item.customer?.phone}</p>
                    </div>

                    {/* Parcels */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>Danh Sách Kiện ({item.parcels?.length || 0})</span>
                      </div>
                      <p className="font-mono font-bold text-blue-800 truncate">
                        {item.parcels?.map((p) => p.parcelCode).join(', ') || 'Chưa có mã kiện'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Tổng cân nặng:{' '}
                        {item.parcels?.reduce((sum, p) => sum + (p.chargeableWeight || 0), 0).toFixed(2)} kg
                      </p>
                    </div>

                    {/* Address & Fee */}
                    <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px] uppercase tracking-wide">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Địa Chỉ &amp; Cước Phí</span>
                      </div>
                      <p className="text-slate-800 font-medium line-clamp-1">{item.address}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 font-bold">
                        <span className="text-slate-600">Phí giao:</span>
                        <span className="text-emerald-700 font-mono text-sm">{formatMoney(item.feeVnd)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         MODAL 1: TRANSPORT DETAIL FULL MODAL
         ═════════════════════════════════════════════════════════════════════ */}
      {detailTransport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 text-base">{detailTransport.requestCode}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {TRANSPORT_STATUS_MAP[detailTransport.status]?.label || detailTransport.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Chi tiết yêu cầu vận chuyển quốc tế TQ ➔ VN</p>
              </div>

              <button
                onClick={() => setDetailTransport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Content Cards */}
            <div className="space-y-4 text-xs">
              {/* Goods Detail */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Thông Tin Hàng Hóa &amp; Quy Cách</span>
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Phân loại:</span>
                    <p className="font-bold text-slate-800">{detailTransport.categoryName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Số lượng kiện:</span>
                    <p className="font-bold text-slate-800 font-mono">{detailTransport.quantity || 1} kiện</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cân nặng thực tế:</span>
                    <p className="font-bold text-slate-800 font-mono">{detailTransport.weightKg} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cân nặng tính cước:</span>
                    <p className="font-bold text-blue-700 font-mono">{detailTransport.chargeableWeight} kg</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Mô tả chi tiết:</span>
                  <p className="font-medium text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 mt-1 whitespace-pre-line">
                    {detailTransport.goodsDescription}
                  </p>
                </div>
              </div>

              {/* Pickup & Delivery Addresses */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200 space-y-1.5">
                  <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Kho Lấy Hàng (Trung Quốc)</span>
                  </h4>
                  <p className="font-bold text-slate-900">{detailTransport.pickupContactName} • {detailTransport.pickupPhone}</p>
                  <p className="text-slate-700 leading-relaxed">
                    {detailTransport.pickupAddressLine}, {detailTransport.pickupWard}, {detailTransport.pickupDistrict}, {detailTransport.pickupProvince}, {resolveCountryName(detailTransport.pickupCountry)}
                  </p>
                  {detailTransport.pickupNote && (
                    <p className="text-slate-500 italic text-[11px]">Ghi chú: {detailTransport.pickupNote}</p>
                  )}
                </div>

                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200 space-y-1.5">
                  <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Địa Chỉ Nhận (Việt Nam)</span>
                  </h4>
                  <p className="font-bold text-slate-900">{detailTransport.recipientName} • {detailTransport.recipientPhone}</p>
                  {detailTransport.recipientEmail && <p className="text-slate-500">{detailTransport.recipientEmail}</p>}
                  <p className="text-slate-700 leading-relaxed">
                    {detailTransport.addressLine}, {detailTransport.ward}, {detailTransport.district}, {detailTransport.province}, {resolveCountryName(detailTransport.country)}
                  </p>
                  {detailTransport.deliveryNote && (
                    <p className="text-slate-500 italic text-[11px]">Ghi chú: {detailTransport.deliveryNote}</p>
                  )}
                </div>
              </div>

              {/* Pickup Image if exists */}
              {detailTransport.pickupImage && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide block">
                    Ảnh chụp địa điểm lấy hàng tại Trung Quốc:
                  </span>
                  <div className="max-h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5">
                    <img
                      src={detailTransport.pickupImage}
                      alt="Ảnh lấy hàng"
                      className="w-full h-auto object-contain max-h-56"
                    />
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 space-y-2">
                <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wide flex items-center justify-between">
                  <span>Hạch Toán Tài Chính</span>
                  <span className="font-mono text-sm">{formatMoney(detailTransport.estimatedTotalVnd)}</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-indigo-200">
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block">Tổng Tạm Tính</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {formatMoney(detailTransport.estimatedTotalVnd)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-600 block">Đã Cọc ({detailTransport.depositPercentage || 70}%)</span>
                    <span className="font-bold text-indigo-700 font-mono text-xs">
                      {formatMoney(detailTransport.depositPaidVnd || 0)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-rose-600 block">Số Tiền Còn Lại</span>
                    <span className="font-bold text-rose-700 font-mono text-xs">
                      {formatMoney(Math.max(0, detailTransport.estimatedTotalVnd - (detailTransport.depositPaidVnd || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailTransport(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailTransport;
                  setDetailTransport(null);
                  handleOpenStatusModal(item);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Cập Nhật Trạng Thái &amp; Ghi Chú</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         MODAL 2: UPDATE TRANSPORT STATUS & ADMIN NOTE & TRACKING CODE
         ═════════════════════════════════════════════════════════════════════ */}
      {statusModalTransport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cập Nhật Trạng Thái Vận Chuyển</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Mã yêu cầu: <span className="font-mono font-bold text-blue-700">{statusModalTransport.requestCode}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStatusModalTransport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{actionSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn Trạng Thái Mới <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  <option value="PENDING">Chờ xử lý / Chờ cọc (PENDING)</option>
                  <option value="DEPOSITED">Đã đặt cọc (DEPOSITED)</option>
                  <option value="APPROVED">Đã duyệt yêu cầu (APPROVED)</option>
                  <option value="PICKING_UP">Đang lấy hàng tại kho TQ (PICKING_UP)</option>
                  <option value="IN_TRANSIT">Hàng đang vận chuyển TQ ➔ VN (IN_TRANSIT)</option>
                  <option value="COMPLETED">Đã hoàn thành vận chuyển (COMPLETED)</option>
                  <option value="CANCELLED">Hủy yêu cầu vận chuyển (CANCELLED)</option>
                </select>
              </div>

              {/* China Tracking Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Mã Vận Đơn Trung Quốc (Nếu có)
                </label>
                <input
                  type="text"
                  value={trackingCodeChina}
                  onChange={(e) => setTrackingCodeChina(e.target.value)}
                  placeholder="Ví dụ: SF1839201928, YT7382910..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Admin Note / Message to Customer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Ghi Chú Quản Trị &amp; Phản Hồi Khách Hàng
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập thông tin phản hồi (Khách hàng sẽ nhận được thông báo qua app và email)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalTransport(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleUpdateTransportStatus}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Lưu &amp; Báo Khách</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         MODAL 3: REFUND DEPOSIT APPROVAL MODAL
         ═════════════════════════════════════════════════════════════════════ */}
      {refundModalTransport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Xử Lý Yêu Cầu Hoàn Cọc</h3>
                  <p className="text-xs text-slate-500 font-medium">Mã yêu cầu: {refundModalTransport.requestCode}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRefundModalTransport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{actionSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-bold">Khách hàng yêu cầu:</span>
                  <span className="font-bold text-slate-900">{refundModalTransport.customer?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-bold">Số tiền cọc đã nhận:</span>
                  <span className="font-bold text-indigo-700 font-mono text-sm">
                    {formatMoney(refundModalTransport.depositPaidVnd || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-amber-200/80">
                  <span className="text-amber-900 font-bold block mb-1">Lý do khách hàng đưa ra:</span>
                  <p className="italic text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                    "{refundModalTransport.depositRefundReason || 'Không ghi rõ lý do'}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú phản hồi của Ban Quản Trị
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập lý do duyệt hoàn tiền hoặc lý do từ chối gửi tới khách hàng..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProcessRefund(false)}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Từ Chối Hoàn Cọc
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProcessRefund(true)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang Xử Lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt Hoàn Tiền Vào Ví</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         MODAL 4: DELIVERY DETAIL MODAL
         ═════════════════════════════════════════════════════════════════════ */}
      {detailDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Chi Tiết Yêu Cầu Giao Hàng Nội Địa</h3>
                <p className="text-xs text-slate-500 font-mono font-bold text-blue-700">{detailDelivery.requestCode}</p>
              </div>

              <button
                type="button"
                onClick={() => setDetailDelivery(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500">Người nhận &amp; SĐT:</span>
                <p className="font-bold text-slate-900 text-sm">
                  {detailDelivery.customer?.fullName} • {detailDelivery.contactPhone}
                </p>
                <span className="text-slate-500 block pt-1">Địa chỉ giao tận nơi:</span>
                <p className="font-semibold text-slate-800">{detailDelivery.address}</p>
              </div>

              <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-200 space-y-2">
                <span className="font-bold text-blue-900 block uppercase tracking-wide">
                  Danh Sách {detailDelivery.parcels?.length || 0} Kiện Hàng:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detailDelivery.parcels?.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2 bg-white rounded-xl border border-blue-100 flex items-center justify-between"
                    >
                      <span className="font-mono font-bold text-blue-800">{p.parcelCode}</span>
                      <span className="text-slate-600 font-mono">{Number(p.chargeableWeight || 0).toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 font-bold">
                <span className="text-emerald-900">Cước phí giao hàng:</span>
                <span className="text-emerald-700 font-mono text-base">{formatMoney(detailDelivery.feeVnd)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailDelivery(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         MODAL 5: UPDATE DELIVERY STATUS & REVIEW NOTE
         ═════════════════════════════════════════════════════════════════════ */}
      {statusModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cập Nhật Tiến Độ Giao Hàng</h3>
                <p className="text-xs text-slate-500 font-mono font-bold text-blue-700">{statusModalDelivery.requestCode}</p>
              </div>

              <button
                type="button"
                onClick={() => setStatusModalDelivery(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{actionSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn Trạng Thái Mới <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  <option value="PENDING">Chờ duyệt giao hàng (PENDING)</option>
                  <option value="APPROVED">Đã duyệt xuất kho giao (APPROVED)</option>
                  <option value="DELIVERING">Đang trên đường giao tận nơi (DELIVERING)</option>
                  <option value="COMPLETED">Giao hàng thành công (COMPLETED)</option>
                  <option value="CANCELLED">Hủy yêu cầu giao (CANCELLED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Ghi Chú Giao Hàng / Mã Vận Đơn Nội Địa
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ví dụ: Đã bàn giao cho shipper Viettel Post mã 8493021..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalDelivery(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleUpdateDeliveryStatus}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Lưu Trạng Thái</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
