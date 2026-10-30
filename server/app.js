import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import consentRoutes from './routes/consent.routes.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import serviceRoutes from './routes/service.routes.js';
import orderRoutes from './routes/order.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import fileRoutes from './routes/file.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import supportRoutes from './routes/support.routes.js';
import reviewRoutes from './routes/review.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import privacyRoutes from './routes/privacy.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin / server-to-server
      const allowed = [...env.clientOrigins, /^https:\/\/[a-z0-9-]+\.e2b\.app$/];
      const ok = allowed.some((a) => (typeof a === 'string' ? a === origin : a.test(origin)));
      if (ok) return cb(null, true);
      // In development allow any localhost port for tooling.
      if (!env.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin ${origin}`));
    },
    credentials: true,
  })
);

// Raw body needed for webhook HMAC verification.
app.use('/api/payments/webhook', express.json({ limit: '1mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    db: dbStates[mongoose.connection.readyState] || 'unknown',
    env: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Public, non-sensitive settings used to render branding and contact details.
app.get('/api/public/settings', async (_req, res) => {
  const { ADDITIONAL_CHARGES, STARTING_PRICES, PRICING_POLICIES } = await import('./utils/catalogue.js');
  const { default: SystemSettings } = await import('./models/SystemSettings.js');
  let s = await SystemSettings.findOne({ singleton: 'main' }).lean();
  if (!s) {
    await SystemSettings.create({ singleton: 'main' });
    s = await SystemSettings.findOne({ singleton: 'main' }).lean();
  }
  res.json({
    settings: s
      ? {
          business: s.business,
          content: s.content,
          pricing: s.pricing?.policies?.length
            ? s.pricing
            : {
                additionalCharges: ADDITIONAL_CHARGES,
                startingPrices: STARTING_PRICES,
                policies: PRICING_POLICIES,
              },
          defaults: { maxFileMb: s.defaults?.maxFileMb, revisionLimit: s.defaults?.revisionLimit, servicesOpen: s.defaults?.servicesOpen },
          consent: { policyVersion: '2026-01' },
        }
      : null,
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consent', consentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
