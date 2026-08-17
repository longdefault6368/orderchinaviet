'use client';

import { use, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PackageCheck,
  Plus,
  ExternalLink,
  X,
  Sparkles,
  Download,
  Link as LinkIcon,
  HelpCircle,
  ShieldCheck,
  AppWindow,
  Edit3,
  Trash2,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Copy,
  Check,
  QrCode,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { orderStore, OrderItem } from '@/lib/order-store';
import { settingsStore } from '@/lib/settings-store';
import { authStore } from '@/lib/auth-store';
import { paymentGateway } from '@/lib/payment-service';
import { notificationStore } from '@/lib/notification-store';
import { OrderGuideModal } from '@/components/common/OrderGuideModal';

export default function OrdersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status') || 'ALL';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(statusParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [detailModalOrder, setDetailModalOrder] = useState<OrderItem | null>(null);
  const [editModalOrder, setEditModalOrder] = useState<OrderItem | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<OrderItem | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [editForm, setEditForm] = useState({
    productName: '',
    quantity: 1,
    priceRmb: 50,
    note: '',
    attributes: '',
  });

  const [orders, setOrders] = useState<OrderItem[]>([]);

  // Multi-selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Column sorting state
  type SortableColumn = 'id' | 'platform' | 'productName' | 'quantity' | 'totalRmb' | 'totalVnd' | 'createdAt';
  const [sortColumn, setSortColumn] = useState<SortableColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Buy For Me Form State
  const EXCHANGE_RATE = settingsStore.getSettings().rateBuyForMe || 3650; // 1 RMB = rateBuyForMe VND
  const SERVICE_FEE_PERCENT = 0.02; // 2%
  const DEPOSIT_PERCENT = 0.70; // 70%

  const [form, setForm] = useState({
    productUrl: '',
    productName: '',
    platform: '1688',
    quantity: 1,
    priceRmb: 50,
    variation: '',
    imageUrl: '',
    note: '',
  });

  const [extensionImportSuccess, setExtensionImportSuccess] = useState<string | null>(null);
  const importedCartRef = useRef<string | null>(null);

  // -----------------------------------------------------------------------
  // PLATFORM SEARCH STATE (1688 / TAOBAO / PINDUODUO)
  // -----------------------------------------------------------------------
  const platforms = [
    {
      id: '1688',
      label: '1688.com',
      url: 'https://s.1688.com/selloffer/offer_search.htm?keywords=',
      urlSuffix: '',
      icon: '/1688.png',
    },
    {
      id: 'taobao',
      label: 'Taobao.com',
      url: 'https://s.taobao.com/search?q=',
      urlSuffix: '',
      icon: '/taobao.png',
    },
    {
      id: 'pinduoduo',
      label: 'Pinduoduo',
      url: 'https://mobile.yangkeduo.com/search_result.html?search_key=',
      urlSuffix: '',
      icon: '/pinduoduo.webp',
    },
  ];
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [platformOpen, setPlatformOpen] = useState(false);
  const platformBtnRef = useRef<HTMLButtonElement>(null);
  const platformDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  const handleToggleDropdown = () => {
    if (!platformOpen && platformBtnRef.current) {
      const rect = platformBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    setPlatformOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isBtn = platformBtnRef.current?.contains(target);
      const isMenu = platformDropdownRef.current?.contains(target);
      if (!isBtn && !isMenu) setPlatformOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handlePlatformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchProductQuery.trim();
    if (!query) return;

    // If user pasted a direct product URL, open create order modal with the URL prefilled
    if (query.startsWith('http://') || query.startsWith('https://')) {
      setForm((prev) => ({ ...prev, productUrl: query, platform: selectedPlatform.id }));
      setIsModalOpen(true);
      return;
    }

    const finalUrl = selectedPlatform.url + encodeURIComponent(query) + selectedPlatform.urlSuffix;
    window.open(finalUrl, '_blank');
  };

  // Payment Gateway Modal State
  const [payGatewayOrder, setPayGatewayOrder] = useState<OrderItem | null>(null);
  const [payMethod, setPayMethod] = useState<'PAYOS' | 'PAYPAL' | 'WALLET'>('PAYOS');
  const [copiedTransferContent, setCopiedTransferContent] = useState(false);
  const [isVerifyingPayos, setIsVerifyingPayos] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentPercentage, setPaymentPercentage] = useState(70);
  const paymentDepositAmount = payGatewayOrder
    ? Math.min(payGatewayOrder.totalVnd, Math.round(payGatewayOrder.totalVnd * paymentPercentage / 100))
    : 0;

  const refreshWalletBalance = async () => {
    try {
      const user = await authStore.refreshProfile();
      setWalletBalance(Number(user.balanceVnd ?? 0));
    } catch {
      setWalletBalance(Number(authStore.getUser()?.balanceVnd ?? 0));
    }
  };

  const openPaymentGateway = (ord: OrderItem) => {
    setPayGatewayOrder(ord);
    setPaymentSuccessMsg(null);
    setPaymentPercentage(70);
    void refreshWalletBalance();
  };

  const handleProcessPayment = async () => {
    if (!payGatewayOrder) return;
    if (!(new Set<string>(['WALLET'])).has(payMethod)) {
      setPaymentSuccessMsg('PayOS/PayPal chỉ được ghi nhận sau webhook xác nhận. Vui lòng chọn Ví Dư để thanh toán ngay.');
      return;
    }
    if (walletBalance < paymentDepositAmount) {
      setPaymentSuccessMsg('Số dư ví không đủ để thanh toán tiền cọc cho đơn hàng này.');
      return;
    }
    setIsVerifyingPayos(true);

    try {
      await orderStore.depositOrder(payGatewayOrder.id, paymentDepositAmount);
      await refreshWalletBalance();
      loadLatestOrders();
      window.dispatchEvent(new Event('orderchinaviet_balance_updated'));
      notificationStore.notifyOrderDeposit({
        orderId: payGatewayOrder.orderCode || payGatewayOrder.id,
        customerName: authStore.getUser()?.fullName || payGatewayOrder.customerName || 'Khách Hàng',
        amountVnd: paymentDepositAmount,
        paymentMethod: 'Ví Dư Tài Khoản',
      });
      setPaymentSuccessMsg(`Xác nhận thanh toán ${paymentPercentage}% thành công cho đơn hàng ${payGatewayOrder.orderCode || payGatewayOrder.id} qua Ví Dư Tài Khoản!`);
      setTimeout(() => {
        setPayGatewayOrder(null);
        setPaymentSuccessMsg(null);
      }, 2000);
    } catch (error: any) {
      setPaymentSuccessMsg(error.message || 'Không thể thanh toán tiền cọc. Vui lòng thử lại.');
      await refreshWalletBalance();
    } finally {
      setIsVerifyingPayos(false);
    }
  };

  const loadLatestOrders = () => {
    setOrders(orderStore.getOrders());
  };

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setActiveTab(statusParam);
      setCurrentPage(1);
    } else {
      setActiveTab('ALL');
    }
  }, [searchParams]);

  useEffect(() => {
    orderStore.fetchOrdersFromApi().then(setOrders).finally(() => setLoading(false));

    // Parse items sent from Chrome Extension (Ensure executed ONLY ONCE via sessionStorage key)
    const source = searchParams.get('source');
    const cartRaw = searchParams.get('cart');

    if (source === 'extension' && cartRaw) {
      const sessionKey = 'ocv_processed_cart_' + cartRaw;
      const alreadyProcessed = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;

      if (!alreadyProcessed) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(sessionKey, '1');
          window.history.replaceState({}, '', window.location.pathname);
        }

        try {
          const decoded = JSON.parse(decodeURIComponent(cartRaw));
          if (Array.isArray(decoded) && decoded.length > 0) {
            const currentUser = authStore.getUser();
            const itemsToCreate = decoded.map((item: any) => ({
              platform: item.platform || '1688',
              productName: item.name || 'Sản phẩm mua hộ',
              quantity: item.qty || item.quantity || 1,
              totalRmb: (item.price || 50) * (item.qty || 1),
              totalVnd: item.price ? Math.round(item.price * (item.qty || 1) * EXCHANGE_RATE * 1.02) : undefined,
              productUrl: item.url,
              imageUrl: item.image,
              note: item.note,
              attributes: item.attributes,
              customerName: currentUser?.fullName || 'Khách Hàng Mua Hộ',
              customerPhone: currentUser?.phone || '0909 123 456',
              customerCode: currentUser?.customerCode || 'OCV_9812',
            }));

            const added = orderStore.addMultipleOrders(itemsToCreate);
            loadLatestOrders();
            if (added.length > 0) {
              setExtensionImportSuccess(`Đã nhận thành công ${added.length} sản phẩm từ Chrome Extension!`);
            }
          }
        } catch (err) {
          console.error('Error importing cart from extension:', err);
        }
      }
    }

    // Real-time Multi-Tab Sync listeners
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderchinaviet_user_orders_v1' || e.key === 'ocv_cart') {
        loadLatestOrders();
      }
    };

    const handleCustomUpdate = () => {
      loadLatestOrders();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('orderchinaviet_orders_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderchinaviet_orders_updated', handleCustomUpdate);
    };
  }, [searchParams]);

  // Calculations for form
  const rawProductVnd = Math.round((form.quantity || 0) * (form.priceRmb || 0) * EXCHANGE_RATE);
  const serviceFeeVnd = Math.round(rawProductVnd * SERVICE_FEE_PERCENT);
  const totalOrderVnd = rawProductVnd + serviceFeeVnd;
  const depositRequiredVnd = Math.round(totalOrderVnd * DEPOSIT_PERCENT);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) return;

    const currentUser = authStore.getUser();
    const newOrd = orderStore.addOrder({
      platform: form.platform,
      productName: form.productName,
      quantity: form.quantity,
      totalRmb: (form.quantity * form.priceRmb),
      totalVnd: totalOrderVnd,
      depositPaid: depositRequiredVnd,
      status: 'PENDING',
      statusLabel: 'Chờ duyệt cọc',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
      productUrl: form.productUrl,
      imageUrl: form.imageUrl,
      note: form.note,
      attributes: form.variation,
      customerName: currentUser?.fullName || 'Khách Hàng Mua Hộ',
      customerPhone: currentUser?.phone || '0909 123 456',
      customerCode: currentUser?.customerCode || 'OCV_9812',
      chinaTrackingCode: 'Chưa có mã TQ',
      warehouse: 'Kho Quảng Châu ➔ Kho TP.HCM',
      shippingMethod: 'Đường bộ chính ngạch',
      estimatedDelivery: '3 - 5 ngày làm việc',
      updatedAt: new Date().toLocaleString('vi-VN'),
    });

    notificationStore.notifyNewOrder({
      id: newOrd.orderCode || newOrd.id,
      customerName: currentUser?.fullName || 'Khách Hàng Mua Hộ',
      amountVnd: totalOrderVnd,
      itemsCount: form.quantity,
    });

    loadLatestOrders();
    setIsModalOpen(false);
    setForm({
      productUrl: '',
      productName: '',
      platform: '1688',
      quantity: 1,
      priceRmb: 50,
      variation: '',
      imageUrl: '',
      note: '',
    });
  };

  const handleCancelOrder = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      orderStore.cancelOrder(id);
      loadLatestOrders();
    }
  };

  const handleOpenEditModal = (ord: OrderItem) => {
    setEditModalOrder(ord);
    const priceRmb = ord.quantity > 0 ? ord.totalRmb / ord.quantity : 50;
    setEditForm({
      productName: ord.productName,
      quantity: ord.quantity,
      priceRmb: Math.round(priceRmb * 100) / 100,
      note: ord.note || '',
      attributes: ord.attributes || '',
    });
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrder) return;
    const newTotalRmb = editForm.quantity * editForm.priceRmb;
    orderStore.updateOrder(editModalOrder.id, {
      productName: editForm.productName,
      quantity: editForm.quantity,
      totalRmb: newTotalRmb,
      note: editForm.note,
      attributes: editForm.attributes,
    });
    loadLatestOrders();
    setEditModalOrder(null);
  };

  const handleConfirmRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    setIsSubmittingRefund(true);
    try {
      await orderStore.requestDepositRefund(refundModalOrder.id, refundReason || 'Khách hàng yêu cầu hoàn cọc');
      const currentUser = authStore.getUser();
      notificationStore.notifyRefundRequest({
        orderId: refundModalOrder.id,
        customerName: currentUser?.fullName || refundModalOrder.customerName || 'Khách Hàng',
        amountVnd: refundModalOrder.depositPaid || refundModalOrder.depositRequiredVnd || 0,
        reason: refundReason,
      });
      loadLatestOrders();
      alert('Đã gửi yêu cầu hoàn tiền cọc cho Admin thành công! Hệ thống sẽ xử lý và chuyển tiền cọc lại vào ví của bạn sau khi Admin phê duyệt.');
      setRefundModalOrder(null);
      setRefundReason('');
    } catch (err: any) {
      alert(err.message || 'Không thể gửi yêu cầu hoàn cọc. Vui lòng thử lại.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

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

  const filteredOrders = orders.filter((ord) => {
    if (!matchStatus(ord.status, activeTab)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = ord.id?.toLowerCase().includes(q) || ord.orderCode?.toLowerCase().includes(q);
      const matchName = ord.productName?.toLowerCase().includes(q);
      const matchCode = ord.chinaTrackingCode?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchCode) return false;
    }
    return true;
  });

  // Sort orders based on sortColumn and sortDirection
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal: any = a[sortColumn] || '';
    let bVal: any = b[sortColumn] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate pagination
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
      const newSelected = Array.from(new Set([...selectedOrderIds, ...pageIds]));
      setSelectedOrderIds(newSelected);
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Bulk Actions
  const handleBulkDeposit = () => {
    if (selectedOrderIds.length === 0) return;
    if (confirm(`Bạn muốn thanh toán đặt cọc 70% hàng loạt cho ${selectedOrderIds.length} đơn hàng đã chọn?`)) {
      selectedOrderIds.forEach(id => {
        orderStore.updateOrder(id, {
          status: 'RECEIVED',
          statusLabel: 'Đã cọc - Đang mua',
          statusClass: 'bg-[#0c3ed0]/10 text-[#0c3ed0] border-[#0c3ed0]/20',
        });
      });
      loadLatestOrders();
      setSelectedOrderIds([]);
    }
  };

  const handleBulkCancel = () => {
    if (selectedOrderIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn hủy ${selectedOrderIds.length} đơn hàng đã chọn?`)) {
      selectedOrderIds.forEach(id => {
        orderStore.cancelOrder(id);
      });
      loadLatestOrders();
      setSelectedOrderIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedOrderIds.length} đơn hàng đã chọn khỏi hệ thống?`)) {
      selectedOrderIds.forEach(id => {
        orderStore.deleteOrder(id);
      });
      loadLatestOrders();
      setSelectedOrderIds([]);
    }
  };

  // Render Skeleton Loading UI
  if (loading) {
    return (
      <div className="space-y-4 text-slate-800  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-12 rounded-2xl w-full" />
        <div className="bg-slate-200 h-14 rounded-2xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-800  animate-in fade-in duration-200">
      {/* Extension Import Success Notification Banner */}
      {extensionImportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-emerald-900 shadow-sm animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{extensionImportSuccess}</span>
          </div>
          <button
            onClick={() => setExtensionImportSuccess(null)}
            className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Top Banner: Title, Action Buttons & Product Search Tool */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 space-y-4 sm:space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full uppercase">
                DỊCH VỤ MUA HỘ NÂNG CAO
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-white">Quản Lý Đơn Hàng Mua Hộ 1688 / Taobao / Pinduoduo</h1>
            <p className="text-xs text-slate-300">
              Tỷ giá công khai: <span className="font-mono font-bold text-amber-400">1 ¥ = {EXCHANGE_RATE.toLocaleString('vi-VN')} ₫</span> | Phí dịch vụ: <span className="font-bold text-emerald-400">2%</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 border border-sky-400/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <AppWindow className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Tải Extension Cốc Cốc / Chrome</span>
            </button>

            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Hướng Dẫn</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] text-white text-xs font-bold transition-all shadow-md hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tạo Đơn Mua Hộ Mới</span>
            </button>
          </div>
        </div>

        {/* ── CÔNG CỤ TÌM KIẾM SẢN PHẨM 1688 / TAOBAO / PINDUODUO ── */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sky-300">
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span>Tìm Kiếm Sản Phẩm Tận Xưởng (1688 / Taobao / Pinduoduo):</span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium">
              Nhập từ khóa tiếng Việt / Trung hoặc dán link sản phẩm để tạo đơn tự động
            </span>
          </div>

          <div className="flex items-stretch bg-white rounded-2xl shadow-xl overflow-visible max-w-3xl">
            <div className="relative shrink-0">
              <button
                ref={platformBtnRef}
                type="button"
                onClick={handleToggleDropdown}
                className="h-full flex items-center gap-2 px-3.5 sm:px-5 bg-white text-slate-900 border-r border-slate-200 text-xs sm:text-sm font-bold hover:bg-primary-50 hover:text-primary-700 transition-colors min-w-[125px] sm:min-w-[145px] justify-between rounded-l-2xl cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 shrink-0 relative bg-white p-0.5 shadow-2xs">
                    <Image src={selectedPlatform.icon} alt={selectedPlatform.label} fill sizes="20px" className="object-contain" />
                  </div>
                  <span>{selectedPlatform.label}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    platformOpen ? 'rotate-180 text-primary-600' : ''
                  }`}
                />
              </button>
            </div>

            <input
              type="text"
              value={searchProductQuery}
              onChange={(e) => setSearchProductQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePlatformSearch(e as any);
              }}
              placeholder={`Tìm sản phẩm hoặc dán link trên ${selectedPlatform.label}...`}
              className="flex-1 px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-white min-w-0"
            />

            <button
              onClick={handlePlatformSearch}
              type="button"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition-colors shrink-0 rounded-r-2xl cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-status Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-2 flex items-center gap-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'Tất Cả Đơn Hàng' },
          { key: 'PENDING', label: 'Chờ đặt cọc' },
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
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn hàng ORD-... hoặc tên sản phẩm"
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

      {/* Orders Table & Cards Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 overflow-hidden">
        {/* Table Header / Title */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
            <span>Danh sách đơn hàng mua hộ</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#fa3131] font-mono text-xs font-bold border border-rose-200">
              {totalItems} đơn hàng
            </span>
          </h2>
        </div>

        {/* Floating Bulk Actions Bar when rows are selected */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-5 h-5 rounded-md bg-[#fa3131] text-white flex items-center justify-center text-[11px] font-mono">
                {selectedOrderIds.length}
              </span>
              <span>Đơn hàng đang được chọn</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBulkDeposit}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Đặt Cọc 70% ({selectedOrderIds.length})</span>
              </button>
              <button
                type="button"
                onClick={handleBulkCancel}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Hủy Đơn ({selectedOrderIds.length})</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Hàng Loạt ({selectedOrderIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
              >
                Bỏ Chọn
              </button>
            </div>
          </div>
        )}

        {totalItems === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có dữ liệu đơn hàng mua hộ nào</p>
              <p className="text-xs text-slate-400 mt-0.5">Không có đơn hàng nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#fa3131] hover:bg-[#d62828] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Đơn Mua Hộ Mới</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards with Checkboxes */}
            <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-3">
              {paginatedOrders.map((ord) => {
                const isSelected = selectedOrderIds.includes(ord.id);
                return (
                  <div
                    key={ord.id}
                    className={`p-3.5 rounded-2xl space-y-2 text-xs transition-all ${isSelected ? 'bg-rose-50/60 border-2 border-[#fa3131]' : 'bg-slate-50 border border-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(ord.id)}
                          className="w-4 h-4 rounded text-[#fa3131] focus:ring-[#fa3131] cursor-pointer"
                        />
                        <span className="font-mono font-bold text-[#fa3131] text-sm">{ord.id}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ord.statusClass}`}>
                        {ord.statusLabel}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">{ord.productName}</div>
                      {ord.attributes && (
                        <div className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md inline-block font-semibold border border-sky-200">
                          Phân loại: {ord.attributes}
                        </div>
                      )}
                      {ord.productUrl && (
                        <div>
                          <a
                            href={ord.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Xem Link Sản Phẩm 1688/Taobao</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500">Sàn:</span>
                        <div className="font-bold text-slate-700">{ord.platform}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Số lượng:</span>
                        <div className="font-mono font-bold text-slate-900">{ord.quantity}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Tiền RMB:</span>
                        <div className="font-mono font-bold text-rose-600">¥{ord.totalRmb.toLocaleString('zh-CN')}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Tổng tiền VNĐ:</span>
                      <strong className="font-mono text-[#0c3ed0] font-bold">{ord.totalVnd.toLocaleString('vi-VN')} ₫</strong>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/60">
                      {ord.depositRefundStatus === 'PENDING' ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] border border-amber-300">
                          Chờ Admin duyệt hoàn cọc
                        </span>
                      ) : ord.status === 'DEPOSITED' || ord.status === 'RECEIVED' ? (
                        <button
                          onClick={() => {
                            setRefundModalOrder(ord);
                            setRefundReason('');
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Hoàn Tiền Cọc</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => setDetailModalOrder(ord)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem</span>
                      </button>
                      {ord.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(ord)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hủy</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Sortable Table with Checkboxes */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] select-none">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        className="w-4 h-4 rounded text-[#fa3131] focus:ring-[#fa3131] cursor-pointer"
                        title="Chọn tất cả đơn hàng trên trang này"
                      />
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort('id')}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] transition-colors cursor-pointer"
                      >
                        <span>Mã Đơn</span>
                        {sortColumn === 'id' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort('platform')}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] transition-colors cursor-pointer"
                      >
                        <span>Sàn</span>
                        {sortColumn === 'platform' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort('productName')}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] transition-colors cursor-pointer"
                      >
                        <span>Sản Phẩm &amp; Link</span>
                        {sortColumn === 'productName' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort('quantity')}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] transition-colors cursor-pointer"
                      >
                        <span>Số Lượng</span>
                        {sortColumn === 'quantity' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort('totalRmb')}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] transition-colors cursor-pointer"
                      >
                        <span>Tiền RMB (¥)</span>
                        {sortColumn === 'totalRmb' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort('totalVnd')}
                        className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] transition-colors cursor-pointer"
                      >
                        <span>Tổng Tiền (VNĐ)</span>
                        {sortColumn === 'totalVnd' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Đặt Cọc (70%)</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
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
                        <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131] whitespace-nowrap">{ord.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-600">{ord.platform}</td>
                        <td className="py-3.5 px-4 max-w-xs space-y-1">
                          <div className="font-semibold text-slate-800 line-clamp-2">{ord.productName}</div>
                          {ord.attributes && (
                            <div className="text-[10px] text-sky-700 font-medium">
                              Phân loại: {ord.attributes}
                            </div>
                          )}
                          {ord.productUrl ? (
                            <a
                              href={ord.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Xem Link Sản Phẩm</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Không có link</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ord.quantity}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                          ¥{ord.totalRmb.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0c3ed0] whitespace-nowrap">
                          {ord.totalVnd.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {ord.depositPaid.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ord.statusClass}`}>
                            {ord.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {ord.depositRefundStatus === 'PENDING' ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] border border-amber-300">
                                Chờ Admin duyệt hoàn cọc
                              </span>
                            ) : ord.status === 'DEPOSITED' || ord.status === 'RECEIVED' ? (
                              <button
                                onClick={() => {
                                  setRefundModalOrder(ord);
                                  setRefundReason('');
                                }}
                                title="Yêu cầu hoàn tiền cọc cho đơn hàng này"
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Hoàn Tiền Cọc</span>
                              </button>
                            ) : ord.status === 'PENDING' || ord.status === 'CREATED' ? (
                              <button
                                onClick={() => openPaymentGateway(ord)}
                                title="Thanh toán từ 70% đến 100% giá trị đơn hàng"
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Thanh Toán Cọc</span>
                              </button>
                            ) : null}
                            <button
                              onClick={() => setDetailModalOrder(ord)}
                              title="Xem chi tiết"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {ord.status !== 'CANCELLED' && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(ord)}
                                  title="Chỉnh sửa đơn hàng"
                                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(ord.id)}
                                  title="Hủy đơn hàng"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
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
                  Hiển thị <strong className="font-mono text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</strong>–<strong className="font-mono text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</strong> trên tổng số <strong className="font-mono text-[#fa3131]">{totalItems}</strong> đơn hàng
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Trang trước"
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
                  title="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL 1: TẠO ĐƠN MUA HỘ QUA LINK WEB ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold font-mono bg-rose-50 text-[#fa3131] border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                  GIAI ĐOẠN 1 — MUA HỘ THỦ CÔNG
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Tạo Yêu Cầu Mua Hộ 1688 / Taobao</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Sản Phẩm (1688 / Taobao / Pinduoduo / Tmall) <span className="text-[#fa3131]">*</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    required
                    value={form.productUrl}
                    onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                    placeholder="Dán đường link sản phẩm từ 1688, Taobao..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fa3131]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sàn Thương Mại</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#fa3131]"
                  >
                    <option value="1688">1688.com</option>
                    <option value="Taobao">Taobao.com</option>
                    <option value="Pinduoduo">Pinduoduo</option>
                    <option value="Tmall">Tmall.com</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Sản Phẩm <span className="text-[#fa3131]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="Áo sơ mi nam, Giày thể thao..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#fa3131]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#fa3131]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Giá RMB (¥)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.priceRmb}
                    onChange={(e) => setForm({ ...form, priceRmb: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0c3ed0] focus:outline-none focus:border-[#fa3131]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân Loại (Size/Màu)</label>
                  <input
                    type="text"
                    value={form.variation}
                    onChange={(e) => setForm({ ...form, variation: e.target.value })}
                    placeholder="Màu Đen, Size XL"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#fa3131]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Cho Nhân Viên Mua Hộ</label>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Kiểm tra đúng size, yêu cầu đóng hộp gỗ..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#fa3131]"
                />
              </div>

              {/* Dynamic Fee Calculation Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tiền hàng thực tế ({form.quantity} x ¥{form.priceRmb} x 3.650đ):</span>
                  <span className="font-mono font-bold text-slate-900">{rawProductVnd.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Phí dịch vụ mua hộ (2%):</span>
                  <span className="font-mono font-bold text-emerald-600">+{serviceFeeVnd.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Tổng Tiền Đơn Hàng Dự Kiến:</span>
                  <span className="font-mono text-[#0c3ed0]">{totalOrderVnd.toLocaleString('vi-VN')} ₫</span>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] text-white font-bold rounded-xl text-xs transition-all shadow-md hover:scale-105 cursor-pointer"
                >
                  Gửi Yêu Cầu Mua Hộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EXTENSION MUA HỘ TỰ ĐỘNG ── */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800">
            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto">
              <AppWindow className="w-6 h-6" />
            </div>

            <div className="text-center">
              <span className="text-[10px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full uppercase">
                GIAI ĐOẠN 2 — TỰ ĐỘNG HÓA NÂNG CAO
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">OrderChinaViet Chrome Extension</h3>
              <p className="text-xs text-slate-500 mt-1">Cài đặt công cụ hỗ trợ thêm sản phẩm trực tiếp khi lướt web trên 1688 / Taobao / Tmall.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tính Năng Extension Nổi Bật:</span>
              </div>
              <ul className="space-y-2 text-slate-600 leading-relaxed font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Bóc tách tự động tên, ảnh, size, màu sắc &amp; giá tiền RMB.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Đổi giá tiền sang VNĐ ngay trên giao diện 1688 / Taobao.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Nút "Thêm Vào Giỏ OrderChinaViet" 1-Click siêu tốc.</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <a
                href="/extension/orderchinaviet-extension.zip"
                download
                className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Extension (.zip)</span>
              </a>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: XEM CHI TIẾT ĐƠN HÀNG ── */}
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

            {/* Order Details Body */}
            <div className="space-y-4 text-xs">
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
                      <span>Mở Trang Sản Phẩm Trên 1688 / Taobao</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sàn Giao Dịch</div>
                  <div className="font-bold text-amber-400">{detailModalOrder.platform}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Số Lượng Đặt</div>
                  <div className="font-mono font-bold text-white">{detailModalOrder.quantity} sản phẩm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tiền Nhân Dân Tệ (RMB)</div>
                  <div className="font-mono font-bold text-rose-400 text-sm">¥{detailModalOrder.totalRmb.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng Cước VNĐ (Tỷ giá 3.650)</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{detailModalOrder.totalVnd.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex justify-between items-center font-bold">
                <span>Đã thanh toán:</span>
                <span className="font-mono text-rose-700 text-sm">{(detailModalOrder.paidVnd || 0).toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold"><span>Còn phải thanh toán:</span><span className="font-mono text-rose-600">{(detailModalOrder.remainingVnd ?? detailModalOrder.totalVnd).toLocaleString('vi-VN')} ₫</span></div>
                {(detailModalOrder.remainingVnd || 0) > 0 && ['DEPOSITED', 'PURCHASING', 'PURCHASED'].includes(detailModalOrder.status) && (
                  <button onClick={async () => { try { await orderStore.payBalance(detailModalOrder.id); setDetailModalOrder(null); await loadLatestOrders(); } catch (error: any) { alert(error.message); } }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-bold">Thanh toán phần còn lại bằng Ví Dư</button>
                )}
              </div>

              {detailModalOrder.items && detailModalOrder.items.length > 0 && <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"><div className="font-bold">Danh sách sản phẩm</div>{detailModalOrder.items.map((item) => <div key={item.id} className="flex justify-between gap-3 border-t pt-2"><span>{item.productName} × {item.quantity}</span><span className="font-mono">¥{item.totalCny.toLocaleString('zh-CN')}</span></div>)}</div>}

              {detailModalOrder.payments && detailModalOrder.payments.length > 0 && <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"><div className="font-bold">Lịch sử thanh toán</div>{detailModalOrder.payments.map((payment) => <div key={payment.id} className="flex justify-between gap-3 border-t pt-2"><span>{payment.purpose} · {payment.method} · {payment.status}</span><span className="font-mono">{payment.amountVnd.toLocaleString('vi-VN')} ₫</span></div>)}</div>}

              {detailModalOrder.note && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-700">Ghi chú từ khách hàng:</div>
                  <div className="text-slate-600 italic">{detailModalOrder.note}</div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalOrder(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng Chi Tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CHỈNH SỬA ĐƠN HÀNG ── */}
      {editModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sửa Đơn Hàng {editModalOrder.id}</h3>
                <p className="text-xs text-slate-500">Cập nhật số lượng, đơn giá RMB hoặc ghi chú</p>
              </div>
              <button
                onClick={() => setEditModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phân Loại SKU / Màu Sắc</label>
                <input
                  type="text"
                  value={editForm.attributes}
                  onChange={(e) => setEditForm({ ...editForm, attributes: e.target.value })}
                  placeholder="Màu đen, size L..."
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

      {/* ── MODAL 5: PAYMENT GATEWAY (PAYOS & PAYPAL) ── */}
      {payGatewayOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-[700px] w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPayGatewayOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Thanh Toán Đơn Hàng</h3>
                <p className="text-xs text-slate-500">Chọn phương thức thanh toán PayOS (VietQR) hoặc PayPal (USD)</p>
              </div>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Thanh Toán Hoàn Tất!</h4>
                <p className="text-xs text-emerald-800">{paymentSuccessMsg}</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Chọn tỷ lệ thanh toán</div>
                      <div className="text-[11px] text-slate-500">Tối thiểu 70%, có thể thanh toán toàn bộ đơn hàng.</div>
                    </div>
                    <span className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 font-mono text-sm font-bold text-[#fa3131]">{paymentPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    step="1"
                    value={paymentPercentage}
                    onChange={(event) => setPaymentPercentage(Number(event.target.value))}
                    className="w-full accent-[#fa3131] cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[70, 80, 90, 100].map((percentage) => (
                      <button key={percentage} type="button" onClick={() => setPaymentPercentage(percentage)} className={`rounded-xl border py-1.5 text-xs font-bold transition-colors ${paymentPercentage === percentage ? 'border-[#fa3131] bg-[#fa3131] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#fa3131]/50'}`}>{percentage}%</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                    <span className="font-semibold text-slate-600">Số tiền thanh toán</span>
                    <span className="font-mono text-base font-bold text-rose-600">{paymentDepositAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>

                {/* Method Selector Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPayMethod('PAYOS')}
                    className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${payMethod === 'PAYOS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>PayOS VietQR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('PAYPAL')}
                    className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${payMethod === 'PAYPAL'
                      ? 'bg-[#003087] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>PayPal USD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('WALLET')}
                    className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${payMethod === 'WALLET'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Ví Dư ({walletBalance.toLocaleString('vi-VN')}đ)</span>
                  </button>
                </div>

                {/* PAYOS VIETQR VIEW */}
                {payMethod === 'PAYOS' && (() => {
                  const checkout = paymentGateway.createPayosCheckout({
                    orderId: payGatewayOrder.id,
                    amountVnd: paymentDepositAmount,
                    description: `Thanh toan ${paymentPercentage}% don ${payGatewayOrder.id}`,
                  });

                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-36 h-36 bg-white p-2 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-center shrink-0">
                          <img
                            src={checkout.qrCodeUrl}
                            alt="PayOS VietQR Code"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-800 flex-1">
                          <div className="font-bold text-emerald-900 text-sm flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span>Quét Mã QR Chuyển Khoản Tự Động</span>
                          </div>

                          <div>Ngân Hàng: <strong className="font-bold text-slate-900">{checkout.bankName}</strong></div>
                          <div>Số Tài Khoản: <strong className="font-mono font-bold text-slate-900">{checkout.accountNumber}</strong></div>
                          <div>Chủ Tài Khoản: <strong className="font-bold text-slate-900">{checkout.accountName}</strong></div>
                          <div>
                            Số Tiền Thanh Toán {paymentPercentage}%: <strong className="font-mono font-bold text-rose-600 text-sm">{checkout.amountVnd.toLocaleString('vi-VN')} ₫</strong>
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <span className="text-slate-500">Nội dung CK:</span>
                            <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 text-xs">
                              {checkout.transferContent}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(checkout.transferContent);
                                setCopiedTransferContent(true);
                                setTimeout(() => setCopiedTransferContent(false), 2000);
                              }}
                              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedTransferContent ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedTransferContent ? 'Đã chép' : 'Sao chép'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 italic text-center">
                        * PayOS sẽ tự động quét biến động số dư 24/7 và duyệt đơn ngay khi ngân hàng nhận được khoản tiền.
                      </div>
                    </div>
                  );
                })()}

                {/* PAYPAL INTERNATIONAL VIEW */}
                {payMethod === 'PAYPAL' && (() => {
                  const paypal = paymentGateway.createPaypalCheckout({
                    orderId: payGatewayOrder.id,
                    amountVnd: paymentDepositAmount,
                    description: `Order Payment ${paymentPercentage}% ${payGatewayOrder.id}`,
                  });

                  return (
                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sky-900 flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-lg bg-[#003087] text-white font-mono font-bold flex items-center justify-center text-[10px]">
                            PP
                          </span>
                          <span>Thanh Toán Thẻ Visa/Mastercard Qua PayPal</span>
                        </div>
                        <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                          {paypal.mode.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2 font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>Giá Trị VNĐ:</span>
                          <span className="font-bold text-slate-900">{paypal.amountVnd.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tỷ Giá Quy Đổi USD:</span>
                          <span className="font-bold text-slate-900">1 USD = {paypal.exchangeRate.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-bold text-sm pt-2 border-t border-sky-100">
                          <span>Tổng USD Thanh Toán:</span>
                          <span>${paypal.amountUsd.toFixed(2)} USD</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        PayPal Client ID: <span className="font-mono text-slate-800 font-bold">{paypal.paypalClientId}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* WALLET VIEW */}
                {payMethod === 'WALLET' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-slate-900">Thanh Toán Trực Tiếp Từ Số Dư Ví Tài Khoản</div>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-600">Số Dư Hiện Có:</span>
                      <span className="font-bold text-emerald-600 text-sm">{walletBalance.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-600">Thanh Toán Đơn Hàng {paymentPercentage}%:</span>
                      <span className="font-bold text-rose-600 text-sm">-{paymentDepositAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-mono">
                      <span className="text-slate-600">Số Dư Sau Thanh Toán:</span>
                      <span className={`font-bold text-sm ${walletBalance >= paymentDepositAmount ? 'text-slate-900' : 'text-rose-600'}`}>
                        {walletBalance >= paymentDepositAmount
                          ? `${(walletBalance - paymentDepositAmount).toLocaleString('vi-VN')} ₫`
                          : 'Không đủ số dư'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPayGatewayOrder(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingPayos || (payMethod === 'WALLET' && walletBalance < paymentDepositAmount)}
                    onClick={handleProcessPayment}
                    className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${payMethod === 'PAYOS'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : payMethod === 'PAYPAL'
                        ? 'bg-[#003087] hover:bg-[#002266]'
                        : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                  >
                    {isVerifyingPayos ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang Kiểm Tra Biến Động...</span>
                      </>
                    ) : (
                      <span>Xác Nhận Đã Thanh Toán Cọc</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Deposit Refund Request Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 stroke-2" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Yêu Cầu Hoàn Tiền Cọc</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Đơn hàng #{refundModalOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setRefundModalOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
              <div className="flex justify-between items-center">
                <span className="text-amber-700">Sản phẩm:</span>
                <span className="font-bold text-slate-900 line-clamp-1">{refundModalOrder.productName}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-amber-200/60">
                <span className="text-amber-700 font-medium">Số tiền cọc sẽ hoàn:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {(refundModalOrder.depositPaid || refundModalOrder.depositRequiredVnd || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRequestRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do yêu cầu hoàn tiền cọc (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ví dụ: Tôi đổi ý không muốn mua mặt hàng này nữa, nhờ Admin hoàn cọc về ví giúp tôi..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-xl text-[11px] text-sky-800 space-y-1 border border-sky-100">
                <p className="font-bold">⚠️ Quy trình xử lý hoàn cọc:</p>
                <p>Sau khi bạn gửi yêu cầu, thông báo sẽ gửi ngay cho Admin. Admin phê duyệt xong thì số tiền cọc sẽ tự động trả về **Ví Dư Tài Khoản** của bạn.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRefund ? (
                    <span>Đang Gửi Yêu Cầu...</span>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xác Nhận Gửi Yêu Cầu Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Reusable Order Guide Modal */}
      <OrderGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        locale={locale}
      />

      {/* ── PLATFORM DROPDOWN PORTAL — fixed position, escapes all overflow ── */}
      {platformOpen && dropdownPos && (
        <div
          ref={platformDropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 99999,
            width: '220px',
          }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn sàn TMĐT</span>
          </div>
          <div className="p-1.5 space-y-0.5">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlatform(p);
                  setPlatformOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  selectedPlatform.id === p.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'
                }`}
              >
                <div className="relative w-6 h-6 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white p-0.5 shadow-2xs">
                  <Image src={p.icon} alt={p.label} fill sizes="24px" className="object-contain" />
                </div>
                <span className="truncate">{p.label}</span>
                {selectedPlatform.id === p.id && (
                  <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0 stroke-[2.5]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
