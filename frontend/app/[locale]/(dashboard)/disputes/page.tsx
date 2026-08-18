'use client';

import { use, useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  Clock,
  Search,
  Truck,
  ShoppingBag,
  Wallet,
  Award,
  HelpCircle,
  XCircle,
  Filter,
  Package,
  Sparkles,
  Headphones,
  Check,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import { notificationStore } from '@/lib/notification-store';

export interface DisputeItem {
  id: string;
  disputeCode: string;
  category: string;
  parentCategory: string;
  typeLabel: string;
  title: string;
  parcelCode?: string;
  description: string;
  status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
}

export interface DisputeCategoryOption {
  value: string;
  label: string;
  icon: any;
  hint: string;
}

export interface DisputeCategoryGroup {
  id: string;
  name: string;
  icon: any;
  color: string;
  codeLabel?: string;
  placeholderCode?: string;
  items: DisputeCategoryOption[];
}

export const DISPUTE_CATEGORY_GROUPS: DisputeCategoryGroup[] = [
  {
    id: 'SHIPPING',
    name: 'Vận Chuyển & Kho Bãi',
    icon: Truck,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    codeLabel: 'Mã Kiện Hàng / Mã Vận Đơn (Nếu có)',
    placeholderCode: 'Ví dụ: PKG-8809 hoặc 7583920192',
    items: [
      { value: 'SHIPPING_DELAY', label: 'Hàng về chậm so với cam kết', icon: Clock, hint: 'Quá thời hạn ước tính nhưng kiện hàng chưa đến kho đích' },
      { value: 'SHIPPING_DAMAGED', label: 'Hàng hóa bị móp méo, hư hại', icon: AlertCircle, hint: 'Bao bì hoặc sản phẩm có dấu hiệu rách vỡ, ướt nước' },
      { value: 'SHIPPING_LOST', label: 'Thất lạc kiện hàng / Mất hàng', icon: XCircle, hint: 'Mã vận đơn ngừng cập nhật hoặc không tìm thấy tại kho' },
      { value: 'SHIPPING_WRONG_WEIGHT', label: 'Sai lệch cân nặng / Thể tích tính cước', icon: Package, hint: 'Cân đo lại tại kho đích có chênh lệch so với phiếu xuất' },
    ],
  },
  {
    id: 'PURCHASE',
    name: 'Đơn Hàng Mua Hộ TMĐT',
    icon: ShoppingBag,
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    codeLabel: 'Mã Đơn Hàng Mua Hộ (Nếu có)',
    placeholderCode: 'Ví dụ: ORD-2026-8809',
    items: [
      { value: 'PURCHASE_WRONG_ITEM', label: 'Shop TQ giao sai mẫu / Màu / Size', icon: AlertCircle, hint: 'Sản phẩm nhận được không đúng như link đặt ban đầu' },
      { value: 'PURCHASE_MISSING_QTY', label: 'Thiếu số lượng sản phẩm', icon: Package, hint: 'Shop phát thiếu số lượng kiện hoặc số lượng cái' },
      { value: 'PURCHASE_SELLER_DELAY', label: 'Shop TQ chậm phát hàng / Không gửi', icon: Clock, hint: 'Đã thanh toán nhưng sau 48h shop vẫn chưa điền mã vận đơn' },
      { value: 'PURCHASE_DEFECTIVE', label: 'Sản phẩm lỗi kỹ thuật / Không hoạt động', icon: XCircle, hint: 'Hàng điện tử hoặc máy móc bị lỗi ngay khi mở hộp' },
    ],
  },
  {
    id: 'FINANCE',
    name: 'Tài Chính & Nạp / Rút Ví',
    icon: Wallet,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    codeLabel: 'Mã Giao Dịch / STK Ngân Hàng',
    placeholderCode: 'Ví dụ: PAY-1002 hoặc STK MBBank',
    items: [
      { value: 'FINANCE_TOPUP_DELAY', label: 'Nạp tiền ví chưa thấy cộng số dư', icon: Clock, hint: 'Đã quét QR chuyển khoản ngân hàng thành công nhưng ví chưa lên tiền' },
      { value: 'FINANCE_WITHDRAW_DELAY', label: 'Yêu cầu rút tiền chưa nhận được', icon: Wallet, hint: 'Yêu cầu rút tiền về tài khoản ngân hàng quá thời hạn quy định' },
      { value: 'FINANCE_RATE_ISSUE', label: 'Thắc mắc tỷ giá hoặc phụ phí', icon: HelpCircle, hint: 'Cần giải trình về chênh lệch tỷ giá NDT hoặc phụ phí bảo hiểm/đóng gỗ' },
    ],
  },
  {
    id: 'AFFILIATE',
    name: 'Đối Tác Tiếp Thị & Thưởng',
    icon: Award,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    codeLabel: 'Mã Giới Thiệu / Mã Khách Hàng',
    placeholderCode: 'Ví dụ: OCV8888 hoặc Mã Đơn',
    items: [
      { value: 'AFFILIATE_COMMISSION_MISSING', label: 'Chưa ghi nhận hoa hồng đơn hàng', icon: Award, hint: 'Khách hàng cấp dưới đã hoàn tất đơn nhưng hoa hồng chưa cộng vào ví' },
      { value: 'AFFILIATE_BONUS_LOCKED', label: 'Thắc mắc điều kiện mở khóa 250k', icon: Sparkles, hint: 'Cần hỗ trợ về số lượng khách hàng hợp lệ để rút thưởng chào mừng' },
    ],
  },
];

export default function DisputesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [parentCategoryFilter, setParentCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form State
  const [parentCategory, setParentCategory] = useState<string>('SHIPPING');
  const [subCategory, setSubCategory] = useState<string>('SHIPPING_DELAY');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const [disputes, setDisputes] = useState<DisputeItem[]>([]);

  // Get active parent group
  const activeParentGroup = DISPUTE_CATEGORY_GROUPS.find((g) => g.id === parentCategory) || DISPUTE_CATEGORY_GROUPS[0];
  const activeSubItem = activeParentGroup.items.find((i) => i.value === subCategory) || activeParentGroup.items[0];

  const findSubItemInfo = (val: string) => {
    for (const g of DISPUTE_CATEGORY_GROUPS) {
      const match = g.items.find((item) => item.value === val);
      if (match) return { group: g, item: match };
    }
    return null;
  };

  const fetchDisputes = async () => {
    try {
      const response = await apiFetch('/operations/disputes');
      if (!response.ok) throw new Error('Không thể tải khiếu nại');
      const json = await response.json();

      setDisputes(
        json.data.map((item: any) => {
          const info = findSubItemInfo(item.category);
          const typeLabel = info ? `${info.group.name} - ${info.item.label}` : item.category;
          const parentCategory = info ? info.group.id : 'OTHER';

          let statusLabel = 'Chờ Tiếp Nhận';
          let statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
          if (item.status === 'RESOLVED') {
            statusLabel = 'Đã Giải Quyết';
            statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          } else if (item.status === 'PROCESSING') {
            statusLabel = 'Đang Xử Lý';
            statusClass = 'bg-sky-50 text-sky-700 border-sky-200';
          } else if (item.status === 'REJECTED') {
            statusLabel = 'Từ Chối';
            statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
          }

          return {
            id: item.id,
            disputeCode: item.disputeCode,
            category: item.category,
            parentCategory,
            typeLabel,
            title: item.title,
            parcelCode: item.parcelId || undefined,
            description: item.description,
            status: item.status,
            statusLabel,
            statusClass,
            createdAt: new Date(item.createdAt).toLocaleString('vi-VN'),
            updatedAt: new Date(item.updatedAt).toLocaleString('vi-VN'),
            adminReply: item.resolution,
          };
        })
      );
    } catch (err) {
      console.error('Lỗi khi tải khiếu nại:', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleParentCategoryChange = (newParent: string) => {
    setParentCategory(newParent);
    const group = DISPUTE_CATEGORY_GROUPS.find((g) => g.id === newParent) || DISPUTE_CATEGORY_GROUPS[0];
    if (group.items.length > 0) {
      setSubCategory(group.items[0].value);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Vui lòng nhập nội dung mô tả chi tiết vấn đề.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItem = activeParentGroup.items.find((i) => i.value === subCategory) || activeParentGroup.items[0];
      const finalTitle = customTitle.trim() || `[${activeParentGroup.name}] ${selectedItem.label}`;

      const response = await apiFetch('/operations/disputes', {
        method: 'POST',
        body: JSON.stringify({
          category: subCategory,
          parcelCode: referenceCode.trim() || undefined,
          title: finalTitle,
          description: description.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Không thể tạo khiếu nại');
      }

      setModalOpen(false);
      setReferenceCode('');
      setCustomTitle('');
      setDescription('');
      fetchDisputes();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tạo khiếu nại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    // Search
    const term = search.toLowerCase().trim();
    if (term) {
      const matchCode = d.disputeCode?.toLowerCase().includes(term);
      const matchTitle = d.title?.toLowerCase().includes(term);
      const matchDesc = d.description?.toLowerCase().includes(term);
      const matchParcel = d.parcelCode?.toLowerCase().includes(term);
      if (!matchCode && !matchTitle && !matchDesc && !matchParcel) return false;
    }

    // Parent Category Filter
    if (parentCategoryFilter !== 'ALL' && d.parentCategory !== parentCategoryFilter) return false;

    // Status Filter
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;

    return true;
  });

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === 'OPEN').length,
    processing: disputes.filter((d) => d.status === 'PROCESSING').length,
    resolved: disputes.filter((d) => d.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-200 pb-12">
      {/* ── TOP HEADER CARD ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Trung Tâm Hỗ Trợ &amp; Khiếu Nại Đơn Hàng</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Kênh liên hệ trực tiếp và tiếp nhận xử lý khiếu nại về Vận chuyển, Đơn mua hộ, Tài chính hoặc Đối tác.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khiếu Nại Mới</span>
        </button>
      </div>

      {/* ── KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'ALL' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Tổng Yêu Cầu</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'OPEN' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase block">Chờ Tiếp Nhận</span>
          <span className="text-xl font-bold text-amber-600 font-mono mt-0.5 block">{stats.open}</span>
        </div>

        <div
          onClick={() => setStatusFilter('PROCESSING')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'PROCESSING' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-sky-700 uppercase block">Đang Xử Lý</span>
          <span className="text-xl font-bold text-sky-600 font-mono mt-0.5 block">{stats.processing}</span>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'RESOLVED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Đã Giải Quyết</span>
          <span className="text-xl font-bold text-emerald-600 font-mono mt-0.5 block">{stats.resolved}</span>
        </div>
      </div>

      {/* ── SECTION 3: SEARCH & MULTI-LEVEL FILTER TOOLBAR ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã DSP-..., mã kiện, mã đơn, nội dung..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          {/* Parent Category Filter Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={parentCategoryFilter}
              onChange={(e) => setParentCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Nhóm Khiếu Nại</option>
              <option value="SHIPPING">Vận Chuyển &amp; Giao Nhận</option>
              <option value="ORDER">Đơn Hàng Mua Hộ (1688 / Taobao)</option>
              <option value="FINANCE">Tài Chính, Ví Tiền &amp; Nạp Rút</option>
              <option value="AFFILIATE">Tiếp Thị Liên Kết (Affiliate)</option>
              <option value="OTHER">Dịch Vụ &amp; Khác</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="OPEN">Chờ Tiếp Nhận</option>
              <option value="PROCESSING">Đang Xử Lý</option>
              <option value="RESOLVED">Đã Giải Quyết</option>
              <option value="REJECTED">Bị Từ Chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: DISPUTES LIST ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-medium">Đang tải danh sách khiếu nại...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có yêu cầu khiếu nại nào</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Nếu phát sinh sự cố về Vận chuyển, Đơn mua hộ hoặc Ví tiền, bạn có thể bấm nút &quot;Tạo Khiếu Nại Mới&quot; bên trên để Ban Quản Trị hỗ trợ giải quyết ngay.
              </p>
            </div>
          </div>
        ) : (
          filteredDisputes.map((d) => {
            const info = findSubItemInfo(d.category);
            const GroupIcon = info ? info.group.icon : AlertCircle;

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 hover:border-slate-300 p-5 sm:p-6 space-y-3.5 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-rose-600 text-xs sm:text-sm bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      {d.disputeCode}
                    </span>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${d.statusClass}`}>
                      {d.statusLabel}
                    </span>

                    {info && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        <GroupIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{info.group.name}</span>
                      </span>
                    )}

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                      {info ? info.item.label : d.category}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">{d.createdAt}</span>
                </div>

                {/* Body Row */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">{d.title}</h3>

                  {d.parcelCode && (
                    <p className="text-xs font-bold text-slate-600">
                      Mã Tham Chiếu / Kiện Hàng: <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">{d.parcelCode}</span>
                    </p>
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                    {d.description}
                  </p>
                </div>

                {/* Admin Reply Section */}
                {d.adminReply && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Phản hồi từ OrderChinaViet Admin:</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line">{d.adminReply}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE DISPUTE MODAL (TWO-TIER DROPDOWN) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tạo Yêu Cầu Khiếu Nại</h3>
                  <p className="text-xs text-slate-500 font-medium">Chọn nhóm vấn đề và nhập chi tiết để CSKH xử lý</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDispute} className="space-y-4">
              {/* 1. Parent Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Nhóm Vấn Đề Khiếu Nại <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={parentCategory}
                  onChange={(e) => handleParentCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                >
                  {DISPUTE_CATEGORY_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Sub-Item / Child Reason Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Lý Do / Sự Cố Cụ Thể <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                >
                  {activeParentGroup.items.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {activeSubItem?.hint && (
                  <p className="text-[11px] text-slate-500 mt-1 italic pl-1">
                    Ghi chú: {activeSubItem.hint}
                  </p>
                )}
              </div>

              {/* 3. Reference Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. {activeParentGroup.codeLabel}
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder={activeParentGroup.placeholderCode}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              {/* 4. Custom Title (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Tiêu Đề Khiếu Nại (Tùy Chọn)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`Mặc định: [${activeParentGroup.name}] ${activeSubItem.label}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              {/* 5. Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. Mô Tả Chi Tiết Sự Cố &amp; Bằng Chứng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể sự việc: số lượng hàng bị ảnh hưởng, tình trạng bao bì khi nhận, mã bill chuyển khoản, thời gian phát sinh sự cố..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi Khiếu Nại Ngay</span>
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
