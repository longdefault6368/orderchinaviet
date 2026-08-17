'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Check,
  X,
  CreditCard,
  Send,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  DollarSign,
  Plus,
  Upload,
  LoaderCircle,
} from 'lucide-react';
import { exchangeStore, ExchangeTransaction } from '@/lib/exchange-store';
import { DEFAULT_CONTACT_SETTINGS, settingsStore } from '@/lib/settings-store';

export default function AdminExchangePage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ExchangeTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(DEFAULT_CONTACT_SETTINGS);

  // Sorting
  type SortableColumn = 'id' | 'customerName' | 'type' | 'amountCny' | 'amountVnd' | 'createdAt';
  const [sortColumn, setSortColumn] = useState<SortableColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [detailModalTx, setDetailModalTx] = useState<ExchangeTransaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewTx, setReviewTx] = useState<ExchangeTransaction | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'COMPLETED' | 'REJECTED'>('COMPLETED');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: '',
    customerPhone: '',
    type: 'VND_TO_CNY' as 'VND_TO_CNY' | 'CNY_TO_VND',
    amountCny: 1000,
    rate: 3680,
    accountInfo: '',
    note: '',
  });

  const loadLatestTransactions = () => {
    setTransactions(exchangeStore.getTransactions());
  };

  useEffect(() => {
    void settingsStore.refreshSettings(true).then((value) => { setSettings(value); setAddForm((current) => ({ ...current, rate: current.type === 'VND_TO_CNY' ? value.rateVndToCny : value.rateCnyToVnd })); });
    loadLatestTransactions();
    setLoading(false);

    const handleExchangeUpdate = () => {
      loadLatestTransactions();
    };

    window.addEventListener('orderchinaviet_exchange_updated', handleExchangeUpdate);
    return () => window.removeEventListener('orderchinaviet_exchange_updated', handleExchangeUpdate);
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab !== 'ALL' && tx.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = tx.id.toLowerCase().includes(q);
      const matchName = tx.customerName.toLowerCase().includes(q);
      const matchPhone = tx.customerPhone.toLowerCase().includes(q);
      const matchAcc = tx.accountInfo.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchAcc) return false;
    }
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal: any = a[sortColumn] || '';
    let bVal: any = b[sortColumn] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize);

  const handleSort = (col: SortableColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const openReview = (tx: ExchangeTransaction, status: 'COMPLETED' | 'REJECTED') => { setReviewTx(tx); setReviewStatus(status); setReviewNote(''); setReviewImage(''); };
  const handleReviewImage = (file: File) => { if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return alert('Chỉ hỗ trợ JPG, PNG hoặc WEBP'); if (file.size > 2*1024*1024) return alert('Ảnh không được vượt quá 2 MB'); const reader=new FileReader(); reader.onload=()=>setReviewImage(String(reader.result)); reader.readAsDataURL(file); };
  const submitReview = async () => { if (!reviewTx) return; if (reviewStatus === 'REJECTED' && !reviewNote.trim()) return alert('Vui lòng nhập lý do từ chối'); setReviewing(true); try { await exchangeStore.reviewTransaction(reviewTx.id, reviewStatus, reviewNote.trim(), reviewImage || undefined); setReviewTx(null); loadLatestTransactions(); } catch(error) { alert(error instanceof Error ? error.message : 'Không thể xử lý lệnh'); } finally { setReviewing(false); } };
  const handleApprove = (tx: ExchangeTransaction) => openReview(tx, 'COMPLETED');

  const handleReject = (tx: ExchangeTransaction) => openReview(tx, 'REJECTED');

  const handleDelete = (id: string) => {
    if (confirm(`Super Admin xác nhận XÓA VĨNH VIỄN giao dịch ${id}?`)) {
      exchangeStore.deleteTransaction(id);
      loadLatestTransactions();
    }
  };

  const handleSaveAddModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVnd = addForm.amountCny * addForm.rate;
    const typeLabel = addForm.type === 'VND_TO_CNY' ? 'Nạp Alipay (VNĐ ➔ CNY)' : 'Bán Tệ NDT (CNY ➔ VNĐ)';
    exchangeStore.addTransaction({
      customerName: addForm.customerName,
      customerPhone: addForm.customerPhone,
      type: addForm.type,
      typeLabel,
      amountCny: addForm.amountCny,
      rate: addForm.rate,
      amountVnd,
      accountInfo: addForm.accountInfo,
      note: addForm.note,
      status: 'PENDING',
      statusLabel: 'Chờ duyệt',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
    });
    loadLatestTransactions();
    setShowAddModal(false);
    setAddForm({
      customerName: '',
      customerPhone: '',
      type: 'VND_TO_CNY',
      amountCny: 1000,
      rate: settings.rateVndToCny,
      accountInfo: '',
      note: '',
    });
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
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full uppercase">
              ALIPAY &amp; WECHAT REMITTANCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Quản Lý Đổi Tiền &amp; Thanh Toán Hộ Alipay / WeChat Pay
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý giao dịch nạp tiền ví điện tử Trung Quốc (VNĐ ➔ CNY) và rút tiền đổi ngoại tệ (CNY ➔ VNĐ).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Giao Dịch Đổi Tiền Mới</span>
        </button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: `Tất cả (${transactions.length})` },
          { key: 'PENDING', label: 'Chờ duyệt xử lý' },
          { key: 'COMPLETED', label: 'Đã hoàn tất' },
          { key: 'REJECTED', label: 'Đã từ chối' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.key
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
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
            placeholder="Tìm theo Mã EX-..., Tên khách hàng, SĐT hoặc Tài khoản Alipay/Ngân hàng..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-600"
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
        {totalItems === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 space-y-2">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto stroke-1.5" />
            <p className="font-bold text-xs sm:text-sm text-slate-800">Không tìm thấy giao dịch đổi tiền nào</p>
            <p className="text-xs text-slate-400">Thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] select-none">
                  <tr>
                    <th className="py-3 px-4">
                      <button onClick={() => handleSort('id')} className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-sky-600 cursor-pointer">
                        <span>Mã Giao Dịch</span>
                        {sortColumn === 'id' ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-sky-600" /> : <ChevronDown className="w-3 h-3 text-sky-600" />) : <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Loại Giao Dịch</th>
                    <th className="py-3 px-4">Số Tiền NDT (¥)</th>
                    <th className="py-3 px-4">Tỷ Giá</th>
                    <th className="py-3 px-4">Thành Tiền (VNĐ)</th>
                    <th className="py-3 px-4">Tài Khoản Nhận</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-600 whitespace-nowrap">{tx.id}</td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-slate-900">{tx.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tx.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${tx.type === 'VND_TO_CNY' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tx.statusClass}`}>
                          {tx.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tx.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(tx)}
                                title="Duyệt hoàn tất giao dịch"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                onClick={() => handleReject(tx)}
                                title="Từ chối giao dịch"
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDetailModalTx(tx)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="Xóa giao dịch"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-sky-600 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>hàng / trang</span>
                <span className="text-slate-300 mx-1">|</span>
                <span className="font-semibold text-slate-700">
                  Hiển thị <strong className="font-mono text-slate-900">{startIndex + 1}</strong>–<strong className="font-mono text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</strong> trên tổng số <strong className="font-mono text-sky-600">{totalItems}</strong> giao dịch
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
                        ? 'bg-sky-600 text-white shadow-2xs'
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

      {reviewTx && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between border-b pb-4"><div><h3 className="font-bold">{reviewStatus==='COMPLETED'?'Duyệt hoàn tất':'Từ chối'} lệnh {reviewTx.id}</h3><p className="mt-1 text-xs text-slate-500">Phản hồi này sẽ hiển thị cho khách hàng.</p></div><button onClick={()=>setReviewTx(null)} className="rounded-full bg-slate-100 p-2"><X className="h-4 w-4"/></button></div><div className="mt-4 space-y-4"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setReviewStatus('COMPLETED')} className={`rounded-xl py-2.5 text-xs font-bold ${reviewStatus==='COMPLETED'?'bg-emerald-600 text-white':'bg-slate-100'}`}>Duyệt hoàn tất</button><button type="button" onClick={()=>setReviewStatus('REJECTED')} className={`rounded-xl py-2.5 text-xs font-bold ${reviewStatus==='REJECTED'?'bg-rose-600 text-white':'bg-slate-100'}`}>Từ chối</button></div><textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder={reviewStatus==='REJECTED'?'Lý do từ chối *':'Ghi chú phản hồi cho khách hàng'} className="min-h-28 w-full rounded-xl border p-3 text-sm"/><div className="rounded-xl border-2 border-dashed p-3"><p className="mb-2 text-xs font-bold">Ảnh phản hồi <span className="font-normal text-slate-400">(không bắt buộc)</span></p>{reviewImage?<div className="relative h-36 overflow-hidden rounded-xl"><img src={reviewImage} alt="Ảnh phản hồi" className="h-full w-full object-contain"/><button onClick={()=>setReviewImage('')} className="absolute right-2 top-2 rounded-full bg-slate-900 p-1 text-white"><X className="h-4 w-4"/></button></div>:<label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-50 p-5 text-xs font-bold"><Upload className="h-4 w-4"/>Chọn ảnh JPG, PNG hoặc WEBP<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)handleReviewImage(file)}}/></label>}</div><button disabled={reviewing} onClick={()=>void submitReview()} className={`w-full rounded-xl py-3 text-xs font-bold text-white disabled:opacity-60 ${reviewStatus==='COMPLETED'?'bg-emerald-600':'bg-rose-600'}`}>{reviewing?<span className="flex items-center justify-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin"/>Đang xử lý...</span>:reviewStatus==='COMPLETED'?'Xác nhận duyệt':'Xác nhận từ chối'}</button></div></div></div>}

      {/* ── MODAL XEM CHI TIẾT ── */}
      {detailModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-h-[90vh] overflow-y-auto bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-base text-sky-600">{detailModalTx.id}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${detailModalTx.statusClass}`}>
                  {detailModalTx.statusLabel}
                </span>
              </div>
              <button
                onClick={() => setDetailModalTx(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Thông tin khách hàng</div>
                <div className="font-bold text-sm text-slate-900">{detailModalTx.customerName} - {detailModalTx.customerPhone}</div>
                <div className="text-xs text-sky-700 font-semibold">{detailModalTx.typeLabel}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Số Tiền NDT (RMB)</div>
                  <div className="font-mono font-bold text-rose-400 text-sm">¥{detailModalTx.amountCny.toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tỷ Giá Quy Đổi</div>
                  <div className="font-mono font-bold text-amber-400 text-sm">1 ¥ = {detailModalTx.rate.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng Thành Tiền (VNĐ)</div>
                  <div className="font-mono font-bold text-emerald-400 text-base">{detailModalTx.amountVnd.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1">
                <div className="font-bold text-sky-900">Tài khoản nhận tiền (Alipay / WeChat / Ngân Hàng):</div>
                <div className="font-mono font-bold text-slate-800 bg-white p-2 rounded-lg border border-sky-200">{detailModalTx.accountInfo}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><span className="font-bold text-slate-700">Nguồn thanh toán: </span><span className="font-mono">{detailModalTx.fundingMethod || 'WALLET'}</span>{detailModalTx.fundingMethod === 'WALLET' && <p className="mt-1 text-[10px] text-slate-500">Lệnh này sử dụng và giữ số dư ví của khách.</p>}</div>

              {detailModalTx.proofImage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="mb-2 text-xs font-bold text-emerald-900">Ảnh chứng minh / biên lai</div><a href={detailModalTx.proofImage} target="_blank" rel="noreferrer"><img src={detailModalTx.proofImage} alt={`Ảnh chứng minh ${detailModalTx.id}`} className="max-h-72 w-full rounded-xl border bg-white object-contain" /></a><p className="mt-1 text-[10px] text-emerald-700">Bấm vào ảnh để xem kích thước đầy đủ.</p></div>}

              {detailModalTx.note && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-700">Ghi chú giao dịch:</div>
                  <div className="text-slate-600 italic">{detailModalTx.note}</div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalTx(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TẠO GIAO DỊCH MỚI ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tạo Giao Dịch Đổi Tiền Mới</h3>
                <p className="text-xs text-slate-500">Nạp ví Alipay/WeChat Pay hoặc mua bán ngoại tệ</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại Giao Dịch</label>
                <select
                  value={addForm.type}
                  onChange={(e) => {
                    const type = e.target.value as 'VND_TO_CNY' | 'CNY_TO_VND';
                    const defaultRate = type === 'VND_TO_CNY' ? settings.rateVndToCny : settings.rateCnyToVnd;
                    setAddForm({ ...addForm, type, rate: defaultRate });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-600"
                >
                  <option value="VND_TO_CNY">Khách nạp ví Alipay / WeChat Pay (VNĐ ➔ CNY)</option>
                  <option value="CNY_TO_VND">Khách rút tiền / Bán Tệ NDT (CNY ➔ VNĐ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Khách Hàng</label>
                  <input
                    type="text"
                    required
                    value={addForm.customerName}
                    onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Khách Hàng</label>
                  <input
                    type="text"
                    required
                    value={addForm.customerPhone}
                    onChange={(e) => setAddForm({ ...addForm, customerPhone: e.target.value })}
                    placeholder="0909 123 456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền NDT (¥)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={addForm.amountCny}
                    onChange={(e) => setAddForm({ ...addForm, amountCny: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tỷ Giá Áp Dụng</label>
                  <input
                    type="number"
                    required
                    value={addForm.rate}
                    onChange={(e) => setAddForm({ ...addForm, rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-sky-600 focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tài Khoản Nhận (Alipay ID / SĐT Zalo / STK Ngân Hàng)</label>
                <input
                  type="text"
                  required
                  value={addForm.accountInfo}
                  onChange={(e) => setAddForm({ ...addForm, accountInfo: e.target.value })}
                  placeholder="alipay_acc@gmail.com hoặc Vietcombank 007..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Giao Dịch</label>
                <input
                  type="text"
                  value={addForm.note}
                  onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                  placeholder="Thanh toán cọc xưởng, nạp tiền mua hàng..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Tạo Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
