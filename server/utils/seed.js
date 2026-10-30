/**
 * Seed script.
 *   node utils/seed.js           -> settings, services, staff + one demo student (no transactional data)
 *   node utils/seed.js --demo    -> additionally creates sample orders/quotations/payments for that demo student
 * Safe to re-run: services/settings are upserted, accounts are skipped when they already exist.
 */
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import SystemSettings from "../models/SystemSettings.js";
import Order from "../models/Order.js";
import Quotation from "../models/Quotation.js";
import Payment from "../models/Payment.js";
import { nextReference } from "./reference.js";
import { ALLOWED_MIME, ORDER_STATUS } from "./constants.js";
import {
  CATALOGUE,
  RETIRED_SLUGS,
  ADDITIONAL_CHARGES,
  STARTING_PRICES,
  PRICING_POLICIES,
} from "./catalogue.js";

async function main() {
  const demo = process.argv.includes("--demo");
  await connectDB();

  await SystemSettings.findOneAndUpdate(
    { singleton: "main" },
    {
      singleton: "main",
      business: {
        name: "Acadexa",
        tagline: "Your Academic Journey, Simplified.",
        message:
          "Professional Academic Support. Personalized Guidance. Complete Confidentiality.",
        email: "hello@acadexa.example",
        phone: "+91 98257 51614",
        whatsapp: "+91 98257 51614",
        address: "Ahmedabad, Gujarat, India",
        currency: "INR",
        timezone: "Asia/Kolkata",
      },
      defaults: {
        quotationValidDays: 7,
        revisionLimit: 2,
        maxFileMb: 10,
        allowedFileTypes: ALLOWED_MIME,
        dataRetentionMonths: 24,
        servicesOpen: true,
      },
      pricing: {
        additionalCharges: ADDITIONAL_CHARGES,
        startingPrices: STARTING_PRICES,
        policies: PRICING_POLICIES,
      },
      content: {
        heroHeadline: "Your Academic Work, Made Simpler.",
        heroSubtext:
          "Practical manuals, assignments, project reports, presentations and technical or research support — billed per item, with written quotations, organised tracking and private document handling.",
        announcement: "",
      },
      notifications: {
        emailEnabled: true,
        quotationReminders: true,
        deadlineReminders: true,
      },
      integrations: {
        paymentConfigured: false,
        paymentProvider: "sandbox",
        emailConfigured: false,
        emailProvider: "log",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  console.log("[seed] settings ready");

  let position = 0;
  for (const item of CATALOGUE) {
    position += 1;
    await Service.findOneAndUpdate(
      { slug: item.slug },
      {
        ...item,
        sortOrder: position,
        isActive: true,
        availability: "available",
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
  const retired = await Service.updateMany(
    { slug: { $in: RETIRED_SLUGS } },
    { $set: { isActive: false } },
  );
  console.log(
    `[seed] ${CATALOGUE.length} catalogue services ready${retired.modifiedCount ? `, ${retired.modifiedCount} legacy services unpublished` : ""}`,
  );

  const accounts = [
    // Primary administrator. Set ADMIN_EMAIL / ADMIN_PASSWORD to override at first seed.
    {
      name: "Yug Lakhani",
      email: process.env.ADMIN_EMAIL || "yuglakhani99@gmail.com",
      role: "admin",
      password: process.env.ADMIN_PASSWORD || "#yug7979.",
      phone: "+919876500001",
    },
    {
      name: "Rahul Verma",
      email: "consultant@acadexa.example",
      role: "consultant",
      password: "Consult@12345",
      phone: "+919876500002",
    },
    {
      name: "Neha Joshi",
      email: "support@acadexa.example",
      role: "support",
      password: "Support@12345",
      phone: "+919876500003",
    },
    {
      name: "Aarav Patel",
      email: "student@acadexa.example",
      role: "student",
      password: "Student@12345",
      phone: "+919876543210",
    },
  ];
  // Demo privileged logins are removed if they exist, so only the admin above grants admin access.
  const retiredAccounts = await User.deleteMany({
    email: { $in: ["owner@acadexa.example", "admin@acadexa.example"] },
  });
  if (retiredAccounts.deletedCount)
    console.log(
      `[seed] removed ${retiredAccounts.deletedCount} retired demo admin account(s)`,
    );
  for (const a of accounts) {
    const existing = await User.findOne({ email: a.email });
    if (existing) {
      // Backfill a missing demo mobile number so call-links work in the seeded data.
      if (a.phone && !existing.profile?.phone) {
        existing.profile = {
          ...(existing.profile?.toObject?.() ?? existing.profile ?? {}),
          phone: a.phone,
        };
        await existing.save();
        console.log(`[seed] added mobile number: ${a.email}`);
        continue;
      }
      console.log(`[seed] exists: ${a.email}`);
      continue;
    }
    await User.create({
      name: a.name,
      email: a.email,
      role: a.role,
      emailVerified: true,
      passwordHash: await User.hashPassword(a.password),
      profile: { city: "Ahmedabad", phone: a.phone },
    });
    console.log(`[seed] created ${a.role}: ${a.email} / ${a.password}`);
  }

  if (demo) {
    const student = await User.findOne({ email: "student@acadexa.example" });
    const consultant = await User.findOne({
      email: "consultant@acadexa.example",
    });
    const hasOrders = await Order.countDocuments({ student: student._id });
    if (hasOrders) {
      console.log("[seed] demo orders already present — skipping");
    } else {
      const labManual = await Service.findOne({
        slug: "practical-lab-manual-support",
      });
      const project = await Service.findOne({ slug: "project-documentation" });

      const o1 = await Order.create({
        reference: await nextReference("SD"),
        student: student._id,
        service: labManual._id,
        serviceName: labManual.name,
        title: "Semester 4 Physics lab manual — 10 experiments",
        subjectArea: "Applied Physics",
        instructions:
          "Need procedures, observation tables and calculation sections formatted per the department lab manual template. Readings will be shared as photos.",
        deliverablesRequired: "Formatted DOCX + print-ready PDF",
        deadline: new Date(Date.now() + 6 * 86400000),
        status: ORDER_STATUS.DELIVERED,
        assignedConsultant: consultant._id,
        agreedAmount: 249,
        paymentStatus: "Paid",
        activity: [
          {
            status: ORDER_STATUS.PENDING_REVIEW,
            action: "Request submitted",
            actor: student._id,
            actorRole: "student",
          },
        ],
      });
      const q1 = await Quotation.create({
        reference: await nextReference("QT"),
        order: o1._id,
        student: student._id,
        amount: 249,
        scope:
          "Ten experiments: procedure, observation tables, calculations and result discussion formatted to the department template.",
        deliverables: ["Formatted DOCX", "Print-ready PDF"],
        estimatedDelivery: new Date(Date.now() + 5 * 86400000),
        revisionLimit: 2,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        status: "Accepted",
        acceptedAt: new Date(),
      });
      o1.activeQuotation = q1._id;
      await o1.save();
      const p1 = await Payment.create({
        reference: await nextReference("PAY"),
        order: o1._id,
        quotation: q1._id,
        student: student._id,
        provider: "sandbox",
        providerOrderId: "order_sbx_demo_0001",
        providerPaymentId: "pay_sbx_demo_0001",
        amount: 249,
        status: "Verified",
        verifiedAt: new Date(),
        invoiceNumber: "INV-DEMO0001",
      });

      const o2 = await Order.create({
        reference: await nextReference("SD"),
        student: student._id,
        service: project._id,
        serviceName: project.name,
        title: "Final year project report formatting",
        subjectArea: "Computer Engineering",
        instructions:
          "Draft chapters are ready. Need university-format structuring, figure numbering, references in IEEE style and front matter.",
        deliverablesRequired: "Complete report DOCX",
        deadline: new Date(Date.now() + 12 * 86400000),
        status: ORDER_STATUS.QUOTATION_SENT,
        agreedAmount: 499,
        paymentStatus: "Pending",
        activity: [
          {
            status: ORDER_STATUS.PENDING_REVIEW,
            action: "Request submitted",
            actor: student._id,
            actorRole: "student",
          },
        ],
      });
      const q2 = await Quotation.create({
        reference: await nextReference("QT"),
        order: o2._id,
        student: student._id,
        amount: 499,
        scope:
          "Report structuring, formatting, IEEE reference styling and front matter for a 40-page college project report.",
        deliverables: ["Formatted report DOCX", "Print-ready PDF"],
        estimatedDelivery: new Date(Date.now() + 10 * 86400000),
        revisionLimit: 3,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        status: "Sent",
        sentAt: new Date(),
      });
      o2.activeQuotation = q2._id;
      await o2.save();
      console.log(
        `[seed] demo data: orders ${o1.reference} (paid, delivered), ${o2.reference} (quotation sent), payment ${p1.reference}`,
      );
    }
  }

  await mongoose.disconnect();
  console.log("[seed] done");
}

main().catch(async (err) => {
  console.error("[seed] failed", err);
  await mongoose.disconnect();
  process.exit(1);
});
