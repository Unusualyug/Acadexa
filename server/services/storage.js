/**
 * File storage abstraction.
 *
 * Two drivers:
 *   cloudinary  - used whenever CLOUDINARY_* credentials are configured
 *   local       - development fallback so the app keeps working without keys
 *
 * Every uploaded asset is stored as a *private* Cloudinary asset
 * (`type: 'private'`). Nothing is delivered from a public Cloudinary URL:
 * downloads always pass through our own authorized route, which streams the
 * asset from Cloudinary with a short-lived signed private-download URL.
 *
 * FileRecord keeps `provider` + `publicId` + `resourceType` so assets uploaded
 * before the switch (local disk) remain downloadable and deletable.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import FileRecord from '../models/FileRecord.js';
import { UPLOAD_ROOT } from '../middleware/upload.js';

const PDF_MIME = 'application/pdf';
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'];

export const cloudinaryEnabled = () =>
  Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (cloudinaryEnabled()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export const storageDriver = () => (cloudinaryEnabled() ? 'cloudinary' : 'local');

/**
 * PDFs and images go up as `image` (Cloudinary can also page/thumbs them);
 * everything else (docx, xlsx, zip, csv...) goes up as `raw`.
 * The resource type must be repeated on delete, so it is stored per record.
 */
const resourceTypeFor = (mimeType) =>
  mimeType === PDF_MIME || IMAGE_MIME.includes(mimeType) ? 'image' : 'raw';

const safeFormat = (originalName) =>
  path.extname(originalName || '').replace('.', '').toLowerCase().slice(0, 10) || 'bin';

const randomName = (originalName) => {
  const base = path.basename(originalName || 'file', path.extname(originalName || ''));
  return `${base.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)}-${crypto.randomBytes(8).toString('hex')}`;
};

/* --------------------------------- local driver --------------------------------- */

function saveLocal({ buffer, originalName }) {
  const key = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${path.extname(originalName).slice(0, 10)}`;
  fs.writeFileSync(path.join(UPLOAD_ROOT, key), buffer);
  return { provider: 'local', storageKey: key, publicId: null, resourceType: null, url: null };
}

function deleteLocal(key) {
  const abs = path.join(UPLOAD_ROOT, path.basename(key));
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

/* ------------------------------ cloudinary driver ------------------------------- */

function uploadCloudinary({ buffer, originalName, mimeType, folder }) {
  const resourceType = resourceTypeFor(mimeType);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || env.cloudinary.folder,
        public_id: randomName(originalName),
        resource_type: resourceType,
        type: 'private', // never publicly deliverable
        access_mode: 'authenticated',
        overwrite: false,
        use_filename: false,
        unique_filename: false,
        context: { original: originalName },
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          provider: 'cloudinary',
          storageKey: result.public_id,
          publicId: result.public_id,
          resourceType: result.resource_type,
          url: null, // deliberately not stored: private assets have no public URL
          bytes: result.bytes,
        });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Sends one multipart file to whichever driver is active.
 * Returns the fields that belong on the FileRecord.
 */
export async function storeFile(file, { folder } = {}) {
  if (!cloudinaryEnabled()) return saveLocal(file);
  return uploadCloudinary({ ...file, folder });
}

/** Best-effort delete of one asset. Returns true when something was removed. */
export async function deleteStoredAsset(record) {
  if (record.provider === 'cloudinary' && record.publicId) {
    if (!cloudinaryEnabled()) return false;
    const res = await cloudinary.uploader.destroy(record.publicId, {
      resource_type: record.resourceType || 'raw',
      type: 'private',
      invalidate: true,
    });
    return ['ok', 'not found'].includes(res?.result);
  }
  if (record.storageKey) {
    deleteLocal(record.storageKey);
    return true;
  }
  return false;
}

/**
 * Streams a stored asset to an Express response. Authorization has already been
 * enforced by the caller; this only resolves *where* the bytes live.
 */
export async function streamStoredAsset(record, res) {
  if (record.provider === 'cloudinary') {
    if (!cloudinaryEnabled()) throw new Error('Cloudinary is not configured but this file lives there.');
    // Signed, short-lived URL generated server-side; the student never sees it.
    const url = cloudinary.utils.private_download_url(record.publicId, safeFormat(record.originalName), {
      resource_type: record.resourceType || 'raw',
      type: 'private',
      expires_at: Math.floor(Date.now() / 1000) + 120,
      attachment: true,
    });
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Cloudinary download failed (${upstream.status})`);
    res.setHeader('Content-Length', upstream.headers.get('content-length') || '');
    Readable.fromWeb(upstream.body).pipe(res);
    return;
  }

  const abs = path.join(UPLOAD_ROOT, path.basename(record.storageKey));
  if (!fs.existsSync(abs)) throw new Error('Stored file is no longer available.');
  fs.createReadStream(abs).pipe(res);
}

/**
 * Deletes every live file attached to one order (student references and
 * deliverables) from the active storage provider, keeping the database record
 * for the audit trail.
 *
 * Used by "Mark completed": once an order is finished the documents are no
 * longer needed, so the bytes are removed from Cloudinary.
 */
export async function purgeOrderFiles(orderId, { actorId = null, reason = 'order_completed' } = {}) {
  const files = await FileRecord.find({ order: orderId, isDeleted: false });
  const purged = [];
  const failed = [];

  for (const file of files) {
    let removed = false;
    try {
      removed = await deleteStoredAsset(file);
    } catch (err) {
      failed.push({ id: file._id, name: file.originalName, error: err.message });
      continue;
    }
    file.isDeleted = true;
    file.deletedAt = new Date();
    file.purgedAt = new Date();
    file.purgedBy = actorId;
    file.purgeReason = reason;
    file.downloadCount = 0;
    await file.save();
    purged.push({ id: file._id, name: file.originalName, provider: file.provider, removed });
  }

  return { purged, failed, provider: storageDriver() };
}
