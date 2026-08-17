'use client';

import { use, useState, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  User,
  Clock,
  Gift,
  Calendar,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, AffiliateAccount, WithdrawalRequest } from '@/lib/affiliate-store';
import { VIETNAM_BANKS } from '@/lib/constants/banks';

export default function AffiliateCommissionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Form states
  const [amount, setAmount] = useState('250000');
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('1012938475');
  const [accountName, setAccountName] = useState('LE VAN TIEP THI');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener('orderchinaviet_affiliate_updated', loadData);
    return () => window.removeEventListener('orderchinaviet_affiliate_updated', loadData);
  }, []);

  const loadData = () => {
    const data = affiliateStore.getAffiliate();
    const list = affiliateStore.getWithdrawalHistory();
    setAffiliate(data);
    setWithdrawals(list);
    if (data?.bankInfo) {
      setBankName(data.bankInfo.bankName || 'Vietcombank');
      setAccountNumber(data.bankInfo.accountNumber || '');
      setAccountName(data.bankInfo.accountName || '');
    }
  };

  const activeCustomerCount = affiliate?.referredCustomersCount || 0;
  const isUnlocked = activeCustomerCount >= 3;
  const promoBalance = affiliate?.promoBalanceVnd || 0;
  const withdrawable = affiliate?.withdrawableBalanceVnd || 0;
  const totalAvailableToWithdraw = isUnlocked ? promoBalance + withdrawable : withdrawable;

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 100000) {
      setMsg({ type: 'error', text: 'Số tiền rút tối thiểu là 100.000 ₫.' });
      return;
    }

    if (numAmount > totalAvailableToWithdraw) {
      setMsg({ type: 'error', text: `Số tiền rút vượt quá số dư khả dụng (${totalAvailableToWithdraw.toLocaleString('vi-VN')} ₫).` });
      return;
    }

    try {
      affiliateStore.requestWithdrawal(numAmount, { bankName, accountNumber, accountName });
      setMsg({ type: 'success', text: 'Đã gửi yêu cầu rút tiền thành công! Bộ phận Kế toán OrderChinaViet sẽ chuyển khoản trong 24h.' });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gửi yêu cầu không thành công.' });
    }
  };

  return (
    <div className="space-y-6 text-slate-800  ">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Wallet className="w-3.5 h-3.5 text-amber-400" />
          <span>Quản Lý Thu Nhập &amp; Rút Tiền</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ví Hoa Hồng &amp; Lịch Sử Rút Tiền Ngân Hàng</h1>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Theo dõi tổng thu nhập tiếp thị liên kết, số dư thưởng 250.000 ₫ &amp; gửi yêu cầu rút tiền về thẻ ATM / ngân hàng Việt Nam.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Withdrawal Request Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Rút Tiền Về Ngân Hàng</h2>
              <p className="text-xs text-slate-500">Chuyển khoản 24/7 không mất phí</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Ví thưởng khuyến mãi:</span>
              <strong className="text-amber-600">{promoBalance.toLocaleString('vi-VN')} ₫</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Hoa hồng phát sinh:</span>
              <strong className="text-emerald-600">{withdrawable.toLocaleString('vi-VN')} ₫</strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Khả dụng rút tối đa:</span>
              <strong className="text-emerald-700 text-sm">{totalAvailableToWithdraw.toLocaleString('vi-VN')} ₫</strong>
            </div>
          </div>

          {msg && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền Rút (VNĐ)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Ngân Hàng Thụ Hưởng</label>
              <select
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {VIETNAM_BANKS.map((b) => (
                  <option key={b.code} value={b.shortName}>
                    {b.shortName} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Tài Khoản Ngân Hàng</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1012938475"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (In hoa)</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="LE VAN TIEP THI"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Gửi Yêu Cầu Rút Tiền
            </button>
          </form>
        </div>

        {/* Right: Withdrawal Ledger Table / Cards */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Lịch Sử Yêu Cầu Rút Tiền</h2>

          {/* Mobile View Cards */}
          <div className="block md:hidden space-y-3">
            {withdrawals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-normal">
                Chưa có lịch sử rút tiền nào.
              </div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-primary-600">{w.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${w.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : w.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                      {w.status === 'APPROVED' ? 'Đã Chuyển Khoản' : w.status === 'REJECTED' ? 'Từ Chối' : 'Chờ Duyệt'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pt-1">
                    <span className="text-slate-500">Số Tiền Rút:</span>
                    <strong className="font-mono text-emerald-600 font-bold text-sm">
                      {w.amountVnd.toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>

                  <div className="space-y-0.5 pt-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{w.bankInfo?.bankName || w.bankName}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      STK: {w.bankInfo?.accountNumber || w.accountNumber} - {w.bankInfo?.accountName || w.accountName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{w.createdAt || w.requestedAt}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Mã Yêu Cầu</th>
                  <th className="pb-3">Số Tiền Rút</th>
                  <th className="pb-3">Ngân Hàng Thụ Hưởng</th>
                  <th className="pb-3">Thời Gian Gửi</th>
                  <th className="pb-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">
                      Chưa có lịch sử rút tiền nào.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-primary-600">{w.id}</td>
                      <td className="py-3.5 font-mono font-bold text-emerald-600">{w.amountVnd.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-3.5 text-slate-800">
                        <div className="font-bold">{w.bankInfo?.bankName || w.bankName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{w.bankInfo?.accountNumber || w.accountNumber} - {w.bankInfo?.accountName || w.accountName}</div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-500">{w.createdAt || w.requestedAt}</td>
                      <td className="py-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${w.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : w.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {w.status === 'APPROVED' ? 'Đã Chuyển Khoản' : w.status === 'REJECTED' ? 'Từ Chối' : 'Chờ Duyệt'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


