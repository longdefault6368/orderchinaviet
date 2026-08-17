'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PackageCheck,
  Truck,
  Plus,
  ShieldCheck,
  X,
  Filter,
  User,
  Phone,
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import { orderStore, OrderItem } from '@/lib/order-store';
import { settingsStore } from '@/lib/settings-store';

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Sorting
  type SortableColumn = 'id' | 'customerName' | 'platform' | 'productName' | 'quantity' | 'totalRmb' | 'totalVnd' | 'createdAt';
  const [sortColumn, setSortColumn] = useState<SortableColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [detailModalOrder, setDetailModalOrder] = useState<OrderItem | null>(null);
  const [editModalOrder, setEditModalOrder] = useState<OrderItem | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<OrderItem | null>(null);

  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerCode: '',
    productName: '',
    quantity: 1,
    priceRmb: 50,
    attributes: '',
    chinaTrackingCode: '',
    vnTrackingCode: '',
    warehouse: 'Kho Quảng Châu ➔ Kho TP.HCM',
    shippingMethod: 'Đường bộ chính ngạch',
    estimatedDelivery: '3 - 5 ngày',
    note: '',
  });

  const [newStatus, setNewStatus] = useState<string>('PENDING');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const loadLatestOrders = async () => {
    const list = await orderStore.fetchOrdersFromApi(searchQuery, activeTab);
    setOrders(list);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchApiOrders = async () => {
      setLoading(true);
      const list = await orderStore.fetchOrdersFromApi(searchQuery, activeTab);
      if (isMounted) {
        setOrders(list);
        setLoading(false);
      }
    };

    fetchApiOrders();

    const handleOrdersUpdate = () => {
      loadLatestOrders();
    };

    window.addEventListener('orderchinaviet_orders_updated', handleOrdersUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('orderchinaviet_orders_updated', handleOrdersUpdate);
    };
  }, [searchQuery, activeTab]);

  const matchStatus = (orderStatus: string, tabKey: string): boolean => {
    if (tabKey === 'ALL') return true;
    const st = (orderStatus || '').toUpperCase();
    if (tabKey === 'PENDING') return st === 'PENDING' || st === 'CREATED';
    if (tabKey === 'DEPOSITED') return st === 'DEPOSITED' || st === 'RECEIVED';
    if (tabKey === 'PURCHASING') return st === 'PURCHASING' || st === 'BUYING';
    if (tabKey === 'PURCHASED') return st === 'PURCHASED' || st === 'RECEIVED_CHINA';
    if (tabKey === 'COMPLETED') return st === 'COMPLETED' || st === 'DELIVERED';
    if (tabKey === 'CANCELLED') return st === 'CANCELLED';
    return st === tabKey;
  };

  const getStatusCount = (tabKey: string): number => {
    if (tabKey === 'ALL') return orders.length;
    return orders.filter((ord) => matchStatus(ord.status, tabKey)).length;
  };

  // Filtered & Sorted orders
  const filteredOrders = orders.filter((ord) => {
    if (!matchStatus(ord.status, activeTab)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = ord.id.toLowerCase().includes(q);
      const matchName = ord.productName.toLowerCase().includes(q);
      const matchCustomer = (ord.customerName || '').toLowerCase().includes(q);
      const matchPhone = (ord.customerPhone || '').toLowerCase().includes(q);
      const matchCode = (ord.customerCode || '').toLowerCase().includes(q);
      const matchTrack = (ord.chinaTrackingCode || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchCustomer && !matchPhone && !matchCode && !matchTrack) return false;
    }
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal: any = a[sortColumn] || '';
    let bVal: any = b[sortColumn] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + pageSize);

  const handleSort = (col: SortableColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Selection handlers
  const isAllCurrentPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id));

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = paginatedOrders.map(o => o.id);
      setSelectedOrderIds(selectedOrderIds.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedOrders.map(o => o.id);
      setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...pageIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Admin Single Order Handlers
  const handleOpenEditModal = (ord: OrderItem) => {
    setEditModalOrder(ord);
    const priceRmb = ord.quantity > 0 ? ord.totalRmb / ord.quantity : 50;
    setEditForm({
      customerName: ord.customerName || 'Nguyễn Văn A',
      customerPhone: ord.customerPhone || '0909 123 456',
      customerCode: ord.customerCode || 'OCV_MEMBER',
      productName: ord.productName,
      quantity: ord.quantity,
      priceRmb: Math.round(priceRmb * 100) / 100,
      attributes: ord.attributes || '',
      chinaTrackingCode: ord.chinaTrackingCode || '',
      vnTrackingCode: ord.vnTrackingCode || '',
      warehouse: ord.warehouse || 'Kho Quảng Châu ➔ Kho TP.HCM',
      shippingMethod: ord.shippingMethod || 'Đường bộ chính ngạch',
      estimatedDelivery: ord.estimatedDelivery || '3 - 5 ngày',
      note: ord.note || '',
    });
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrder) return;
    const newTotalRmb = editForm.quantity * editForm.priceRmb;
    orderStore.updateOrder(editModalOrder.id, {
      customerName: editForm.customerName,
      customerPhone: editForm.customerPhone,
      customerCode: editForm.customerCode,
      productName: editForm.productName,
      quantity: editForm.quantity,
      totalRmb: newTotalRmb,
      attributes: editForm.attributes,
      chinaTrackingCode: editForm.chinaTrackingCode,
      vnTrackingCode: editForm.vnTrackingCode,
      warehouse: editForm.warehouse,
      shippingMethod: editForm.shippingMethod,
      estimatedDelivery: editForm.estimatedDelivery,
      note: editForm.note,
      updatedAt: new Date().toLocaleString('vi-VN'),
    });
    loadLatestOrders();
    setEditModalOrder(null);
  };

  const handleOpenStatusModal = (ord: OrderItem) => {
    setStatusModalOrder(ord);
    setNewStatus(ord.status);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOrder) return;

    let label = 'Chờ duyệt cọc';
    let css = 'bg-amber-50 text-amber-700 border-amber-200';

    switch (newStatus) {
      case 'DEPOSITED':
        label = 'Đã cọc - Đang mua';
        css = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'PURCHASED':
        label = 'Đã mua - Vào kho TQ';
        css = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'PURCHASING':
        label = 'Đang vận chuyển Về VN';
        css = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'COMPLETED':
        label = 'Đã hoàn thành';
        css = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'CANCELLED':
        label = 'Đã hủy đơn';
        css = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }

    if (newStatus === statusModalOrder.status) {
      setStatusModalOrder(null);
      return;
    }
    setIsSavingStatus(true);
    try {
      if (newStatus === 'CANCELLED') await orderStore.cancelOrder(statusModalOrder.id);
      else await orderStore.updateOrder(statusModalOrder.id, { status: newStatus, statusLabel: label, statusClass: css, updatedAt: new Date().toLocaleString('vi-VN') });
      await loadLatestOrders();
      setStatusModalOrder(null);
    } catch (error: any) {
      alert(error.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleApproveRefund = async (ord: OrderItem) => {
    const amountStr = (ord.depositPaid || ord.depositRequiredVnd || 0).toLocaleString('vi-VN');
    if (confirm(`XÁC NHẬN HOÀN CỌC: Bạn có chắc chắn muốn duyệt hoàn ${amountStr} ₫ tiền cọc cho đơn ${ord.id} vào ví của khách hàng ${ord.customerName || 'khách hàng'}?`)) {
      try {
        await orderStore.approveDepositRefund(ord.id);
        await loadLatestOrders();
        alert(`Thành công! Đã hoàn trả ${amountStr} ₫ tiền cọc vào Ví Dư Tài Khoản của khách hàng. Đơn hàng được chuyển sang trạng thái Đã Hủy.`);
      } catch (err: any) {
        alert(err.message || 'Không thể duyệt hoàn cọc.');
      }
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm(`Super Admin xác nhận XÓA VĨNH VIỄN đơn hàng ${id}?`)) {
      orderStore.deleteOrder(id);
      await loadLatestOrders();
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = async (status: string, label: string, css: string) => {
    if (selectedOrderIds.length === 0) return;
    if (confirm(`Cập nhật trạng thái "${label}" hàng loạt cho ${selectedOrderIds.length} đơn hàng đã chọn?`)) {
      const nowStr = new Date().toLocaleString('vi-VN');
      try {
        await Promise.all(selectedOrderIds.map(id => orderStore.updateOrder(id, {
          status,
          statusLabel: label,
          statusClass: css,
          updatedAt: nowStr,
        })));
        await loadLatestOrders();
        setSelectedOrderIds([]);
      } catch (error: any) {
        alert(error.message || 'Một hoặc nhiều đơn không thể chuyển sang trạng thái đã chọn');
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    if (confirm(`Super Admin xác nhận XÓA VĨNH VIỄN ${selectedOrderIds.length} đơn hàng đã chọn?`)) {
      selectedOrderIds.forEach(id => {
        orderStore.deleteOrder(id);
      });
      loadLatestOrders();
      setSelectedOrderIds([]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 text-slate-800  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800  animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full uppercase">
              SUPER ADMIN MANAGEMENT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Quản Lý Đơn Mua Hộ Khách Hàng (Đầy Đủ Khách Hàng &amp; Mã Vận Đơn)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi khách hàng đặt mua, thời gian khởi tạo, mã vận đơn nội địa Trung Quốc, tuyến kho bãi &amp; tiến độ vận chuyển.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-mono font-bold text-amber-400">
            Tổng {orders.length} Đơn Hàng
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ duyệt cọc' },
          { key: 'DEPOSITED', label: 'Đã đặt cọc' },
          { key: 'PURCHASING', label: 'Đang mua' },
          { key: 'PURCHASED', label: 'Đã mua' },
          { key: 'COMPLETED', label: 'Hoàn thành' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => {
          const count = getStatusCount(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === tab.key
                ? 'bg-[#fa3131] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === tab.key
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 text-slate-500'
                  }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo Mã Đơn ORD-..., Tên Khách Hàng, SĐT, Mã Định Danh OCV_... hoặc Mã Vận Đơn TQ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa3131]"
          />
        </div>
        <button
          onClick={() => setSearchQuery('')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer self-end sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Datatable Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 overflow-hidden">
        {/* Bulk Action Bar */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-5 h-5 rounded-md bg-[#fa3131] text-white flex items-center justify-center text-[11px] font-mono">
                {selectedOrderIds.length}
              </span>
              <span>Đơn hàng đang chọn</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBulkStatusChange('PURCHASED', 'Đã mua - Vào kho TQ', 'bg-blue-50 text-blue-700 border-blue-200')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Vào Kho TQ ({selectedOrderIds.length})</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Hàng Loạt</span>
              </button>
              <button
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
              >
                Bỏ Chọn
              </button>
            </div>
          </div>
        )}

        {totalItems === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto stroke-1.5" />
            <p className="font-bold text-xs sm:text-sm text-slate-800">Không tìm thấy đơn hàng mua hộ nào</p>
            <p className="text-xs text-slate-400">Thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] select-none">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        className="w-4 h-4 rounded text-[#fa3131] focus:ring-[#fa3131] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">
                      <button onClick={() => handleSort('id')} className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] cursor-pointer">
                        <span>Mã Đơn</span>
                        {sortColumn === 'id' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />) : <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button onClick={() => handleSort('customerName')} className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] cursor-pointer">
                        <span>Khách Hàng Đặt</span>
                        {sortColumn === 'customerName' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />) : <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">Sản Phẩm &amp; Link</th>
                    <th className="py-3 px-4">Mã Vận Đơn TQ</th>
                    <th className="py-3 px-4">Tiền RMB (¥)</th>
                    <th className="py-3 px-4">Tổng VNĐ / Đặt Cọc</th>
                    <th className="py-3 px-4">
                      <button onClick={() => handleSort('createdAt')} className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] cursor-pointer">
                        <span>Thời Gian Tạo</span>
                        {sortColumn === 'createdAt' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />) : <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {paginatedOrders.map((ord) => {
                    const isSelected = selectedOrderIds.includes(ord.id);
                    return (
                      <tr key={ord.id} className={`transition-colors ${isSelected ? 'bg-rose-50/70 font-semibold' : 'hover:bg-slate-50'}`}>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(ord.id)}
                            className="w-4 h-4 rounded text-[#fa3131] focus:ring-[#fa3131] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131] whitespace-nowrap">
                          {ord.id}
                          <div className="text-[10px] text-slate-500  font-bold">{ord.platform}</div>
                        </td>
                        {/* Customer Information */}
                        <td className="py-3.5 px-4 max-w-xs space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{ord.customerName || 'Nguyễn Văn Hùng'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{ord.customerPhone || '0909 123 456'}</span>
                          </div>
                          {ord.customerCode && (
                            <span className="inline-block text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              {ord.customerCode}
                            </span>
                          )}
                        </td>
                        {/* Product Information */}
                        <td className="py-3.5 px-4 max-w-xs space-y-1">
                          <div className="font-semibold text-slate-800 line-clamp-2">{ord.productName}</div>
                          {ord.attributes && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              Phân loại: {ord.attributes}
                            </div>
                          )}
                          {ord.productUrl && (
                            <a
                              href={ord.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Mở Link Nguồn Gốc</span>
                            </a>
                          )}
                        </td>
                        {/* Tracking Information */}
                        <td className="py-3.5 px-4 whitespace-nowrap space-y-0.5 font-mono text-[11px]">
                          <div className="font-bold text-slate-800">{ord.chinaTrackingCode || 'Chưa có mã TQ'}</div>
                          <div className="text-[10px] text-slate-500  ">{ord.warehouse || 'Kho Q.Châu ➔ VN'}</div>
                        </td>
                        {/* RMB Price */}
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                          ¥{ord.totalRmb.toLocaleString('zh-CN')} ({ord.quantity} sp)
                        </td>
                        {/* VND Price */}
                        <td className="py-3.5 px-4 whitespace-nowrap space-y-0.5">
                          <div className="font-mono font-bold text-[#0c3ed0]">{ord.totalVnd.toLocaleString('vi-VN')} ₫</div>
                          <div className="text-[10px] font-mono text-emerald-700 font-bold">Cọc 70%: {ord.depositPaid.toLocaleString('vi-VN')} ₫</div>
                        </td>
                        {/* Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] space-y-0.5 text-slate-500">
                          <div className="font-mono text-slate-700">{ord.createdAt}</div>
                          {ord.updatedAt && <div className="text-[10px] italic">Cập nhật: {ord.updatedAt}</div>}
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenStatusModal(ord)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer ${ord.statusClass}`}
                            title="Bấm để đổi trạng thái"
                          >
                            <span>{ord.statusLabel}</span>
                            <Edit3 className="w-3 h-3 opacity-60" />
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {ord.depositRefundStatus === 'PENDING' && (
                              <button
                                onClick={() => handleApproveRefund(ord)}
                                title="Khách gửi yêu cầu hoàn tiền cọc - Bấm để duyệt hoàn tiền vào ví"
                                className="px-2.5 py-1 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold rounded-lg text-[11px] transition-all shadow-xs flex items-center gap-1 cursor-pointer animate-pulse shrink-0"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Duyệt Hoàn Cọc</span>
                              </button>
                            )}
                            <button
                              onClick={() => setDetailModalOrder(ord)}
                              title="Xem chi tiết đơn"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(ord)}
                              title="Chỉnh sửa đơn"
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              title="Xóa đơn hàng"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-[#fa3131] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>hàng / trang</span>
                <span className="text-slate-300 mx-1">|</span>
                <span className="font-semibold text-slate-700">
                  Hiển thị <strong className="font-mono text-slate-900">{startIndex + 1}</strong>–<strong className="font-mono text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</strong> trên tổng số <strong className="font-mono text-[#fa3131]">{totalItems}</strong> đơn
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${validCurrentPage === pNum
                      ? 'bg-[#fa3131] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL 1: BẢNG XEM CHI TIẾT ĐƠN ĐẦY ĐỦ ── */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-base text-[#fa3131]">{detailModalOrder.id}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${detailModalOrder.statusClass}`}>
                  {detailModalOrder.statusLabel}
                </span>
              </div>
              <button
                onClick={() => setDetailModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Thông tin khách hàng mua hộ</div>
                <div className="font-bold text-sm text-white flex items-center justify-between">
                  <span>{detailModalOrder.customerName || 'Nguyễn Văn Hùng'}</span>
                  {detailModalOrder.customerCode && (
                    <span className="text-xs font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {detailModalOrder.customerCode}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  SĐT: {detailModalOrder.customerPhone || '0909 123 456'}
                </div>
              </div>

              {/* Product Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Tên sản phẩm mua hộ</div>
                <div className="font-bold text-sm text-slate-900 leading-snug">{detailModalOrder.productName}</div>

                {detailModalOrder.attributes && (
                  <div className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 inline-block">
                    Phân loại SKU: {detailModalOrder.attributes}
                  </div>
                )}

                {detailModalOrder.productUrl && (
                  <div className="pt-1">
                    <a
                      href={detailModalOrder.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở Trang Sản Phẩm Gốc Trực Tiếp</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Financial & Logistics Info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sàn Mua Hộ</div>
                  <div className="font-bold text-slate-800">{detailModalOrder.platform}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Số Lượng Đặt</div>
                  <div className="font-mono font-bold text-slate-900">{detailModalOrder.quantity} sản phẩm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tiền RMB (¥)</div>
                  <div className="font-mono font-bold text-rose-600 text-sm">¥{detailModalOrder.totalRmb.toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng VNĐ</div>
                  <div className="font-mono font-bold text-[#0c3ed0] text-sm">{detailModalOrder.totalVnd.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-600">Khoản Đặt Cọc 70%:</span>
                  <span className="font-mono text-emerald-700 text-sm">{detailModalOrder.depositPaid.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Tracking & Logistics Box */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
                <div className="text-[10px] font-bold uppercase text-sky-900 font-mono">Thông tin kho bãi &amp; Mã vận đơn</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Mã Vận Đơn TQ:</span>
                    <div className="font-mono font-bold text-slate-900">{detailModalOrder.chinaTrackingCode || 'Chưa có mã TQ'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Mã Vận Đơn VN:</span>
                    <div className="font-mono font-bold text-slate-900">{detailModalOrder.vnTrackingCode || 'Chưa có mã VN'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Tuyến Kho Bãi:</span>
                    <div className="font-bold text-slate-800">{detailModalOrder.warehouse || 'Kho Quảng Châu ➔ Kho TP.HCM'}</div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-600">
                <div>Ngày Tạo Đơn: <strong className="font-mono text-slate-800">{detailModalOrder.createdAt}</strong></div>
                {detailModalOrder.updatedAt && <div>Cập Nhật Gần Nhất: <strong className="font-mono text-slate-800">{detailModalOrder.updatedAt}</strong></div>}
                {detailModalOrder.estimatedDelivery && <div>Dự Kiến Giao Hàng: <strong className="font-bold text-emerald-700">{detailModalOrder.estimatedDelivery}</strong></div>}
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between font-bold"><span>Đã thanh toán</span><span>{(detailModalOrder.paidVnd || 0).toLocaleString('vi-VN')} ₫</span></div>
                <div className="flex justify-between font-bold text-rose-600"><span>Còn lại</span><span>{(detailModalOrder.remainingVnd ?? detailModalOrder.totalVnd).toLocaleString('vi-VN')} ₫</span></div>
                {detailModalOrder.payments?.map((payment) => <div key={payment.id} className="flex justify-between border-t pt-2"><span>{payment.paymentCode} · {payment.method} · {payment.status}</span><span>{payment.amountVnd.toLocaleString('vi-VN')} ₫</span></div>)}
              </div>

              {['PURCHASED', 'COMPLETED'].includes(detailModalOrder.status) && <button onClick={async () => { const tracking = prompt('Nhập mã vận đơn Trung Quốc'); if (!tracking) return; try { await orderStore.createParcel(detailModalOrder.id, tracking.trim()); await loadLatestOrders(); setDetailModalOrder(null); } catch (error: any) { alert(error.message); } }} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold">Tạo kiện hàng từ đơn</button>}
              {detailModalOrder.parcels && detailModalOrder.parcels.length > 0 && <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs space-y-2"><div className="font-bold">Kiện hàng đã liên kết</div>{detailModalOrder.parcels.map((parcel) => <div key={parcel.id} className="flex justify-between border-t pt-2"><span>{parcel.parcelCode}</span><span>{parcel.trackingCodeChina} · {parcel.status}</span></div>)}</div>}

              {detailModalOrder.note && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-amber-900">Ghi chú từ khách hàng:</div>
                  <div className="text-amber-800 italic">{detailModalOrder.note}</div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalOrder(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ĐỔI TRẠNG THÁI ĐƠN ── */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Đổi Trạng Thái Đơn {statusModalOrder.id}</h3>
                <p className="text-xs text-slate-500">Cập nhật quy trình xử lý đơn hàng cho khách</p>
              </div>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Trạng Thái Mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#fa3131]"
                >
                  <option value={statusModalOrder.status}>{statusModalOrder.statusLabel} (Hiện tại)</option>
                  {statusModalOrder.status === 'PENDING' && <option value="CANCELLED">Đã hủy đơn hàng</option>}
                  {statusModalOrder.status === 'DEPOSITED' && <><option value="PURCHASING">Đang tiến hành mua hàng</option><option value="CANCELLED">Đã hủy đơn hàng</option></>}
                  {statusModalOrder.status === 'PURCHASING' && <><option value="PURCHASED">Đã mua - Vào kho TQ</option><option value="CANCELLED">Đã hủy đơn hàng</option></>}
                  {statusModalOrder.status === 'PURCHASED' && <><option value="COMPLETED">Đã hoàn thành</option><option value="CANCELLED">Đã hủy đơn hàng</option></>}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusModalOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingStatus}
                  className="px-5 py-2 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingStatus ? 'Đang cập nhật...' : 'Cập Nhật Trạng Thái'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CHỈNH SỬA CHI TIẾT ĐƠN HÀNG FULL ── */}
      {editModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sửa Chi Tiết Đơn Hàng {editModalOrder.id}</h3>
                <p className="text-xs text-slate-500">Cập nhật Khách hàng, Mã vận đơn TQ, Giá RMB &amp; Tuyến kho</p>
              </div>
              <button
                onClick={() => setEditModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4">
              {/* Customer Fields */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Thông tin Khách Hàng</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tên Khách Hàng</label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#fa3131]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Khách Hàng</label>
                    <input
                      type="text"
                      required
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#fa3131]"
                    />
                  </div>
                </div>
              </div>

              {/* Product Fields */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Sản Phẩm</label>
                <input
                  type="text"
                  required
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#fa3131]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Lượng</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#fa3131]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Giá RMB (¥)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editForm.priceRmb}
                    onChange={(e) => setEditForm({ ...editForm, priceRmb: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-[#fa3131]"
                  />
                </div>
              </div>

              {/* Tracking & Warehouse Fields */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                <div className="text-[10px] font-bold uppercase text-sky-900 font-mono">Mã Vận Đơn &amp; Tuyến Vận Chuyển</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Vận Đơn TQ</label>
                    <input
                      type="text"
                      value={editForm.chinaTrackingCode}
                      onChange={(e) => setEditForm({ ...editForm, chinaTrackingCode: e.target.value })}
                      placeholder="SF142857..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Vận Đơn VN</label>
                    <input
                      type="text"
                      value={editForm.vnTrackingCode}
                      onChange={(e) => setEditForm({ ...editForm, vnTrackingCode: e.target.value })}
                      placeholder="GHTK-9812..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tuyến Kho Bãi</label>
                  <input
                    type="text"
                    value={editForm.warehouse}
                    onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value })}
                    placeholder="Kho Quảng Châu ➔ Kho TP.HCM"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phân Loại SKU / Màu Sắc</label>
                <input
                  type="text"
                  value={editForm.attributes}
                  onChange={(e) => setEditForm({ ...editForm, attributes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#fa3131]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Đơn Hàng</label>
                <textarea
                  rows={2}
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fa3131]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
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
