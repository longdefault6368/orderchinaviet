'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Download,
  RotateCcw,
  Search,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeftRight,
  Plus,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  Check,
  Copy,
  ExternalLink,
  QrCode,
  ZoomIn,
  Maximize2,
  Phone,
  Send,
  Headset,
  MessageSquare,
  Share2,
  Mail,
  MapPin,
  Video,
  Globe,
  Upload,
  ImageIcon,
  FileCheck,
  ShieldCheck,
  Lock,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { settingsStore, ContactSettings } from '@/lib/settings-store';
import { exchangeStore, ExchangeTransaction } from '@/lib/exchange-store';
import { authStore } from '@/lib/auth-store';
import { paymentGateway } from '@/lib/payment-service';
import { notificationStore } from '@/lib/notification-store';
import { apiFetch } from '@/lib/api-client';

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const message = (await response.text()).trim();
  return { message: message || `Máy chủ trả về lỗi ${response.status}` };
}

import alipayQrImg from '@/assets/images/alipay_qr.jpg';
import cryptoQrImg from '@/assets/images/crypto_qr.jpg';
import zaloImg from '@/assets/images/zalo.png';
import telegramImg from '@/assets/images/telegram.webp';
import wechatImg from '@/assets/images/wechat.webp';
import facebookImg from '@/assets/images/facebook.webp';
import whatsappImg from '@/assets/images/whatsapp.png';

interface LedgerTransaction {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  balanceBefore: number | null;
  balanceAfter: number | null;
  note: string;
  createdAt: string;
  createdAtTimestamp: number;
  status: string;
  statusLabel: string;
  statusClass: string;
}

const TRANSACTION_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền vào ví',
  WITHDRAWAL: 'Rút tiền',
  ORDER_DEPOSIT: 'Đặt cọc đơn hàng',
  ORDER_BALANCE: 'Thanh toán đơn hàng',
  ORDER_DEPOSIT_EXTERNAL: 'Cọc đơn qua cổng thanh toán',
  ORDER_BALANCE_EXTERNAL: 'Thanh toán đơn qua cổng thanh toán',
  EXCHANGE_HOLD: 'Giữ tiền đổi VNĐ sang CNY',
  EXCHANGE_RELEASE: 'Hoàn tiền lệnh đổi',
  EXCHANGE: 'Nhận tiền đổi CNY sang VNĐ',
  EXCHANGE_SETTLED: 'Tất toán lệnh đổi tiền',
  REFUND: 'Hoàn tiền',
  ADJUSTMENT: 'Điều chỉnh số dư',
};

export default function CustomerFinancePage() {
  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState<'LEDGER' | 'EXCHANGE'>('LEDGER'); // LEDGER = Sổ Sách Ví, EXCHANGE = Đổi Tiền Alipay

  // Settings & Exchange data
  const [settings, setSettings] = useState<ContactSettings>(settingsStore.getSettings());
  const [exchangeTxs, setExchangeTxs] = useState<ExchangeTransaction[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [exchangeFilterStatus, setExchangeFilterStatus] = useState('ALL');

  // Sorting for Ledger
  type LedgerSortCol = 'id' | 'type' | 'amount' | 'balanceAfter' | 'createdAt';
  const [ledgerSortCol, setLedgerSortCol] = useState<LedgerSortCol>('createdAt');
  const [ledgerSortDir, setLedgerSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination for Ledger
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  // Modals
  const [showAddExchangeModal, setShowAddExchangeModal] = useState(false);
  const [isSubmittingExchange, setIsSubmittingExchange] = useState(false);
  const [detailExchangeTx, setDetailExchangeTx] = useState<ExchangeTransaction | null>(null);
  const [showSocialContactModal, setShowSocialContactModal] = useState(false);

  // Modal Popup Top Tab: DEPOSIT (Nạp Tiền) vs EXCHANGE (Đổi Tiền)
  const [modalModeTab, setModalModeTab] = useState<'DEPOSIT' | 'EXCHANGE'>('DEPOSIT');

  // Deposit Form State (Tab Nạp Tiền)
  const [depositVndAmount, setDepositVndAmount] = useState<number>(0);
  const [depositDisplayStr, setDepositDisplayStr] = useState<string>('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositPayMethod, setDepositPayMethod] = useState<'PAYOS' | 'PAYPAL' | 'CRYPTO'>('PAYOS');
  const [exchangePayMethod, setExchangePayMethod] = useState<'WALLET' | 'PAYOS' | 'PAYPAL' | 'CRYPTO'>('WALLET');
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState(false);

  // Zoom Lightbox State for QR Images
  const [zoomImageSrc, setZoomImageSrc] = useState<any | string | null>(null);
  const [zoomImageTitle, setZoomImageTitle] = useState<string>('');

  // Proof Image Upload State (Optional)
  const [proofImage, setProofImage] = useState<string | null>(null);

  const handleProofImageFile = (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      alert('Vui lòng chọn ảnh PNG, JPG, JPEG hoặc WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { alert('Ảnh không được vượt quá 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setProofImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // PayPal Interactive Modal State
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalCheckoutInfo, setPaypalCheckoutInfo] = useState<{
    orderId: string;
    amountVnd: number;
    amountUsd: number;
    exchangeRate: number;
    description: string;
    mode: string;
  } | null>(null);
  const [paypalPayTab, setPaypalPayTab] = useState<'PAYPAL_ACCOUNT' | 'CARD'>('PAYPAL_ACCOUNT');
  const [isProcessingPaypal, setIsProcessingPaypal] = useState(false);
  const [paypalSuccessTxId, setPaypalSuccessTxId] = useState<string | null>(null);
  const [paypalPurpose, setPaypalPurpose] = useState<'DEPOSIT' | 'EXCHANGE'>('DEPOSIT');

  const handleOpenPaypalModal = (amountVnd: number, description: string, purpose: 'DEPOSIT' | 'EXCHANGE') => {
    const paypalRes = paymentGateway.createPaypalCheckout({
      orderId: `PP2026${Math.floor(Math.random() * 89999 + 10000)}`,
      amountVnd: amountVnd,
      description: description,
    });
    setPaypalCheckoutInfo(paypalRes);
    setPaypalSuccessTxId(null);
    setPaypalPurpose(purpose);
    setIsProcessingPaypal(false);
    setShowPaypalModal(true);
  };

  const handleExecutePaypalPayment = async () => {
    if (!paypalCheckoutInfo) return;
    setIsProcessingPaypal(true);

    try {
      // 1. Tạo PayPal Order trên backend
      const createRes = await apiFetch('/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amountVnd: paypalCheckoutInfo.amountVnd,
          purpose: paypalPurpose === 'DEPOSIT' ? 'DEPOSIT' : 'EXCHANGE',
          description: `OrderChinaViet - ${paypalPurpose === 'DEPOSIT' ? 'Nạp tiền ví' : 'Mua tệ'} (${paypalCheckoutInfo.amountVnd.toLocaleString('vi-VN')} ₫)`,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.message || 'Lỗi khởi tạo giao dịch PayPal');

      const paypalOrderId = createData.data?.paypalOrderId || `PAYID-PP${Date.now()}`;

      // 2. Xác nhận và Khớp lệnh thanh toán PayPal tự động (Capture & Auto Credit)
      const captureRes = await apiFetch('/payments/paypal/capture-order', {
        method: 'POST',
        body: JSON.stringify({
          paypalOrderId,
          amountVnd: paypalCheckoutInfo.amountVnd,
          purpose: 'DEPOSIT',
        }),
      });
      const captureData = await captureRes.json();
      if (!captureRes.ok) throw new Error(captureData.message || 'Lỗi xác nhận thanh toán PayPal');

      setIsProcessingPaypal(false);
      setPaypalSuccessTxId(paypalOrderId);

      // Cập nhật số dư ví real-time
      await loadFinanceData();
      window.dispatchEvent(new Event('orderchinaviet_finance_updated'));

      // Tự động đóng modal sau 2s
      setTimeout(() => {
        setShowPaypalModal(false);
        setShowAddExchangeModal(false);
        setMainTab('LEDGER');
      }, 2000);
    } catch (error: any) {
      setIsProcessingPaypal(false);
      setPaypalSuccessTxId(null);
      alert(error.message || 'Không thể hoàn tất thanh toán PayPal.');
    }
  };

  const CRYPTO_TRC20_ADDRESS = 'TL8Xit9J3MwJMJ6rkwsRKeZPZJYutxFhEW';

  const handleDepositAmountChange = (rawInput: string) => {
    const digitsOnly = rawInput.replace(/\D/g, '');
    if (!digitsOnly) {
      setDepositDisplayStr('');
      setDepositVndAmount(0);
      return;
    }
    const num = parseInt(digitsOnly, 10);
    setDepositVndAmount(num);
    setDepositDisplayStr(num.toLocaleString('vi-VN'));
  };

  // Payment Gateway State inside Modal
  const [payMethod, setPayMethod] = useState<'PAYOS' | 'PAYPAL' | 'MANUAL'>('PAYOS');
  const [copiedTransferContent, setCopiedTransferContent] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Exchange Form State
  const [exchangeForm, setExchangeForm] = useState({
    type: 'VND_TO_CNY' as 'VND_TO_CNY' | 'CNY_TO_VND',
    amountCny: 0,
    accountInfo: '',
    note: '',
  });

  const loadExchangeTxs = () => {
    setExchangeTxs(exchangeStore.getTransactions());
  };

  const loadFinanceData = async () => {
    try {
      const [profile, response, depositResponse] = await Promise.all([
        authStore.refreshProfile(),
        apiFetch('/finance/transactions'),
        apiFetch('/finance/deposit-requests'),
      ]);
      const json = await readApiResponse(response);
      const depositJson = await readApiResponse(depositResponse);
      if (!response.ok) throw new Error(json.message || 'Không thể tải sổ giao dịch');
      if (!depositResponse.ok) throw new Error(depositJson.message || 'Không thể tải lịch sử nạp tiền');

      setWalletBalance(Number(profile.balanceVnd ?? 0));
      const depositRequests = depositJson.data || [];
      const depositRequestCodes = new Set(depositRequests.map((item: any) => item.requestCode));
      const postedByCode = new Map((json.data || []).map((item: any) => [item.transactionNo, item]));
      const exchangeAccountingTypes = new Set(['EXCHANGE_HOLD', 'EXCHANGE_RELEASE', 'EXCHANGE', 'EXCHANGE_SETTLED']);

      const postedLedger = (json.data || []).filter((item: any) => {
        if (exchangeAccountingTypes.has(item.type)) return false;
        return !(item.type === 'DEPOSIT' && depositRequestCodes.has(item.transactionNo));
      }).map((item: any) => {
        const amount = Number(item.amountVnd ?? 0);
        const balanceAfter = Number(item.balanceAfter ?? 0);
        return {
          id: item.transactionNo,
          type: item.type,
          typeLabel: TRANSACTION_LABELS[item.type] || item.type,
          amount,
          balanceBefore: balanceAfter - amount,
          balanceAfter,
          note: item.description || '',
          createdAt: new Date(item.createdAt).toLocaleString('vi-VN'),
          createdAtTimestamp: new Date(item.createdAt).getTime(),
          status: 'COMPLETED',
          statusLabel: 'Thành công',
          statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      });

      const depositLedger = depositRequests.map((request: any) => {
        const posted: any = postedByCode.get(request.requestCode);
        const status = String(request.status || 'PENDING');
        const isApproved = status === 'APPROVED';
        const isRejected = status === 'REJECTED';
        const balanceAfter = posted ? Number(posted.balanceAfter ?? 0) : null;
        return {
          id: request.requestCode,
          type: 'DEPOSIT',
          typeLabel: 'Nạp tiền vào ví',
          amount: Number(request.amountVnd ?? 0),
          balanceBefore: balanceAfter === null ? null : balanceAfter - Number(request.amountVnd ?? 0),
          balanceAfter,
          note: `Nạp tiền qua ${request.method || 'không xác định'}${request.reviewNote ? ` — ${request.reviewNote}` : ''}`,
          createdAt: new Date(request.createdAt).toLocaleString('vi-VN'),
          createdAtTimestamp: new Date(request.createdAt).getTime(),
          status,
          statusLabel: isApproved ? 'Đã duyệt' : isRejected ? 'Đã từ chối' : 'Chờ duyệt',
          statusClass: isApproved
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : isRejected
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200',
        };
      });

      setLedger([...postedLedger, ...depositLedger]);
    } catch (error) {
      console.error('Không thể tải dữ liệu tài chính:', error);
    }
  };

  useEffect(() => {
    const action = searchParams.get('action');
    const view = searchParams.get('view');
    if (view === 'deposit') {
      setShowAddExchangeModal(false);
      setMainTab('LEDGER');
      setFilterType('DEPOSIT');
      setLedgerPage(1);
      return;
    }
    if (view === 'exchange') {
      setShowAddExchangeModal(false);
      setMainTab('EXCHANGE');
      setExchangeFilterStatus('ALL');
      return;
    }
    if (action === 'deposit' || action === 'exchange') {
      setMainTab('EXCHANGE');
      setModalModeTab(action === 'deposit' ? 'DEPOSIT' : 'EXCHANGE');
      if (action === 'deposit') { setDepositVndAmount(0); setDepositDisplayStr(''); }
      if (action === 'exchange') setExchangeForm((current) => ({ ...current, amountCny: 0 }));
      setShowAddExchangeModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadExchangeTxs();
    void loadFinanceData();
    setSettings(settingsStore.getSettings());
    void settingsStore.refreshSettings(true).then(setSettings);

    const handleExchangeUpdate = () => {
      loadExchangeTxs();
      void loadFinanceData();
    };
    const handleSettingsUpdate = () => setSettings(settingsStore.getSettings());
    const handleFocus = () => void loadFinanceData();

    window.addEventListener('orderchinaviet_exchange_updated', handleExchangeUpdate);
    window.addEventListener('orderchinaviet_balance_updated', handleFocus);
    window.addEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('orderchinaviet_exchange_updated', handleExchangeUpdate);
      window.removeEventListener('orderchinaviet_balance_updated', handleFocus);
      window.removeEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Rates
  const rateRecharge = settings.rateVndToCny || 3680;
  const rateCashout = settings.rateCnyToVnd || 3620;
  const activeRate = exchangeForm.type === 'VND_TO_CNY' ? rateRecharge : rateCashout;
  const computedVndAmount = Math.round(exchangeForm.amountCny * activeRate);

  // Filtered & Sorted Ledger
  const exchangeLedger: LedgerTransaction[] = exchangeTxs.map((transaction) => ({
    id: transaction.id,
    type: 'EXCHANGE_REQUEST',
    typeLabel: transaction.type === 'VND_TO_CNY' ? 'Đổi VND sang CNY' : 'Đổi CNY sang VND',
    amount: transaction.type === 'VND_TO_CNY' ? -transaction.amountVnd : transaction.amountVnd,
    balanceBefore: null,
    balanceAfter: null,
    note: `${transaction.amountCny.toLocaleString('vi-VN')} CNY × ${transaction.rate.toLocaleString('vi-VN')} ₫${transaction.note ? ` — ${transaction.note}` : ''}`,
    createdAt: transaction.createdAt,
    createdAtTimestamp: (() => {
      const parts = transaction.createdAt.match(/(\d{1,2}):(\d{2}):(\d{2}) (\d{1,2})\/(\d{1,2})\/(\d{4})/);
      return parts ? new Date(Number(parts[6]), Number(parts[5]) - 1, Number(parts[4]), Number(parts[1]), Number(parts[2]), Number(parts[3])).getTime() : 0;
    })(),
    status: transaction.status,
    statusLabel: transaction.statusLabel,
    statusClass: transaction.statusClass,
  }));

  const completeLedger = [...ledger, ...exchangeLedger];
  const filteredLedger = completeLedger.filter((t) => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.note.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sortedLedger = [...filteredLedger].sort((a, b) => {
    let aVal: any = ledgerSortCol === 'createdAt' ? a.createdAtTimestamp : a[ledgerSortCol];
    let bVal: any = ledgerSortCol === 'createdAt' ? b.createdAtTimestamp : b[ledgerSortCol];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return ledgerSortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return ledgerSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Ledger Pagination
  const totalLedgerItems = sortedLedger.length;
  const totalLedgerPages = Math.max(1, Math.ceil(totalLedgerItems / ledgerPageSize));
  const validLedgerPage = Math.min(ledgerPage, totalLedgerPages);
  const startLedgerIdx = (validLedgerPage - 1) * ledgerPageSize;
  const paginatedLedger = sortedLedger.slice(startLedgerIdx, startLedgerIdx + ledgerPageSize);

  const handleLedgerSort = (col: LedgerSortCol) => {
    if (ledgerSortCol === col) {
      setLedgerSortDir(ledgerSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setLedgerSortCol(col);
      setLedgerSortDir('asc');
    }
  };

  // Filtered Exchange Transactions
  const filteredExchangeTxs = exchangeTxs.filter((tx) => {
    if (exchangeFilterStatus !== 'ALL' && tx.status !== exchangeFilterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = tx.id.toLowerCase().includes(q);
      const matchAcc = tx.accountInfo.toLowerCase().includes(q);
      if (!matchId && !matchAcc) return false;
    }
    return true;
  });

  // Submit Deposit Request to Exchange Store & Update UI
  const handleConfirmDepositRequest = async (methodName: string) => {
    if (!depositVndAmount || depositVndAmount < 50000) {
      alert('Vui lòng nhập số tiền nạp tối thiểu 50.000 ₫');
      return;
    }

    try {
      setIsSubmittingDeposit(true);
      const response = await apiFetch('/finance/deposit-requests', { method: 'POST', body: JSON.stringify({ amountVnd: depositVndAmount, method: methodName, proofImage }) });
      const json = await readApiResponse(response);
      if (!response.ok) throw new Error(json.message || 'Không thể tạo lệnh nạp tiền');
      await loadFinanceData();
      window.dispatchEvent(new Event('orderchinaviet_finance_updated'));
      
      const currentUser = authStore.getUser();
      notificationStore.notifyWalletDeposit({
        amountVnd: depositVndAmount,
        customerName: currentUser?.fullName || 'Khách hàng',
        paymentMethod: methodName,
      });

      setShowAddExchangeModal(false);
      setProofImage(null);
      setMainTab('LEDGER');
      alert(`Đã gửi yêu cầu nạp ${depositVndAmount.toLocaleString('vi-VN')} ₫ thành công. Vui lòng chờ Admin duyệt.`);
    } catch (error: any) {
      alert(error.message || 'Không thể tạo lệnh nạp tiền');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Submit New Exchange Request
  const handleSaveExchangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(exchangeForm.amountCny) || exchangeForm.amountCny <= 0) { alert('Vui lòng nhập số CNY lớn hơn 0.'); return; }
    if (exchangeForm.type === 'VND_TO_CNY' && exchangePayMethod === 'WALLET' && walletBalance < computedVndAmount) { alert(`Số dư ví còn thiếu ${(computedVndAmount - walletBalance).toLocaleString('vi-VN')} ₫. Vui lòng nạp thêm hoặc chọn PayOS, PayPal, Crypto.`); return; }
    if (!exchangeForm.accountInfo.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin tài khoản nhận tiền.');
      return;
    }

    const currentUser = authStore.getUser();
    const customerName = currentUser?.fullName || 'Nguyễn Văn Hùng';
    const customerPhone = currentUser?.phone || '0909 123 456';
    const typeLabel = exchangeForm.type === 'VND_TO_CNY' ? 'Mua Tệ (VNĐ ➔ CNY)' : 'Bán Tệ (CNY ➔ VNĐ)';

    setIsSubmittingExchange(true);
    try {
    const newTx = await exchangeStore.createTransaction({
      customerName,
      customerPhone,
      type: exchangeForm.type,
      typeLabel,
      amountCny: exchangeForm.amountCny,
      rate: activeRate,
      amountVnd: computedVndAmount,
      accountInfo: exchangeForm.accountInfo,
      note: exchangeForm.note,
      proofImage: proofImage || undefined,
      fundingMethod: exchangeForm.type === 'VND_TO_CNY' ? exchangePayMethod : 'CNY_TRANSFER',
      status: 'PENDING',
      statusLabel: 'Chờ duyệt',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
    });

    notificationStore.notifyExchangeRequest({
      id: newTx.id,
      typeLabel,
      customerName,
      amountVnd: computedVndAmount,
      amountCny: exchangeForm.amountCny,
      paymentMethod: exchangeForm.type === 'VND_TO_CNY' ? exchangePayMethod : 'Chuyển Tệ Alipay Công Ty',
    });

    loadExchangeTxs();
    setShowAddExchangeModal(false);
    setProofImage(null);
    setMainTab('EXCHANGE'); // Switch main page tab to "Quản Lý Đổi Tiền & Nạp Ví" so user sees request immediately
    alert('Trạng thái đã được cập nhật, vui lòng chờ trong giây lát.');

    setExchangeForm({
      type: 'VND_TO_CNY',
      amountCny: 0,
      accountInfo: '',
      note: '',
    });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể tạo lệnh đổi tiền');
    } finally {
      setIsSubmittingExchange(false);
    }
  };

  // Finance Summary Stats
  const currentBalance = walletBalance;
  const totalDeposit = ledger
    .filter((transaction) => transaction.type === 'DEPOSIT' && ['COMPLETED', 'APPROVED'].includes(transaction.status))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalDeducted = Math.abs(
    ledger
      .filter((transaction) => transaction.amount < 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const pendingExchangeCount = exchangeTxs.filter(t => t.status === 'PENDING').length;

  return (
    <div className="space-y-6 text-slate-800  animate-in fade-in duration-200">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase">
              CUSTOMER WALLET &amp; EXCHANGE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Quản Lý Tài Chính, Ví Dư &amp; Đổi Tiền Alipay</h1>
          <p className="text-xs text-slate-400">
            Theo dõi biến động số dư ví vận chuyển, tạo lệnh nạp ví Alipay/WeChat Pay &amp; rút tiền đổi tệ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              setMainTab('EXCHANGE');
              setShowAddExchangeModal(true);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] text-white font-bold text-xs rounded-xl shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Tạo Đổi Tiền / Nạp Ví</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl shrink-0">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Số Dư Khả Dụng Ví</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 font-mono mt-0.5">{currentBalance.toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl shrink-0">
            <ArrowUpRight className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tổng Nạp Vào Ví</p>
            <p className="text-lg sm:text-xl font-bold text-sky-600 font-mono mt-0.5">{totalDeposit.toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl shrink-0">
            <ArrowDownToLine className="w-6 h-6 text-[#fa3131]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tổng Đã Thanh Toán</p>
            <p className="text-lg sm:text-xl font-bold text-[#fa3131] font-mono mt-0.5">{totalDeducted.toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Lệnh Đổi Tiền Chờ Duyệt</p>
            <p className="text-lg sm:text-xl font-bold text-amber-600 font-mono mt-0.5">{pendingExchangeCount} Lệnh</p>
          </div>
        </div>
      </div>

      {/* Main Feature Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-1.5 flex items-center gap-2">
        <button
          onClick={() => setMainTab('LEDGER')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${mainTab === 'LEDGER'
              ? 'bg-[#fa3131] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Sổ Sách Giao Dịch Ví Dư ({completeLedger.length})</span>
        </button>

        <button
          onClick={() => setMainTab('EXCHANGE')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${mainTab === 'EXCHANGE'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Quản Lý Đổi Tiền &amp; Nạp Ví Alipay ({exchangeTxs.length})</span>
        </button>
      </div>

      {/* ── TAB 1: SỔ SÁCH GIAO DỊCH VÍ DƯ ── */}
      {mainTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Sub-filter & Search */}
          <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {[
                { key: 'ALL', label: 'Tất Cả Giao Dịch' },
                { key: 'DEPOSIT', label: 'Nạp Tiền Vào Ví' },
                { key: 'EXCHANGE_REQUEST', label: 'Đổi Tiền' },
                { key: 'FEE_DEDUCT', label: 'Trừ Phí Cước & Dịch Vụ' },
              ].map((tab) => {
                const count = tab.key === 'ALL' ? completeLedger.length : completeLedger.filter((item) => item.type === tab.key).length;
                return (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${filterType === tab.key ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {tab.label} ({count})
                </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã TXN-... hoặc nội dung"
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#fa3131]"
              />
            </div>
          </div>

          {/* Ledger Datatable */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-xs sm:text-sm">Sổ Sách Giao Dịch Ví Dư <span className="text-[#fa3131]">({totalLedgerItems})</span></h2>
              <button className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200">
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] select-none">
                  <tr>
                    <th className="py-3 px-4">
                      <button onClick={() => handleLedgerSort('id')} className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#fa3131] cursor-pointer">
                        <span>Mã Giao Dịch</span>
                        {ledgerSortCol === 'id' ? (ledgerSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[#fa3131]" /> : <ChevronDown className="w-3 h-3 text-[#fa3131]" />) : <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">Loại Giao Dịch</th>
                    <th className="py-3 px-4">Số Tiền (VNĐ)</th>
                    <th className="py-3 px-4">Số Dư Sau</th>
                    <th className="py-3 px-4">Nội Dung Chi Tiết</th>
                    <th className="py-3 px-4">Ngày Tạo</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {paginatedLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131] whitespace-nowrap">{tx.id}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : tx.type === 'EXCHANGE_REQUEST' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {tx.typeLabel}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-bold whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString('vi-VN')}` : tx.amount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {tx.balanceAfter === null ? '—' : `${tx.balanceAfter.toLocaleString('vi-VN')} ₫`}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm text-slate-700 leading-snug">
                        {tx.note}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.createdAt}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tx.statusClass}`}>
                          {tx.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <span>Hiển thị</span>
                <select
                  value={ledgerPageSize}
                  onChange={(e) => {
                    setLedgerPageSize(Number(e.target.value));
                    setLedgerPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>hàng / trang</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                  disabled={validLedgerPage === 1}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700 px-2">Trang {validLedgerPage} / {totalLedgerPages}</span>
                <button
                  type="button"
                  onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
                  disabled={validLedgerPage === totalLedgerPages}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: QUẢN LÝ ĐỔI TIỀN & NẠP VÍ ALIPAY ── */}
      {mainTab === 'EXCHANGE' && (
        <div className="space-y-4">
          {/* Action Header & Sub Filter */}
          <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {[
                { key: 'ALL', label: 'Tất Cả Lệnh' },
                { key: 'PENDING', label: 'Chờ duyệt' },
                { key: 'COMPLETED', label: 'Đã hoàn tất' },
                { key: 'REJECTED', label: 'Đã từ chối' },
              ].map((tab) => {
                const count = tab.key === 'ALL' ? exchangeTxs.length : exchangeTxs.filter((transaction) => transaction.status === tab.key).length;
                return (
                <button
                  key={tab.key}
                  onClick={() => setExchangeFilterStatus(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${exchangeFilterStatus === tab.key ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {tab.label} ({count})
                </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAddExchangeModal(true)}
              className="px-4 py-2 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đơn Đổi Tiền / Nạp Ví Mới</span>
            </button>
          </div>

          {/* Exchange Datatable */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 overflow-hidden">
            {filteredExchangeTxs.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-500 space-y-2">
                <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto stroke-1.5" />
                <p className="font-bold text-xs sm:text-sm text-slate-800">Không tìm thấy lệnh đổi tiền nào</p>
                <p className="text-xs text-slate-400">Bấm nút "Tạo Đơn Đổi Tiền Mới" để tạo lệnh nạp ví Alipay hoặc bán tệ.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] select-none">
                    <tr>
                      <th className="py-3 px-4">Mã Giao Dịch</th>
                      <th className="py-3 px-4">Loại Giao Dịch</th>
                      <th className="py-3 px-4">Số Tiền NDT (¥)</th>
                      <th className="py-3 px-4">Tỷ Giá Quy Đổi</th>
                      <th className="py-3 px-4">Thành Tiền (VNĐ)</th>
                      <th className="py-3 px-4">Tài Khoản Nhận</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4">Thời Gian Tạo</th>
                      <th className="py-3 px-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {filteredExchangeTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-600 whitespace-nowrap">{tx.id}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${tx.type === 'VND_TO_CNY' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {tx.typeLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                          ¥{tx.amountCny.toLocaleString('zh-CN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          1 ¥ = {tx.rate.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0c3ed0] whitespace-nowrap">
                          {tx.amountVnd.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 max-w-xs font-mono text-[11px] text-slate-800 break-words">
                          {tx.accountInfo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tx.statusClass}`}>
                            {tx.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {tx.createdAt}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => setDetailExchangeTx(tx)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 1: TẠO YÊU CẦU NẠP TIỀN & ĐỔI TIỀN (2 TABS - MAX WIDTH 2XL) ── */}
      {showAddExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Trung Tâm Nạp Tiền &amp; Đổi Tiền Tệ (Alipay / WeChat)</h3>
                <p className="text-xs text-slate-500">Thanh toán tự động PayOS VietQR, PayPal USD, Crypto TRC20 &amp; QR Alipay</p>
              </div>
              <button
                onClick={() => setShowAddExchangeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Mode Tabs: Nạp Tiền vs Đổi Tiền */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalModeTab('DEPOSIT')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modalModeTab === 'DEPOSIT'
                    ? 'bg-[#fa3131] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Nạp Tiền Vào Ví Dư</span>
              </button>

              <button
                type="button"
                onClick={() => setModalModeTab('EXCHANGE')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modalModeTab === 'EXCHANGE'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Đổi Tiền (Mua Tệ / Bán Tệ)</span>
              </button>
            </div>

            {/* ── MODE 1: NẠP TIỀN VÀO VÍ DƯ (DEPOSIT) ── */}
            {modalModeTab === 'DEPOSIT' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Tiền Muốn Nạp Vào Ví (VNĐ ₫) <span className="text-slate-400 font-normal">(Nhập tự động phân cách hàng nghìn)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={depositDisplayStr}
                      onChange={(e) => handleDepositAmountChange(e.target.value)}
                      placeholder="1.000.000"
                      className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-[#0c3ed0] focus:outline-none focus:border-[#fa3131]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₫</span>
                  </div>
                  {depositVndAmount > 0 && (
                    <div className="text-[11px] font-bold font-mono text-emerald-700 mt-1">
                      = {depositVndAmount.toLocaleString('vi-VN')} Việt Nam Đồng
                    </div>
                  )}
                </div>

                {/* 3 Payment Methods Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Chọn Cổng Thanh Toán Tự Động</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDepositPayMethod('PAYOS')}
                      className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${depositPayMethod === 'PAYOS'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>PayOS VietQR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDepositPayMethod('PAYPAL')}
                      className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${depositPayMethod === 'PAYPAL'
                          ? 'bg-[#003087] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>PayPal USD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDepositPayMethod('CRYPTO')}
                      className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${depositPayMethod === 'CRYPTO'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ví Crypto</span>
                    </button>
                  </div>
                </div>

                {/* 1. PAYOS VIETQR VIEW */}
                {depositPayMethod === 'PAYOS' && (() => {
                  const checkout = paymentGateway.createPayosCheckout({
                    orderId: `DEP2026${Math.floor(Math.random() * 8999 + 1000)}`,
                    amountVnd: depositVndAmount,
                    description: `Nap tien vi du OCV`,
                  });

                  return (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3.5 text-xs">
                      <div
                        onClick={() => {
                          setZoomImageSrc(checkout.qrCodeUrl);
                          setZoomImageTitle('Mã QR PayOS VietQR Ngân Hàng');
                        }}
                        className="w-32 h-32 bg-white p-1.5 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-center shrink-0 relative group cursor-pointer overflow-hidden"
                      >
                        <img
                          src={checkout.qrCodeUrl}
                          alt="PayOS VietQR Code"
                          className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold rounded-xl gap-1">
                          <Maximize2 className="w-5 h-5 text-emerald-400" />
                          <span>Bấm Phóng To</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-slate-800 flex-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chuyển Khoản Tự Động Duyệt 24/7</span>
                        </div>
                        <div>Ngân Hàng: <strong className="font-bold">{checkout.bankName}</strong></div>
                        <div>Số TK: <strong className="font-mono font-bold text-slate-900">{checkout.accountNumber}</strong></div>
                        <div>Tên TK: <strong className="font-bold">{checkout.accountName}</strong></div>
                        <div className="flex items-center gap-1 pt-0.5">
                          <span className="text-slate-500">Nội dung:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                            {checkout.transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(checkout.transferContent);
                              setCopiedTransferContent(true);
                              setTimeout(() => setCopiedTransferContent(false), 2000);
                            }}
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer ml-1"
                          >
                            {copiedTransferContent ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedTransferContent ? 'Đã chép' : 'Chép'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. PAYPAL STANDARD FORM VIEW */}
                {depositPayMethod === 'PAYPAL' && (() => {
                  const paypal = paymentGateway.createPaypalCheckout({
                    orderId: `DEP2026${Math.floor(Math.random() * 8999 + 1000)}`,
                    amountVnd: depositVndAmount,
                    description: `Wallet Deposit ${depositVndAmount} VND`,
                  });

                  return (
                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-sky-900">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-[#003087] text-white font-mono font-bold text-[10px] flex items-center justify-center">
                            PP
                          </span>
                          <span>PayPal International Checkout</span>
                        </div>
                        <span className="font-mono text-[10px] text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                          {paypal.mode.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-sky-200 font-mono space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Số Tiền VNĐ:</span>
                          <span className="font-bold text-slate-900">{paypal.amountVnd.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tỷ Giá Quy Đổi:</span>
                          <span className="font-bold text-slate-900">1 USD = {paypal.exchangeRate.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-bold text-sm pt-1.5 border-t border-sky-100">
                          <span>Tổng Tiền PayPal USD:</span>
                          <span>${paypal.amountUsd.toFixed(2)} USD</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPaypalModal(depositVndAmount, `Nạp ${depositVndAmount.toLocaleString('vi-VN')} ₫ vào Ví Dư`, 'DEPOSIT')}
                        className="w-full py-3 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <span className="font-bold font-mono text-sm">Pay with PayPal (${paypal.amountUsd.toFixed(2)} USD)</span>
                      </button>
                    </div>
                  );
                })()}

                {/* 3. VÍ CRYPTO USDT TRC20 VIEW */}
                {depositPayMethod === 'CRYPTO' && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs">
                    <div className="text-center space-y-2">
                      <div
                        onClick={() => {
                          setZoomImageSrc(cryptoQrImg);
                          setZoomImageTitle('Mã QR Ví Crypto USDT (Mạng TRC20)');
                        }}
                        className="w-36 h-36 bg-white p-1 rounded-xl border border-amber-200 shadow-xs mx-auto overflow-hidden relative group cursor-pointer"
                      >
                        <Image
                          src={cryptoQrImg}
                          alt="Mã QR Ví Crypto USDT TRC20"
                          width={144}
                          height={144}
                          className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold rounded-xl gap-1">
                          <Maximize2 className="w-5 h-5 text-amber-300" />
                          <span>Bấm Phóng To</span>
                        </div>
                      </div>
                      <div className="font-bold text-amber-900 text-xs">Quét Mã QR Ví Crypto USDT (Mạng TRC20)</div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Địa Chỉ Ví USDT (TRC20):</div>
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="truncate mr-2">{CRYPTO_TRC20_ADDRESS}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(CRYPTO_TRC20_ADDRESS);
                            setCopiedCryptoAddress(true);
                            setTimeout(() => setCopiedCryptoAddress(false), 2000);
                          }}
                          className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedCryptoAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCryptoAddress ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>

                      <div className="pt-1 flex justify-between font-mono text-[11px] text-slate-600">
                        <span>Số Tiền Quy Đổi USDT:</span>
                        <span className="font-bold text-amber-700">~{(depositVndAmount / 25400).toFixed(2)} USDT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proof Image Upload Box (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Ảnh Chứng Minh / Hóa Đơn Thanh Toán <span className="text-slate-400 font-normal">(Không bắt buộc)</span></span>
                  </label>
                  {!proofImage ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleProofImageFile(e.dataTransfer.files[0]);
                        }
                      }}
                      className="p-3.5 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl bg-slate-50 hover:bg-sky-50/50 transition-all text-center cursor-pointer group"
                    >
                      <input
                        type="file"
                        id="proof-upload-deposit"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleProofImageFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="proof-upload-deposit" className="cursor-pointer space-y-1 block">
                        <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-slate-400 group-hover:text-sky-600 group-hover:border-sky-200 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-700 group-hover:text-sky-700">
                          Kéo &amp; thả ảnh vào đây hoặc <span className="text-sky-600 underline">Tải lên từ máy</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Hỗ trợ PNG, JPG, WEBP, JPEG</p>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => {
                            setZoomImageSrc(proofImage);
                            setZoomImageTitle('Ảnh Chứng Minh Thanh Toán Nạp Tiền');
                          }}
                          className="w-14 h-14 bg-white rounded-xl border border-emerald-200 overflow-hidden shrink-0 relative group cursor-pointer"
                        >
                          <img src={proofImage} alt="Proof image preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Đã Chọn Ảnh Hóa Đơn</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">Bấm vào hình để xem lớn</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProofImage(null)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-xl border border-slate-200 hover:border-rose-200 text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        Xóa Ảnh
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowSocialContactModal(true)}
                    className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-sky-200 transition-colors"
                  >
                    <Headset className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Liên Hệ CSKH Hỗ Trợ</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExchangeModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingDeposit}
                      onClick={() =>
                        handleConfirmDepositRequest(
                          depositPayMethod === 'PAYOS'
                            ? 'PayOS VietQR'
                            : depositPayMethod === 'PAYPAL'
                              ? 'PayPal USD'
                              : 'Ví Crypto TRC20'
                        )
                      }
                      className="px-5 py-2 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingDeposit ? 'Đang gửi yêu cầu...' : 'Xác Nhận Nạp Tiền'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODE 2: ĐỔI TIỀN (MUA TỆ / BÁN TỆ) ── */}
            {modalModeTab === 'EXCHANGE' && (
              <form onSubmit={handleSaveExchangeRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại Giao Dịch Đổi Tiền</label>
                  <select
                    value={exchangeForm.type}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, type: e.target.value as 'VND_TO_CNY' | 'CNY_TO_VND' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-600 cursor-pointer"
                  >
                    <option value="VND_TO_CNY">Mua Tệ NDT / Nạp Ví Alipay &amp; WeChat (VNĐ ➔ CNY)</option>
                    <option value="CNY_TO_VND">Bán Tệ NDT / Rút VNĐ Về Ngân Hàng (CNY ➔ VNĐ)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền Nhân Dân Tệ (CNY ¥)</label>
                    <input
                      type="number"
                      min="10"
                      required
                      value={exchangeForm.amountCny}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, amountCny: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Thành Tiền Việt Nam Đồng (VNĐ ₫)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${computedVndAmount.toLocaleString('vi-VN')} ₫`}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0c3ed0] focus:outline-none cursor-default"
                    />
                  </div>
                </div>

                {/* Dynamic Rate Info Box */}
                <div className="p-3 bg-sky-50/80 rounded-2xl border border-sky-200 flex justify-between items-center text-xs text-sky-900 font-semibold">
                  <span>Tỷ giá {exchangeForm.type === 'VND_TO_CNY' ? 'Mua Tệ (Nạp Ví)' : 'Bán Tệ (Rút VNĐ)'}:</span>
                  <span className="font-mono font-bold text-sky-700 text-sm">1 ¥ = {activeRate.toLocaleString('vi-VN')} ₫</span>
                </div>

                {/* IF MUA TỆ (VNĐ ➔ CNY): DISPLAY 3 AUTOMATIC PAYMENT METHODS TO PAY VNĐ */}
                {exchangeForm.type === 'VND_TO_CNY' && (
                  <div className="space-y-3 pt-1">
                    <label className="block text-xs font-bold text-slate-700">Chọn Phương Thức Thanh Toán VNĐ Để Mua Tệ</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                      <button type="button" onClick={() => setExchangePayMethod('WALLET')} className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${exchangePayMethod === 'WALLET' ? 'bg-[#0c3ed0] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Wallet className="w-3.5 h-3.5"/><span>Số Dư Ví</span></button>
                      <button
                        type="button"
                        onClick={() => setExchangePayMethod('PAYOS')}
                        className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${exchangePayMethod === 'PAYOS'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>PayOS VietQR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExchangePayMethod('PAYPAL')}
                        className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${exchangePayMethod === 'PAYPAL'
                            ? 'bg-[#003087] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>PayPal USD</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExchangePayMethod('CRYPTO')}
                        className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${exchangePayMethod === 'CRYPTO'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ví Crypto</span>
                      </button>
                    </div>

                    {/* PayOS VietQR for Mua Tệ */}
                    {exchangePayMethod === 'WALLET' && <div className={`rounded-2xl border p-4 text-xs ${walletBalance >= computedVndAmount && computedVndAmount > 0 ? 'border-blue-200 bg-blue-50' : 'border-rose-200 bg-rose-50'}`}><div className="flex items-center justify-between"><span>Số dư ví hiện tại</span><b className="font-mono">{walletBalance.toLocaleString('vi-VN')} ₫</b></div><div className="mt-2 flex items-center justify-between"><span>Số tiền cần giữ</span><b className="font-mono">{computedVndAmount.toLocaleString('vi-VN')} ₫</b></div><p className={`mt-3 border-t pt-2 font-bold ${walletBalance >= computedVndAmount && computedVndAmount > 0 ? 'text-blue-700' : 'text-rose-700'}`}>{computedVndAmount <= 0 ? 'Vui lòng nhập số CNY muốn mua.' : walletBalance >= computedVndAmount ? 'Số dư đủ. Tiền sẽ được giữ khi tạo lệnh.' : `Số dư còn thiếu ${(computedVndAmount-walletBalance).toLocaleString('vi-VN')} ₫.`}</p></div>}
                    {exchangePayMethod === 'PAYOS' && (() => {
                      const checkout = paymentGateway.createPayosCheckout({
                        orderId: `EX2026${Math.floor(Math.random() * 8999 + 1000)}`,
                        amountVnd: computedVndAmount,
                        description: `Mua ${exchangeForm.amountCny} RMB Alipay`,
                      });

                      return (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3 text-xs">
                          <div
                            onClick={() => {
                              setZoomImageSrc(checkout.qrCodeUrl);
                              setZoomImageTitle('Mã QR PayOS VietQR Ngân Hàng');
                            }}
                            className="w-28 h-28 bg-white p-1 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-center shrink-0 relative group cursor-pointer overflow-hidden"
                          >
                            <img src={checkout.qrCodeUrl} alt="PayOS VietQR" className="w-full h-full object-contain rounded-lg" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4 text-emerald-400" />
                            </div>
                          </div>
                          <div className="space-y-1 text-slate-800 flex-1">
                            <div className="font-bold text-emerald-900 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Quét QR Chuyển Khoản Tự Động</span>
                            </div>
                            <div>Ngân Hàng: <strong className="font-bold">{checkout.bankName}</strong></div>
                            <div>Số TK: <strong className="font-mono font-bold text-slate-900">{checkout.accountNumber}</strong></div>
                            <div>Tên TK: <strong className="font-bold">{checkout.accountName}</strong></div>
                            <div>Cú Pháp: <strong className="font-mono font-bold text-emerald-800 bg-white px-1 py-0.5 rounded border border-emerald-300">{checkout.transferContent}</strong></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* PayPal Form for Mua Tệ */}
                    {exchangePayMethod === 'PAYPAL' && (() => {
                      const paypal = paymentGateway.createPaypalCheckout({
                        orderId: `EX2026${Math.floor(Math.random() * 8999 + 1000)}`,
                        amountVnd: computedVndAmount,
                        description: `Buy ${exchangeForm.amountCny} RMB Alipay`,
                      });

                      return (
                        <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between font-mono">
                            <span>Thành Tiền VNĐ: <strong>{paypal.amountVnd.toLocaleString('vi-VN')} ₫</strong></span>
                            <span>USD: <strong className="text-rose-600">${paypal.amountUsd.toFixed(2)} USD</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenPaypalModal(computedVndAmount, `Mua ${exchangeForm.amountCny} RMB Alipay`, 'EXCHANGE')}
                            className="w-full py-2.5 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                          >
                            <span className="font-bold font-mono">Pay with PayPal (${paypal.amountUsd.toFixed(2)} USD)</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Crypto TRC20 for Mua Tệ */}
                    {exchangePayMethod === 'CRYPTO' && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs">
                        <div
                          onClick={() => {
                            setZoomImageSrc(cryptoQrImg);
                            setZoomImageTitle('Mã QR Ví Crypto USDT (TRC20)');
                          }}
                          className="w-24 h-24 bg-white p-1 rounded-xl border border-amber-200 shadow-xs shrink-0 cursor-pointer overflow-hidden relative group"
                        >
                          <Image src={cryptoQrImg} alt="Crypto QR" width={96} height={96} className="w-full h-full object-contain rounded-lg" />
                        </div>
                        <div className="space-y-1 font-mono text-amber-900 flex-1">
                          <div className="font-bold text-xs">Ví USDT (Mạng TRC20):</div>
                          <div className="text-[11px] font-bold text-slate-900 bg-white p-1.5 rounded border border-amber-300 truncate">
                            {CRYPTO_TRC20_ADDRESS}
                          </div>
                          <div className="text-[11px]">~{(computedVndAmount / 25400).toFixed(2)} USDT</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* IF BÁN TỆ NDT (CNY ➔ VNĐ): DISPLAY COMPANY ALIPAY QR CODE */}
                {exchangeForm.type === 'CNY_TO_VND' && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center text-xs">
                    <div
                      onClick={() => {
                        setZoomImageSrc(alipayQrImg);
                        setZoomImageTitle('Mã QR Alipay Công Ty Nhận Tệ NDT');
                      }}
                      className="w-32 h-32 bg-white p-1 rounded-xl border border-slate-200 shadow-xs mx-auto overflow-hidden relative group cursor-pointer"
                    >
                      <Image
                        src={alipayQrImg}
                        alt="Mã QR Alipay Công Ty"
                        width={128}
                        height={128}
                        className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold rounded-xl gap-1">
                        <Maximize2 className="w-5 h-5 text-sky-300" />
                        <span>Bấm Phóng To</span>
                      </div>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">Mã QR Alipay Công Ty Nhận Tệ NDT</div>
                    <p className="text-[11px] text-slate-500">
                      Vui lòng quét mã QR Alipay bên trên để chuyển tiền Nhân Dân Tệ, sau đó điền thông tin tài khoản ngân hàng nhận VNĐ bên dưới.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {exchangeForm.type === 'VND_TO_CNY'
                      ? 'Tài Khoản Ví Alipay / WeChat ID Của Bạn Nhận CNY'
                      : 'Tài Khoản Ngân Hàng VNĐ Của Bạn Nhận Tiền (Ngân Hàng, STK, Tên TK)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={exchangeForm.accountInfo}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, accountInfo: e.target.value })}
                    placeholder={
                      exchangeForm.type === 'VND_TO_CNY'
                        ? 'Ví dụ: alipay_acc@gmail.com hoặc WeChat ID: user123'
                        : 'Ví dụ: Vietcombank - 0071001234567 - NGUYEN VAN A'
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Cho CSKH</label>
                  <input
                    type="text"
                    value={exchangeForm.note}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, note: e.target.value })}
                    placeholder="Ghi chú thêm nếu có..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                {/* Proof Image Upload Box (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Ảnh Chứng Minh / Biên Lai Đổi Tiền <span className="text-slate-400 font-normal">(Không bắt buộc)</span></span>
                  </label>
                  {!proofImage ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleProofImageFile(e.dataTransfer.files[0]);
                        }
                      }}
                      className="p-3.5 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl bg-slate-50 hover:bg-sky-50/50 transition-all text-center cursor-pointer group"
                    >
                      <input
                        type="file"
                        id="proof-upload-exchange"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleProofImageFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="proof-upload-exchange" className="cursor-pointer space-y-1 block">
                        <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-slate-400 group-hover:text-sky-600 group-hover:border-sky-200 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-700 group-hover:text-sky-700">
                          Kéo &amp; thả ảnh chứng minh vào đây hoặc <span className="text-sky-600 underline">Tải lên từ máy</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Hỗ trợ PNG, JPG, WEBP, JPEG</p>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => {
                            setZoomImageSrc(proofImage);
                            setZoomImageTitle('Ảnh Chứng Minh Giao Dịch Đổi Tiền');
                          }}
                          className="w-14 h-14 bg-white rounded-xl border border-emerald-200 overflow-hidden shrink-0 relative group cursor-pointer"
                        >
                          <img src={proofImage} alt="Proof image preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Đã Chọn Ảnh Hóa Đơn</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">Bấm vào hình để xem lớn</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProofImage(null)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-xl border border-slate-200 hover:border-rose-200 text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        Xóa Ảnh
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowSocialContactModal(true)}
                    className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-sky-200 transition-colors"
                  >
                    <Headset className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Liên Hệ CSKH Hỗ Trợ</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExchangeModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingExchange}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-60"
                    >
                      <span>{isSubmittingExchange ? 'Đang gửi...' : 'Gửi Yêu Cầu Đổi Tiền'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 4: KÊNH MẠNG XÃ HỘI CSKH SUPPORT (LOAD DỮ LIỆU ĐỘNG 100%) ── */}
      {showSocialContactModal && (
        <div
          onClick={() => setShowSocialContactModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-slate-800 max-h-[88vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowSocialContactModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                <Headset className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tổng Đài CSKH &amp; Mạng Xã Hội Hỗ Trợ</h3>
                <p className="text-xs text-slate-500">Cấu hình kênh liên hệ trực tiếp 24/7 từ hệ thống</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              {/* 1. HOTLINE */}
              {settings.showHotline && settings.hotline && (
                <a
                  href={`tel:${settings.hotline.split('/')[0].trim()}`}
                  className="p-3 bg-slate-50 hover:bg-rose-50 rounded-2xl border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#fa3131]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Hotline CSKH</div>
                    <div className="font-mono font-bold text-slate-900 text-xs truncate group-hover:text-[#fa3131]">
                      {settings.hotline}
                    </div>
                  </div>
                </a>
              )}

              {/* 2. EMAIL */}
              {settings.showEmail && settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="p-3 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-200 hover:border-sky-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Email Hỗ Trợ</div>
                    <div className="font-mono font-bold text-slate-900 text-xs truncate group-hover:text-sky-600">
                      {settings.email}
                    </div>
                  </div>
                </a>
              )}

              {/* 3. ZALO */}
              {settings.showZaloLink && settings.zaloLink && (
                <a
                  href={settings.zaloLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-200 hover:border-sky-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative shrink-0 bg-white p-0.5 border border-slate-200">
                    <Image src={zaloImg} alt="Zalo" width={28} height={28} className="object-contain w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Zalo Chat 24/7</div>
                    <div className="font-bold text-sky-700 text-xs truncate group-hover:underline">
                      Chat Ngay Qua Zalo
                    </div>
                  </div>
                </a>
              )}

              {/* 4. TELEGRAM */}
              {settings.showTelegramLink && settings.telegramLink && (
                <a
                  href={settings.telegramLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative shrink-0 bg-white p-0.5 border border-slate-200">
                    <Image src={telegramImg} alt="Telegram" width={28} height={28} className="object-contain w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Telegram</div>
                    <div className="font-mono font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600">
                      @{settings.telegramLink.split('/').pop() || 'orderchinaviet'}
                    </div>
                  </div>
                </a>
              )}

              {/* 5. WECHAT */}
              {settings.showWechatId && settings.wechatId && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative shrink-0 bg-white p-0.5 border border-slate-200">
                    <Image src={wechatImg} alt="WeChat" width={28} height={28} className="object-contain w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">WeChat Kho TQ</div>
                    <div className="font-mono font-bold text-emerald-700 text-xs truncate">
                      ID: {settings.wechatId}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. WHATSAPP */}
              {settings.showWhatsappLink && settings.whatsappLink && (
                <a
                  href={settings.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative shrink-0 bg-white p-0.5 border border-slate-200">
                    <Image src={whatsappImg} alt="WhatsApp" width={28} height={28} className="object-contain w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">WhatsApp</div>
                    <div className="font-bold text-emerald-700 text-xs truncate group-hover:underline">
                      WhatsApp Support
                    </div>
                  </div>
                </a>
              )}

              {/* 7. FACEBOOK */}
              {settings.showFacebookLink && settings.facebookLink && (
                <a
                  href={settings.facebookLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative shrink-0 bg-white p-0.5 border border-slate-200">
                    <Image src={facebookImg} alt="Facebook" width={28} height={28} className="object-contain w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Facebook Page</div>
                    <div className="font-bold text-blue-700 text-xs truncate group-hover:underline">
                      OrderChinaViet Fanpage
                    </div>
                  </div>
                </a>
              )}

              {/* 8. TIKTOK */}
              {settings.showTiktokLink && settings.tiktokLink && (
                <a
                  href={settings.tiktokLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">TikTok Channel</div>
                    <div className="font-bold text-slate-900 text-xs truncate group-hover:underline">
                      TikTok Logistics
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* ADDRESSES & WORKING HOURS */}
            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
              {settings.showAddressVietnam && settings.addressVietnam && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#fa3131] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-slate-900">Kho / VP Việt Nam:</strong> {settings.addressVietnam}
                  </div>
                </div>
              )}

              {settings.showAddressChina && settings.addressChina && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-slate-900">Kho / VP Bằng Tường Trung Quốc:</strong> {settings.addressChina}
                  </div>
                </div>
              )}

              {settings.showWorkingHours && settings.workingHours && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Thời gian hỗ trợ: <strong className="text-slate-900 font-bold">{settings.workingHours}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: HIỂN THỊ PHÓNG TO ẢNH QR CODE ── */}
      {zoomImageSrc && (
        <div
          onClick={() => setZoomImageSrc(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-center text-slate-800"
          >
            <button
              onClick={() => setZoomImageSrc(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{zoomImageTitle || 'Chi Tiết Mã QR Code'}</h3>
            <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center overflow-hidden">
              {typeof zoomImageSrc === 'string' ? (
                <img src={zoomImageSrc} alt="QR Code Lightbox" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Image src={zoomImageSrc} alt="QR Code Lightbox" width={288} height={288} className="w-full h-full object-contain rounded-xl" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Bấm bất kỳ đâu xung quanh để đóng cửa sổ phóng to.</p>
          </div>
        </div>
      )}

      {/* ── MODAL 2: XEM CHI TIẾT LỆNH ĐỔI TIỀN ── */}
      {detailExchangeTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-sky-600">{detailExchangeTx.id}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${detailExchangeTx.statusClass}`}>
                  {detailExchangeTx.statusLabel}
                </span>
              </div>
              <button
                onClick={() => setDetailExchangeTx(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Loại Giao Dịch</div>
                <div className="font-bold text-amber-400">{detailExchangeTx.typeLabel}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Số Tiền NDT (¥)</div>
                  <div className="font-mono font-bold text-rose-600 text-sm">¥{detailExchangeTx.amountCny.toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tỷ Giá Quy Đổi</div>
                  <div className="font-mono font-bold text-slate-900">1 ¥ = {detailExchangeTx.rate.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Thành Tiền VNĐ</div>
                  <div className="font-mono font-bold text-[#0c3ed0] text-base">{detailExchangeTx.amountVnd.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1">
                <div className="font-bold text-sky-900">Tài khoản nhận tiền:</div>
                <div className="font-mono font-bold text-slate-800 bg-white p-2 rounded-lg border border-sky-200">{detailExchangeTx.accountInfo}</div>
              </div>

              {detailExchangeTx.note && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-700">Ghi chú:</div>
                  <div className="text-slate-600 italic">{detailExchangeTx.note}</div>
                </div>
              )}

              {(detailExchangeTx.reviewNote || detailExchangeTx.reviewImage) && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs"><div className="mb-2 font-bold text-blue-900">Phản hồi từ quản trị viên</div>{detailExchangeTx.reviewNote&&<p className="whitespace-pre-wrap text-slate-700">{detailExchangeTx.reviewNote}</p>}{detailExchangeTx.reviewImage&&<div onClick={()=>{setZoomImageSrc(detailExchangeTx.reviewImage);setZoomImageTitle(`Ảnh phản hồi - ${detailExchangeTx.id}`)}} className="mt-3 h-32 cursor-pointer overflow-hidden rounded-xl border bg-white"><img src={detailExchangeTx.reviewImage} alt="Ảnh phản hồi admin" className="h-full w-full object-contain"/></div>}</div>}

              {detailExchangeTx.proofImage && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-900 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ảnh chứng minh thanh toán / hóa đơn:</span>
                  </div>
                  <div
                    onClick={() => {
                      setZoomImageSrc(detailExchangeTx.proofImage);
                      setZoomImageTitle(`Ảnh Chứng Minh - Lệnh ${detailExchangeTx.id}`);
                    }}
                    className="w-24 h-24 bg-white rounded-xl border border-emerald-200 overflow-hidden relative group cursor-pointer"
                  >
                    <img src={detailExchangeTx.proofImage} alt="Proof image" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                      <Maximize2 className="w-4 h-4 text-emerald-300" />
                      <span>Phóng To</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailExchangeTx(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: CHÍNH THỨC POPUP THANH TOÁN PAYPAL INTERNATIONAL CHECKOUT ── */}
      {showPaypalModal && paypalCheckoutInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 text-slate-800 relative">
            {/* PayPal Navy Header Bar */}
            <div className="bg-[#003087] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFC439] text-[#003087] font-black italic flex items-center justify-center text-xs shadow-inner">
                  P
                </div>
                <div className="font-bold tracking-wide font-mono text-sm flex items-center gap-1.5">
                  <span className="text-white">PayPal</span>
                  <span className="text-[#0070BA] font-light">Checkout</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-700/60">
                  {paypalCheckoutInfo.mode.toUpperCase()} MODE
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaypalModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Merchant & Order Amount Summary */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Đơn Vị Nhận Thanh Toán</div>
                  <div className="font-bold text-slate-900 text-xs">ORDERCHINAVIET LOGISTICS CO., LTD</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">{paypalCheckoutInfo.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Tổng Tiền Thanh Toán</div>
                  <div className="font-mono font-bold text-[#003087] text-base sm:text-lg">${paypalCheckoutInfo.amountUsd.toFixed(2)} USD</div>
                  <div className="text-[10px] font-mono text-slate-500">~{paypalCheckoutInfo.amountVnd.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>
            </div>

            {/* State A: Successful Checkout Result */}
            {paypalSuccessTxId ? (
              <div className="p-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Thanh Toán PayPal Thành Công!</h3>
                  <p className="text-xs text-slate-600 font-medium">Giao dịch qua PayPal International đã hoàn tất an toàn.</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 font-mono text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã Giao Dịch PayPal:</span>
                    <strong className="text-emerald-900">{paypalSuccessTxId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số Tiền Khách Trả:</span>
                    <strong className="text-slate-900">${paypalCheckoutInfo.amountUsd.toFixed(2)} USD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số Tiền Quy Đổi Ví:</span>
                    <strong className="text-slate-900">{paypalCheckoutInfo.amountVnd.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trạng Thái:</span>
                    <strong className="text-emerald-700">COMPLETED (Đã Thanh Toán)</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">Đang tự động cập nhật hệ thống và đóng cửa sổ...</p>
              </div>
            ) : isProcessingPaypal ? (
              /* State B: Processing Spinner */
              <div className="p-8 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#0070BA] animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Đang Xử Lý Giao Dịch Qua PayPal...</h4>
                  <p className="text-xs text-slate-500">Đang bảo mật truyền dữ liệu với PayPal Gateway Server. Vui lòng không đóng cửa sổ.</p>
                </div>
              </div>
            ) : (
              /* State C: Normal Interactive PayPal Checkout Form */
              <div className="p-5 space-y-4">
                {/* Method Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaypalPayTab('PAYPAL_ACCOUNT')}
                    className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${paypalPayTab === 'PAYPAL_ACCOUNT'
                        ? 'bg-[#0070BA] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span>Ví / Tài Khoản PayPal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaypalPayTab('CARD')}
                    className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${paypalPayTab === 'CARD'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Thẻ Visa / Mastercard</span>
                  </button>
                </div>

                {paypalPayTab === 'PAYPAL_ACCOUNT' ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-2">
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-bold">Tài Khoản PayPal Khách Hàng:</span>
                        <span className="font-mono font-semibold text-sky-800">customer@orderchinaviet.com</span>
                      </div>
                      <div className="space-y-1.5 pt-1.5 border-t border-sky-200/80">
                        <div className="font-bold text-slate-800">Chọn Nguồn Tiền Thanh Toán:</div>
                        <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-sky-300 shadow-2xs cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input type="radio" name="paypal_source" defaultChecked className="text-[#0070BA] focus:ring-[#0070BA]" />
                            <span className="font-bold text-slate-800">Số Dư PayPal (PayPal Balance)</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600">$1,250.00 USD</span>
                        </label>
                        <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300">
                          <div className="flex items-center gap-2">
                            <input type="radio" name="paypal_source" className="text-[#0070BA] focus:ring-[#0070BA]" />
                            <span className="font-medium text-slate-700">Thẻ Visa •••• 8829 (Ngân Hàng Chính)</span>
                          </div>
                          <span className="font-mono text-slate-400">Primary</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>PayPal Buyer Protection Standard 2026</span>
                      </div>
                      <p>Giao dịch được bảo vệ 100% bởi PayPal Security. Số tiền sẽ được trích trực tiếp từ tài khoản PayPal của bạn.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExecutePaypalPayment}
                      className="w-full py-3 bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-sky-200" />
                      <span>Hoàn Tất Thanh Toán (${paypalCheckoutInfo.amountUsd.toFixed(2)} USD)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số Thẻ Quốc Tế (Visa / Mastercard / Amex)</label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue="4532 •••• •••• 8829"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                        <div className="absolute right-3 top-2.5 flex items-center gap-1 text-slate-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Ngày Hết Hạn (MM/YY)</label>
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mã Bảo Mật (CVV / CVC)</label>
                        <input
                          type="password"
                          defaultValue="888"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tên In Trên Thẻ</label>
                      <input
                        type="text"
                        defaultValue="NGUYEN VAN A"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 uppercase focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExecutePaypalPayment}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-slate-300" />
                      <span>Thanh Toán Thẻ (${paypalCheckoutInfo.amountUsd.toFixed(2)} USD)</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Powered by official PayPal Secure Payments (TLS 1.3 / SSL 256-bit)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
