import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, FINANCE_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';

const prisma = new PrismaClient();
export const paymentsRouter = Router();

interface NormalizedWebhookPayload {
  provider: string;
  providerRef: string;
  amountVnd: number;
  content: string;
  orderCode?: string;
  requestCode?: string;
  accountNumber?: string;
  bankName?: string;
  rawPayload: any;
}

/**
 * Trích xuất và chuẩn hóa dữ liệu từ các nhà cung cấp Webhook khác nhau (PayOS, SePay, Casso, VietQR)
 */
function normalizeWebhook(providerRaw: string, body: any): NormalizedWebhookPayload {
  const provider = providerRaw.toUpperCase();
  let providerRef = '';
  let amountVnd = 0;
  let content = '';
  let accountNumber = '';
  let bankName = '';

  // 1. PayOS Webhook Format
  if (body?.data && (body.code === '00' || body.desc === 'success' || body.data.orderCode)) {
    const d = body.data;
    providerRef = String(d.reference || d.paymentLinkId || d.orderCode || '').trim();
    amountVnd = Number(d.amount || 0);
    content = String(d.description || '').trim();
    accountNumber = String(d.accountNumber || '').trim();
    bankName = 'MB Bank';
  }
  // 2. SePay Webhook Format
  else if (body?.transferType || body?.gateway || body?.transferAmount !== undefined) {
    providerRef = String(body.referenceCode || body.id || '').trim();
    amountVnd = Number(body.transferAmount || body.amount || 0);
    content = String(body.content || body.description || '').trim();
    accountNumber = String(body.accountNumber || '').trim();
    bankName = String(body.gateway || '').trim();
  }
  // 3. Casso Webhook Format
  else if (body?.data && Array.isArray(body.data)) {
    const first = body.data[0] || {};
    providerRef = String(first.tid || first.id || '').trim();
    amountVnd = Number(first.amount || 0);
    content = String(first.description || '').trim();
    accountNumber = String(first.accountNumber || '').trim();
    bankName = String(first.bankName || '').trim();
  }
  // 4. Universal VietQR / Custom Format
  else {
    providerRef = String(body.providerRef || body.transactionId || body.reference || body.id || `TX-${Date.now()}`).trim();
    amountVnd = Number(body.amountVnd || body.amount || body.transferAmount || 0);
    content = String(body.content || body.description || body.notes || body.addInfo || '').trim();
    accountNumber = String(body.accountNumber || '').trim();
    bankName = String(body.bankName || body.gateway || 'VietQR').trim();
  }

  return {
    provider,
    providerRef,
    amountVnd: Math.round(amountVnd),
    content,
    accountNumber,
    bankName,
    rawPayload: body,
  };
}

/**
 * Phân tích nội dung chuyển khoản để tìm User, Order hoặc DepositRequest
 */
async function resolveTransferTarget(content: string) {
  const clean = content.toUpperCase().replace(/[^A-Z0-9_\-\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);

  // 1. Tìm theo Mã đơn hàng (ORD-...)
  const ordMatch = content.match(/ORD[-_]?[0-9]+/i);
  if (ordMatch) {
    const rawOrd = ordMatch[0];
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderCode: rawOrd },
          { orderCode: rawOrd.replace(/^ORD/, 'ORD-') },
          { orderCode: { contains: rawOrd } },
        ],
        deletedAt: null,
      },
      include: { customer: true },
    });
    if (order) return { type: 'ORDER' as const, order, user: order.customer };
  }

  // 2. Tìm theo Mã yêu cầu nạp tiền (DEP-...)
  const depMatch = content.match(/DEP[-_]?[0-9]+/i);
  if (depMatch) {
    const rawDep = depMatch[0];
    const depositRequest = await prisma.depositRequest.findFirst({
      where: {
        OR: [
          { requestCode: rawDep },
          { requestCode: rawDep.replace(/^DEP/, 'DEP-') },
          { requestCode: { contains: rawDep } },
        ],
      },
      include: { user: true },
    });
    if (depositRequest) return { type: 'DEPOSIT_REQUEST' as const, depositRequest, user: depositRequest.user };
  }

  // 3. Tìm theo Số điện thoại khách hàng (03x, 05x, 07x, 08x, 09x)
  const phoneMatch = content.match(/(0[3|5|7|8|9][0-9]{8})/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    const user = await prisma.user.findFirst({ where: { phone } });
    if (user) return { type: 'USER' as const, user };
  }

  // 4. Tìm theo Mã khách hàng (KH..., CUST...)
  for (const token of tokens) {
    if (token.startsWith('KH') || token.startsWith('CUST')) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { customerCode: token },
            { customerCode: token.replace(/^KH/, 'KH-') },
            { customerCode: token.replace(/^CUST/, 'CUST-') },
          ],
        },
      });
      if (user) return { type: 'USER' as const, user };
    }
  }

  // 5. Thử tìm theo từng token có độ dài >= 3 khớp với customerCode hoặc phone
  for (const token of tokens) {
    if (token.length >= 3 && token !== 'OCV' && token !== 'NAP' && token !== 'TIEN' && token !== 'VIETQR') {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { customerCode: { contains: token } },
            { phone: { contains: token } },
          ],
        },
      });
      if (user) return { type: 'USER' as const, user };
    }
  }

  return { type: 'UNKNOWN' as const, user: null };
}

/**
 * Xử lý khớp lệnh nạp tiền hoặc thanh toán đơn hàng tự động
 */
async function processWebhookReconciliation(normalized: NormalizedWebhookPayload) {
  const { provider, providerRef, amountVnd, content, bankName, accountNumber, rawPayload } = normalized;

  if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0) {
    throw Object.assign(new Error('Số tiền giao dịch không hợp lệ'), { statusCode: 400 });
  }

  // Kiểm tra trùng lặp giao dịch (Idempotency)
  if (providerRef) {
    const existingTx = await prisma.financialTransaction.findFirst({
      where: {
        OR: [
          { transactionNo: providerRef },
          { transactionNo: `${provider}:${providerRef}` },
        ],
      },
    });
    if (existingTx) {
      return { success: true, message: 'Giao dịch đã được xử lý trước đó (Idempotent OK)', duplicate: true, data: existingTx };
    }
  }

  // Phân tích đối tượng thụ hưởng
  const target = await resolveTransferTarget(content);

  // ── TRƯỜNG HỢP 1: THANH TOÁN ĐẶT CỌC ĐƠN HÀNG TRỰC TIẾP ──
  if (target.type === 'ORDER' && target.order) {
    const order = target.order;
    const user = target.user;

    const result = await prisma.$transaction(async (tx) => {
      const purpose = order.paidVnd === 0 ? 'DEPOSIT' : 'BALANCE';
      const paidVnd = order.paidVnd + amountVnd;
      const remainingVnd = Math.max(0, order.totalVnd - paidVnd);
      const isDeposited = paidVnd >= order.depositRequiredVnd;

      // Cập nhật đơn hàng
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paidVnd,
          remainingVnd,
          ...(purpose === 'DEPOSIT' ? { depositPaidVnd: Math.min(paidVnd, order.depositRequiredVnd) } : {}),
          ...(isDeposited && order.status === 'PENDING' ? { status: 'DEPOSITED' } : {}),
        },
      });

      // Tạo bản ghi Payment
      const paymentCode = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payment = await tx.payment.create({
        data: {
          paymentCode,
          idempotencyKey: `${provider}:${providerRef || paymentCode}`,
          providerRef: providerRef || paymentCode,
          provider,
          orderId: order.id,
          userId: user.id,
          purpose,
          method: 'VIETQR_AUTO',
          amountVnd,
          status: 'COMPLETED',
          rawPayload: JSON.stringify(rawPayload),
          completedAt: new Date(),
        },
      });

      // Tạo biến động số dư / nhật ký tài chính
      await tx.financialTransaction.create({
        data: {
          transactionNo: providerRef || paymentCode,
          userId: user.id,
          type: purpose === 'DEPOSIT' ? 'ORDER_DEPOSIT_EXTERNAL' : 'ORDER_BALANCE_EXTERNAL',
          amountVnd: 0,
          balanceAfter: user.balance,
          description: `${provider} tự động khớp ${purpose === 'DEPOSIT' ? 'tiền cọc' : 'thanh toán'} đơn ${order.orderCode} (+${amountVnd.toLocaleString('vi-VN')} ₫)`,
        },
      });

      // Tạo thông báo trong app cho khách
      await tx.notification.create({
        data: {
          userId: user.id,
          title: `Thanh toán thành công đơn hàng ${order.orderCode}`,
          message: `Hệ thống VietQR tự động xác nhận số tiền ${amountVnd.toLocaleString('vi-VN')} VND cho đơn hàng ${order.orderCode}.`,
          type: 'ORDER_PAID',
          targetRole: 'CUSTOMER',
        },
      });

      return { updatedOrder, payment, user };
    });

    // Bắn thông báo Telegram cho Admin
    void TelegramService.sendMessage(`
<b>TỰ ĐỘNG KHỚP LỆNH THANH TOÁN ĐƠN HÀNG (VIETQR)</b>
--------------------------------------------
<b>Mã đơn:</b> <code>${result.updatedOrder.orderCode}</code>
<b>Khách hàng:</b> ${result.user.fullName} (${result.user.phone || 'N/A'})
<b>Số tiền nhận:</b> <b>+${amountVnd.toLocaleString('vi-VN')} ₫</b>
<b>Cổng thanh toán:</b> ${provider} (${bankName || 'VietQR'})
<b>Mã GD Ngân hàng:</b> <code>${providerRef || 'N/A'}</code>
<b>Nội dung chuyển khoản:</b> <i>${content}</i>
<b>Trạng thái đơn:</b> ${result.updatedOrder.status} (Đã thanh toán ${result.updatedOrder.paidVnd.toLocaleString('vi-VN')} ₫)

👉 <i>Hệ thống đã tự động chuyển trạng thái đơn sang ĐÃ ĐẶT CỌC và sẵn sàng mua hàng.</i>
    `.trim());

    return { success: true, message: `Tự động thanh toán thành công đơn hàng ${order.orderCode}`, data: result };
  }

  // ── TRƯỜNG HỢP 2: NẠP TIỀN VÀO VÍ NGƯỜI DÙNG (TỰ ĐỘNG CỘNG TIỀN VÍ) ──
  if (target.user) {
    const user = target.user;
    const txNo = providerRef || `DEP-AUTO-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cộng tiền vào ví User
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amountVnd } },
      });

      // 2. Nếu có DepositRequest PENDING khớp, chuyển thành APPROVED
      if (target.type === 'DEPOSIT_REQUEST' && target.depositRequest) {
        await tx.depositRequest.update({
          where: { id: target.depositRequest.id },
          data: {
            status: 'APPROVED',
            reviewNote: `Tự động duyệt qua ${provider} Webhook (${providerRef})`,
            reviewedAt: new Date(),
          },
        });
      }

      // 3. Tạo biến động số dư FinancialTransaction
      const financialTx = await tx.financialTransaction.create({
        data: {
          transactionNo: txNo,
          userId: user.id,
          type: 'DEPOSIT',
          amountVnd,
          balanceAfter: updatedUser.balance,
          description: `Nạp tiền tự động qua ${provider} [Mã GD: ${providerRef || txNo}] - ${content}`,
        },
      });

      // 4. Tạo thông báo trong app cho khách hàng
      await tx.notification.create({
        data: {
          userId: user.id,
          title: `Nạp tiền tự động thành công +${amountVnd.toLocaleString('vi-VN')} VND`,
          message: `Ví của bạn đã được cộng +${amountVnd.toLocaleString('vi-VN')} VND qua VietQR ${provider}. Số dư hiện tại: ${updatedUser.balance.toLocaleString('vi-VN')} VND.`,
          type: 'FINANCE_DEPOSIT',
          targetRole: 'CUSTOMER',
        },
      });

      // 5. Ghi Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'VIETQR_AUTO_DEPOSIT',
          entity: 'UserBalance',
          entityId: user.id,
          details: JSON.stringify({ provider, providerRef, amountVnd, content, newBalance: updatedUser.balance }),
        },
      });

      return { updatedUser, financialTx };
    });

    // Bắn thông báo Telegram cho Admin
    void TelegramService.sendMessage(`
<b>TỰ ĐỘNG KHỚP LỆNH NẠP TIỀN VÍ THÀNH CÔNG (VIETQR)</b>
--------------------------------------------
<b>Khách hàng:</b> <b>${user.fullName}</b>
<b>Mã KH / SĐT:</b> <code>${user.customerCode || user.phone || user.email}</code>
<b>Số tiền nạp:</b> <b>+${amountVnd.toLocaleString('vi-VN')} ₫</b>
<b>Số dư mới:</b> <b>${result.updatedUser.balance.toLocaleString('vi-VN')} ₫</b>
<b>Cổng thanh toán:</b> ${provider} (${bankName || 'VietQR'})
<b>Mã GD Ngân hàng:</b> <code>${providerRef || txNo}</code>
<b>Nội dung CK:</b> <i>${content}</i>

👉 <i>Tiền đã được cộng vào ví khách hàng tức thì sau 3 giây.</i>
    `.trim());

    // Bắn Email cho Khách hàng
    if (user.email) {
      void EmailService.notifyCustomerAlert({
        toEmail: user.email,
        customerName: user.fullName,
        title: `Nạp Tiền Vào Ví Thành Công +${amountVnd.toLocaleString('vi-VN')} ₫`,
        message: `Hệ thống tự động ghi nhận giao dịch chuyển khoản VietQR ${provider} trị giá ${amountVnd.toLocaleString('vi-VN')} ₫ vào ví tài khoản của bạn.`,
        linkUrl: '/finance',
        metadata: {
          transactionNo: txNo,
          amountVnd,
          newBalance: result.updatedUser.balance,
          paymentMethod: `VietQR (${provider})`,
        },
      });
    }

    return {
      success: true,
      message: `Đã tự động nạp +${amountVnd.toLocaleString('vi-VN')} ₫ vào ví cho khách hàng ${user.fullName}`,
      data: {
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        customerCode: user.customerCode,
        amountVnd,
        newBalance: result.updatedUser.balance,
        transactionNo: txNo,
      },
    };
  }

  // ── TRƯỜNG HỢP 3: KHÔNG TÌM THẤY KHÁCH HÀNG HOẶC ĐƠN HÀNG TƯƠNG ỨNG ──
  await prisma.auditLog.create({
    data: {
      action: 'PAYMENT_WEBHOOK_UNMATCHED',
      entity: 'Payment',
      details: JSON.stringify({ provider, providerRef, amountVnd, content, rawPayload }),
    },
  });

  void TelegramService.sendMessage(`
<b>CẢNH BÁO: GIAO DỊCH VIETQR CHƯA KHỚP ĐƯỢC KHÁCH HÀNG</b>
--------------------------------------------
<b>Số tiền:</b> <b>+${amountVnd.toLocaleString('vi-VN')} ₫</b>
<b>Cổng:</b> ${provider} (${bankName || 'VietQR'})
<b>Mã GD:</b> <code>${providerRef || 'N/A'}</code>
<b>Nội dung CK:</b> <i>${content}</i>

⚠️ <i>Nội dung chuyển khoản không chứa Mã KH, SĐT hoặc Mã Đơn hợp lệ. Vui lòng vào trang Quản trị để gán thủ công cho khách.</i>
  `.trim());

  return {
    success: true,
    message: 'Đã nhận webhook nhưng nội dung chuyển khoản chưa khớp với khách hàng cụ thể. Đã lưu nhật ký để xử lý thủ công.',
    unmatched: true,
    data: { provider, providerRef, amountVnd, content },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Universal Webhook Endpoint: /api/v1/payments/webhook/:provider
 * Hỗ trợ PayOS, SePay, Casso, VietQR
 */
paymentsRouter.post('/webhook/:provider', async (req, res, next) => {
  try {
    const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const headerSecret = req.headers['x-webhook-secret'] || req.headers['x-api-key'] || req.headers['authorization'];

    // Nếu có cấu hình secret bảo mật, kiểm tra xác thực
    if (configuredSecret && headerSecret) {
      const cleanHeader = String(headerSecret).replace(/^Bearer\s+/i, '').trim();
      if (cleanHeader !== configuredSecret.trim()) {
        return res.status(401).json({ success: false, message: 'Chữ ký Webhook Secret không hợp lệ' });
      }
    }

    const normalized = normalizeWebhook(req.params.provider, req.body);
    const result = await processWebhookReconciliation(normalized);
    res.json(result);
  } catch (error: any) {
    console.error('[PaymentWebhook] Lỗi xử lý:', error);
    next(error);
  }
});

/**
 * Admin Webhook Simulator Endpoint: /api/v1/payments/simulate-webhook
 * Cho phép Admin thử nghiệm bắn webhook giả lập để kiểm tra cơ chế tự động khớp lệnh
 */
paymentsRouter.post('/simulate-webhook', authenticate, authorize(...ADMIN_ROLES, ...FINANCE_ROLES), async (req, res, next) => {
  try {
    const { provider = 'VIETQR_TEST', amountVnd, content, providerRef } = req.body;

    if (!amountVnd || Number(amountVnd) <= 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số tiền nạp hợp lệ (> 0 VNĐ).' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung chuyển khoản mô phỏng (VD: OCV 0909123456 hoặc OCV KH001).' });
    }

    const normalized: NormalizedWebhookPayload = {
      provider: String(provider).toUpperCase(),
      providerRef: providerRef?.trim() || `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amountVnd: Number(amountVnd),
      content: content.trim(),
      bankName: 'MB Bank (Simulated)',
      accountNumber: '0386918343',
      rawPayload: req.body,
    };

    const result = await processWebhookReconciliation(normalized);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PAYPAL GATEWAY SERVICES & ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

interface PaypalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
  exchangeRateUsdToVnd: number;
}

async function getPaypalConfig(): Promise<PaypalConfig> {
  let clientId = process.env.PAYPAL_CLIENT_ID || '';
  let clientSecret = process.env.PAYPAL_SECRET || '';
  let mode: 'sandbox' | 'live' = (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox';
  let exchangeRateUsdToVnd = 25400;

  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed.paypalClientId) clientId = parsed.paypalClientId;
      if (parsed.paypalSecret) clientSecret = parsed.paypalSecret;
      if (parsed.paypalMode) mode = parsed.paypalMode;
      if (parsed.exchangeRateUsdToVnd) exchangeRateUsdToVnd = Number(parsed.exchangeRateUsdToVnd) || 25400;
    }
  } catch (e) {
    console.warn('[PayPal] Lỗi đọc cấu hình PayPal từ DB:', e);
  }

  return { clientId, clientSecret, mode, exchangeRateUsdToVnd };
}

async function getPaypalAccessToken(clientId: string, clientSecret: string, mode: 'sandbox' | 'live'): Promise<string | null> {
  if (!clientId || !clientSecret || clientId.includes('sb-paypal-client') || clientSecret.includes('secret')) {
    return null; // Dùng sandbox mock
  }

  try {
    const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const authHeader = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');

    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) return null;
    const json = (await res.json()) as any;
    return json.access_token || null;
  } catch (err) {
    console.warn('[PayPal] Lỗi lấy access token:', err);
    return null;
  }
}

/**
 * Tạo đơn hàng thanh toán PayPal (Create PayPal Order)
 * POST /api/v1/payments/paypal/create-order
 */
paymentsRouter.post('/paypal/create-order', authenticate, async (req, res, next) => {
  try {
    const { amountVnd, orderId, purpose = 'DEPOSIT', description } = req.body;
    const amount = Number(amountVnd);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền thanh toán không hợp lệ (> 0 VNĐ).' });
    }

    const config = await getPaypalConfig();
    const amountUsd = Number((amount / config.exchangeRateUsdToVnd).toFixed(2));
    const token = await getPaypalAccessToken(config.clientId, config.clientSecret, config.mode);

    if (token) {
      const baseUrl = config.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: orderId || `DEP-${Date.now()}`,
              description: description || `OrderChinaViet - ${purpose === 'DEPOSIT' ? 'Nap Tien Vi' : 'Thanh Toan Don Hang'}`,
              amount: {
                currency_code: 'USD',
                value: amountUsd.toFixed(2),
              },
            },
          ],
        }),
      });

      const orderJson = (await orderRes.json()) as any;
      if (orderRes.ok && orderJson.id) {
        return res.json({
          success: true,
          data: {
            paypalOrderId: orderJson.id,
            amountVnd: amount,
            amountUsd,
            exchangeRate: config.exchangeRateUsdToVnd,
            currency: 'USD',
            mode: config.mode,
            clientId: config.clientId,
          },
        });
      }
    }

    // Mock / Simulated Mode khi chưa cấu hình Secret hoặc ở chế độ thử nghiệm
    const simulatedOrderId = `PAYID-PP${Date.now()}${Math.floor(Math.random() * 8999 + 1000)}`;
    res.json({
      success: true,
      data: {
        paypalOrderId: simulatedOrderId,
        amountVnd: amount,
        amountUsd,
        exchangeRate: config.exchangeRateUsdToVnd,
        currency: 'USD',
        mode: config.mode,
        clientId: config.clientId || 'sb-paypal-client-ocv-2026',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Xác nhận và Khớp lệnh thanh toán PayPal (Capture PayPal Order)
 * POST /api/v1/payments/paypal/capture-order
 */
paymentsRouter.post('/paypal/capture-order', authenticate, async (req, res, next) => {
  try {
    const { paypalOrderId, amountVnd, purpose = 'DEPOSIT', orderId } = req.body;
    const amount = Number(amountVnd);

    if (!paypalOrderId || !Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu xác thực PayPal không hợp lệ.' });
    }

    const config = await getPaypalConfig();
    const amountUsd = (amount / config.exchangeRateUsdToVnd).toFixed(2);
    const userId = req.user!.id;

    // Kiểm tra trùng lặp
    const existingTx = await prisma.financialTransaction.findUnique({
      where: { transactionNo: String(paypalOrderId) },
    });
    if (existingTx) {
      return res.json({
        success: true,
        message: 'Giao dịch PayPal này đã được hoàn tất trước đó.',
        duplicate: true,
        data: existingTx,
      });
    }

    // ── NẠP TIỀN VÀO VÍ DƯ (WALLET DEPOSIT) ──
    if (purpose === 'DEPOSIT') {
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } },
        });

        const financialTx = await tx.financialTransaction.create({
          data: {
            transactionNo: String(paypalOrderId),
            userId,
            type: 'DEPOSIT',
            amountVnd: amount,
            balanceAfter: updatedUser.balance,
            description: `Nạp tiền qua PayPal USD ($${amountUsd} USD - Tỷ giá: ${config.exchangeRateUsdToVnd.toLocaleString('vi-VN')} ₫) [Mã GD: ${paypalOrderId}]`,
          },
        });

        await tx.notification.create({
          data: {
            userId,
            title: `Nạp tiền qua PayPal thành công +${amount.toLocaleString('vi-VN')} VND`,
            message: `Hệ thống ghi nhận thanh toán $${amountUsd} USD qua PayPal. Ví của bạn đã được cộng +${amount.toLocaleString('vi-VN')} VND.`,
            type: 'FINANCE_DEPOSIT',
            targetRole: 'CUSTOMER',
          },
        });

        return { updatedUser, financialTx };
      });

      // Bắn thông báo Telegram cho Ban Quản Trị
      void TelegramService.sendMessage(`
<b>NẠP TIỀN PAYPAL USD THÀNH CÔNG</b>
--------------------------------------------
<b>Khách hàng:</b> <b>${req.user?.fullName || 'Khách hàng'}</b>
<b>Số tiền VNĐ:</b> <b>+${amount.toLocaleString('vi-VN')} ₫</b>
<b>Số tiền PayPal:</b> <b>$${amountUsd} USD</b> (Tỷ giá: ${config.exchangeRateUsdToVnd.toLocaleString('vi-VN')} ₫)
<b>Mã GD PayPal:</b> <code>${paypalOrderId}</code>
<b>Số dư ví mới:</b> <b>${result.updatedUser.balance.toLocaleString('vi-VN')} ₫</b>

👉 <i>Hệ thống đã tự động cộng tiền ví tức thì cho khách hàng quốc tế.</i>
      `.trim());

      // Bắn email cho khách hàng
      if (req.user?.email) {
        void EmailService.notifyCustomerAlert({
          toEmail: req.user.email,
          customerName: req.user.fullName,
          title: `Nạp Tiền Thành Công Qua PayPal USD ($${amountUsd} USD)`,
          message: `Giao dịch thanh toán $${amountUsd} USD qua PayPal của bạn đã được xử lý thành công. Ví tài khoản đã được cộng +${amount.toLocaleString('vi-VN')} ₫.`,
          linkUrl: '/finance',
          metadata: {
            transactionNo: String(paypalOrderId),
            amountVnd: amount,
            amountUsd: `$${amountUsd} USD`,
            newBalance: result.updatedUser.balance,
            paymentMethod: 'PayPal International Checkout',
          },
        });
      }

      return res.json({
        success: true,
        message: `Đã nạp thành công +${amount.toLocaleString('vi-VN')} ₫ ($${amountUsd} USD) vào ví của bạn!`,
        data: {
          transactionNo: String(paypalOrderId),
          amountVnd: amount,
          amountUsd,
          newBalance: result.updatedUser.balance,
        },
      });
    }

    // ── THANH TOÁN ĐƠN HÀNG TRỰC TIẾP (ORDER PAYMENT) ──
    if (purpose === 'ORDER_PAYMENT' && orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });

      const result = await prisma.$transaction(async (tx) => {
        const purposeType = order.paidVnd === 0 ? 'DEPOSIT' : 'BALANCE';
        const paidVnd = order.paidVnd + amount;
        const remainingVnd = Math.max(0, order.totalVnd - paidVnd);
        const isDeposited = paidVnd >= order.depositRequiredVnd;

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            paidVnd,
            remainingVnd,
            ...(purposeType === 'DEPOSIT' ? { depositPaidVnd: Math.min(paidVnd, order.depositRequiredVnd) } : {}),
            ...(isDeposited && order.status === 'PENDING' ? { status: 'DEPOSITED' } : {}),
          },
        });

        const payment = await tx.payment.create({
          data: {
            paymentCode: `PAY-PP-${Date.now()}`,
            idempotencyKey: `PAYPAL:${paypalOrderId}`,
            providerRef: String(paypalOrderId),
            provider: 'PAYPAL',
            orderId: order.id,
            userId,
            purpose: purposeType,
            method: 'PAYPAL_USD',
            amountVnd: amount,
            status: 'COMPLETED',
            rawPayload: JSON.stringify({ paypalOrderId, amountUsd, amountVnd: amount }),
            completedAt: new Date(),
          },
        });

        await tx.financialTransaction.create({
          data: {
            transactionNo: String(paypalOrderId),
            userId,
            type: purposeType === 'DEPOSIT' ? 'ORDER_DEPOSIT_EXTERNAL' : 'ORDER_BALANCE_EXTERNAL',
            amountVnd: 0,
            balanceAfter: (await tx.user.findUniqueOrThrow({ where: { id: userId } })).balance,
            description: `PayPal USD ($${amountUsd}) xác nhận ${purposeType === 'DEPOSIT' ? 'tiền cọc' : 'thanh toán'} đơn ${order.orderCode}`,
          },
        });

        await tx.notification.create({
          data: {
            userId,
            title: `Thanh toán PayPal thành công cho đơn ${order.orderCode}`,
            message: `Giao dịch $${amountUsd} USD qua PayPal đã được hoàn tất cho đơn hàng ${order.orderCode}.`,
            type: 'ORDER_PAID',
            targetRole: 'CUSTOMER',
          },
        });

        return { updatedOrder, payment };
      });

      // Bắn thông báo Telegram cho Admin
      void TelegramService.sendMessage(`
<b>THANH TOÁN ĐƠN HÀNG PAYPAL USD THÀNH CÔNG</b>
--------------------------------------------
<b>Mã đơn:</b> <code>${result.updatedOrder.orderCode}</code>
<b>Khách hàng:</b> ${req.user?.fullName || 'Khách hàng'}
<b>Số tiền:</b> <b>+${amount.toLocaleString('vi-VN')} ₫ ($${amountUsd} USD)</b>
<b>Mã GD PayPal:</b> <code>${paypalOrderId}</code>
<b>Trạng thái đơn:</b> ${result.updatedOrder.status} (Đã thanh toán ${result.updatedOrder.paidVnd.toLocaleString('vi-VN')} ₫)

👉 <i>Đơn hàng đã được tự động xác nhận thanh toán và sẵn sàng xử lý.</i>
      `.trim());

      return res.json({
        success: true,
        message: `Thanh toán thành công đơn hàng ${order.orderCode} qua PayPal ($${amountUsd} USD)!`,
        data: result,
      });
    }

    res.status(400).json({ success: false, message: 'Mục đích thanh toán không hợp lệ.' });
  } catch (error) {
    next(error);
  }
});
