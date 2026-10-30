import FileRecord from "../models/FileRecord.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  storeFile,
  deleteStoredAsset,
  streamStoredAsset,
  purgeOrderFiles,
  storageDriver,
} from "../services/storage.js";
import OrphanAsset from "../models/OrphanAsset.js";
import { notify } from "../services/notify.js";
import { pushActivity } from "../services/orders.js";
import { logAudit } from "../services/audit.js";
import { ORDER_STATUS } from "../utils/constants.js";

const PURPOSE_ALLOWED = ["reference", "revision-reference", "payment-proof"];

export const uploadFiles = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest("No files were received.");
  const purpose = req.body.purpose || "reference";
  if (!PURPOSE_ALLOWED.includes(purpose))
    throw ApiError.forbidden(
      "You are not permitted to upload files for that purpose.",
    );
  const order = req.body.orderId
    ? await Order.findById(req.body.orderId)
    : null;
  if (req.body.orderId && !order) throw ApiError.notFound("Order not found.");
  if (
    order &&
    !order.student.equals(req.user._id) &&
    !["admin", "owner"].includes(req.user.role)
  )
    throw ApiError.forbidden("You cannot attach files to that order.");

  // Determine owner: authenticated user, or fallback to first admin for unauthenticated enquiry uploads
  let ownerId = req.user?._id;
  if (!ownerId && purpose === "reference" && !order) {
    const admin = await User.findOne({ role: { $in: ["admin", "owner"] } })
      .select("_id")
      .lean();
    if (admin) ownerId = admin._id;
  }
  if (!ownerId)
    throw ApiError.forbidden("Authentication required to upload files.");

  const retention = new Date();
  retention.setMonth(retention.getMonth() + 24);

  const stored = await storeAll(
    req.files,
    `orders/${order?._id || "unassigned"}`,
  );
  const records = await FileRecord.create(
    stored.map((f) => ({
      owner: ownerId,
      order: order?._id,
      uploadedBy: ownerId,
      provider: f.provider,
      storageKey: f.storageKey,
      publicId: f.publicId,
      resourceType: f.resourceType,
      originalName: f.originalName.slice(0, 200),
      mimeType: f.mimeType,
      size: f.size,
      purpose,
      retentionUntil: retention,
    })),
  );
  if (order) {
    if (purpose === "reference") {
      order.files.push(...records.map((r) => r._id));
      await order.save();
    }
  }
  res.status(201).json({ files: records });
});

/** Authorized, server-mediated download. Files are never served from a public path. */
export const downloadFile = asyncHandler(async (req, res) => {
  const file = await FileRecord.findById(req.params.id);
  if (!file || file.isDeleted)
    throw ApiError.notFound("File not found or has been deleted.");
  const isOwner = file.owner.equals(req.user._id);
  const isAdmin = ["admin", "owner"].includes(req.user.role);
  let isAssigned = false;
  if (req.user.role === "consultant" && file.order) {
    const order = await Order.findById(file.order).select("assignedConsultant");
    isAssigned = order?.assignedConsultant?.equals(req.user._id) || false;
  }
  if (!isOwner && !isAdmin && !isAssigned)
    throw ApiError.forbidden("You do not have access to this file.");

  file.downloadCount += 1;
  await file.save();
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.originalName)}"`,
  );
  res.setHeader("Cache-Control", "private, no-store");
  try {
    await streamStoredAsset(file, res);
  } catch (err) {
    if (res.headersSent) return res.end();
    throw ApiError.notFound(
      err.message || "Stored file is no longer available.",
    );
  }
});

export const myFiles = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.user.role === "student") filter.owner = req.user._id;
  if (req.query.order) filter.order = req.query.order;
  const files = await FileRecord.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("order", "reference")
    .lean();
  res.json({ files });
});

export const deleteFile = asyncHandler(async (req, res) => {
  const file = await FileRecord.findById(req.params.id);
  if (!file || file.isDeleted) throw ApiError.notFound("File not found.");
  if (
    !file.owner.equals(req.user._id) &&
    !["admin", "owner"].includes(req.user.role)
  )
    throw ApiError.forbidden("You cannot delete this file.");
  await deleteStoredAsset(file).catch((err) =>
    console.error("[storage] delete failed:", err.message),
  );
  file.isDeleted = true;
  file.deletedAt = new Date();
  file.purgedAt = new Date();
  file.purgedBy = req.user._id;
  file.purgeReason = "manual_delete";
  await file.save();
  await logAudit(req, {
    action: "file.deleted",
    entity: "FileRecord",
    entityId: file._id,
    reference: file.originalName,
    meta: { provider: file.provider },
  });
  res.json({ message: "File deleted." });
});

export const uploadDeliverable = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found.");
  if (!req.files?.length) throw ApiError.badRequest("No files were received.");
  const existingMax = await FileRecord.findOne({
    order: order._id,
    purpose: "deliverable",
  })
    .sort({ version: -1 })
    .select("version");
  const version = (existingMax?.version || 0) + 1;
  const stored = await storeAll(req.files, `orders/${order._id}/deliverables`);
  const records = await FileRecord.create(
    stored.map((f) => ({
      owner: order.student,
      order: order._id,
      uploadedBy: req.user._id,
      provider: f.provider,
      storageKey: f.storageKey,
      publicId: f.publicId,
      resourceType: f.resourceType,
      originalName: f.originalName.slice(0, 200),
      mimeType: f.mimeType,
      size: f.size,
      purpose: "deliverable",
      version,
    })),
  );
  order.deliveredFiles.push(...records.map((r) => r._id));
  if (
    order.status === ORDER_STATUS.IN_PROGRESS ||
    order.status === ORDER_STATUS.REVISION_REQUESTED
  ) {
    order.status = ORDER_STATUS.DELIVERED;
    order.deliveredAt = new Date();
    pushActivity(order, {
      status: ORDER_STATUS.DELIVERED,
      action: `Deliverable uploaded (v${version})`,
      note: req.body.note,
      actor: req.user._id,
      actorRole: req.user.role,
    });
  }
  await order.save();
  await notify({
    recipient: order.student,
    type: "delivery",
    title: `Deliverables available for ${order.reference}`,
    body: "Your documents are ready to review and download from the order page.",
    link: `/dashboard/orders/${order._id}`,
    email: true,
  });
  await logAudit(req, {
    action: "file.deliverable_uploaded",
    entity: "Order",
    entityId: order._id,
    reference: order.reference,
    meta: { version, count: records.length },
  });
  res.status(201).json({ files: records, order });
});

/**
 * Uploads every buffer to the active driver before any record is written, so a
 * storage failure never leaves a FileRecord pointing at a missing asset.
 */
async function storeAll(files, folder) {
  const out = [];
  for (const f of files) {
    const stored = await storeFile(
      { buffer: f.buffer, originalName: f.originalname, mimeType: f.mimetype },
      { folder },
    );
    out.push({
      ...stored,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    });
  }
  return out;
}

/** Admin: which files would be destroyed if this order were completed now. */
export const purgePreview = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).select("reference");
  if (!order) throw ApiError.notFound("Order not found.");
  const files = await FileRecord.find({
    order: order._id,
    isDeleted: false,
  }).select("originalName size purpose provider publicId");
  res.json({
    provider: storageDriver(),
    count: files.length,
    files: files.map((f) => ({
      id: f._id,
      name: f.originalName,
      size: f.size,
      purpose: f.purpose,
      provider: f.provider,
    })),
  });
});

/** Admin: destroy every file on one order, keeping the records for the audit trail. */
export const purgeOrderFilesNow = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found.");
  const result = await purgeOrderFiles(order._id, {
    actorId: req.user._id,
    reason: req.body?.reason || "admin_purge",
  });
  await logAudit(req, {
    action: "file.order_purged",
    entity: "Order",
    entityId: order._id,
    reference: order.reference,
    meta: {
      count: result.purged.length,
      failed: result.failed.length,
      provider: result.provider,
    },
  });
  res.json({
    ...result,
    message: `${result.purged.length} file(s) deleted from ${result.provider}.`,
  });
});

/**
 * Retries every asset whose deletion failed when its record was removed.
 * Runs alongside the retention job; a record is dropped only once the provider
 * confirms the asset is gone, so the bucket cannot accumulate untracked files.
 */
export async function orphanCleanupJob() {
  const pending = await OrphanAsset.find({}).limit(200);
  let cleared = 0;
  for (const orphan of pending) {
    try {
      const gone = await deleteStoredAsset({
        provider: orphan.provider,
        storageKey: orphan.storageKey,
        publicId: orphan.publicId,
        resourceType: orphan.resourceType,
      });
      if (gone) {
        await OrphanAsset.deleteOne({ _id: orphan._id });
        cleared += 1;
      }
    } catch (err) {
      await OrphanAsset.updateOne(
        { _id: orphan._id },
        {
          $inc: { attempts: 1 },
          $set: {
            lastError: String(err.message || err).slice(0, 300),
            lastAttemptAt: new Date(),
          },
        },
      );
    }
  }
  if (cleared)
    console.log(`[job] orphan-asset cleanup removed ${cleared} asset(s)`);
  return cleared;
}

export const retentionJob = async () => {
  const now = new Date();
  const expired = await FileRecord.find({
    isDeleted: false,
    retentionUntil: { $lt: now },
  });
  for (const f of expired) {
    await deleteStoredAsset(f).catch((err) =>
      console.error("[storage] retention delete failed:", err.message),
    );
    f.isDeleted = true;
    f.deletedAt = now;
    f.purgedAt = now;
    f.purgeReason = "retention_expired";
    await f.save();
  }
  if (expired.length)
    console.log(`[job] retention purge removed ${expired.length} files`);
  return expired.length;
};
