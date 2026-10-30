import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    consultant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true },
    startsAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 30 },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['Requested', 'Confirmed', 'Rescheduled', 'Cancelled', 'Completed', 'No Show'], default: 'Requested', index: true },
    notes: { type: String, maxlength: 1200 },
    meetingLink: String,
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    cancelReason: String,
  },
  { timestamps: true }
);

bookingSchema.index({ consultant: 1, startsAt: 1 });

export default mongoose.model('ConsultationBooking', bookingSchema);
