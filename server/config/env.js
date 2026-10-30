import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'sd_token',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  paymentProvider: process.env.PAYMENT_PROVIDER || 'sandbox',
  paymentKeyId: process.env.PAYMENT_KEY_ID || '',
  paymentKeySecret: process.env.PAYMENT_KEY_SECRET || '',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  uploadDir: process.env.UPLOAD_DIR || '.data/uploads',
  maxFileMb: Number(process.env.MAX_FILE_MB || 10),
  supportEmail: process.env.SUPPORT_EMAIL || 'support@acadexa.example',
  // File storage. When these three are present every upload goes to Cloudinary;
  // otherwise the server falls back to local disk so development still works.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'acadexa/documents',
  },
};

if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
  console.warn('[config] Cloudinary credentials missing — uploads will be stored on local disk.');
}
