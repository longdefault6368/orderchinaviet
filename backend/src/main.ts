import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './modules/auth/auth.controller';
import { customerRouter } from './modules/customers/customers.controller';
import { warehouseRouter } from './modules/warehouses/warehouses.controller';
import { packageRouter } from './modules/packages/packages.controller';
import { shipmentRouter } from './modules/shipments/shipments.controller';
import { financeRouter } from './modules/finance/finance.controller';
import { cmsRouter } from './modules/cms/cms.controller';
import { operationsRouter } from './modules/operations/operations.controller';
import { affiliateRouter } from './modules/affiliates/affiliates.controller';
import { settingsRouter } from './modules/settings/settings.controller';
import { ratesRouter } from './modules/rates/rates.controller';
import { exchangeRouter } from './modules/exchange/exchange.controller';
import { ordersRouter } from './modules/orders/orders.controller';
import { paymentsRouter } from './modules/payments/payments.controller';

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.CORS_ORIGIN) {
  throw new Error('JWT_SECRET, JWT_REFRESH_SECRET and CORS_ORIGIN are required. Check .env.example.');
}

// Disable ETag caching for API endpoints so Express always returns 200 OK with fresh data
app.disable('etag');
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
// Base64 proof/pickup images are capped at 2 MB by their APIs; allow JSON encoding overhead.
app.use(express.json({ limit: '4mb' }));

// Prevent browser API caching middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Custom HTTP Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;
    
    let statusTag = `[${statusCode}]`;
    if (statusCode >= 200 && statusCode < 300) {
      statusTag = `✅ ${statusCode}`;
    } else if (statusCode === 304) {
      statusTag = `ℹ️ 304 (Cache)`;
    } else if (statusCode >= 400 && statusCode < 500) {
      statusTag = `⚠️ ${statusCode}`;
    } else if (statusCode >= 500) {
      statusTag = `❌ ${statusCode}`;
    }
    
    console.log(`[${timestamp}] 📡 ${method} ${url} ➔ ${statusTag} (${duration}ms)`);
  });

  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'OrderChinaViet Logistics Backend API', timestamp: new Date() });
});

// API Routes
const API_PREFIX = '/api/v1';
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau.' },
});
app.use(`${API_PREFIX}/auth/login`, authLimiter);
app.use(`${API_PREFIX}/auth/register`, authLimiter);
app.use(`${API_PREFIX}/auth/refresh`, authLimiter);
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/customers`, customerRouter);
app.use(`${API_PREFIX}/warehouses`, warehouseRouter);
app.use(`${API_PREFIX}/packages`, packageRouter);
app.use(`${API_PREFIX}/shipments`, shipmentRouter);
app.use(`${API_PREFIX}/finance`, financeRouter);
app.use(`${API_PREFIX}/cms`, cmsRouter);
app.use(`${API_PREFIX}/operations`, operationsRouter);
app.use(`${API_PREFIX}/affiliates`, affiliateRouter);
app.use(`${API_PREFIX}/settings`, settingsRouter);
app.use(`${API_PREFIX}/rates`, ratesRouter);
app.use(`${API_PREFIX}/exchange`, exchangeRouter);
app.use(`${API_PREFIX}/orders`, ordersRouter);
app.use(`${API_PREFIX}/payments`, paymentsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 OrderChinaViet Backend API running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  });
}

export { app };
