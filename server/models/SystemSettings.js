import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'main', unique: true },
    business: {
      name: { type: String, default: 'Acadexa' },
      tagline: { type: String, default: 'Your Academic Journey, Simplified.' },
      message: { type: String, default: 'Professional Academic Support. Personalized Guidance. Complete Confidentiality.' },
      email: { type: String, default: 'hello@acadexa.example' },
      phone: { type: String, default: '+91 98257 51614' },
      whatsapp: { type: String, default: '+91 98257 51614' },
      address: { type: String, default: 'Ahmedabad, Gujarat, India' },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    defaults: {
      quotationValidDays: { type: Number, default: 7 },
      revisionLimit: { type: Number, default: 2 },
      maxFileMb: { type: Number, default: 10 },
      allowedFileTypes: [{ type: String }],
      dataRetentionMonths: { type: Number, default: 24 },
      servicesOpen: { type: Boolean, default: true },
    },
    content: {
      heroHeadline: { type: String, default: 'Your Academic Work, Made Simpler.' },
      heroSubtext: { type: String, default: '' },
      announcement: { type: String, default: '' },
    },
    pricing: {
      additionalCharges: [{ label: String, charge: String }],
      startingPrices: [{ label: String, price: String }],
      policies: [{ heading: String, text: String }],
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      quotationReminders: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true },
    },
    integrations: {
      paymentConfigured: { type: Boolean, default: false },
      paymentProvider: { type: String, default: 'sandbox' },
      emailConfigured: { type: Boolean, default: false },
      emailProvider: { type: String, default: 'log' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemSettings', settingsSchema);
