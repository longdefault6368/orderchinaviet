'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Filter,
  ArrowUpDown,
  Phone,
  Mail,
  Calendar,
  Gift,
  Eye,
  X,
  FileText,
  Sparkles,
  Download,
  Share2,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Crown,
  Layers,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, ReferredCustomer, AffiliateSession } from '@/lib/affiliate-store';

export default function AffiliateReferralsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<ReferredCustomer[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'VIP'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SPENT_DESC' | 'COMMISSION_DESC' | 'ORDERS_DESC'>('NEWEST');
  const [selectedCustomer, setSelectedCustomer] = useState<ReferredCustomer | null>(null);

  const loadData = () => {
    const list = affiliateStore.getReferredCustomers();
    const aff = affiliateStore.getAffiliate();
    setReferrals(list);
    setAffiliate(aff);
  };

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setLoading(false), 300);

    const refresh = () => loadData();
    window.addEventListener('orderchinaviet_affiliate_updated', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('orderchinaviet_affiliate_updated', refresh);
    };
  }, []);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = referrals.length;
    const active = referrals.filter((r) => r.hasDeposited !== false && (r.totalOrders > 0 || r.totalSpentVnd > 0)).length;
    const pending = total - active;
    const totalSpent = referrals.reduce((sum, r) => sum + (r.totalSpentVnd || 0), 0);
    const totalCommission = referrals.reduce(
      (sum, r) => sum + (r.commissionVnd || r.commissionEarnedVnd || 0),
      0
    );
    const vipCount = referrals.filter((r) => (r.totalSpentVnd || 0) >= 5000000).length;
    const conversionRate = total > 0 ? Math.round((active / total) * 100) : 0;
    const progressToBonus = Math.min(3, active);

    return {
      total,
      active,
      pending,
      vipCount,
      totalSpent,
      totalCommission,
      conversionRate,
      progressToBonus,
    };
  }, [referrals]);

  // Filter & Sort
  const filteredReferrals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return referrals
      .filter((r) => {
        // Status filter
        const isActive = r.hasDeposited !== false && (r.totalOrders > 0 || r.totalSpentVnd > 0);
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'PENDING' && isActive) return false;
        if (statusFilter === 'VIP' && (r.totalSpentVnd || 0) < 5000000) return false;

        // Search query
        if (!q) return true;
        const codeMatch = (r.customerCode || '').toLowerCase().includes(q);
        const nameMatch = (r.fullName || r.name || '').toLowerCase().includes(q);
        const phoneMatch = (r.phone || '').includes(q);
        return codeMatch || nameMatch || phoneMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'SPENT_DESC') return (b.totalSpentVnd || 0) - (a.totalSpentVnd || 0);
        if (sortBy === 'COMMISSION_DESC')
          return (b.commissionVnd || b.commissionEarnedVnd || 0) - (a.commissionVnd || a.commissionEarnedVnd || 0);
        if (sortBy === 'ORDERS_DESC') return (b.totalOrders || 0) - (a.totalOrders || 0);
        // Default NEWEST
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [referrals, searchQuery, statusFilter, sortBy]);

  const formatMoney = (amount: number) =>
    `${Math.round(amount || 0).toLocaleString('vi-VN')} ₫`;

  const handleExportCSV = () => {
    if (!referrals.length) return;
    const headers = 'Mã Khách,Họ Tên,Số Điện Thoại,Ngày Đăng Ký,Trạng Thái,Số Đơn,Tổng Tiền Nạp (VNĐ),Hoa Hồng Nhận (VNĐ)\n';
    const rows = referrals
      .map((r) => {
        const status = r.hasDeposited !== false ? 'Đã Nạp Đơn' : 'Chưa Tạo Đơn';
        const commission = r.commissionVnd || r.commissionEarnedVnd || 0;
        return `"${r.customerCode}","${r.fullName || r.name}","${r.phone}","${r.registeredAt}","${status}",${r.totalOrders || 0},${r.totalSpentVnd || 0},${commission}`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Khach_Hang_Affiliate_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6 text-slate-800 animate-pulse">
        <div className="bg-slate-200 h-36 rounded-3xl w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-200 h-24 rounded-2xl w-full" />
          ))}
        </div>
        <div className="bg-slate-200 h-80 rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-200 pb-16">
      {/* ── TOP HERO BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mạng Lưới Khách Hàng Tuyến Dưới (F1)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Thống Kê Khách Hàng Giới Thiệu</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Theo dõi chi tiết tiến độ tạo đơn, tổng sản lượng nạp cước và hoa hồng phát sinh trọn đời từ từng khách hàng đăng ký qua mã của bạn.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportCSV}
              disabled={!referrals.length}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all backdrop-blur-md border border-white/10 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Xuất File CSV</span>
            </button>

            <Link
              href={`/${locale}/affiliate/links`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Lấy Link Giới Thiệu</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 250K BONUS UNLOCKING MILESTONE BANNER ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
            <Gift className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Thưởng Chào Mừng Thành Viên 250.000 ₫</h3>
              {stats.progressToBonus >= 3 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ĐÃ MỞ KHÓA RÚT TIỀN</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  CÒN THIẾU {3 - stats.progressToBonus} KHÁCH
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {stats.progressToBonus >= 3
                ? 'Bạn đã đạt mốc 3 khách hàng nạp đơn đầu tiên! Số tiền 250.000 ₫ đã sẵn sàng rút về tài khoản.'
                : `Giới thiệu thêm ${3 - stats.progressToBonus} khách hàng tạo đơn để mở khóa rút 250.000 ₫ về tài khoản ngân hàng.`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-64 shrink-0 space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-600">Tiến độ mở khóa</span>
            <span className="text-indigo-700 font-mono">{stats.progressToBonus}/3 Khách</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.progressToBonus >= 3
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-indigo-600'
              }`}
              style={{ width: `${(stats.progressToBonus / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 6 KPI STATISTIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Khách F1</span>
          <p className="text-xl font-bold font-mono text-slate-900">{stats.total}</p>
          <p className="text-[10px] text-slate-400 font-medium">Đăng ký qua mã của bạn</p>
        </div>

        {/* Active Deposited */}
        <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Đã Nạp Đơn</span>
          <p className="text-xl font-bold font-mono text-emerald-950">{stats.active}</p>
          <p className="text-[10px] text-emerald-700 font-medium">{stats.conversionRate}% tỷ lệ chuyển đổi</p>
        </div>

        {/* Pending */}
        <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Chưa Tạo Đơn</span>
          <p className="text-xl font-bold font-mono text-amber-950">{stats.pending}</p>
          <p className="text-[10px] text-amber-700 font-medium">Cần CTV tư vấn hỗ trợ</p>
        </div>

        {/* VIP Clients */}
        <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Khách VIP (&gt;5Tr)</span>
          <p className="text-xl font-bold font-mono text-purple-950">{stats.vipCount}</p>
          <p className="text-[10px] text-purple-700 font-medium">Khách hàng sản lượng lớn</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Doanh Số F1</span>
          <p className="text-base font-bold font-mono text-slate-900 truncate">{formatMoney(stats.totalSpent)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Tổng giá trị nạp đơn</p>
        </div>

        {/* Total Commission */}
        <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded-2xl shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">Hoa Hồng Nhận</span>
          <p className="text-base font-bold font-mono text-indigo-700 truncate">{formatMoney(stats.totalCommission)}</p>
          <p className="text-[10px] text-indigo-600 font-medium">5% – 50% trọn đời</p>
        </div>
      </div>

      {/* ── SEARCH & ADVANCED FILTER TOOLBAR ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        {/* Status Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'ALL', label: 'Tất cả', count: stats.total },
              { id: 'ACTIVE', label: 'Đã nạp đơn', count: stats.active },
              { id: 'PENDING', label: 'Chưa tạo đơn', count: stats.pending },
              { id: 'VIP', label: 'Khách VIP', count: stats.vipCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700 font-bold'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input & Sorter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã OCV, tên hoặc SĐT..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shrink-0"
            >
              <option value="NEWEST">Mới đăng ký nhất</option>
              <option value="SPENT_DESC">Doanh số cao nhất</option>
              <option value="COMMISSION_DESC">Hoa hồng cao nhất</option>
              <option value="ORDERS_DESC">Nhiều đơn hàng nhất</option>
            </select>
          </div>
        </div>

        {/* ── REFERRAL DATA TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50">
                <th className="py-3 px-3.5 rounded-l-xl">Mã Khách Hàng</th>
                <th className="py-3 px-3">Họ Và Tên</th>
                <th className="py-3 px-3">Liên Hệ</th>
                <th className="py-3 px-3">Ngày Đăng Ký</th>
                <th className="py-3 px-3 text-center">Số Đơn</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Tổng Tiền Nạp</th>
                <th className="py-3 px-3 text-right">Hoa Hồng Nhận</th>
                <th className="py-3 px-3.5 text-right rounded-r-xl">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-normal">
                    <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-xs">Không tìm thấy khách hàng nào phù hợp</p>
                    <p className="text-[11px] text-slate-400">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => {
                  const isActive = r.hasDeposited !== false && (r.totalOrders > 0 || r.totalSpentVnd > 0);
                  const isVip = (r.totalSpentVnd || 0) >= 5000000;
                  const commission = r.commissionVnd || r.commissionEarnedVnd || 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Code */}
                      <td className="py-3.5 px-3.5 font-mono font-bold text-blue-700">
                        <div className="flex items-center gap-1.5">
                          <span>{r.customerCode}</span>
                          {isVip && (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[9px] font-bold flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-purple-600" />
                              <span>VIP</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {r.fullName || r.name}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        <a
                          href={`tel:${r.phone}`}
                          className="hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{r.phone || 'Chưa cập nhật'}</span>
                        </a>
                      </td>

                      {/* Reg Date */}
                      <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                        {r.registeredAt}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
                        {r.totalOrders || 0}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã Nạp Đơn</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Chưa Tạo Đơn</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 text-right">
                        {formatMoney(r.totalSpentVnd || 0)}
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 text-right">
                        +{formatMoney(commission)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(r)}
                            title="Xem chi tiết doanh số & lịch sử"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {r.phone && (
                            <a
                              href={`https://zalo.me/${r.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Nhắn tin Zalo hỗ trợ khách"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Hiển thị <span className="font-bold text-slate-900">{filteredReferrals.length}</span> / {referrals.length} khách hàng
          </div>
          <div className="flex items-center gap-4">
            <span>
              Tổng nạp lọc được: <strong className="font-mono text-slate-900">{formatMoney(filteredReferrals.reduce((s, r) => s + (r.totalSpentVnd || 0), 0))}</strong>
            </span>
            <span>
              Hoa hồng: <strong className="font-mono text-emerald-600">+{formatMoney(filteredReferrals.reduce((s, r) => s + (r.commissionVnd || r.commissionEarnedVnd || 0), 0))}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
         CUSTOMER DETAIL MODAL (ANALYTICS & ADVICE)
         ═════════════════════════════════════════════════════════════════════ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hồ Sơ Khách Hàng F1</h3>
                  <p className="text-xs text-slate-500 font-mono font-bold text-blue-700">
                    {selectedCustomer.customerCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Profile Overview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedCustomer.fullName || selectedCustomer.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại:</span>
                    <p className="font-bold text-slate-900 font-mono">{selectedCustomer.phone || 'Chưa có'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ngày đăng ký:</span>
                    <p className="font-bold text-slate-700 font-mono">{selectedCustomer.registeredAt}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Trạng thái:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedCustomer.hasDeposited !== false ? 'Đã Nạp Đơn' : 'Chưa Tạo Đơn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Commission Breakdown */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
                <span className="font-bold text-emerald-950 block uppercase tracking-wide text-[11px]">
                  Thống Kê Doanh Số &amp; Hoa Hồng:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Số Đơn Hàng</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{selectedCustomer.totalOrders || 0}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Tổng Tiền Nạp</span>
                    <span className="font-bold text-slate-900 font-mono text-xs truncate block">
                      {formatMoney(selectedCustomer.totalSpentVnd || 0)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 block font-bold">Hoa Hồng CTV</span>
                    <span className="font-bold text-emerald-700 font-mono text-xs truncate block">
                      +{formatMoney(selectedCustomer.commissionVnd || selectedCustomer.commissionEarnedVnd || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Advice for CTV */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2">
                <span className="font-bold text-blue-950 block text-[11px] uppercase tracking-wide">
                  Gợi Ý Chăm Sóc Khách Hàng:
                </span>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {selectedCustomer.hasDeposited === false
                    ? 'Khách hàng chưa tạo đơn đầu tiên. Bạn nên chủ động nhắn tin Zalo hướng dẫn khách cách dán link đặt hàng Taobao/1688 hoặc chia sẻ mã ưu đãi giảm cước vận chuyển.'
                    : 'Khách hàng đang hoạt động tốt. Bạn có thể thường xuyên cập nhật tỷ giá CNY và thông báo các đợt sale lớn trên 1688/Taobao để kích thích khách nạp thêm đơn hàng.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              {selectedCustomer.phone && (
                <a
                  href={`https://zalo.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Nhắn Zalo Ngay</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
