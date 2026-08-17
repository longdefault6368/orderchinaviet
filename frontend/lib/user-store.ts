'use client';

import { apiFetch } from './api-client';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER' | 'AFFILIATE' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING' | 'DISABLED';

export interface BankAccountInfo { bankName: string; accountNumber: string; accountName: string }
export interface UserRecord {
  id: string; customerCode: string; fullName: string; email: string; phone: string; password?: string;
  role: UserRole; balanceVnd: number; promoBalanceVnd: number; status: UserStatus;
  createdAt: string; lastLoginAt: string; bankInfo?: BankAccountInfo; address?: string; avatarUrl?: string;
  customCommissionRate?: number; // Custom commission rate (%) for individual affiliate
}
export interface BalanceTransaction {
  id: string; userId: string; customerCode: string; amountVnd: number;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ORDER_PAYMENT' | 'AFFILIATE_REWARD'; note: string; createdAt: string;
}

class UserStoreService {
  private users: UserRecord[] = [];

  private mapUser(user: any): UserRecord {
    return {
      id: user.id, customerCode: user.customerCode || '', fullName: user.fullName || '', email: user.email || '', phone: user.phone || '',
      role: (user.roleCode || 'CUSTOMER') as UserRole, balanceVnd: Number(user.balance ?? user.balanceVnd ?? 0), promoBalanceVnd: 0,
      status: (user.status || 'ACTIVE') as UserStatus, createdAt: user.createdAt || '', lastLoginAt: user.updatedAt || '',
      address: user.address || '', avatarUrl: user.avatarUrl || '',
      customCommissionRate: user.customCommissionRate !== undefined ? Number(user.customCommissionRate) : undefined,
    };
  }

  async fetchCustomersFromApi(query = '', roleFilter = 'ALL', statusFilter = 'ALL'): Promise<UserRecord[]> {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (roleFilter !== 'ALL') params.set('role', roleFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    const response = await apiFetch(`/customers?${params}`);
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Không thể tải khách hàng');
    this.users = json.data.map((user: any) => this.mapUser(user));
    return this.users;
  }

  getUsers() { return this.users; }
  getUserById(id: string) { return this.users.find((user) => user.id === id); }
  getUserByCustomerCode(code: string) { return this.users.find((user) => user.customerCode.toLowerCase() === code.toLowerCase()); }
  getUserByEmail(email: string) { return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase()); }
  searchUsers(query: string, roleFilter = 'ALL', statusFilter = 'ALL') {
    const normalized = query.toLowerCase().trim();
    return this.users.filter((user) => (roleFilter === 'ALL' || user.role === roleFilter) && (statusFilter === 'ALL' || user.status === statusFilter) && (!normalized || [user.customerCode, user.fullName, user.email, user.phone].some((value) => value.toLowerCase().includes(normalized))));
  }
  authenticate(): never { throw new Error('Đăng nhập cục bộ đã bị vô hiệu hóa.'); }

  createUser(data: { fullName: string; email: string; phone: string; password?: string; role?: UserRole; initialBalanceVnd?: number; address?: string }): UserRecord {
    const optimistic = this.mapUser({ id: `pending-${Date.now()}`, customerCode: '', ...data, roleCode: data.role, balance: data.initialBalanceVnd, status: 'PENDING', createdAt: new Date().toISOString() });
    this.users = [optimistic, ...this.users];
    void apiFetch('/customers', { method: 'POST', body: JSON.stringify({ ...data, balanceVnd: data.initialBalanceVnd }) });
    return optimistic;
  }
  updateUser(id: string, data: Partial<UserRecord>): UserRecord {
    const index = this.users.findIndex((user) => user.id === id);
    if (index < 0) throw new Error('Không tìm thấy người dùng trong bộ nhớ hiện tại.');
    this.users[index] = { ...this.users[index], ...data };
    return this.users[index];
  }
  adjustBalance(id: string, amountVnd: number, note: string) {
    const user = this.getUserById(id);
    if (!user) throw new Error('Không tìm thấy người dùng.');
    void apiFetch(`/customers/${id}/balance`, { method: 'POST', body: JSON.stringify({ amountVnd, note }) });
    return user;
  }
  async toggleUserStatus(id: string) {
    const user = this.getUserById(id);
    if (!user) throw new Error('Không tìm thấy người dùng.');
    const nextStatus: UserStatus = (user.status === 'ACTIVE') ? 'DISABLED' : 'ACTIVE';
    user.status = nextStatus;
    await apiFetch(`/customers/${id}/toggle-status`, { method: 'POST' });
    return user;
  }
  async resetUserPassword(id: string, newPassword: string) {
    const res = await apiFetch(`/customers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể đổi mật khẩu');
    return json;
  }
  deleteUser(id: string) { this.users = this.users.filter((user) => user.id !== id); }
}

export const userStore = new UserStoreService();
