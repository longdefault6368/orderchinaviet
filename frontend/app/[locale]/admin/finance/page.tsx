'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, RefreshCw, Search, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

type FinanceLog = { id: string; type: string; typeLabel: string; amountVnd: number; balanceAfter: number | null; description: string; status: 'COMPLETED' | 'PENDING' | 'REJECTED'; createdAt: string; timestamp: number; customerName: string; customerCode: string; customerContact: string };
type FinanceCommand = { id: string; code: string; kind: 'DEPOSIT' | 'WITHDRAWAL'; amountVnd: number; method: string; status: string; customerName: string; customerCode: string; createdAt: string; timestamp: number };

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền vào ví', WITHDRAWAL: 'Rút tiền', ORDER_DEPOSIT: 'Đặt cọc đơn hàng', ORDER_BALANCE: 'Thanh toán đơn hàng',
  ORDER_DEPOSIT_EXTERNAL: 'Cọc đơn qua cổng thanh toán', ORDER_BALANCE_EXTERNAL: 'Thanh toán đơn qua cổng thanh toán',
  EXCHANGE_HOLD: 'Giữ tiền đổi VNĐ → CNY', EXCHANGE_RELEASE: 'Hoàn tiền lệnh đổi', EXCHANGE: 'Nhận tiền đổi CNY → VNĐ',
  EXCHANGE_SETTLED: 'Tất toán lệnh đổi tiền', REFUND: 'Hoàn tiền', ADJUSTMENT: 'Điều chỉnh số dư',
};

const statusStyle = (status: FinanceLog['status']) => status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200';

export default function AdminFinancePage() {
  const [logs, setLogs] = useState<FinanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeMenu, setActiveMenu] = useState<'HISTORY' | 'COMMANDS'>('HISTORY');
  const [commands, setCommands] = useState<FinanceCommand[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [txResponse, withdrawalResponse, depositResponse] = await Promise.all([apiFetch('/finance/transactions'), apiFetch('/operations/withdrawals'), apiFetch('/finance/deposit-requests')]);
      const [txJson, withdrawalJson, depositJson] = await Promise.all([txResponse.json(), withdrawalResponse.json(), depositResponse.json()]);
      if (!txResponse.ok) throw new Error(txJson.message || 'Không thể tải giao dịch tài chính');
      if (!withdrawalResponse.ok) throw new Error(withdrawalJson.message || 'Không thể tải yêu cầu rút tiền');
      if (!depositResponse.ok) throw new Error(depositJson.message || 'Không thể tải yêu cầu nạp tiền');

      const transactionLogs: FinanceLog[] = (txJson.data || []).map((item: any) => ({
        id: item.transactionNo, type: item.type, typeLabel: TYPE_LABELS[item.type] || item.type,
        amountVnd: Number(item.amountVnd || 0), balanceAfter: Number(item.balanceAfter || 0), description: item.description || '', status: 'COMPLETED',
        createdAt: new Date(item.createdAt).toLocaleString('vi-VN'), timestamp: new Date(item.createdAt).getTime(),
        customerName: item.user?.fullName || 'Người dùng', customerCode: item.user?.customerCode || '', customerContact: item.user?.phone || item.user?.email || '',
      }));
      const existingWithdrawalCodes = new Set(transactionLogs.filter((item) => item.type === 'WITHDRAWAL').map((item) => item.id));
      const requestLogs: FinanceLog[] = (withdrawalJson.data || []).filter((item: any) => !existingWithdrawalCodes.has(item.requestCode)).map((item: any) => ({
        id: item.requestCode, type: 'WITHDRAWAL', typeLabel: 'Yêu cầu rút tiền', amountVnd: -Number(item.amountVnd || 0),
        balanceAfter: item.user?.balance == null ? null : Number(item.user.balance),
        description: `${item.bankName} • ${item.accountNumber} • ${item.accountName}${item.reviewNote ? ` — ${item.reviewNote}` : ''}`,
        status: item.status === 'REJECTED' ? 'REJECTED' : 'PENDING', createdAt: new Date(item.createdAt).toLocaleString('vi-VN'), timestamp: new Date(item.createdAt).getTime(),
        customerName: item.user?.fullName || 'Người dùng', customerCode: item.user?.customerCode || '', customerContact: '',
      }));
      setLogs([...transactionLogs, ...requestLogs].sort((a, b) => b.timestamp - a.timestamp));
      const depositCommands: FinanceCommand[] = (depositJson.data || []).map((item: any) => ({ id: item.id, code: item.requestCode, kind: 'DEPOSIT', amountVnd: Number(item.amountVnd), method: item.method, status: item.status, customerName: item.user?.fullName || 'Người dùng', customerCode: item.user?.customerCode || '', createdAt: new Date(item.createdAt).toLocaleString('vi-VN'), timestamp: new Date(item.createdAt).getTime() }));
      const withdrawalCommands: FinanceCommand[] = (withdrawalJson.data || []).map((item: any) => ({ id: item.id, code: item.requestCode, kind: 'WITHDRAWAL', amountVnd: Number(item.amountVnd), method: `${item.bankName} • ${item.accountNumber}`, status: item.status, customerName: item.user?.fullName || 'Người dùng', customerCode: item.user?.customerCode || '', createdAt: new Date(item.createdAt).toLocaleString('vi-VN'), timestamp: new Date(item.createdAt).getTime() }));
      setCommands([...depositCommands, ...withdrawalCommands].sort((a, b) => b.timestamp - a.timestamp));
    } catch (cause: any) { setError(cause.message || 'Không thể tải dữ liệu tài chính'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  const reviewCommand = async (command: FinanceCommand, nextStatus: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`${nextStatus === 'APPROVED' ? 'Duyệt' : 'Từ chối'} lệnh ${command.code}?`)) return;
    setReviewingId(command.id);
    try {
      const endpoint = command.kind === 'DEPOSIT' ? `/finance/deposit-requests/${command.id}` : `/operations/withdrawals/${command.id}`;
      const response = await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không thể xử lý lệnh');
      await loadLogs();
    } catch (cause: any) { alert(cause.message || 'Không thể xử lý lệnh'); }
    finally { setReviewingId(null); }
  };

  const filtered = useMemo(() => logs.filter((item) => {
    if (type !== 'ALL' && item.type !== type) return false;
    if (status !== 'ALL' && item.status !== status) return false;
    const query = search.trim().toLowerCase();
    return !query || [item.id, item.typeLabel, item.customerName, item.customerCode, item.customerContact, item.description].some((value) => value.toLowerCase().includes(query));
  }), [logs, search, status, type]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalDeposited = logs.filter((item) => item.type === 'DEPOSIT' && item.status === 'COMPLETED').reduce((sum, item) => sum + item.amountVnd, 0);
  const totalWithdrawn = Math.abs(logs.filter((item) => item.type === 'WITHDRAWAL' && item.status === 'COMPLETED').reduce((sum, item) => sum + item.amountVnd, 0));
  const totalDebited = Math.abs(logs.filter((item) => item.amountVnd < 0 && item.status === 'COMPLETED').reduce((sum, item) => sum + item.amountVnd, 0));
  const pendingCount = logs.filter((item) => item.status === 'PENDING').length;
  const types = Array.from(new Set(logs.map((item) => item.type)));

  return <div className="space-y-6 text-slate-900">
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div><div className="mb-1 flex items-center gap-2 text-xs font-bold text-amber-400"><CreditCard className="h-4 w-4" /> SỔ TÀI CHÍNH TOÀN HỆ THỐNG</div><h1 className="text-xl font-bold sm:text-2xl">Lịch Sử Nạp, Rút &amp; Biến Động Số Dư</h1><p className="mt-1 text-xs text-slate-400">Dữ liệu trực tiếp từ database của tất cả người dùng.</p></div>
      <button onClick={() => void loadLogs()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới</button>
    </div>
    <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
      <button onClick={() => setActiveMenu('HISTORY')} className={`rounded-xl px-5 py-2.5 text-xs font-bold ${activeMenu === 'HISTORY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Lịch sử giao dịch</button>
      <button onClick={() => setActiveMenu('COMMANDS')} className={`rounded-xl px-5 py-2.5 text-xs font-bold ${activeMenu === 'COMMANDS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Lệnh nạp/rút <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">{commands.filter((item) => item.status === 'PENDING').length}</span></button>
    </div>
    {activeMenu === 'COMMANDS' && <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-base font-bold">Danh sách lệnh nạp/rút tiền</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead><tr className="border-b text-[10px] uppercase text-slate-500"><th className="pb-3">Mã lệnh</th><th className="pb-3">Khách hàng</th><th className="pb-3">Loại</th><th className="pb-3">Phương thức</th><th className="pb-3 text-right">Số tiền</th><th className="pb-3">Trạng thái</th><th className="pb-3">Thời gian</th><th className="pb-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{commands.map((item) => <tr key={`${item.kind}-${item.id}`} className="hover:bg-slate-50"><td className="py-3.5 font-mono font-bold text-sky-700">{item.code}</td><td className="py-3.5"><div className="font-bold">{item.customerName}</div><div className="text-[10px] text-slate-400">{item.customerCode}</div></td><td className="py-3.5 font-bold">{item.kind === 'DEPOSIT' ? 'Nạp tiền' : 'Rút tiền'}</td><td className="py-3.5 text-slate-600">{item.method}</td><td className={`py-3.5 text-right font-mono font-bold ${item.kind === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.amountVnd.toLocaleString('vi-VN')} ₫</td><td className="py-3.5"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${item.status === 'APPROVED' ? statusStyle('COMPLETED') : statusStyle(item.status === 'REJECTED' ? 'REJECTED' : 'PENDING')}`}>{item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}</span></td><td className="py-3.5 text-slate-500">{item.createdAt}</td><td className="py-3.5 text-right">{item.status === 'PENDING' ? <div className="flex justify-end gap-2"><button disabled={reviewingId === item.id} onClick={() => void reviewCommand(item, 'APPROVED')} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white disabled:opacity-50">Duyệt</button><button disabled={reviewingId === item.id} onClick={() => void reviewCommand(item, 'REJECTED')} className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white disabled:opacity-50">Từ chối</button></div> : '—'}</td></tr>)}</tbody></table>{commands.length === 0 && <div className="py-12 text-center text-slate-500">Chưa có lệnh nạp/rút tiền.</div>}</div>
    </div>}
    <div className={activeMenu === 'HISTORY' ? 'contents' : 'hidden'}>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Tổng nạp thành công', totalDeposited, <ArrowDownLeft key="d" className="h-5 w-5 text-emerald-500" />, 'text-emerald-600'],
        ['Tổng rút thành công', totalWithdrawn, <ArrowUpRight key="w" className="h-5 w-5 text-rose-500" />, 'text-rose-600'],
        ['Tổng tiền đã ghi nợ', totalDebited, <Wallet key="x" className="h-5 w-5 text-sky-500" />, 'text-sky-600'],
        ['Yêu cầu đang chờ', pendingCount, <CreditCard key="p" className="h-5 w-5 text-amber-500" />, 'text-amber-600'],
      ].map(([label, value, icon, color]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"><div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400"><span>{label}</span>{icon}</div><div className={`mt-1 font-mono text-xl font-bold ${color}`}>{Number(value).toLocaleString('vi-VN')}{label === 'Yêu cầu đang chờ' ? ' lệnh' : ' ₫'}</div></div>)}
    </div>
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 xl:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm mã giao dịch, khách hàng, nội dung..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-sky-500" /></div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold"><option value="ALL">Tất cả loại giao dịch</option>{types.map((item) => <option key={item} value={item}>{TYPE_LABELS[item] || item}</option>)}</select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold"><option value="ALL">Tất cả trạng thái</option><option value="COMPLETED">Thành công</option><option value="PENDING">Chờ xử lý</option><option value="REJECTED">Từ chối</option></select>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : loading ? <div className="py-16 text-center text-sm text-slate-500">Đang tải dữ liệu tài chính...</div> : visible.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Không có giao dịch phù hợp.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500"><th className="pb-3">Mã giao dịch</th><th className="pb-3">Khách hàng</th><th className="pb-3">Loại giao dịch</th><th className="pb-3 text-right">Số tiền</th><th className="pb-3 text-right">Số dư sau</th><th className="pb-3">Nội dung</th><th className="pb-3">Trạng thái</th><th className="pb-3">Thời gian</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((item) => <tr key={`${item.id}-${item.status}`} className="hover:bg-slate-50"><td className="py-3.5 font-mono font-bold text-sky-700">{item.id}</td><td className="py-3.5"><div className="font-bold text-slate-900">{item.customerName}</div><div className="text-[10px] text-slate-400">{item.customerCode}{item.customerContact ? ` • ${item.customerContact}` : ''}</div></td><td className="py-3.5 font-semibold">{item.typeLabel}</td><td className={`py-3.5 text-right font-mono font-bold ${item.amountVnd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.amountVnd > 0 ? '+' : ''}{item.amountVnd.toLocaleString('vi-VN')} ₫</td><td className="py-3.5 text-right font-mono font-bold text-slate-700">{item.balanceAfter == null ? '—' : `${item.balanceAfter.toLocaleString('vi-VN')} ₫`}</td><td className="max-w-[260px] truncate py-3.5 text-slate-600" title={item.description}>{item.description || '—'}</td><td className="py-3.5"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyle(item.status)}`}>{item.status === 'COMPLETED' ? 'Thành công' : item.status === 'REJECTED' ? 'Từ chối' : 'Chờ xử lý'}</span></td><td className="whitespace-nowrap py-3.5 text-slate-500">{item.createdAt}</td></tr>)}</tbody></table></div>}
      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">Hiển thị {visible.length}/{filtered.length} giao dịch</span><div className="flex items-center gap-2"><select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 px-2 py-1.5"><option value={10}>10 / trang</option><option value={20}>20 / trang</option><option value={50}>50 / trang</option></select><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Trước</button><span className="font-bold">{currentPage}/{totalPages}</span><button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Sau</button></div></div>
    </div>
    </div>
  </div>;
}
