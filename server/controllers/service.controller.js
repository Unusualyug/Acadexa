import { z } from 'zod';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.js';

export const serviceSchema = z.object({
  name: z.string().min(3).max(140),
  category: z.string().min(2).max(60),
  shortDescription: z.string().min(10).max(220),
  description: z.string().min(20),
  icon: z.string().optional(),
  included: z.array(z.string()).optional(),
  excluded: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  acceptedFormats: z.array(z.string()).optional(),
  pricingModel: z.enum(['fixed', 'quotation']),
  priceNote: z.string().max(600).optional(),
  priceTable: z.array(z.object({ item: z.string().min(1), softcopy: z.string().default('—'), handwritten: z.string().default('—') })).optional(),
  additionalCharges: z.array(z.object({ label: z.string(), charge: z.string() })).optional(),
  startingPrice: z.coerce.number().min(0).optional(),
  turnaroundEstimate: z.string().optional(),
  revisionPolicy: z.string().optional(),
  revisionLimit: z.coerce.number().min(0).max(20).optional(),
  availability: z.enum(['available', 'limited', 'paused']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().optional(),
  slug: z.string().optional(),
});

export const listServices = asyncHandler(async (req, res) => {
  const { q, category, sort = 'order', includeInactive } = req.query;
  const filter = {};
  if (!(includeInactive === 'true' && req.user && ['admin', 'owner'].includes(req.user.role))) {
    filter.isActive = true;
  }
  if (category && category !== 'All') filter.category = category;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { shortDescription: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ];
  }
  const sortMap = { order: { sortOrder: 1, name: 1 }, name: { name: 1 }, priceAsc: { startingPrice: 1 }, priceDesc: { startingPrice: -1 } };
  const services = await Service.find(filter).sort(sortMap[sort] || sortMap.order).lean();
  const categories = [...new Set((await Service.find({ isActive: true }).distinct('category')))];
  res.json({ services, categories });
});

export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug, ...(req.user && ['admin', 'owner'].includes(req.user.role) ? {} : { isActive: true }) }).lean();
  if (!service) throw ApiError.notFound('Service not found or no longer available.');
  res.json({ service });
});

export const createService = asyncHandler(async (req, res) => {
  const body = req.body;
  const slug = (body.slug || body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const exists = await Service.findOne({ slug });
  if (exists) throw ApiError.conflict('A service with a similar name or slug already exists.');
  const service = await Service.create({ ...body, slug });
  await logAudit(req, { action: 'service.created', entity: 'Service', entityId: service._id, reference: service.slug });
  res.status(201).json({ service });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found.');
  Object.assign(service, req.body);
  if (req.body.name && !req.body.slug && service.isModified('name')) {
    service.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  await service.save();
  await logAudit(req, { action: 'service.updated', entity: 'Service', entityId: service._id, reference: service.slug, meta: { fields: Object.keys(req.body) } });
  res.json({ service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found.');
  service.isActive = false;
  await service.save();
  await logAudit(req, { action: 'service.unpublished', entity: 'Service', entityId: service._id, reference: service.slug });
  res.json({ message: 'Service unpublished. Existing orders are unaffected.' });
});

export const toggleSavedService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await Service.findById(id).select('_id');
  if (!service) throw ApiError.notFound('Service not found.');
  const user = await User.findById(req.user._id);
  const has = user.savedServices.some((s) => s.equals(service._id));
  user.savedServices = has ? user.savedServices.filter((s) => !s.equals(service._id)) : [...user.savedServices, service._id];
  await user.save();
  res.json({ saved: !has, savedServices: user.savedServices });
});
