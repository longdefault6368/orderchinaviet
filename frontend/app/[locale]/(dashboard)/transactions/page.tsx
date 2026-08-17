'use client';

import { use, useState, useEffect } from 'react';
import { CreditCard, ArrowDownRight, ArrowUpRight, Wallet, RefreshCw, Filter, Boxes } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { userStore, UserRecord } from '@/lib/user-store';
import { apiFetch } from '@/lib/api-client';

export interface TxItem {
  id: string;
  type: string;
  typeLabel: string;
  typeClass: string;
  amount: number;
  balanceAfter: number;
  description: string;
  date: string;
}

export default function TransactionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [transactions, setTransactions] = useState<TxItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const current = authStore.getUser();
      setUser(current);
      try {
        const response = await apiFetch('/finance/transactions');
        const json = await response.json();
        if (!response.ok) throw new Error(json.message);
        setTransactions(json.data.map((item: any) => ({
          id: item.transactionNo, type: item.type,
          typeLabel: item.type === 'DEPOSIT' ? 'Nạp tiền' : item.type === 'WITHDRAWAL' ? 'Rút tiền' : item.type,
          typeClass: item.amountVnd >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200',
          amount: item.amountVnd, balanceAfter: item.balanceAfter, description: item.description,
          date: new Date(item.createdAt).toLocaleString('vi-VN'),
        })));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const liveBalance = transactions[0]?.balanceAfter ?? userRecord?.balanceVnd ?? user?.balanceVnd ?? 0;

  if (loading) {
    return (
      <div className="space-y-4 text-slate-800  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-800  animate-in fade-in duration-200">
      {/* Wallet Balance Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#0c3ed0] p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Số Dư Ví Dư Khách Hàng ({userRecord?.customerCode || user?.customerCode || 'OCV000001'})
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            {liveBalance.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Transactions Table & Empty State */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#fa3131]" />
            Lịch sử giao dịch biến động số dư
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có giao dịch biến động số dư nào</p>
              <p className="text-xs text-slate-400 mt-0.5">Lịch sử nạp tiền, trừ cước vận chuyển hoặc hoàn tiền sẽ xuất hiện tại đây.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Mã Giao Dịch</th>
                  <th className="py-3 px-4">Loại Giao Dịch</th>
                  <th className="py-3 px-4">Số Tiền (VNĐ)</th>
                  <th className="py-3 px-4">Số Dư Sau Giao Dịch</th>
                  <th className="py-3 px-4">Nội Dung</th>
                  <th className="py-3 px-4">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{tx.id}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tx.typeClass}`}>
                        {tx.typeLabel}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-[#fa3131]'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{tx.balanceAfter.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-3.5 px-4 text-slate-700">{tx.description}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


