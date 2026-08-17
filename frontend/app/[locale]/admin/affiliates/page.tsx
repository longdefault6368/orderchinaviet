'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  DollarSign,
  Gift,
  ArrowUpRight,
  Building2,
  Calendar,
  Eye,
  X,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  CreditCard,
  UserCheck,
  Percent,
  Phone,
  Mail,
  Save,
  Plus,
  UserPlus,
  Key,
  KeyRound,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Lock,
  Unlock,
  EyeOff,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, WithdrawalRequest, ReferredCustomer } from '@/lib/affiliate-store';
import { userStore, UserRecord } from '@/lib/user-store';
import { settingsStore } from '@/lib/settings-store';
import { apiFetch } from '@/lib/api-client';

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<UserRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<UserRecord | null>(null);
  const [referredCustomers, setReferredCustomers] = useState<ReferredCustomer[]>([]);
  const [editingRate, setEditingRate] = useState<number | null>(null);
  const [rateSaved, setRateSaved] = useState(false);

  // Create Partner Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [newPartner, setNewPartner] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    affiliateCode: '',
    customCommissionRate: 30,
    promoBalanceVnd: 250000,
    balanceVnd: 0,
  });

  // Reset Password Modal State
  const [resetPassUser, setResetPassUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPassLoading, setResetPassLoading] = useState(false);
  const [resetPassError, setResetPassError] = useState('');
  const [resetPassSuccess, setResetPassSuccess] = useState('');

  // Status Toggle Loading State
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const defaultCommissionRate = settingsStore.getSettings().defaultAffiliateCommissionRate || 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    userStore.fetchCustomersFromApi('', 'AFFILIATE').then(setAffiliates).catch(() => setAffiliates(userStore.searchUsers('', 'AFFILIATE')));
    const requests = affiliateStore.getWithdrawalHistory();
    setWithdrawals(requests);
  };

  const handleOpenResetPassword = (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResetPassUser(user);
    setNewPassword('Pass' + Math.floor(100000 + Math.random() * 900000));
    setResetPassError('');
    setResetPassSuccess('');
    setShowNewPassword(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    if (newPassword.length < 6) {
      setResetPassError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    setResetPassLoading(true);
    setResetPassError('');
    try {
      await userStore.resetUserPassword(resetPassUser.id, newPassword);
      setResetPassSuccess(`Đổi mật khẩu thành công cho [${resetPassUser.fullName}]! Mật khẩu mới: ${newPassword}`);
      setTimeout(() => {
        setResetPassUser(null);
      }, 2000);
    } catch (err: any) {
      setResetPassError(err.message || 'Lỗi đổi mật khẩu');
    } finally {
      setResetPassLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyActive = user.status === 'ACTIVE';
    const actionName = isCurrentlyActive ? 'vô hiệu hóa / khóa' : 'mở khóa / kích hoạt lại';
    if (!confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản đối tác [${user.fullName}]?`)) return;

    setTogglingUserId(user.id);
    try {
      await userStore.toggleUserStatus(user.id);
      loadData();
      if (selectedAffiliate && selectedAffiliate.id === user.id) {
        setSelectedAffiliate({
          ...selectedAffiliate,
          status: isCurrentlyActive ? 'DISABLED' : 'ACTIVE',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi thay đổi trạng thái');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleOpenCreateModal = () => {
    setNewPartner({
      fullName: '',
      email: '',
      phone: '',
      password: 'Pass' + Math.floor(100000 + Math.random() * 900000),
      affiliateCode: 'OCV_AFF_' + Date.now().toString().slice(-6),
      customCommissionRate: 30,
      promoBalanceVnd: 250000,
      balanceVnd: 0,
    });
    setCreateError('');
    setCreateSuccess('');
    setShowCreateModal(true);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!newPartner.fullName.trim()) {
      setCreateError('Vui lòng nhập họ và tên của đối tác');
      return;
    }
    if (!newPartner.email.trim()) {
      setCreateError('Vui lòng nhập email đăng nhập');
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newPartner.fullName.trim(),
          email: newPartner.email.trim(),
          phone: newPartner.phone.trim(),
          password: newPartner.password || '123456',
          role: 'AFFILIATE',
          isAffiliate: true,
          affiliateCode: newPartner.affiliateCode.trim().toUpperCase(),
          customCommissionRate: Number(newPartner.customCommissionRate || 30),
          promoBalanceVnd: Number(newPartner.promoBalanceVnd || 250000),
          balanceVnd: Number(newPartner.balanceVnd || 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Tạo tài khoản đối tác thất bại');
      }

      setCreateSuccess(`Tạo thành công tài khoản Đối tác [${newPartner.fullName}] với Mã [${newPartner.affiliateCode}]!`);
      loadData();
      setTimeout(() => {
        setShowCreateModal(false);
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDetail = async (aff: UserRecord) => {
    setSelectedAffiliate(aff);
    setEditingRate(aff.customCommissionRate !== undefined ? aff.customCommissionRate : null);

    const activeRate = aff.customCommissionRate ?? defaultCommissionRate;

    try {
      const response = await apiFetch(`/affiliates/referrals?affiliateId=${aff.id}`);
      if (response.ok) {
        const json = await response.json();
        const realRefs: ReferredCustomer[] = (json.data || []).map((item: any) => ({
          id: item.id || 'ref-' + item.customerCode,
          customerCode: item.customerCode || '',
          name: item.fullName || item.name || '',
          fullName: item.fullName || item.name || '',
          phone: item.phone || '',
          registeredAt: item.registeredAt ? new Date(item.registeredAt).toLocaleDateString('vi-VN') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'),
          totalOrders: Number(item.totalOrders || item._count?.orders || 0),
          totalSpentVnd: Number(item.totalSpentVnd || item.totalSpent || 0),
          commissionEarnedVnd: Math.round(((Number(item.totalSpentVnd || item.totalSpent || 0)) * activeRate) / 100),
          status: item.status || 'ACTIVE',
          hasDeposited: item.hasDeposited ?? true,
        }));
        setReferredCustomers(realRefs);
        return;
      }
    } catch {
      // Fallback to real store data
    }

    // Load only real store data (Zero mock / demo data)
    const storeRefs = affiliateStore.getReferredCustomers();
    setReferredCustomers(
      storeRefs.map((c) => ({
        ...c,
        commissionEarnedVnd: Math.round(((c.totalSpentVnd || 0) * activeRate) / 100),
      }))
    );
  };

  const handleSaveCommissionRate = () => {
    if (!selectedAffiliate) return;
    const updated = userStore.updateUser(selectedAffiliate.id, {
      customCommissionRate: editingRate !== null ? Number(editingRate) : undefined,
    });
    setSelectedAffiliate({ ...updated });
    loadData();

    // Recalculate referral commissions dynamically
    const newRate = editingRate !== null ? Number(editingRate) : defaultCommissionRate;
    setReferredCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        commissionEarnedVnd: Math.round((c.totalSpentVnd * newRate) / 100),
      }))
    );

    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  };

  const handleApproveWithdrawal = (id: string) => {
    affiliateStore.approveWithdrawal(id);
    loadData();
  };

  const handleRejectWithdrawal = (id: string) => {
    affiliateStore.rejectWithdrawal(id);
    loadData();
  };

  const filteredAffiliates = affiliates.filter(
    (a) =>
      a.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900  ">
      {/* Header Banner — Bright & Clean Accent */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-200/80">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 border border-amber-300/80 text-xs font-bold px-3 py-1 rounded-full">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Quản Trị Hệ Thống Tiếp Thị Liên Kết</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Quản Lý Đối Tác Tiếp Thị &amp; Duyệt Hoa Hồng</h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            Tỷ lệ hoa hồng mặc định toàn hệ thống là <strong className="text-amber-700 font-mono font-bold">{defaultCommissionRate}%</strong>. Bạn có thể xem chi tiết khách hàng giới thiệu &amp; cài đặt tỷ lệ hoa hồng riêng cho từng User.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Tài Khoản Đối Tác</span>
        </button>
      </div>

      {/* Overview Cards — Bright & Clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200/90 p-5 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng Số Đối Tác Affiliate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">{affiliates.length} Đối Tác</div>
          <p className="text-[11px] text-slate-400">Đã đăng ký cổng Tiếp thị liên kết</p>
        </div>

        <div className="bg-white border border-emerald-200/90 p-5 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Yêu Cầu Rút Tiền Chờ Duyệt</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {withdrawals.filter((w) => w.status === 'PENDING').length} Yêu Cầu
          </div>
          <p className="text-[11px] text-slate-400">Cần kế toán xác nhận chuyển khoản</p>
        </div>

        <div className="bg-white border border-sky-200/90 p-5 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all space-y-1.5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tỷ Lệ Hoa Hồng Mặc Định</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700">
            {defaultCommissionRate}% Doanh Số
          </div>
          <p className="text-[11px] text-slate-400">Áp dụng cho toàn bộ đơn hàng mua hộ</p>
        </div>
      </div>

      {/* Pending Withdrawals Approvals Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Yêu Cầu Rút Tiền Cần Duyệt Chuyển Khoản</span>
          </h2>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {withdrawals.filter((w) => w.status === 'PENDING').length} đơn chờ
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {withdrawals.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Hiện chưa có yêu cầu rút tiền nào cần xử lý.
            </div>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-mono font-bold text-[#0c3ed0]">{w.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${w.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : w.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                    {w.status === 'APPROVED' ? 'Đã Chuyển Khoản' : w.status === 'REJECTED' ? 'Đã Từ Chối' : 'Chờ Duyệt'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Mã Đối Tác:</span>
                    <div className="font-mono font-bold text-amber-600">{w.affiliateCode}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Số Tiền Rút:</span>
                    <div className="font-mono font-bold text-emerald-600">{w.amountVnd.toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{w.bankInfo?.bankName || w.bankName}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    STK: {w.bankInfo?.accountNumber || w.accountNumber} - {w.bankInfo?.accountName || w.accountName}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{w.createdAt || w.requestedAt}</span>
                  </div>
                </div>

                {w.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApproveWithdrawal(w.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã Chuyển Tiền</span>
                    </button>
                    <button
                      onClick={() => handleRejectWithdrawal(w.id)}
                      className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ Chối</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px]">
                <th className="py-3 px-3.5 rounded-l-xl">Mã Yêu Cầu</th>
                <th className="py-3 px-3.5">Mã Đối Tác</th>
                <th className="py-3 px-3.5">Số Tiền Rút</th>
                <th className="py-3 px-3.5">Thông Tin Ngân Hàng</th>
                <th className="py-3 px-3.5">Thời Gian Gửi</th>
                <th className="py-3 px-3.5">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right rounded-r-xl">Thao Tác Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-normal">
                    Hiện chưa có yêu cầu rút tiền nào cần xử lý.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3.5 font-mono font-bold text-[#0c3ed0]">{w.id}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-amber-600">{w.affiliateCode}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-600">{w.amountVnd.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-3.5 px-3.5 text-slate-800">
                      <div className="font-bold">{w.bankInfo?.bankName || w.bankName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{w.bankInfo?.accountNumber || w.accountNumber} - {w.bankInfo?.accountName || w.accountName}</div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-slate-500">{w.createdAt || w.requestedAt}</td>
                    <td className="py-3.5 px-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${w.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : w.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {w.status === 'APPROVED' ? 'Đã Chuyển Khoản' : w.status === 'REJECTED' ? 'Đã Từ Chối' : 'Chờ Duyệt'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã Chuyển Tiền</span>
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ Chối</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Affiliate Partners List Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Danh Sách Tài Khoản Đối Tác Tiếp Thị</h2>
            <p className="text-xs text-slate-500">Tỷ lệ hoa hồng hệ thống: <strong>{defaultCommissionRate}%</strong> • Bấm "Xem Chi Tiết" để xem khách giới thiệu &amp; chỉnh tỷ lệ riêng</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Mã OCV_AFF, Tên hoặc Email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Mới</span>
            </button>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {filteredAffiliates.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa tìm thấy đối tác nào phù hợp.
            </div>
          ) : (
            filteredAffiliates.map((a) => (
              <div key={a.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 text-sm">{a.customerCode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                      a.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {a.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{a.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</span>
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Hoa hồng: {a.customCommissionRate !== undefined ? `${a.customCommissionRate}%` : `${defaultCommissionRate}%`}
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-sm">{a.fullName}</div>
                <div className="font-mono text-slate-600 text-[11px]">{a.email}</div>
                <div className="font-mono text-slate-600 text-[11px]">SĐT: {a.phone || 'Chưa cập nhật'}</div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-700">
                  <span className="text-slate-500">Ví Khuyến Mãi 250k:</span>
                  <strong className="font-mono text-amber-600 font-bold text-xs">
                    {(a.promoBalanceVnd || 250000).toLocaleString('vi-VN')} ₫
                  </strong>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDetail(a)}
                    className="py-2 bg-[#0c3ed0] hover:bg-[#092fb0] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi Tiết</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenResetPassword(a, e)}
                    className="py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Đổi Pass</span>
                  </button>
                  <button
                    onClick={(e) => handleToggleStatus(a, e)}
                    disabled={togglingUserId === a.id}
                    className={`py-2 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                      a.status === 'ACTIVE'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {a.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{a.status === 'ACTIVE' ? 'Khóa' : 'Mở Khóa'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px]">
                <th className="py-3 px-3.5 rounded-l-xl">Mã Đối Tác</th>
                <th className="py-3 px-3.5">Họ Và Tên</th>
                <th className="py-3 px-3.5">Email Liên Hệ</th>
                <th className="py-3 px-3.5">Số Điện Thoại</th>
                <th className="py-3 px-3.5">Tỷ Lệ Hoa Hồng</th>
                <th className="py-3 px-3.5">Ví Thưởng 250k</th>
                <th className="py-3 px-3.5">Trạng Thái</th>
                <th className="py-3 px-3.5 text-center rounded-r-xl">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAffiliates.map((a) => (
                <tr key={a.id} className={`hover:bg-slate-50/80 transition-colors ${a.status !== 'ACTIVE' ? 'bg-slate-50/50 opacity-75' : ''}`}>
                  <td className="py-3.5 px-3.5 font-mono font-bold text-amber-600">{a.customerCode}</td>
                  <td className="py-3.5 px-3.5 font-bold text-slate-900">{a.fullName}</td>
                  <td className="py-3.5 px-3.5 font-mono text-slate-600">{a.email}</td>
                  <td className="py-3.5 px-3.5 font-mono text-slate-800">{a.phone || 'Chưa cập nhật'}</td>
                  <td className="py-3.5 px-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${a.customCommissionRate !== undefined
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                      {a.customCommissionRate !== undefined ? `${a.customCommissionRate}% (Riêng)` : `${defaultCommissionRate}% (Mặc định)`}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono font-bold text-amber-600">
                    {(a.promoBalanceVnd || 250000).toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                      a.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {a.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Hoạt động</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Đã khóa</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDetail(a)}
                        className="px-2.5 py-1.5 bg-[#0c3ed0] hover:bg-[#092fb0] text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        title="Xem chi tiết đối tác & tỷ lệ %"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi Tiết</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenResetPassword(a, e)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        title="Đổi mật khẩu tài khoản"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleToggleStatus(a, e)}
                        disabled={togglingUserId === a.id}
                        className={`p-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                          a.status === 'ACTIVE'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title={a.status === 'ACTIVE' ? 'Khóa / Vô hiệu hóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {a.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: CHI TIẾT ĐỐI TÁC TIẾP THỊ & KHÁCH HÀNG GIỚI THIỆU ── */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-800">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedAffiliate.fullName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {selectedAffiliate.customerCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                      selectedAffiliate.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {selectedAffiliate.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-rose-600" />}
                      <span>{selectedAffiliate.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Email: {selectedAffiliate.email} • SĐT: {selectedAffiliate.phone || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={(e) => handleOpenResetPassword(selectedAffiliate, e)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Đổi mật khẩu cho đối tác này"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đổi Pass</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleToggleStatus(selectedAffiliate, e)}
                  disabled={togglingUserId === selectedAffiliate.id}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border ${
                    selectedAffiliate.status === 'ACTIVE'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedAffiliate.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{selectedAffiliate.status === 'ACTIVE' ? 'Khóa Tài Khoản' : 'Mở Khóa'}</span>
                </button>

                <button
                  onClick={() => setSelectedAffiliate(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Custom Commission Rate Setter Box */}
            <div className="p-4.5 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Percent className="w-4 h-4 text-amber-600" />
                  <span>Cấu Hình Tỷ Lệ Hoa Hồng Riêng Cho Đối Tác Này (%):</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-white border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Mặc định hệ thống: {defaultCommissionRate}%
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="relative w-40">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editingRate ?? ''}
                    placeholder={`Dùng ${defaultCommissionRate}%`}
                    onChange={(e) => setEditingRate(e.target.value !== '' ? Number(e.target.value) : null)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCommissionRate}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{rateSaved ? 'Đã Lưu!' : 'Lưu Tỷ Lệ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRate(null);
                    handleSaveCommissionRate();
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-[11px] transition-colors cursor-pointer"
                >
                  Đặt Về Mặc Định ({defaultCommissionRate}%)
                </button>
              </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Ví Khuyến Mãi 250k</div>
                <div className="font-mono font-bold text-amber-700 text-base">
                  {(selectedAffiliate.promoBalanceVnd || 250000).toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã Mở Khóa (3 Khách)</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Hoa Hồng Tích Lũy ({editingRate ?? defaultCommissionRate}%)</div>
                <div className="font-mono font-bold text-emerald-700 text-base">
                  {referredCustomers.reduce((acc, c) => acc + (c.commissionEarnedVnd || c.commissionVnd || 0), 0).toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-slate-500">Từ đơn hàng khách mua hộ</div>
              </div>

              <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Khách Hàng Giới Thiệu</div>
                <div className="font-mono font-bold text-sky-700 text-base">
                  {referredCustomers.length} Khách Hàng
                </div>
                <div className="text-[10px] text-sky-600 font-bold">Đạt mốc tiêu chuẩn 100%</div>
              </div>

              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Đã Rút Về Ngân Hàng</div>
                <div className="font-mono font-bold text-purple-700 text-base">
                  {withdrawals
                    .filter((w) => w.affiliateCode === selectedAffiliate.customerCode && w.status === 'APPROVED')
                    .reduce((acc, w) => acc + w.amountVnd, 0)
                    .toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[10px] text-slate-500">Chuyển khoản thành công</div>
              </div>
            </div>

            {/* Section 2: Referred Customers Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 font-mono tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Danh Sách Khách Hàng Đăng Ký Qua Mã {selectedAffiliate.customerCode}</span>
                </h4>
                <span className="text-xs text-slate-500">
                  Áp dụng hoa hồng: <strong className="text-emerald-700 font-mono font-bold">{editingRate ?? defaultCommissionRate}%</strong>
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Mã Khách Hàng</th>
                        <th className="py-2.5 px-3">Tên Khách Hàng</th>
                        <th className="py-2.5 px-3">Số Điện Thoại</th>
                        <th className="py-2.5 px-3">Ngày Đăng Ký</th>
                        <th className="py-2.5 px-3 text-center">Số Đơn</th>
                        <th className="py-2.5 px-3 text-right">Tổng Chi Tiêu Mua Hộ</th>
                        <th className="py-2.5 px-3 text-right">Hoa Hồng ({editingRate ?? defaultCommissionRate}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 font-medium text-slate-700">
                      {referredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-normal">
                            Chưa có khách hàng nào đăng ký qua liên kết tiếp thị này.
                          </td>
                        </tr>
                      ) : (
                        referredCustomers.map((cust, idx) => (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-[#0c3ed0]">{cust.customerCode}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{cust.fullName || cust.name}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{cust.phone || '—'}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{cust.registeredAt}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold">{cust.totalOrders || 0} đơn</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {(cust.totalSpentVnd || 0).toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                              +{(cust.commissionEarnedVnd || cust.commissionVnd || 0).toLocaleString('vi-VN')} ₫
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 3: Bank Account Info & Payout History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Thông Tin Ngân Hàng Nhận Hoa Hồng</span>
                </div>
                <div className="space-y-1 font-mono text-slate-700">
                  <div>Ngân Hàng: <strong className="text-slate-900 font-bold">{selectedAffiliate.bankInfo?.bankName || 'Vietcombank'}</strong></div>
                  <div>Số Tài Khoản: <strong className="text-emerald-700 font-bold">{selectedAffiliate.bankInfo?.accountNumber || '—'}</strong></div>
                  <div>Chủ Tài Khoản: <strong className="text-slate-900 font-bold">{selectedAffiliate.bankInfo?.accountName || selectedAffiliate.fullName}</strong></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#0c3ed0]" />
                  <span>Link Tiếp Thị Liên Kết Mẫu</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-sky-700 break-all">
                  https://orderchinaviet.com/vi/register?ref={selectedAffiliate.customerCode}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAffiliate(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng Chi Tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Affiliate Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>TẠO ĐỐI TÁC TIẾP THỊ</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    Thêm Tài Khoản Đối Tác Affiliate Mới
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePartner} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên đối tác <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartner.fullName}
                    onChange={(e) => setNewPartner({ ...newPartner, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    placeholder="doitac@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại / Zalo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    placeholder="0988 123 456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu đăng nhập
                  </label>
                  <input
                    type="text"
                    value={newPartner.password}
                    onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                    placeholder="VD: 123456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã giới thiệu (Affiliate Code)
                  </label>
                  <input
                    type="text"
                    value={newPartner.affiliateCode}
                    onChange={(e) => setNewPartner({ ...newPartner, affiliateCode: e.target.value })}
                    placeholder="VD: OCV_AFF_8888"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-amber-700 uppercase focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tỷ lệ hoa hồng (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newPartner.customCommissionRate}
                      onChange={(e) => setNewPartner({ ...newPartner, customCommissionRate: parseInt(e.target.value) || 30 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiền thưởng chào mừng ví (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={newPartner.promoBalanceVnd}
                    onChange={(e) => setNewPartner({ ...newPartner, promoBalanceVnd: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{creating ? 'Đang Tạo...' : 'Tạo Tài Khoản Đối Tác'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ĐỔI MẬT KHẨU ĐỐI TÁC ── */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Đổi Mật Khẩu Tài Khoản Đối Tác</h3>
                  <p className="text-[11px] text-slate-500">{resetPassUser.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPassUser(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="space-y-4">
              {resetPassError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{resetPassError}</span>
                </div>
              )}

              {resetPassSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetPassSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs font-mono">
                <div className="text-slate-500">Mã Đối Tác: <strong className="text-amber-700">{resetPassUser.customerCode}</strong></div>
                <div className="text-slate-500">Email Đăng Nhập: <strong className="text-slate-800">{resetPassUser.email}</strong></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rnd = 'Pass' + Math.floor(100000 + Math.random() * 900000);
                      setNewPassword(rnd);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo Mật Khẩu Ngẫu Nhiên</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetPassLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{resetPassLoading ? 'Đang Lưu...' : 'Cập Nhật Mật Khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
