'use client';
import { apiFetch } from './api-client';

export interface OrderItem {
  id: string; platform: string; productName: string; quantity: number; totalRmb: number; totalVnd: number;
  depositPaid: number; status: string; statusLabel: string; statusClass: string; createdAt: string;
  updatedAt?: string; estimatedDelivery?: string; customerName?: string; customerPhone?: string;
  customerCode?: string; chinaTrackingCode?: string; vnTrackingCode?: string; warehouse?: string;
  shippingMethod?: string; productUrl?: string; imageUrl?: string; note?: string; attributes?: string;
  orderCode?: string; paidVnd?: number; remainingVnd?: number; depositRequiredVnd?: number;
  depositRefundStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  depositRefundReason?: string;
  items?: Array<{ id: string; productName: string; quantity: number; unitPriceCny: number; totalCny: number; productUrl?: string; imageUrl?: string; attributes?: string }>;
  payments?: Array<{ id: string; paymentCode: string; purpose: string; method: string; amountVnd: number; status: string; createdAt: string }>;
  parcels?: Array<{ id: string; parcelCode: string; trackingCodeChina: string; status: string }>;
}

export const INITIAL_ORDERS: OrderItem[] = [];

const labels: Record<string, string> = { PENDING: 'Chờ duyệt cọc', DEPOSITED: 'Đã cọc', PURCHASING: 'Đang mua', PURCHASED: 'Đã mua', CANCELLED: 'Đã hủy', COMPLETED: 'Hoàn tất' };
const mapOrder = (order: any): OrderItem => {
  const normalizedItems = (order.items || []).map((item: any) => ({ ...item, unitPriceCny: Number(item.unitPriceCny), totalCny: Number(item.totalCny) }));
  const first = normalizedItems[0] || {};
  const isRefundPending = String(order.notes || '').includes('[YÊU CẦU HOÀN CỌC]');
  const isRefundApproved = String(order.notes || '').includes('(ĐÃ ĐỒNG Ý HOÀN CỌC)');
  
  const refundStatus = isRefundApproved ? 'APPROVED' : isRefundPending ? 'PENDING' : 'NONE';
  const refundReasonMatch = String(order.notes || '').match(/\[YÊU CẦU HOÀN CỌC\]:\s*([^|]+)/);
  const refundReason = refundReasonMatch ? refundReasonMatch[1].trim() : undefined;

  return {
    id: order.id, orderCode: order.orderCode, platform: order.platform, productName: normalizedItems.length > 1 ? `${first.productName} (+${normalizedItems.length - 1})` : first.productName || 'Đơn hàng',
    quantity: normalizedItems.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
    totalRmb: normalizedItems.reduce((sum: number, item: any) => sum + item.totalCny, 0) || 0,
    totalVnd: order.totalVnd, depositPaid: order.depositPaidVnd, status: order.status,
    statusLabel: refundStatus === 'PENDING' ? 'Chờ duyệt hoàn cọc' : labels[order.status] || order.status,
    statusClass: refundStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-300' : order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' : order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    createdAt: new Date(order.createdAt).toLocaleString('vi-VN'), updatedAt: new Date(order.updatedAt).toLocaleString('vi-VN'),
    customerName: order.customer?.fullName, customerPhone: order.customer?.phone, customerCode: order.customer?.customerCode,
    productUrl: first.productUrl, imageUrl: first.imageUrl, attributes: first.attributes, note: order.notes,
    paidVnd: order.paidVnd, remainingVnd: order.remainingVnd, depositRequiredVnd: order.depositRequiredVnd,
    depositRefundStatus: refundStatus,
    depositRefundReason: refundReason,
    items: normalizedItems, payments: order.payments, parcels: order.parcels,
  };
};

class OrderStoreService {
  private cache: OrderItem[] = [];
  private changed() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('orderchinaviet_orders_updated')); }

  async fetchOrdersFromApi(_searchQuery = '', _statusFilter = 'ALL'): Promise<OrderItem[]> {
    const response = await apiFetch('/orders');
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Không thể tải đơn hàng');
    this.cache = json.data.map(mapOrder);
    return this.cache;
  }
  getOrders() { return this.cache; }
  saveOrders(orders: OrderItem[]) { this.cache = orders; this.changed(); }

  addOrder(order: Omit<OrderItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): OrderItem {
    const pending = { ...order, id: order.id || 'Đang tạo...', createdAt: order.createdAt || new Date().toLocaleString('vi-VN') } as OrderItem;
    void apiFetch('/orders', { method: 'POST', body: JSON.stringify({ platform: order.platform, notes: order.note, items: [{ productName: order.productName, productUrl: order.productUrl, imageUrl: order.imageUrl, attributes: order.attributes, quantity: order.quantity, unitPriceCny: order.totalRmb / order.quantity }] }) })
      .then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); return this.fetchOrdersFromApi(); })
      .then(() => this.changed()).catch((error) => window.alert(error.message || 'Không thể tạo đơn hàng'));
    return pending;
  }

  addMultipleOrders(items: Partial<OrderItem>[]): OrderItem[] {
    items.forEach((item) => this.addOrder({ platform: item.platform || '1688', productName: item.productName || 'Sản phẩm', quantity: item.quantity || 1, totalRmb: item.totalRmb || 0, totalVnd: 0, depositPaid: 0, status: 'PENDING', statusLabel: labels.PENDING, statusClass: 'bg-amber-50 text-amber-700', productUrl: item.productUrl, imageUrl: item.imageUrl, attributes: item.attributes, note: item.note }));
    return items as OrderItem[];
  }

  async updateOrder(id: string, updates: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const current = this.cache.find((item) => item.id === id);
    if (updates.status === 'RECEIVED') {
      await this.depositOrder(id);
      return this.cache.find((item) => item.id === id);
    }
    const merged = current ? { ...current, ...updates } : undefined;
    const response = await apiFetch(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ notes: updates.note, status: updates.status, ...(merged && (updates.productName !== undefined || updates.quantity !== undefined || updates.totalRmb !== undefined || updates.attributes !== undefined) ? { item: { productName: merged.productName, quantity: merged.quantity, unitPriceCny: merged.totalRmb / merged.quantity, attributes: merged.attributes } } : {}) }) });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Không thể cập nhật đơn');
    await this.fetchOrdersFromApi();
    this.changed();
    return this.cache.find((item) => item.id === id);
  }
  depositOrder(id: string, amountVnd?: number) { return apiFetch(`/orders/${id}/deposit`, { method: 'POST', headers: { 'Idempotency-Key': `deposit-${id}` }, body: amountVnd == null ? undefined : JSON.stringify({ amountVnd }) }).then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); await this.fetchOrdersFromApi(); this.changed(); return json.data; }); }
  payBalance(id: string) { return apiFetch(`/orders/${id}/pay-balance`, { method: 'POST', headers: { 'Idempotency-Key': `balance-${id}` } }).then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); await this.fetchOrdersFromApi(); this.changed(); return json.data; }); }
  async cancelOrder(id: string) { const response = await apiFetch(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Quản trị viên cập nhật trạng thái hủy' }) }); const json = await response.json(); if (!response.ok) throw new Error(json.message || 'Không thể hủy đơn'); await this.fetchOrdersFromApi(); this.changed(); return this.cache.find((item) => item.id === id); }
  
  async requestDepositRefund(id: string, reason: string) {
    const res = await apiFetch(`/orders/${id}/request-refund`, { method: 'POST', body: JSON.stringify({ reason }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể gửi yêu cầu hoàn cọc');
    await this.fetchOrdersFromApi();
    this.changed();
    return json.data;
  }

  async approveDepositRefund(id: string) {
    const res = await apiFetch(`/orders/${id}/approve-refund`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể duyệt hoàn cọc');
    await this.fetchOrdersFromApi();
    this.changed();
    return json.data;
  }

  createParcel(id: string, trackingCodeChina: string) { return apiFetch(`/orders/${id}/parcels`, { method: 'POST', body: JSON.stringify({ trackingCodeChina }) }).then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); await this.fetchOrdersFromApi(); this.changed(); return json.data; }); }
  deleteOrder(id: string) { void apiFetch(`/orders/${id}`, { method: 'DELETE' }).then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.message); await this.fetchOrdersFromApi(); this.changed(); }).catch((error) => window.alert(error.message)); return true; }
}

export const orderStore = new OrderStoreService();
