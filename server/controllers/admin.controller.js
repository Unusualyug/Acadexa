import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import SupportTicket from "../models/SupportTicket.js";
import Quotation from "../models/Quotation.js";
import Review from "../models/Review.js";
import AuditLog from "../models/AuditLog.js";
import Service from "../models/Service.js";
import SystemSettings from "../models/SystemSettings.js";
import ConsultationBooking from "../models/ConsultationBooking.js";
import PrivacyRequest from "../models/PrivacyRequest.js";
import Coupon from "../models/Coupon.js";
import FileRecord from "../models/FileRecord.js";
import { storageDriver } from "../services/storage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ORDER_STATUS } from "../utils/constants.js";
import { logAudit } from "../services/audit.js";
import { notify } from "../services/notify.js";
import {
  purgeStudent,
  summariseStudentData,
  maskEmail,
  isValidObjectId,
} from "../services/studentPurge.js";

export const dashboard = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const range = {};
  if (from || to)
    range.createdAt = {
      ...(from && { $gte: new Date(from) }),
      ...(to && { $lte: new Date(to) }),
    };

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);

  const [
    totalStudents,
    newRequests,
    awaitingReview,
    pendingQuotations,
    activeOrders,
    dueSoon,
    delivered,
    completed,
    openTickets,
    recentActivity,
    revenueAgg,
    pendingPayments,
    refundsAgg,
    statusDist,
    servicePop,
    ordersTrend,
    revenueTrend,
    completionAgg,
    privacyOpen,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Order.countDocuments({ ...range }),
    Order.countDocuments({ status: ORDER_STATUS.PENDING_REVIEW }),
    Quotation.countDocuments({ status: "Sent", expiresAt: { $gt: now } }),
    Order.countDocuments({
      status: {
        $in: [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.IN_PROGRESS,
          ORDER_STATUS.AWAITING_INFO,
          ORDER_STATUS.READY_FOR_REVIEW,
        ],
      },
    }),
    Order.countDocuments({
      deadline: { $lte: weekAhead, $gte: now },
      status: {
        $nin: [
          ORDER_STATUS.COMPLETED,
          ORDER_STATUS.CANCELLED,
          ORDER_STATUS.REJECTED,
        ],
      },
    }),
    Order.countDocuments({ status: ORDER_STATUS.DELIVERED }),
    Order.countDocuments({ status: ORDER_STATUS.COMPLETED }),
    SupportTicket.countDocuments({
      status: { $in: ["Open", "In Progress", "Awaiting Student"] },
    }),
    Order.find()
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate("student", "name")
      .select("reference title status updatedAt student")
      .lean(),
    Payment.aggregate([
      { $match: { status: "Verified" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: null, total: { $sum: "$amount" }, n: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { "refunds.0": { $exists: true } } },
      { $unwind: "$refunds" },
      {
        $group: {
          _id: null,
          total: { $sum: "$refunds.amount" },
          n: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate([
      { $group: { _id: "$serviceName", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 90 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          n: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: "Verified",
          verifiedAt: { $gte: new Date(now.getTime() - 90 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$verifiedAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      {
        $match: { status: ORDER_STATUS.COMPLETED, completedAt: { $ne: null } },
      },
      {
        $project: {
          days: {
            $divide: [{ $subtract: ["$completedAt", "$createdAt"] }, 86400000],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: "$days" } } },
    ]),
    PrivacyRequest.countDocuments({
      status: { $in: ["Received", "In Review"] },
    }),
  ]);

  res.json({
    metrics: {
      totalStudents,
      newRequests,
      awaitingReview,
      pendingQuotations,
      activeOrders,
      dueSoon,
      delivered,
      completed,
      openTickets,
      openPrivacyRequests: privacyOpen,
      verifiedRevenue: revenueAgg[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      pendingPaymentCount: pendingPayments[0]?.n || 0,
      refundedAmount: refundsAgg[0]?.total || 0,
      refundCount: refundsAgg[0]?.n || 0,
      avgCompletionDays: Number((completionAgg[0]?.avg || 0).toFixed(1)),
    },
    charts: {
      statusDistribution: statusDist.map((s) => ({
        status: s._id,
        count: s.n,
      })),
      servicePopularity: servicePop.map((s) => ({
        service: s._id || "Unassigned",
        count: s.n,
      })),
      ordersTrend: ordersTrend.map((d) => ({ date: d._id, orders: d.n })),
      revenueTrend: revenueTrend.map((d) => ({
        date: d._id,
        revenue: d.total,
      })),
    },
    recentActivity,
    definitions: {
      verifiedRevenue:
        "Sum of payments with server-verified status only. Pending/failed attempts are excluded.",
      newRequests:
        "Orders created in the selected range (all time when no range is chosen).",
      avgCompletionDays:
        "Mean days between order creation and completion, for completed orders.",
    },
  });
});

export const listStudents = asyncHandler(async (req, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const filter = { role: "student" };
  if (status) filter.accountStatus = status;
  if (q)
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select(
        "name email profile.phone profile.institution profile.city accountStatus emailVerified createdAt",
      )
      .lean(),
    User.countDocuments(filter),
  ]);
  res.json({
    students: students.map((s) => ({
      ...s,
      phone: s.profile?.phone || "",
      hasPhone: Boolean(s.profile?.phone),
    })),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  });
});

/**
 * One student, their work and their documents — the admin detail view.
 *
 * Returns permitted fields only (no hashes, no tokens), every order with the
 * status the admin can act on, and every live file across all of their orders
 * with the storage provider that holds it, so the UI can warn before deleting.
 */
export const studentOverview = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id))
    throw ApiError.badRequest("Invalid student id.");
  const student = await User.findOne({ _id: req.params.id, role: "student" })
    .select(
      "name email profile accountStatus emailVerified createdAt lastLoginAt",
    )
    .lean();
  if (!student) throw ApiError.notFound("Student not found.");

  const orders = await Order.find({ student: student._id })
    .select(
      "reference title status paymentStatus deadline agreedAmount currency createdAt serviceName deliveredAt completedAt revisionCount",
    )
    .sort({ createdAt: -1 })
    .lean();

  const orderIds = orders.map((o) => o._id);
  const files = await FileRecord.find({
    isDeleted: false,
    $or: [{ owner: student._id }, { order: { $in: orderIds } }],
  })
    .select(
      "originalName size mimeType purpose provider publicId order uploadedBy createdAt version",
    )
    .sort({ createdAt: -1 })
    .populate("order", "reference")
    .populate("uploadedBy", "name role")
    .lean();

  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const activeStatuses = [
    "Pending Review",
    "More Information Required",
    "Quotation Sent",
    "Awaiting Payment",
    "Confirmed",
    "In Progress",
    "Awaiting Student Information",
    "Ready for Review",
    "Revision Requested",
  ];

  res.json({
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      phone: student.profile?.phone || "",
      institution: student.profile?.institution || "",
      course: student.profile?.course || "",
      city: student.profile?.city || "",
      accountStatus: student.accountStatus,
      emailVerified: student.emailVerified,
      createdAt: student.createdAt,
      lastLoginAt: student.lastLoginAt || null,
    },
    orders,
    files: files.map((f) => ({
      _id: f._id,
      originalName: f.originalName,
      size: f.size,
      mimeType: f.mimeType,
      purpose: f.purpose,
      provider: f.provider || "local",
      order: f.order
        ? { _id: f.order._id, reference: f.order.reference }
        : null,
      uploadedBy: f.uploadedBy
        ? { name: f.uploadedBy.name, role: f.uploadedBy.role }
        : null,
      createdAt: f.createdAt,
      version: f.version,
    })),
    summary: {
      orders: orders.length,
      active: orders.filter((o) => activeStatuses.includes(o.status)).length,
      completed: orders.filter((o) => o.status === ORDER_STATUS.COMPLETED)
        .length,
      cancelled: orders.filter((o) =>
        ["Cancelled", "Rejected", "Refunded"].includes(o.status),
      ).length,
      files: files.length,
      filesByProvider: files.reduce((acc, f) => {
        const k = f.provider || "local";
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {}),
      byStatus,
    },
    storage: storageDriver(),
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) throw ApiError.notFound("Student not found.");
  const { accountStatus, note } = req.body;
  if (accountStatus) {
    if (!["active", "suspended", "deactivated"].includes(accountStatus))
      throw ApiError.badRequest("Invalid account status.");
    student.accountStatus = accountStatus;
    await student.save();
    await logAudit(req, {
      action: "student.account_status_changed",
      entity: "User",
      entityId: student._id,
      reference: student.email,
      meta: { accountStatus, note },
    });
  }
  res.json({ student: student.toSafeJSON() });
});

/**
 * What would be deleted for this student — shown in the admin confirmation dialog.
 */
export const studentDeletePreview = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id))
    throw ApiError.badRequest("Invalid student id.");
  const student = await User.findById(req.params.id)
    .select("name email accountStatus role createdAt")
    .lean();
  if (!student) throw ApiError.notFound("Student not found.");
  if (student.role !== "student")
    throw ApiError.badRequest("Only student accounts can be deleted.");
  const summary = await summariseStudentData(student._id);
  res.json({ student, summary });
});

/**
 * Permanently deletes a student and all related data.
 * Requires the literal body `{ confirm: "DELETE" }` so an accidental or replayed
 * request cannot wipe an account.
 */
export const deleteStudent = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id))
    throw ApiError.badRequest("Invalid student id.");
  if (req.body?.confirm !== "DELETE")
    throw ApiError.badRequest("Type DELETE to confirm permanent removal.");

  const student = await User.findById(req.params.id)
    .select("name email role")
    .lean();
  if (!student) throw ApiError.notFound("Student not found.");
  if (student.role !== "student")
    throw ApiError.badRequest("Only student accounts can be deleted.");
  if (String(student._id) === String(req.user._id))
    throw ApiError.badRequest("You cannot delete your own account here.");

  const result = await purgeStudent(student._id);
  if (!result) throw ApiError.notFound("Student not found.");

  // The audit record is written after the purge; the email is masked so the log
  // itself does not become a copy of the deleted personal data.
  await logAudit(req, {
    action: "student.deleted",
    entity: "User",
    entityId: student._id,
    reference: maskEmail(student.email),
    meta: {
      name: student.name,
      ...result.deleted,
      filesRemoved: result.filesRemoved,
    },
  });

  const admins = await User.find({
    role: { $in: ["admin", "owner"] },
    _id: { $ne: req.user._id },
  }).select("_id");
  await Promise.all(
    admins.map((a) =>
      notify({
        recipient: a._id,
        type: "admin_student_deleted",
        title: "Student account deleted",
        body: `${student.name} (${maskEmail(student.email)}) and all related records were permanently removed.`,
        link: "/admin/students",
      }),
    ),
  );

  res.json({
    ok: true,
    deletedStudent: { id: student._id, email: maskEmail(student.email) },
    ...result,
  });
});

export const listStaff = asyncHandler(async (_req, res) => {
  const staff = await User.find({
    role: { $in: ["consultant", "support", "admin", "owner"] },
  })
    .select("name email role accountStatus createdAt")
    .lean();
  const workload = await Order.aggregate([
    {
      $match: {
        status: {
          $in: [
            ORDER_STATUS.CONFIRMED,
            ORDER_STATUS.IN_PROGRESS,
            ORDER_STATUS.AWAITING_INFO,
            ORDER_STATUS.READY_FOR_REVIEW,
            ORDER_STATUS.REVISION_REQUESTED,
          ],
        },
        assignedConsultant: { $ne: null },
      },
    },
    { $group: { _id: "$assignedConsultant", n: { $sum: 1 } } },
  ]);
  const wmap = Object.fromEntries(workload.map((w) => [String(w._id), w.n]));
  res.json({
    staff: staff.map((s) => ({
      ...s,
      activeAssignments: wmap[String(s._id)] || 0,
    })),
  });
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, role, password } = req.body;
  if (!["consultant", "support", "admin"].includes(role))
    throw ApiError.badRequest("Invalid staff role.");
  if (role === "admin" && req.user.role !== "owner")
    throw ApiError.forbidden("Only the owner can create administrators.");
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists)
    throw ApiError.conflict("An account with this email already exists.");
  const staff = await User.create({
    name,
    email,
    role,
    emailVerified: true,
    passwordHash: await User.hashPassword(
      password || Math.random().toString(36).slice(2) + "Aa1!",
    ),
  });
  await logAudit(req, {
    action: "staff.created",
    entity: "User",
    entityId: staff._id,
    reference: staff.email,
    meta: { role },
  });
  res
    .status(201)
    .json({
      staff: staff.toSafeJSON(),
      temporaryPassword: password
        ? undefined
        : "Password not set — user must use password reset.",
    });
});

export const auditLogs = asyncHandler(async (req, res) => {
  const { action, page = 1, limit = 50 } = req.query;
  const filter = action ? { action: { $regex: action, $options: "i" } } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("actor", "name role email")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({
    logs,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  });
});

export const getSettings = asyncHandler(async (_req, res) => {
  let settings = await SystemSettings.findOne({ singleton: "main" });
  if (!settings) settings = await SystemSettings.create({ singleton: "main" });
  res.json({ settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne({ singleton: "main" });
  if (!settings) settings = await SystemSettings.create({ singleton: "main" });
  for (const section of ["business", "defaults", "content", "notifications"]) {
    if (req.body[section])
      settings[section] = {
        ...(settings[section].toObject?.() ?? settings[section]),
        ...req.body[section],
      };
  }
  await settings.save();
  await logAudit(req, {
    action: "settings.updated",
    entity: "SystemSettings",
    entityId: settings._id,
    meta: { sections: Object.keys(req.body) },
  });
  res.json({ settings });
});

export const reports = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = {};
  if (from || to)
    match.createdAt = {
      ...(from && { $gte: new Date(from) }),
      ...(to && { $lte: new Date(to) }),
    };
  const [byService, byStatus, payments, refunds, workload, ticketStats] =
    await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$serviceName",
            orders: { $sum: 1 },
            value: { $sum: "$agreedAmount" },
          },
        },
        { $sort: { orders: -1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: "$status", orders: { $sum: 1 } } },
        { $sort: { orders: -1 } },
      ]),
      Payment.aggregate([
        { $match: { status: "Verified" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$verifiedAt" } },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $unwind: "$refunds" },
        {
          $group: {
            _id: null,
            total: { $sum: "$refunds.amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            assignedConsultant: { $ne: null },
            status: {
              $in: [
                ORDER_STATUS.CONFIRMED,
                ORDER_STATUS.IN_PROGRESS,
                ORDER_STATUS.READY_FOR_REVIEW,
                ORDER_STATUS.REVISION_REQUESTED,
              ],
            },
          },
        },
        { $group: { _id: "$assignedConsultant", active: { $sum: 1 } } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $project: { name: "$user.name", active: 1 } },
      ]),
      SupportTicket.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
  res.json({
    byService,
    byStatus,
    payments,
    refunds: refunds[0] || { total: 0, count: 0 },
    workload,
    ticketStats,
  });
});

export const coupons = asyncHandler(async (_req, res) => {
  const list = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.json({ coupons: list });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: String(req.body.code).toUpperCase(),
  });
  await logAudit(req, {
    action: "coupon.created",
    entity: "Coupon",
    entityId: coupon._id,
    reference: coupon.code,
  });
  res.status(201).json({ coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!coupon) throw ApiError.notFound("Coupon not found.");
  res.json({ coupon });
});

export const calendar = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date();
  const to = req.query.to
    ? new Date(req.query.to)
    : new Date(Date.now() + 30 * 86400000);
  const [orders, bookings] = await Promise.all([
    Order.find({
      deadline: { $gte: from, $lte: to },
      status: {
        $nin: [
          ORDER_STATUS.CANCELLED,
          ORDER_STATUS.REJECTED,
          ORDER_STATUS.COMPLETED,
        ],
      },
    })
      .sort({ deadline: 1 })
      .select("reference title deadline status assignedConsultant serviceName")
      .populate("assignedConsultant", "name")
      .lean(),
    ConsultationBooking.find({
      startsAt: { $gte: from, $lte: to },
      status: { $ne: "Cancelled" },
    })
      .sort({ startsAt: 1 })
      .populate("student", "name")
      .lean(),
  ]);
  res.json({ orders, bookings, from, to });
});
