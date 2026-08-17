import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './main';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('OrderChinaViet API', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('blocks anonymous access to customer data', async () => {
    const response = await request(app).get('/api/v1/customers');
    expect(response.status).toBe(401);
  });

  it('logs in a seeded customer and restricts admin API', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'customer1@orderchinaviet.com', password: 'password123' });
    expect(login.status).toBe(200);
    const token = login.body.data.tokens.accessToken;
    const customers = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${token}`);
    expect(customers.status).toBe(403);
  });

  it('serves published CMS data and returns 404 for unknown tracking code', async () => {
    const cms = await request(app).get('/api/v1/cms/blogs');
    expect(cms.status).toBe(200);
    expect(Array.isArray(cms.body.data)).toBe(true);
    const tracking = await request(app).get('/api/v1/shipments/track/NOT-FOUND');
    expect(tracking.status).toBe(404);
  });

  it('serves active shipping rates from the database', async () => {
    const response = await request(app).get('/api/v1/rates');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('registers a real customer session and does not expose password hashes', async () => {
    const email = `test-${Date.now()}@example.com`;
    const registration = await request(app).post('/api/v1/auth/register').send({ fullName: 'API Test User', email, phone: `09${Date.now().toString().slice(-8)}`, password: 'StrongPass123' });
    expect(registration.status).toBe(201);
    expect(registration.body.data.tokens.accessToken).toBeTruthy();
    expect(registration.body.data.user.passwordHash).toBeUndefined();
    await prisma.user.delete({ where: { email } });
  });

  it('never returns password hashes from the admin customer endpoint', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'admin@orderchinaviet.com', password: 'password123' });
    const response = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.every((user: Record<string, unknown>) => !('passwordHash' in user))).toBe(true);
  });

  it('persists orders and accounts deposits and exchanges exactly once', async () => {
    const customerLogin = await request(app).post('/api/v1/auth/login').send({ email: 'customer1@orderchinaviet.com', password: 'password123' });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@orderchinaviet.com', password: 'password123' });
    const customerToken = customerLogin.body.data.tokens.accessToken;
    const adminToken = adminLogin.body.data.tokens.accessToken;
    const customer = await prisma.user.findUniqueOrThrow({ where: { email: 'customer1@orderchinaviet.com' } });
    const originalBalance = customer.balance;
    let orderId = ''; let exchangeId = ''; let heldExchangeId = ''; let parcelId = '';
    try {
      const created = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${customerToken}`).send({ platform: '1688', items: [{ productName: 'Test product', quantity: 2, unitPriceCny: 10 }] });
      expect(created.status).toBe(201); orderId = created.body.data.id;
      expect(created.body.data.totalVnd).toBeGreaterThan(0);
      const deposit = await request(app).post(`/api/v1/orders/${orderId}/deposit`).set('Authorization', `Bearer ${customerToken}`);
      expect(deposit.status).toBe(200);
      const duplicateDeposit = await request(app).post(`/api/v1/orders/${orderId}/deposit`).set('Authorization', `Bearer ${customerToken}`);
      expect(duplicateDeposit.status).toBe(409);
      const balancePayment = await request(app).post(`/api/v1/orders/${orderId}/pay-balance`).set('Authorization', `Bearer ${customerToken}`).set('Idempotency-Key', `test-balance-${orderId}`);
      expect(balancePayment.status).toBe(200);
      expect(balancePayment.body.data.order.remainingVnd).toBe(0);
      await request(app).patch(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'PURCHASING' });
      await request(app).patch(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'PURCHASED' });
      const parcel = await request(app).post(`/api/v1/orders/${orderId}/parcels`).set('Authorization', `Bearer ${adminToken}`).send({ trackingCodeChina: `TEST-CN-${Date.now()}` });
      expect(parcel.status).toBe(201); parcelId = parcel.body.data.id;
      const cancelled = await request(app).post(`/api/v1/orders/${orderId}/cancel`).set('Authorization', `Bearer ${adminToken}`).send({ reason: 'Integration test' });
      expect(cancelled.status).toBe(200);
      expect(cancelled.body.data.paidVnd).toBe(0);

      const exchange = await request(app).post('/api/v1/exchange').set('Authorization', `Bearer ${customerToken}`).send({ direction: 'CNY_TO_VND', amountCny: 10, exchangeRate: 1, targetAmount: 1, recipientInfo: 'Test bank' });
      expect(exchange.status).toBe(201); exchangeId = exchange.body.data.id;
      expect(exchange.body.data.exchangeRate).not.toBe(1);
      const completed = await request(app).patch(`/api/v1/exchange/${exchangeId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'COMPLETED' });
      expect(completed.status).toBe(200);
      const duplicateExchange = await request(app).patch(`/api/v1/exchange/${exchangeId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'COMPLETED' });
      expect(duplicateExchange.status).toBe(409);

      const heldExchange = await request(app).post('/api/v1/exchange').set('Authorization', `Bearer ${customerToken}`).send({ direction: 'VND_TO_CNY', amountCny: 10, recipientInfo: 'Test Alipay' });
      expect(heldExchange.status).toBe(201); heldExchangeId = heldExchange.body.data.id;
      expect(heldExchange.body.data.heldAmountVnd).toBeGreaterThan(0);
      const rejected = await request(app).patch(`/api/v1/exchange/${heldExchangeId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'REJECTED' });
      expect(rejected.status).toBe(200);

      const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: customer.id } });
      expect(finalUser.balance).toBe(originalBalance + Number(exchange.body.data.targetAmount));
    } finally {
      const codes: string[] = [];
      if (orderId) { const payments = await prisma.payment.findMany({ where: { orderId } }); codes.push(...payments.map((p) => p.paymentCode)); const row = await prisma.order.findUnique({ where: { id: orderId } }); if (row) codes.push(`REF-${row.orderCode}`); }
      for (const id of [exchangeId, heldExchangeId].filter(Boolean)) { const row = await prisma.exchangeTransaction.findUnique({ where: { id } }); if (row) codes.push(row.transactionCode, `HOLD-${row.transactionCode}`, `RELEASE-${row.transactionCode}`); }
      await prisma.financialTransaction.deleteMany({ where: { transactionNo: { in: codes } } });
      await prisma.auditLog.deleteMany({ where: { entityId: { in: [orderId, exchangeId, heldExchangeId].filter(Boolean) } } });
      if (parcelId) await prisma.parcel.deleteMany({ where: { id: parcelId } });
      if (orderId) await prisma.payment.deleteMany({ where: { orderId } });
      if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
      if (exchangeId) await prisma.exchangeTransaction.deleteMany({ where: { id: exchangeId } });
      if (heldExchangeId) await prisma.exchangeTransaction.deleteMany({ where: { id: heldExchangeId } });
      await prisma.user.update({ where: { id: customer.id }, data: { balance: originalBalance } });
    }
  });

  it('validates payment webhooks and processes a provider reference once', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'customer1@orderchinaviet.com', password: 'password123' });
    const token = login.body.data.tokens.accessToken;
    const created = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send({ platform: '1688', items: [{ productName: 'Webhook product', quantity: 1, unitPriceCny: 5 }] });
    const order = created.body.data;
    const previousSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    process.env.PAYMENT_WEBHOOK_SECRET = 'integration-webhook-secret';
    const providerRef = `provider-${Date.now()}`;
    try {
      const body = { providerRef, orderId: order.id, amountVnd: order.depositRequiredVnd, status: 'COMPLETED' };
      const unauthorized = await request(app).post('/api/v1/payments/webhook/payos').send(body);
      expect(unauthorized.status).toBe(401);
      const accepted = await request(app).post('/api/v1/payments/webhook/payos').set('x-webhook-secret', 'integration-webhook-secret').send(body);
      expect(accepted.status).toBe(200);
      expect(accepted.body.data.duplicate).toBe(false);
      const duplicate = await request(app).post('/api/v1/payments/webhook/payos').set('x-webhook-secret', 'integration-webhook-secret').send(body);
      expect(duplicate.status).toBe(200);
      expect(duplicate.body.data.duplicate).toBe(true);
      expect(await prisma.payment.count({ where: { providerRef } })).toBe(1);
    } finally {
      const payment = await prisma.payment.findUnique({ where: { providerRef } });
      if (payment) {
        await prisma.financialTransaction.deleteMany({ where: { transactionNo: payment.paymentCode } });
        await prisma.auditLog.deleteMany({ where: { entity: 'Payment', entityId: payment.id } });
      }
      await prisma.payment.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      if (previousSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET; else process.env.PAYMENT_WEBHOOK_SECRET = previousSecret;
    }
  });
});
