'use client';

import { use, useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  X,
  Search,
  RotateCcw,
  Send,
  Boxes,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { userStore, UserRecord } from '@/lib/user-store';
import { VIETNAM_BANKS } from '@/lib/constants/banks';
import { apiFetch } from '@/lib/api-client';
import { notificationStore } from '@/lib/notification-store';

export interface WithdrawalRequestItem {
  id: string;
  amount: number;
  bank: string;
  accountNumber: string;
  accountName: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  requestedAt: string;
  processedAt?: string | null;
  note?: string;
}

export default function WithdrawalsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);

  const [form, setForm] = useState({
    amount: '',
    bank: 'Vietcombank',
    accountNumber: '',
    accountName: '',
    note: '',
  });

  useEffect(() => {
    const load = async () => {
      const current = authStore.getUser();
      setUser(current);
      if (current) {
        const live = userStore.getUserById(current.id) || userStore.getUserByCustomerCode(current.customerCode || '');
        setUserRecord(live || null);
        if (live?.bankInfo) {
          setForm((prev) => ({
            ...prev,
            bank: live.bankInfo?.bankName || 'Vietcombank',
            accountNumber: live.bankInfo?.accountNumber || '',
            accountName: live.bankInfo?.accountName || '',
          }));
        }
      }
      try {
        const response = await apiFetch('/operations/withdrawals');
        const json = await response.json();
        if (!response.ok) throw new Error(json.message);
        setWithdrawals(json.data.map((item: any) => ({
          id: item.requestCode, amount: item.amountVnd, bank: item.bankName, accountNumber: item.accountNumber, accountName: item.accountName,
          status: item.status, statusLabel: item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'REJECTED' ? 'Từ chối' : 'Chờ xét duyệt',
          statusClass: item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200',
          requestedAt: new Date(item.createdAt).toLocaleString('vi-VN'), processedAt: item.reviewedAt ? new Date(item.reviewedAt).toLocaleString('vi-VN') : null, note: item.reviewNote,
        })));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const currentBalance = userRecord?.balanceVnd || user?.balanceVnd || 0;

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(form.amount) || 0;
    if (numAmount < 100000) {
      alert('Số tiền rút tối thiểu là 100.000 ₫');
      return;
    }
    if (numAmount > currentBalance) {
      alert('Số tiền rút vượt quá số dư khả dụng');
      return;
    }

    const response = await apiFetch('/operations/withdrawals', { method: 'POST', body: JSON.stringify({ amountVnd: numAmount, bankName: form.bank, accountNumber: form.accountNumber, accountName: form.accountName }) });
    const json = await response.json();
    if (!response.ok) return alert(json.message || 'Không thể tạo yêu cầu rút tiền');
    const newWd: WithdrawalRequestItem = {
      id: json.data.requestCode,
      amount: numAmount,
      bank: form.bank,
      accountNumber: form.accountNumber,
      accountName: form.accountName,
      status: 'PENDING',
      statusLabel: 'Chờ xét duyệt',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
      requestedAt: new Date().toLocaleString('vi-VN'),
      processedAt: null,
    };

    setWithdrawals([newWd, ...withdrawals]);

    notificationStore.notifyWithdrawalRequest({
      requestCode: json.data?.requestCode || newWd.id,
      customerName: userRecord?.fullName || user?.fullName || 'Khách Hàng',
      amountVnd: numAmount,
      bankName: form.bank,
      accountNumber: form.accountNumber,
      accountName: form.accountName,
    });

    setModalOpen(false);
  };

  const filtered = withdrawals.filter((w) =>
    !search || w.id.toLowerCase().includes(search.toLowerCase()) || w.bank.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4 text-slate-800  animate-pulse">
        <div className="bg-slate-200 h-24 rounded-2xl w-full" />
        <div className="bg-slate-200 h-12 rounded-2xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-800  animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-[#fa3131]" />
            Yêu Cầu Rút Tiền Từ Ví Dư
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Rút số dư thừa từ ví OrderChinaViet về tài khoản ngân hàng cá nhân.
            Số dư hiện tại: <span className="font-mono font-bold text-emerald-600">{currentBalance.toLocaleString('vi-VN')} ₫</span>
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-[#0c3ed0] hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Rút Tiền</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiếu (WD-...) hoặc tên ngân hàng"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0c3ed0]"
          />
        </div>
        <button onClick={() => setSearch('')} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Withdrawal History & Empty State */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm">Lịch Sử Rút Tiền <span className="text-[#fa3131]">({filtered.length})</span></h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ArrowDownToLine className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có lịch sử rút tiền nào</p>
              <p className="text-xs text-slate-400 mt-0.5">Bạn có thể tạo yêu cầu rút số dư khả dụng về ngân hàng bất kỳ lúc nào.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mã Phiếu</th>
                  <th className="py-3 px-4">Số Tiền Rút</th>
                  <th className="py-3 px-4">Ngân Hàng & STK</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Yêu Cầu Lúc</th>
                  <th className="py-3 px-4">Xử Lý Lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0c3ed0]">{w.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131]">{w.amount.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{w.bank}</div>
                      <div className="text-slate-500 text-[10px]">{w.accountNumber} — {w.accountName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${w.statusClass}`}>
                        {w.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{w.requestedAt}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{w.processedAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Withdrawal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Tạo Phiếu Rút Tiền</h3>
              <button onClick={() => setModalOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs">
              <p className="text-emerald-700 font-semibold">Số dư ví có thể rút: <span className="font-mono font-bold">{currentBalance.toLocaleString('vi-VN')} ₫</span></p>
              <p className="text-emerald-600 text-[10px] mt-0.5">Số tiền rút tối thiểu: 100,000 ₫. Thời gian xử lý chuyển khoản: 24h.</p>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền Muốn Rút (₫) <span className="text-[#fa3131]">*</span></label>
                <input
                  type="number"
                  required
                  min="100000"
                  max={currentBalance}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="500000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#0c3ed0]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Ngân Hàng Thụ Hưởng <span className="text-[#fa3131]">*</span></label>
                <select
                  required
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0c3ed0] cursor-pointer"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.shortName}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Tài Khoản <span className="text-[#fa3131]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="0123456789"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#0c3ed0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản <span className="text-[#fa3131]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="NGUYEN VAN A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-[#0c3ed0]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#0c3ed0] hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md">
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Yêu Cầu Rút Tiền</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


