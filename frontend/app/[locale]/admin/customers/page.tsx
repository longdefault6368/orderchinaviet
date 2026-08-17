'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  UserCheck,
  Shield,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { userStore, UserRecord, UserRole, UserStatus } from '@/lib/user-store';
import { apiFetch } from '@/lib/api-client';

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form states
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CUSTOMER');
  const [newBalance, setNewBalance] = useState('0');
  const [formError, setFormError] = useState('');

  // Deposit Form states
  const [depositAmount, setDepositAmount] = useState('500000');
  const [depositType, setDepositType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [depositNote, setDepositNote] = useState('Cộng tiền cước kho qua chuyển khoản');

  // Edit Form states
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('CUSTOMER');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      const list = await userStore.fetchCustomersFromApi(searchQuery, roleFilter, statusFilter);
      if (isMounted) {
        setUsers(list);
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    const list = await userStore.fetchCustomersFromApi(searchQuery, roleFilter, statusFilter);
    setUsers(list);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newFullName.trim() || !newEmail.trim() || !newPhone.trim() || newPassword.length < 8) {
      setFormError('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại.');
      return;
    }

    try {
      const response = await apiFetch('/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          password: newPassword,
          role: newRole,
          balanceVnd: parseFloat(newBalance) || 0,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không thể tạo khách hàng');

      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewBalance('0');
      setShowCreateModal(false);
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra khi tạo người dùng.');
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amount = parseFloat(depositAmount) || 0;
    const finalAmount = depositType === 'ADD' ? amount : -amount;

    try {
      const response = await apiFetch(`/customers/${selectedUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVnd: finalAmount, note: depositNote }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không thể điều chỉnh số dư');
    } catch (e: any) { alert(e.message); return; }

    setShowDepositModal(false);
    setSelectedUser(null);
    await loadUsers();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    userStore.updateUser(selectedUser.id, {
      fullName: editFullName,
      phone: editPhone,
      role: editRole,
      status: editStatus,
    });

    try {
      await apiFetch(`/customers/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          phone: editPhone,
          role: editRole,
          status: editStatus,
        }),
      });
    } catch (e) { }

    setShowEditModal(false);
    setSelectedUser(null);
    await loadUsers();
  };

  const handleToggleStatus = async (u: UserRecord) => {
    userStore.toggleUserStatus(u.id);
    try {
      await apiFetch(`/customers/${u.id}/toggle-status`, { method: 'POST' });
    } catch (e) { }
    await loadUsers();
  };

  const handleDeleteUser = async (u: UserRecord) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${u.fullName} (${u.customerCode})?`)) {
      userStore.deleteUser(u.id);
      try {
        await apiFetch(`/customers/${u.id}`, { method: 'DELETE' });
      } catch (e) { }
      await loadUsers();
    }
  };

  const openDepositModal = (u: UserRecord) => {
    setSelectedUser(u);
    setDepositAmount('500000');
    setDepositType('ADD');
    setDepositNote('Cộng tiền cước kho qua chuyển khoản');
    setShowDepositModal(true);
  };

  const openEditModal = (u: UserRecord) => {
    setSelectedUser(u);
    setEditFullName(u.fullName);
    setEditPhone(u.phone);
    setEditRole(u.role);
    setEditStatus(u.status);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900  animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hệ Thống Dữ Liệu Khách Hàng Thật</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Danh Sách Người Dùng &amp; Mã OCV</h1>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">Quản lý tài khoản khách hàng, vai trò, hạn mức tín dụng và cộng số dư ví cước real-time.</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khách Hàng / User Mới</span>
        </button>
      </div>

      {/* Real Customer Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Tổng Số Người Dùng</div>
          <div className="font-mono font-bold text-slate-900 text-xl flex items-center justify-between">
            <span>{userStore.getUsers().length} tài khoản</span>
            <Users className="w-5 h-5 text-primary-500 opacity-60" />
          </div>
          <p className="text-[11px] text-slate-500">Người dùng đã lưu trong hệ thống</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Khách Hàng (Customer)</div>
          <div className="font-mono font-bold text-emerald-600 text-xl flex items-center justify-between">
            <span>{userStore.getUsers().filter((u) => u.role === 'CUSTOMER').length} khách</span>
            <UserCheck className="w-5 h-5 text-emerald-500 opacity-60" />
          </div>
          <p className="text-[11px] text-slate-500">Tài khoản khách hàng chính thức</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Tổng Số Dư Ví Cước Khách</div>
          <div className="font-mono font-bold text-[#0c3ed0] text-xl flex items-center justify-between">
            <span>{userStore.getUsers().reduce((sum, u) => sum + (u.balanceVnd ?? (u as any).balance ?? 0), 0).toLocaleString('vi-VN')} ₫</span>
            <DollarSign className="w-5 h-5 text-[#0c3ed0] opacity-60" />
          </div>
          <p className="text-[11px] text-slate-500">Số dư hiện có trong ví hệ thống</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Tài Khoản Hoạt Động</div>
          <div className="font-mono font-bold text-teal-600 text-xl flex items-center justify-between">
            <span>{userStore.getUsers().filter((u) => u.status === 'ACTIVE').length} active</span>
            <Shield className="w-5 h-5 text-teal-500 opacity-60" />
          </div>
          <p className="text-[11px] text-slate-500">Trạng thái bình thường</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã OCV, Tên, Email hoặc Số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
              <option value="CUSTOMER">Khách Hàng (CUSTOMER)</option>
              <option value="AFFILIATE">Đối Tác (AFFILIATE)</option>
              <option value="STAFF">Nhân Viên Kho (STAFF)</option>
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt Động (ACTIVE)</option>
              <option value="LOCKED">Đã Khóa (LOCKED)</option>
            </select>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 font-normal">
            Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-100 space-y-3">
              {users.map((u) => (
                <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 border border-slate-200">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-primary-600 text-sm">{u.customerCode}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${u.role === 'SUPER_ADMIN'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : u.role === 'AFFILIATE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-primary-50 text-primary-700 border-primary-200'
                      }`}>
                      {u.role}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                  <div className="text-slate-600 font-mono">{u.email}</div>
                  <div className="text-slate-800 font-mono">{u.phone}</div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Số dư ví cước:</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      {(u.balanceVnd ?? (u as any).balance ?? 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}
                    >
                      {u.status === 'ACTIVE' ? 'Hoạt Động' : 'Đã Khóa'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openDepositModal(u)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Ví Tiền
                      </button>
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Mã KH</th>
                    <th className="pb-3">Avatar</th>
                    <th className="pb-3">Họ Và Tên</th>
                    <th className="pb-3">Email Liên Hệ</th>
                    <th className="pb-3">Số Điện Thoại</th>
                    <th className="pb-3">Số Dư Ví Cước</th>
                    <th className="pb-3">Vai Trò</th>
                    <th className="pb-3">Trạng Thái</th>
                    <th className="pb-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-primary-600">{u.customerCode}</td>
                      <td className="py-3.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs border border-slate-200 shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">{u.fullName}</td>
                      <td className="py-3.5 font-mono text-slate-600">{u.email}</td>
                      <td className="py-3.5 font-mono text-slate-800">{u.phone}</td>
                      <td className="py-3.5 font-mono font-bold text-emerald-600">
                        {(u.balanceVnd ?? (u as any).balance ?? 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${u.role === 'SUPER_ADMIN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : u.role === 'AFFILIATE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-primary-50 text-primary-700 border-primary-200'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hoạt Động</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Đã Khóa</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDepositModal(u)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Cộng / Trừ số dư ví"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Ví Tiền</span>
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tài khoản"
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
          </>
        )}
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Tạo Tài Khoản Khách Hàng / User Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="khachhang@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0909123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật Khẩu Đăng Nhập <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai Trò</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
                    <option value="AFFILIATE">AFFILIATE (Tiếp thị)</option>
                    <option value="STAFF">STAFF (Nhân viên)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Dư Ban Đầu (VNĐ)</label>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tạo Người Dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Balance */}
      {showDepositModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Cộng / Trừ Số Dư Ví Cước
                </h3>
                <p className="text-xs font-mono text-primary-600 mt-0.5">{selectedUser.fullName} ({selectedUser.customerCode})</p>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-500">Số dư hiện tại:</span>
                <span className="font-bold text-emerald-600 text-sm">{selectedUser.balanceVnd.toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại Giao Dịch</label>
                  <select
                    value={depositType}
                    onChange={(e) => setDepositType(e.target.value as 'ADD' | 'SUBTRACT')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ADD">Cộng tiền (+)</option>
                    <option value="SUBTRACT">Trừ tiền (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền (VNĐ)</label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="500000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Giao Dịch</label>
                <input
                  type="text"
                  required
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Cộng tiền cước kho qua chuyển khoản Vietcombank"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Xác Nhận Cập Nhật Ví
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary-600" />
                Chỉnh Sửa Thông Tin ({selectedUser.customerCode})
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai Trò (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="AFFILIATE">AFFILIATE</option>
                    <option value="STAFF">STAFF</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng Thái</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
                  >
                    <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                    <option value="LOCKED">LOCKED (Khóa tài khoản)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
