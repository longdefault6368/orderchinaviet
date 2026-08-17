'use client';
import { apiFetch } from './api-client';

export interface ExchangeTransaction {
  id: string;
  customerName: string;
  customerPhone: string;
  type: 'VND_TO_CNY' | 'CNY_TO_VND'; // VNĐ -> CNY (Nạp ví Alipay/WeChat) hoặc CNY -> VNĐ (Rút/bán tệ)
  typeLabel: string;
  amountCny: number;
  rate: number;
  amountVnd: number;
  accountInfo: string; // SĐT / Email Alipay hoặc Số TK Ngân hàng nhận
  note?: string;
  proofImage?: string; // Ảnh hóa đơn / chứng minh chuyển khoản (Base64 hoặc URL)
  fundingMethod?: 'WALLET' | 'PAYOS' | 'PAYPAL' | 'CRYPTO' | 'CNY_TRANSFER';
  reviewNote?: string;
  reviewImage?: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  completedAt?: string;
}

const STORAGE_KEY_EXCHANGE = 'orderchinaviet_exchange_txs_v4';

export const INITIAL_EXCHANGE_TXS: ExchangeTransaction[] = [];

class ExchangeStoreService {
  private cache: ExchangeTransaction[] = [];
  private loading = false;

  public async fetchTransactions(): Promise<ExchangeTransaction[]> {
    const response = await apiFetch('/exchange');
    const contentType = response.headers.get('content-type') || '';
    const json = contentType.includes('application/json') ? await response.json() : { message: await response.text(), data: [] };
    if (!response.ok) throw new Error(json.message || 'Không thể tải giao dịch đổi tiền');
    this.cache = json.data.map((item: any) => ({
      id: item.id, customerName: item.user?.fullName || '', customerPhone: '', type: item.direction,
      typeLabel: item.direction === 'VND_TO_CNY' ? 'VND → CNY' : 'CNY → VND',
      amountCny: Number(item.direction === 'VND_TO_CNY' ? item.targetAmount : item.sourceAmount),
      amountVnd: Number(item.direction === 'VND_TO_CNY' ? item.sourceAmount : item.targetAmount),
      rate: Number(item.exchangeRate), accountInfo: (() => { try { return JSON.parse(item.recipientInfo); } catch { return item.recipientInfo; } })(), status: item.status,
      statusLabel: item.status === 'COMPLETED' ? 'Đã hoàn tất' : item.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ xử lý',
      statusClass: item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      createdAt: new Date(item.createdAt).toLocaleString('vi-VN'), note: item.rejectionReason, proofImage: item.proofImage || undefined, fundingMethod: item.fundingMethod || 'WALLET', reviewNote: item.reviewNote || item.rejectionReason || undefined, reviewImage: item.reviewImage || undefined,
    }));
    return this.cache;
  }

  public getTransactions(): ExchangeTransaction[] {
    if (typeof window !== 'undefined' && !this.loading) {
      this.loading = true;
      this.fetchTransactions().then(() => window.dispatchEvent(new Event('orderchinaviet_exchange_updated'))).finally(() => { this.loading = false; });
    }
    return this.cache;
  }

  public saveTransactions(txs: ExchangeTransaction[]) {
    this.cache = txs;
    window.dispatchEvent(new Event('orderchinaviet_exchange_updated'));
  }

  public addTransaction(tx: Omit<ExchangeTransaction, 'id' | 'createdAt'>): ExchangeTransaction {
    const list = this.getTransactions();
    const newTx: ExchangeTransaction = {
      ...tx,
      id: `EX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    const updated = [newTx, ...list];
    this.saveTransactions(updated);
    void apiFetch('/exchange', { method: 'POST', body: JSON.stringify({ direction: tx.type, amountCny: tx.amountCny, recipientInfo: tx.accountInfo }) })
      .then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); await this.fetchTransactions(); window.dispatchEvent(new Event('orderchinaviet_exchange_updated')); })
      .catch((error) => window.alert(error.message || 'Không thể tạo lệnh đổi tiền'));
    return newTx;
  }

  public async createTransaction(tx: Omit<ExchangeTransaction, 'id' | 'createdAt'>): Promise<ExchangeTransaction> {
    const response = await apiFetch('/exchange', { method: 'POST', body: JSON.stringify({ direction: tx.type, amountCny: tx.amountCny, recipientInfo: tx.accountInfo, proofImage: tx.proofImage, fundingMethod: tx.fundingMethod || 'WALLET' }) });
    const contentType = response.headers.get('content-type') || '';
    const json = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
    if (!response.ok) throw new Error(json.message || 'Không thể tạo lệnh đổi tiền');
    await this.fetchTransactions();
    window.dispatchEvent(new Event('orderchinaviet_exchange_updated'));
    return this.cache.find((item) => item.id === json.data.id) || this.cache[0];
  }

  public updateStatus(id: string, status: 'COMPLETED' | 'REJECTED', note?: string) {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index].status = status;
      if (status === 'COMPLETED') {
        list[index].statusLabel = 'Đã hoàn tất';
        list[index].statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        list[index].completedAt = new Date().toLocaleString('vi-VN');
      } else {
        list[index].statusLabel = 'Đã từ chối';
        list[index].statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
      }
      if (note) list[index].note = note;
      this.saveTransactions(list);
      void apiFetch(`/exchange/${id}`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason: note }) })
        .then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); await this.fetchTransactions(); window.dispatchEvent(new Event('orderchinaviet_exchange_updated')); })
        .catch((error) => window.alert(error.message || 'Không thể xử lý lệnh đổi tiền'));
    }
  }

  public updateTransactionStatus(id: string, status: 'COMPLETED' | 'REJECTED', note?: string) {
    this.updateStatus(id, status, note);
  }

  public async reviewTransaction(id: string, status: 'COMPLETED' | 'REJECTED', reviewNote?: string, reviewImage?: string) {
    const response = await apiFetch(`/exchange/${id}`, { method: 'PATCH', body: JSON.stringify({ status, reviewNote, reviewImage }) });
    const contentType = response.headers.get('content-type') || '';
    const json = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
    if (!response.ok) throw new Error(json.message || 'Không thể xử lý lệnh đổi tiền');
    await this.fetchTransactions();
    window.dispatchEvent(new Event('orderchinaviet_exchange_updated'));
  }

  public deleteTransaction(id: string) {
    const list = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(list);
  }
}

export const exchangeStore = new ExchangeStoreService();
