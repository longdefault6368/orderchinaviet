'use client';

import { settingsStore } from './settings-store';

export interface PayosPaymentRequest {
  orderId: string;
  amountVnd: number;
  description: string;
}

export interface PayosCheckoutResult {
  checkoutUrl: string;
  qrCodeUrl: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amountVnd: number;
  transferContent: string;
  clientId: string;
}

export interface PaypalCheckoutResult {
  orderId: string;
  amountVnd: number;
  amountUsd: number;
  exchangeRate: number;
  paypalClientId: string;
  mode: 'sandbox' | 'live';
  description: string;
}

export class PaymentGatewayService {
  public isPayosEnabled(): boolean {
    const settings = settingsStore.getSettings();
    return settings.enablePayos !== false;
  }

  public isPaypalEnabled(): boolean {
    const settings = settingsStore.getSettings();
    return settings.enablePaypal !== false;
  }

  public createPayosCheckout(req: PayosPaymentRequest): PayosCheckoutResult {
    const settings = settingsStore.getSettings();
    const cleanId = req.orderId.replace(/[^a-zA-Z0-9]/g, '');
    const transferContent = `OCV ${cleanId}`.toUpperCase();

    const bankName = settings.payosBankName || 'MB Bank';
    const bankBin = settings.payosBankBin || '970422'; // 970422 = MB Bank
    const accountNumber = settings.payosAccountNumber || '0386 9183 43';
    const cleanAccountNumber = accountNumber.replace(/\s+/g, '');
    const accountName = settings.payosAccountName || 'DOAN CAT NGUYEN';

    // Generate VietQR dynamic QR code image URL powered by VietQR / PayOS
    const qrCodeUrl = `https://img.vietqr.io/image/${bankBin}-${cleanAccountNumber}-compact2.png?amount=${req.amountVnd}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    return {
      checkoutUrl: `https://payos.vn/checkout/${req.orderId}?client=${settings.payosClientId || '9102fe22-94f0-401d-96d8-2297af74b257'}`,
      qrCodeUrl,
      bankName,
      accountNumber,
      accountName,
      amountVnd: req.amountVnd,
      transferContent,
      clientId: settings.payosClientId || '9102fe22-94f0-401d-96d8-2297af74b257',
    };
  }

  public createPaypalCheckout(req: PayosPaymentRequest): PaypalCheckoutResult {
    const settings = settingsStore.getSettings();
    const rateUsd = settings.exchangeRateUsdToVnd || 25400;
    const amountUsd = Math.round((req.amountVnd / rateUsd) * 100) / 100;

    return {
      orderId: req.orderId,
      amountVnd: req.amountVnd,
      amountUsd,
      exchangeRate: rateUsd,
      paypalClientId: settings.paypalClientId || 'sb-paypal-client-ocv-2026',
      mode: settings.paypalMode || 'sandbox',
      description: req.description || `Payment for order ${req.orderId}`,
    };
  }
}

export const paymentGateway = new PaymentGatewayService();
