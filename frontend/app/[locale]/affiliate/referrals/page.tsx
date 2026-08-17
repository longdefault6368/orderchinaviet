'use client';

import { use, useState, useEffect } from 'react';
import {
  Users,
  Search,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserCheck,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, ReferredCustomer } from '@/lib/affiliate-store';

export default function AffiliateReferralsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<ReferredCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setReferrals(affiliateStore.getReferredCustomers());
      setLoading(false);
    }, 400);
    const refresh = () => setReferrals(affiliateStore.getReferredCustomers());
    window.addEventListener('orderchinaviet_affiliate_updated', refresh);
    return () => { clearTimeout(timer); window.removeEventListener('orderchinaviet_affiliate_updated', refresh); };
  }, []);

  const filteredReferrals = referrals.filter(
    (r) =>
      r.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.fullName || r.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery)
  );

  const totalSpentAll = referrals.reduce((sum, r) => sum + r.totalSpentVnd, 0);
  const totalCommissionEarned = referrals.reduce((sum, r) => sum + (r.commissionVnd || r.commissionEarnedVnd), 0);

  if (loading) {
    return (
      <div className="space-y-6 text-slate-800  animate-pulse">
        <div className="bg-slate-200 h-36 rounded-3xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 h-28 rounded-3xl w-full" />
          ))}
        </div>
        <div className="bg-slate-200 h-80 rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800  animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mạng Lưới Khách Hàng</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Danh Sách Khách Hàng Giới Thiệu</h1>
        <p className="text-xs text-slate-300 mt-1">
          Theo dõi tiến độ nạp cước, tổng sản lượng vận chuyển &amp; hoa hồng chi trả từ từng khách hàng giới thiệu.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">Tổng Khách Đã Đăng Ký</span>
          <div className="text-2xl font-bold font-mono text-primary-600">{referrals.length} Khách Hàng</div>
          <p className="text-[11px] text-slate-400">Đăng ký qua Link/QR của bạn</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">Tổng Doanh Số Vận Chuyển</span>
          <div className="text-2xl font-bold font-mono text-slate-900">{totalSpentAll.toLocaleString('vi-VN')} ₫</div>
          <p className="text-[11px] text-slate-400">Tổng giá trị đơn hàng khách nạp</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500">Tổng Hoa Hồng Phát Sinh</span>
          <div className="text-2xl font-bold font-mono text-emerald-600">{totalCommissionEarned.toLocaleString('vi-VN')} ₫</div>
          <p className="text-[11px] text-slate-400">Tỷ lệ hoa hồng lên đến 50% trọn đời</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã OCV, Tên hoặc SĐT..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Hiển thị <span className="font-mono text-primary-600">{filteredReferrals.length}</span> kết quả
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Mã Khách Hàng</th>
                <th className="pb-3">Họ Và Tên</th>
                <th className="pb-3">Số Điện Thoại</th>
                <th className="pb-3">Ngày Đăng Ký</th>
                <th className="pb-3">Trạng Thái Đơn</th>
                <th className="pb-3">Tổng Tiền Nạp</th>
                <th className="pb-3 text-right">Hoa Hồng Nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-normal">
                    Chưa tìm thấy khách hàng giới thiệu nào.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-primary-600">{r.customerCode}</td>
                    <td className="py-3.5 font-bold text-slate-900">{r.fullName || r.name}</td>
                    <td className="py-3.5 font-mono text-slate-600">{r.phone}</td>
                    <td className="py-3.5 font-mono text-slate-500">{r.registeredAt}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${r.hasDeposited !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {r.hasDeposited !== false ? 'Đã Nạp Đơn' : 'Chưa Tạo Đơn'}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-900">{r.totalSpentVnd.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-3.5 font-mono font-bold text-emerald-600 text-right">
                      +{(r.commissionVnd || r.commissionEarnedVnd).toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


