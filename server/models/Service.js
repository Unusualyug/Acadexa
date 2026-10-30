import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    category: { type: String, required: true, index: true },
    icon: { type: String, default: 'BookOpen' },
    shortDescription: { type: String, required: true, maxlength: 220 },
    description: { type: String, required: true },
    included: [{ type: String }],
    excluded: [{ type: String }],
    requirements: [{ type: String }],
    acceptedFormats: [{ type: String }],
    pricingModel: { type: String, enum: ['fixed', 'quotation'], default: 'quotation' },
    priceNote: { type: String, maxlength: 600 },
    priceTable: [
      {
        item: { type: String, required: true },
        softcopy: { type: String, default: '—' },
        handwritten: { type: String, default: '—' },
        // Free-text qualifier, e.g. "Quoted at actual cost".
        note: { type: String, default: '' },
      },
    ],
    additionalCharges: [{ label: String, charge: String }],
    startingPrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'INR' },
    turnaroundEstimate: { type: String, default: '3-5 working days' },
    revisionPolicy: { type: String, default: '2 revisions within 7 days of delivery, within agreed scope.' },
    revisionLimit: { type: Number, default: 2, min: 0 },
    integrityNotes: { type: String, default: 'Reference-based support only. Students remain responsible for their institution\'s academic rules.' },
    availability: { type: String, enum: ['available', 'limited', 'paused'], default: 'available' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    faqs: [{ question: String, answer: String }],
    seo: { metaTitle: String, metaDescription: String },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1, sortOrder: 1 });

export default mongoose.model('Service', serviceSchema);
