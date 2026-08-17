'use client';

import { use, useState, useEffect } from 'react';
import {
  Headphones,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  Send,
  Phone,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  Copy,
  Check,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';

interface SupportTicket {
  id: string;
  disputeCode: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    customerCode: string;
    email: string;
    phone?: string;
    roleCode?: string;
  };
}

export default function AdminSupportPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Resolution Modal State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'PROCESSING' | 'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/operations/disputes');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTickets(json.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu cầu hỗ trợ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openResolutionModal = (ticket: SupportTicket, defaultStatus: 'PROCESSING' | 'RESOLVED' | 'REJECTED' = 'RESOLVED') => {
    setSelectedTicket(ticket);
    setResolutionText(ticket.resolution || '');
    setSelectedStatus(defaultStatus);
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdating(true);
    setErrorToast('');
    try {
      const res = await apiFetch(`/operations/disputes/${selectedTicket.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: selectedStatus,
          resolution: resolutionText.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Không thể cập nhật trạng thái yêu cầu');
      }

      setSuccessToast(`Đã cập nhật yêu cầu ${selectedTicket.disputeCode} thành công!`);
      setTimeout(() => setSuccessToast(''), 4000);
      setSelectedTicket(null);
      loadTickets();
    } catch (err: any) {
      setErrorToast(err.message || 'Lỗi khi cập nhật yêu cầu');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchCode = t.disputeCode?.toLowerCase().includes(term);
      const matchTitle = t.title?.toLowerCase().includes(term);
      const matchDesc = t.description?.toLowerCase().includes(term);
      const matchUserName = t.user?.fullName?.toLowerCase().includes(term);
      const matchUserCode = t.user?.customerCode?.toLowerCase().includes(term);
      const matchEmail = t.user?.email?.toLowerCase().includes(term);
      const matchPhone = t.user?.phone?.toLowerCase().includes(term);
      if (!matchCode && !matchTitle && !matchDesc && !matchUserName && !matchUserCode && !matchEmail && !matchPhone) {
        return false;
      }
    }

    // Status
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

    // Category
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

    // Role
    if (roleFilter !== 'ALL') {
      const userRole = t.user?.roleCode || 'CUSTOMER';
      if (roleFilter === 'AFFILIATE' && userRole !== 'AFFILIATE') return false;
      if (roleFilter === 'CUSTOMER' && userRole === 'AFFILIATE') return false;
    }

    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    processing: tickets.filter((t) => t.status === 'PROCESSING').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    rejected: tickets.filter((t) => t.status === 'REJECTED').length,
  };

  const categoryLabels: Record<string, string> = {
    // Hierarchical Categories
    SHIPPING_DELAY: 'Vận chuyển chậm trễ',
    SHIPPING_DAMAGED: 'Hàng hư hỏng / Bể vỡ',
    SHIPPING_LOST: 'Thất lạc kiện hàng',
    SHIPPING_WRONG_WEIGHT: 'Sai lệch cân nặng / Thể tích',
    SHIPPING_WRONG_ADDRESS: 'Giao nhầm địa chỉ',
    ORDER_WRONG_ITEM: 'Giao sai mẫu / Màu / Size',
    ORDER_MISSING_QUANTITY: 'Shop giao thiếu số lượng',
    ORDER_SELLER_NOT_SHIPPED: 'Shop TQ không phát hàng',
    ORDER_PRICE_DISPUTE: 'Sai lệch giá mua hộ',
    ORDER_RETURN_REFUND: 'Yêu cầu đổi trả & Hoàn tiền',
    FINANCE_DEPOSIT_NOT_CREDITED: 'Nạp tiền chưa cộng ví',
    FINANCE_WITHDRAWAL_DELAY: 'Rút tiền chậm trễ',
    FINANCE_EXCHANGE_RATE: 'Thắc mắc tỷ giá / Đổi tệ',
    FINANCE_WRONG_DEDUCTION: 'Bị trừ tiền không rõ lý do',
    AFFILIATE_MISSING_COMMISSION: 'Thiếu hoa hồng đối tác',
    AFFILIATE_LINK_TRACKING: 'Lỗi link / QR đối tác',
    AFFILIATE_BONUS_UNLOCK: 'Mở khóa thưởng 250k',
    AFFILIATE_SALARY_ATTENDANCE: 'Chấm công & Lương cứng',
    ACCOUNT_LOGIN_ISSUE: 'Lỗi tài khoản / Đăng nhập',
    CUSTOMER_SERVICE_FEEDBACK: 'Góp ý CSKH & Kho bãi',
    OTHER_INQUIRY: 'Yêu cầu khác',
    // Legacy / Generic Categories
    COMMISSION: 'Hoa Hồng & Rút Tiền',
    TRACKING: 'Link & Mã QR',
    REFERRAL: 'Khách Tuyến Dưới',
    SALARY: 'Lương & Chấm Công',
    TECHNICAL: 'Lỗi Kỹ Thuật',
    PARCEL: 'Kiện Hàng / Vận Chuyển',
    OTHER: 'Thắc Mắc Khác',
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã Giải Quyết</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            <span>Đang Xử Lý</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Từ Chối</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Chờ Tiếp Nhận</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Quản Lý Yêu Cầu Hỗ Trợ &amp; Khiếu Nại</span>
                <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  Helpdesk CSKH
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tiếp nhận, xử lý và phản hồi khiếu nại, thắc mắc hoa hồng từ Khách hàng và Đối tác Tiếp thị liên kết.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadTickets}
            disabled={loading}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* ── SUCCESS / ERROR TOASTS ── */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── KPI STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ALL' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Tổng Yêu Cầu</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'OPEN' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase block">Chờ Tiếp Nhận</span>
          <span className="text-xl font-bold text-amber-600 font-mono mt-1 block">{stats.open}</span>
        </div>

        <div
          onClick={() => setStatusFilter('PROCESSING')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'PROCESSING' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-sky-700 uppercase block">Đang Xử Lý</span>
          <span className="text-xl font-bold text-sky-600 font-mono mt-1 block">{stats.processing}</span>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'RESOLVED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Đã Giải Quyết</span>
          <span className="text-xl font-bold text-emerald-600 font-mono mt-1 block">{stats.resolved}</span>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'REJECTED' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-700 uppercase block">Đã Từ Chối</span>
          <span className="text-xl font-bold text-rose-600 font-mono mt-1 block">{stats.rejected}</span>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã DSP, tên khách, SĐT, email, mã KH..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="OPEN">Chờ Tiếp Nhận</option>
              <option value="PROCESSING">Đang Xử Lý</option>
              <option value="RESOLVED">Đã Giải Quyết</option>
              <option value="REJECTED">Đã Từ Chối</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Danh mục</option>
              <option value="COMMISSION">Hoa Hồng &amp; Rút Tiền</option>
              <option value="TRACKING">Link &amp; Mã QR</option>
              <option value="REFERRAL">Khách Tuyến Dưới</option>
              <option value="SALARY">Lương &amp; Chấm Công</option>
              <option value="TECHNICAL">Lỗi Kỹ Thuật</option>
              <option value="PARCEL">Kiện Hàng / Vận Chuyển</option>
              <option value="OTHER">Thắc Mắc Khác</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Đối tượng</option>
              <option value="AFFILIATE">Đối Tác Affiliate</option>
              <option value="CUSTOMER">Khách Hàng Thường</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── TICKETS LIST ── */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-medium">Đang tải danh sách yêu cầu hỗ trợ...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400 space-y-3">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy yêu cầu hỗ trợ nào</p>
            <p className="text-slate-500">Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa tra cứu.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isAffiliate = ticket.user?.roleCode === 'AFFILIATE';
            return (
              <div
                key={ticket.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header Row: Code, Timestamp, Status & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ticket.disputeCode}
                    </span>

                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {categoryLabels[ticket.category] || ticket.category}
                    </span>

                    {isAffiliate ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Đối Tác Affiliate</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Khách Hàng</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {statusBadge(ticket.status)}
                    <button
                      type="button"
                      onClick={() => openResolutionModal(ticket, ticket.status === 'OPEN' ? 'PROCESSING' : 'RESOLVED')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Xử Lý &amp; Phản Hồi</span>
                    </button>
                  </div>
                </div>

                {/* Sender Information & Title */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Sender Contact Box (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <User className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">{ticket.user?.fullName || 'Khách hàng ẩn danh'}</span>
                    </div>

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mã định danh:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {ticket.user?.customerCode || 'N/A'}
                        </span>
                      </div>

                      {ticket.user?.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Số điện thoại:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-800">{ticket.user.phone}</span>
                            <a
                              href={`tel:${ticket.user.phone}`}
                              className="text-indigo-600 hover:underline"
                              title="Gọi điện"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {ticket.user?.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-mono text-slate-800 truncate max-w-[140px]" title={ticket.user.email}>
                            {ticket.user.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Ticket Content & Resolution (8 cols) */}
                  <div className="lg:col-span-8 space-y-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ticket.title}</h3>
                      <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Resolution Note if any */}
                    {ticket.resolution && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Nội Dung Đã Phản Hồi Cho Người Gửi:</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{ticket.resolution}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── RESOLUTION MODAL ── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Xử Lý &amp; Phản Hồi Yêu Cầu</h3>
                  <span className="text-[11px] font-mono text-slate-400">{selectedTicket.disputeCode}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorToast && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorToast}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cập Nhật Trạng Thái Yêu Cầu
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="PROCESSING">Đang Xử Lý (Processing)</option>
                  <option value="RESOLVED">Đã Giải Quyết (Resolved)</option>
                  <option value="REJECTED">Từ Chối Yêu Cầu (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội Dung Phản Hồi Gửi Cho Khách Hàng / Đối Tác
                </label>
                <textarea
                  rows={4}
                  required={selectedStatus === 'RESOLVED' || selectedStatus === 'REJECTED'}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Nhập nội dung giải thích, kết quả kiểm tra hoa hồng hoặc hướng giải quyết để hệ thống gửi thông báo cho khách..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Khi lưu, hệ thống sẽ tự động gửi email &amp; thông báo In-app tới tài khoản của người gửi.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isUpdating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Lưu &amp; Gửi Phản Hồi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
