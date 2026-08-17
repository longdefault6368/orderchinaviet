/**
 * OrderChinaViet — Affiliate Partner Store v1.0
 * Handles Affiliate Auth, Referral Link Generation, 250,000 ₫ Welcome Bonus,
 * 3-Customer Unlocking Rule, Referred Customer Logs & Payout Requests.
 */

import { authStore } from './auth-store';
import { apiFetch } from './api-client';
import { SITE_URL } from './api-client';

export interface BankAccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface ReferredCustomer {
  id: string;
  customerCode: string;
  name: string;
  fullName?: string;
  phone: string;
  registeredAt: string;
  totalOrders: number;
  totalSpentVnd: number;
  commissionEarnedVnd: number;
  commissionVnd?: number;
  hasDeposited?: boolean;
  status: 'ACTIVE' | 'PENDING';
}

export interface WithdrawalRequest {
  id: string;
  affiliateCode?: string;
  amountVnd: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankInfo?: BankAccountDetails;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  createdAt?: string;
  notes?: string;
}

export interface AffiliateSession {
  id: string;
  affiliateCode: string; // e.g. OCV_AFF_888888
  fullName: string;
  email: string;
  phone: string;
  promoBonusVnd: number; // 250,000 ₫
  promoBalanceVnd?: number;
  withdrawableBalanceVnd?: number;
  unlockedBonus: boolean; // Unlocked when referredCustomers >= 3
  referredCustomersCount: number; // Goal: 3
  requiredCustomersToUnlock: number; // 3
  commissionBalanceVnd: number; // Earned from orders
  totalEarnedVnd: number;
  withdrawnVnd: number;
  clickCount?: number;
  referralLink: string;
  createdAt: string;
  bankInfo?: BankAccountDetails;
}

export type AffiliateAccount = AffiliateSession;

const STORAGE_KEY = 'ocv_affiliate_session_v1';
const REFERRED_CUSTOMERS_KEY = 'ocv_affiliate_referred_customers_v1';
const WITHDRAWALS_KEY = 'ocv_affiliate_withdrawals_v1';

// Initial clean fallback session if no session is stored
const DEFAULT_AFFILIATE: AffiliateSession = {
  id: 'aff-001',
  affiliateCode: 'OCV_AFF_888888',
  fullName: 'Đối Tác Tiếp Thị',
  email: 'affiliate@orderchinaviet.com',
  phone: '',
  promoBonusVnd: 250000,
  promoBalanceVnd: 250000,
  withdrawableBalanceVnd: 0,
  unlockedBonus: false,
  referredCustomersCount: 0,
  requiredCustomersToUnlock: 3,
  commissionBalanceVnd: 0,
  totalEarnedVnd: 250000,
  withdrawnVnd: 0,
  clickCount: 0,
  referralLink: '',
  createdAt: new Date().toLocaleDateString('vi-VN'),
  bankInfo: {
    bankName: 'Vietcombank',
    accountNumber: '',
    accountName: '',
  },
};

const INITIAL_REFERRED_CUSTOMERS: ReferredCustomer[] = [];
const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];

export class AffiliateStore {
  private memory = new Map<string, unknown>();
  private loading = new Set<string>();
  private lastFetched = new Map<string, number>();

  private getStorage<T>(key: string, defaultVal: T): T {
    return (this.memory.get(key) as T) ?? defaultVal;
  }

  private setStorage<T>(key: string, val: T): void {
    this.memory.set(key, val);
  }

  invalidateCache(): void {
    this.lastFetched.clear();
  }

  getAffiliate(): AffiliateSession {
    const activeUser = authStore.getUser();
    const stored = this.getStorage<AffiliateSession | null>(STORAGE_KEY, null);

    let session: AffiliateSession;

    if (stored) {
      session = stored;
    } else if (activeUser) {
      session = {
        id: activeUser.id || 'aff-' + Date.now(),
        affiliateCode: activeUser.customerCode && activeUser.customerCode.startsWith('OCV_AFF') ? activeUser.customerCode : 'OCV_AFF_' + Math.floor(100000 + Math.random() * 900000),
        fullName: activeUser.fullName || '',
        email: activeUser.email || '',
        phone: activeUser.phone || '',
        promoBonusVnd: 250000,
        promoBalanceVnd: 250000,
        withdrawableBalanceVnd: 0,
        unlockedBonus: false,
        referredCustomersCount: 0,
        requiredCustomersToUnlock: 3,
        commissionBalanceVnd: 0,
        totalEarnedVnd: 250000,
        withdrawnVnd: 0,
        clickCount: 0,
        referralLink: `${SITE_URL}/vi/register?ref=${activeUser.customerCode || ''}`,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };
      this.setStorage(STORAGE_KEY, session);
    } else {
      session = { ...DEFAULT_AFFILIATE, id: '', affiliateCode: '', fullName: '', email: '', referralLink: '', promoBonusVnd: 0, promoBalanceVnd: 0, totalEarnedVnd: 0 };
    }

    if (activeUser) {
      session.fullName = activeUser.fullName || session.fullName;
      session.email = activeUser.email || session.email;
      session.phone = activeUser.phone || session.phone;
      if (activeUser.customerCode && activeUser.customerCode.startsWith('OCV_AFF')) {
        session.affiliateCode = activeUser.customerCode;
      }
    }

    session.promoBalanceVnd = session.promoBonusVnd || 250000;
    session.withdrawableBalanceVnd = session.commissionBalanceVnd || 0;

    const storedClicks = typeof window !== 'undefined'
      ? Math.max(
          session.affiliateCode ? Number(localStorage.getItem(`ocv_aff_clicks_${session.affiliateCode}`) || '0') : 0,
          session.affiliateCode ? Number(localStorage.getItem(`ocv_aff_clicks_${session.affiliateCode.toUpperCase()}`) || '0') : 0,
          session.affiliateCode ? Number(localStorage.getItem(`ocv_aff_clicks_${session.affiliateCode.toLowerCase()}`) || '0') : 0,
          Number(localStorage.getItem('ocv_total_aff_clicks') || '0')
        )
      : 0;

    session.clickCount = Math.max(session.clickCount || 0, storedClicks);
    session.referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/vi/register?ref=${session.affiliateCode}`;

    const now = Date.now();
    const token = authStore.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('ocv_access_token') : null);

    if (token && typeof window !== 'undefined' && !this.loading.has('profile') && (now - (this.lastFetched.get('profile') || 0) > 30000)) {
      this.loading.add('profile');
      this.lastFetched.set('profile', now);
      apiFetch('/affiliates/me').then(async (response) => {
        if (!response.ok) return;
        const json = await response.json();
        const profile = json.data;
        const apiClicks = Number(profile.clickCount || profile._count?.clicks || profile.totalClicks || profile.clicks || 0);
        const mapped = {
          ...session,
          id: profile.id,
          affiliateCode: profile.affiliateCode,
          fullName: profile.user?.fullName || session.fullName,
          email: profile.user?.email || session.email,
          phone: profile.user?.phone || session.phone,
          commissionBalanceVnd: profile.totalCommission ?? session.commissionBalanceVnd,
          withdrawableBalanceVnd: profile.totalCommission ?? session.withdrawableBalanceVnd,
          totalEarnedVnd: profile.totalCommission ?? session.totalEarnedVnd,
          clickCount: apiClicks,
          referredCustomersCount: profile._count?.referrals ?? session.referredCustomersCount,
          createdAt: new Date(profile.createdAt || Date.now()).toLocaleDateString('vi-VN'),
          referralLink: `${window.location.origin}/vi/register?ref=${profile.affiliateCode}`,
        };
        this.setStorage(STORAGE_KEY, mapped);
        window.dispatchEvent(new Event('orderchinaviet_affiliate_updated'));
      }).finally(() => this.loading.delete('profile'));
    }

    return session;
  }

  recordLinkClick(refCode: string): void {
    if (!refCode || typeof window === 'undefined') return;

    const cleanCode = refCode.trim();
    if (!cleanCode) return;

    // Update local click count storage for this refCode (case-insensitive keys)
    const currentClicks = Math.max(
      Number(localStorage.getItem(`ocv_aff_clicks_${cleanCode}`) || '0'),
      Number(localStorage.getItem(`ocv_aff_clicks_${cleanCode.toUpperCase()}`) || '0'),
      Number(localStorage.getItem(`ocv_aff_clicks_${cleanCode.toLowerCase()}`) || '0')
    ) + 1;

    localStorage.setItem(`ocv_aff_clicks_${cleanCode}`, String(currentClicks));
    localStorage.setItem(`ocv_aff_clicks_${cleanCode.toUpperCase()}`, String(currentClicks));
    localStorage.setItem(`ocv_aff_clicks_${cleanCode.toLowerCase()}`, String(currentClicks));

    // Update global click counter fallback
    const globalClicks = Number(localStorage.getItem('ocv_total_aff_clicks') || '0') + 1;
    localStorage.setItem('ocv_total_aff_clicks', String(globalClicks));

    // Update active session click count
    const session = this.getAffiliate();
    session.clickCount = Math.max(session.clickCount || 0, currentClicks, globalClicks);
    this.saveAffiliate(session);

    // Trigger update event for dashboard components
    window.dispatchEvent(new Event('orderchinaviet_affiliate_updated'));
  }

  refreshAffiliate(): AffiliateSession {
    this.lastFetched.delete('profile');
    return this.getAffiliate();
  }

  saveAffiliate(session: AffiliateSession): void {
    session.unlockedBonus = session.referredCustomersCount >= session.requiredCustomersToUnlock;
    session.promoBalanceVnd = session.promoBonusVnd || 250000;
    session.withdrawableBalanceVnd = session.commissionBalanceVnd || 0;
    this.setStorage(STORAGE_KEY, session);
  }

  registerAffiliate(data: { fullName: string; email: string; phone: string; password?: string }): AffiliateSession {
    const randomCode = 'OCV_AFF_' + Math.floor(100000 + Math.random() * 900000);
    const newSession: AffiliateSession = {
      id: 'aff-' + Date.now(),
      affiliateCode: randomCode,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      promoBonusVnd: 250000,
      promoBalanceVnd: 250000,
      withdrawableBalanceVnd: 0,
      unlockedBonus: false,
      referredCustomersCount: 0,
      requiredCustomersToUnlock: 3,
      commissionBalanceVnd: 0,
      totalEarnedVnd: 250000,
      withdrawnVnd: 0,
      clickCount: 0,
      referralLink: `${SITE_URL}/vi/register?ref=${randomCode}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    this.saveAffiliate(newSession);
    this.setStorage(REFERRED_CUSTOMERS_KEY, []); // Clean empty referrals
    this.setStorage(WITHDRAWALS_KEY, []); // Clean empty withdrawals

    return newSession;
  }

  getReferredCustomers(): ReferredCustomer[] {
    const list = this.getStorage<ReferredCustomer[]>(REFERRED_CUSTOMERS_KEY, INITIAL_REFERRED_CUSTOMERS);
    const now = Date.now();
    const token = authStore.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('ocv_access_token') : null);

    if (token && typeof window !== 'undefined' && !this.loading.has('referrals') && (now - (this.lastFetched.get('referrals') || 0) > 30000)) {
      this.loading.add('referrals');
      this.lastFetched.set('referrals', now);
      apiFetch('/affiliates/referrals').then(async (response) => {
        if (!response.ok) return;
        const json = await response.json();
        this.setStorage(REFERRED_CUSTOMERS_KEY, json.data.map((item: any) => ({ ...item, name: item.fullName, registeredAt: new Date(item.registeredAt).toLocaleDateString('vi-VN'), commissionEarnedVnd: 0, status: 'ACTIVE' })));
        window.dispatchEvent(new Event('orderchinaviet_affiliate_updated'));
      }).finally(() => this.loading.delete('referrals'));
    }
    return list.map((item) => ({
      ...item,
      fullName: item.fullName || item.name,
      commissionVnd: item.commissionVnd || item.commissionEarnedVnd,
      hasDeposited: item.hasDeposited ?? true,
    }));
  }

  addReferredCustomer(customer: Omit<ReferredCustomer, 'id' | 'registeredAt'>): ReferredCustomer[] {
    const list = this.getReferredCustomers();
    const newItem: ReferredCustomer = {
      ...customer,
      id: 'ref-' + Date.now(),
      registeredAt: new Date().toLocaleDateString('vi-VN'),
      fullName: customer.fullName || customer.name,
      commissionVnd: customer.commissionVnd || customer.commissionEarnedVnd,
      hasDeposited: true,
    };
    list.unshift(newItem);
    this.setStorage(REFERRED_CUSTOMERS_KEY, list);

    const session = this.getAffiliate();
    session.referredCustomersCount = list.length;
    session.commissionBalanceVnd += newItem.commissionEarnedVnd;
    session.totalEarnedVnd += newItem.commissionEarnedVnd;
    this.saveAffiliate(session);

    this.invalidateCache();

    const token = authStore.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('ocv_access_token') : null);

    if (token && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('orderchinaviet_affiliate_updated'));
      void apiFetch('/affiliates/referrals', {
        method: 'POST',
        body: JSON.stringify({
          customerCode: newItem.customerCode,
          fullName: newItem.fullName,
          phone: newItem.phone,
          referredByCode: session.affiliateCode,
        }),
      });
    }

    return list;
  }

  getWithdrawals(): WithdrawalRequest[] {
    const now = Date.now();
    const token = authStore.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('ocv_access_token') : null);

    if (token && typeof window !== 'undefined' && !this.loading.has('withdrawals') && (now - (this.lastFetched.get('withdrawals') || 0) > 30000)) {
      this.loading.add('withdrawals');
      this.lastFetched.set('withdrawals', now);
      apiFetch('/operations/withdrawals').then(async (response) => {
        if (!response.ok) return;
        const json = await response.json();
        this.setStorage(WITHDRAWALS_KEY, json.data.map((item: any) => ({ id: item.id, amountVnd: item.amountVnd, bankName: item.bankName, accountNumber: item.accountNumber, accountName: item.accountName, status: item.status, requestedAt: new Date(item.createdAt).toLocaleString('vi-VN') })));
        window.dispatchEvent(new Event('orderchinaviet_affiliate_updated'));
      }).finally(() => this.loading.delete('withdrawals'));
    }
    return this.getStorage<WithdrawalRequest[]>(WITHDRAWALS_KEY, INITIAL_WITHDRAWALS);
  }

  getWithdrawalHistory(): WithdrawalRequest[] {
    return this.getWithdrawals();
  }

  updateBankInfo(bankInfo: BankAccountDetails): AffiliateSession {
    const session = this.getAffiliate();
    session.bankInfo = bankInfo;
    this.saveAffiliate(session);
    return session;
  }

  requestWithdrawal(amountVnd: number, bankInfo?: BankAccountDetails): { success: boolean; message: string; withdrawal?: WithdrawalRequest } {
    const session = this.getAffiliate();
    const info = bankInfo || session.bankInfo || { bankName: 'Vietcombank', accountNumber: '', accountName: session.fullName };

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newWd: WithdrawalRequest = {
      id: 'wd-' + Date.now(),
      affiliateCode: session.affiliateCode,
      amountVnd,
      bankName: info.bankName,
      accountNumber: info.accountNumber,
      accountName: info.accountName,
      bankInfo: info,
      status: 'PENDING',
      requestedAt: now,
      createdAt: now,
    };

    const list = this.getWithdrawals();
    list.unshift(newWd);
    this.setStorage(WITHDRAWALS_KEY, list);
    void apiFetch('/affiliates/withdrawals', { method: 'POST', body: JSON.stringify({ amountVnd, bankName: info.bankName, accountNumber: info.accountNumber, accountName: info.accountName }) });

    session.commissionBalanceVnd = Math.max(0, session.commissionBalanceVnd - amountVnd);
    this.saveAffiliate(session);

    return { success: true, message: 'Đã gửi yêu cầu rút tiền thành công!', withdrawal: newWd };
  }

  approveWithdrawal(id: string): void {
    const list = this.getWithdrawals();
    const item = list.find((w) => w.id === id);
    if (item) {
      item.status = 'APPROVED';
      this.setStorage(WITHDRAWALS_KEY, list);
    }
  }

  rejectWithdrawal(id: string): void {
    const list = this.getWithdrawals();
    const item = list.find((w) => w.id === id);
    if (item) {
      item.status = 'REJECTED';
      this.setStorage(WITHDRAWALS_KEY, list);
    }
  }
}

export const affiliateStore = new AffiliateStore();
