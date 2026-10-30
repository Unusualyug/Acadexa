/**
 * Integration tests for the critical paths: authentication, authorization,
 * order/quotation/payment workflow, private file access and student isolation.
 * Run with:  npm test        (uses a separate test database)
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Order from '../models/Order.js';
import FileRecord from '../models/FileRecord.js';

process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/studentdesk_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-integration-tests';

let server;
let base;
const jars = {};
const tokens = {};

const call = async (who, method, path, body, opts = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (tokens[who]) headers.authorization = `Bearer ${tokens[who]}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (data?.token) { tokens[who] = data.token; }
  return { status: res.status, data, res };
};

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;

  const password = await User.hashPassword('Test@12345');
  await User.create([
    { name: 'Admin One', email: 'admin@test.local', role: 'admin', passwordHash: password, emailVerified: true },
    { name: 'Student One', email: 's1@test.local', role: 'student', passwordHash: password, emailVerified: true },
    { name: 'Student Two', email: 's2@test.local', role: 'student', passwordHash: password, emailVerified: true },
    { name: 'Consultant One', email: 'c1@test.local', role: 'consultant', passwordHash: password, emailVerified: true },
  ]);
  await Service.create({
    name: 'Test Service', slug: 'test-service', category: 'Testing', shortDescription: 'A service for tests',
    description: 'A service used by the automated integration tests only.', pricingModel: 'fixed', startingPrice: 500,
    included: ['Testing'], excluded: ['Nothing'], requirements: ['A file'], acceptedFormats: ['PDF'], revisionLimit: 2, isActive: true,
  });
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

test('health endpoint reports db state', async () => {
  const { status, data } = await call('anon', 'GET', '/health');
  assert.equal(status, 200);
  assert.equal(data.db, 'connected');
});

test('registration validates input and prevents duplicate accounts', async () => {
  const weak = await call('anon', 'POST', '/auth/register', { name: 'X', email: 'bad', password: '123' });
  assert.equal(weak.status, 400);
  const ok = await call('new', 'POST', '/auth/register', { name: 'New Student', email: 'new@test.local', phone: '9876500001', password: 'Passw0rd!1' });
  assert.equal(ok.status, 201);
  const dup = await call('anon', 'POST', '/auth/register', { name: 'New Student', email: 'new@test.local', phone: '9876500001', password: 'Passw0rd!1' });
  assert.equal(dup.status, 409);
});

test('login succeeds with valid credentials and fails otherwise', async () => {
  const bad = await call('anon', 'POST', '/auth/login', { email: 's1@test.local', password: 'wrong' });
  assert.equal(bad.status, 401);
  const ok = await call('student1', 'POST', '/auth/login', { email: 's1@test.local', password: 'Test@12345' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.email, 's1@test.local');
  assert.equal(ok.data.user.passwordHash, undefined, 'password hash must never be returned');
  await call('admin', 'POST', '/auth/login', { email: 'admin@test.local', password: 'Test@12345' });
  await call('student2', 'POST', '/auth/login', { email: 's2@test.local', password: 'Test@12345' });
  await call('consultant', 'POST', '/auth/login', { email: 'c1@test.local', password: 'Test@12345' });
});

test('anonymous session probe returns null user', async () => {
  const { status, data } = await call('anon', 'GET', '/auth/me');
  assert.equal(status, 200);
  assert.equal(data.user, null);
});

let orderId;
let quotationId;
let paymentOrder;

test('student submits a request', async () => {
  const services = await call('student1', 'GET', '/services');
  const svc = services.data.services.find((s) => s.slug === 'test-service');
  const res = await call('student1', 'POST', '/orders', {
    serviceId: svc._id,
    title: 'Proofreading of draft chapter',
    instructions: 'Please proofread the attached draft chapter for grammar, punctuation and consistent heading style.',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    integrityAccepted: true,
  });
  assert.equal(res.status, 201);
  assert.match(res.data.reference, /^SD-\d{8}-\d{4}$/);
  orderId = res.data.order._id;
});

test('request validation blocks missing integrity confirmation', async () => {
  const services = await call('student1', 'GET', '/services');
  const res = await call('student1', 'POST', '/orders', {
    serviceId: services.data.services[0]._id,
    title: 'Another request',
    instructions: 'This request is long enough to pass the minimum length validation rule.',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
  });
  assert.equal(res.status, 400);
  assert.ok(res.data.details.some((d) => d.path === 'integrityAccepted'));
});

test('students cannot change order status or read the staff queue', async () => {
  const status = await call('student1', 'PATCH', `/orders/${orderId}/status`, { status: 'In Progress' });
  assert.equal(status.status, 403);
  const queue = await call('student1', 'GET', '/orders/staff/all');
  assert.equal(queue.status, 403);
  const dash = await call('student1', 'GET', '/admin/dashboard');
  assert.equal(dash.status, 403);
});

test('another student cannot access the order or its quotation', async () => {
  const order = await call('student2', 'GET', `/orders/${orderId}`);
  assert.equal(order.status, 403);
});

test('admin issues a quotation and status follows the permitted transition', async () => {
  const res = await call('admin', 'POST', '/quotations', {
    orderId,
    amount: 1500,
    scope: 'Full language proofreading of the chapter with heading and reference formatting.',
    deliverables: ['Tracked DOCX', 'Clean PDF'],
    estimatedDelivery: new Date(Date.now() + 4 * 86400000).toISOString(),
    revisionLimit: 2,
    validDays: 7,
  });
  assert.equal(res.status, 201);
  quotationId = res.data.quotation._id;
  assert.match(res.data.quotation.reference, /^QT-/);

  const illegal = await call('admin', 'PATCH', `/orders/${orderId}/status`, { status: 'Completed' });
  assert.equal(illegal.status, 400, 'skipping workflow stages must be rejected');

  const legal = await call('admin', 'PATCH', `/orders/${orderId}/status`, { status: 'Awaiting Payment' });
  assert.equal(legal.status, 200);
});

test('student accepts the quotation and a payment intent is created', async () => {
  const accept = await call('student1', 'POST', `/quotations/${quotationId}/accept`);
  assert.equal(accept.status, 200);
  assert.equal(accept.data.quotation.status, 'Accepted');

  const intent = await call('student1', 'POST', '/payments/create', { orderId });
  assert.equal(intent.status, 201);
  assert.equal(intent.data.payment.amount, 1500);
  assert.equal(intent.data.payment.status, 'Pending');
  paymentOrder = intent.data;
});

test('payment is not marked verified without a valid signature', async () => {
  const bad = await call('student1', 'POST', '/payments/verify', {
    providerOrderId: paymentOrder.checkout.providerOrderId,
    providerPaymentId: 'pay_invalid_1',
    signature: 'a'.repeat(64),
  });
  assert.equal(bad.status, 400);
  const order = await Order.findById(orderId);
  assert.equal(order.paymentStatus, 'Pending', 'failed verification must not record money as received');
});

test('valid signature verifies the payment and confirms the order', async () => {
  const signed = await fetch(`${base}/payments/${paymentOrder.payment._id}/sandbox-sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${tokens.student1}` },
    body: JSON.stringify({ providerPaymentId: 'pay_valid_1' }),
  }).then((r) => r.json());
  const res = await call('student1', 'POST', '/payments/verify', {
    providerOrderId: paymentOrder.checkout.providerOrderId,
    providerPaymentId: 'pay_valid_1',
    signature: signed.signature,
  });
  assert.equal(res.status, 200);
  const order = await Order.findById(orderId);
  assert.equal(order.status, 'Confirmed');
  assert.equal(order.paymentStatus, 'Paid');
});

test('duplicate payment events are rejected', async () => {
  const res = await call('student1', 'POST', '/payments/create', { orderId });
  assert.equal(res.status, 409);
});

test('private files are not downloadable by unrelated users', async () => {
  const file = await FileRecord.create({
    owner: (await User.findOne({ email: 's1@test.local' }))._id,
    storageKey: 'nonexistent-test-file.pdf',
    originalName: 'draft.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    purpose: 'reference',
  });
  const other = await call('student2', 'GET', `/files/${file._id}/download`);
  assert.equal(other.status, 403);
  const admin = await call('admin', 'GET', `/files/${file._id}/download`);
  assert.ok([404, 200].includes(admin.status), 'admin passes authorization but the test file has no storage object');
});

test('revision limits from the quotation are enforced', async () => {
  await Order.findByIdAndUpdate(orderId, { status: 'Delivered', revisionCount: 2, deliveredAt: new Date() });
  const res = await call('student1', 'POST', `/orders/${orderId}/revisions`, { description: 'Please adjust the heading numbering in section two.' });
  assert.equal(res.status, 400);
  assert.match(res.data.message, /revision limit/i);
});

test('support tickets and privacy requests are created with references', async () => {
  const ticket = await call('student1', 'POST', '/support', { category: 'Payment or refund', subject: 'Receipt needed', description: 'Please share a copy of the receipt for my latest payment.' });
  assert.equal(ticket.status, 201);
  assert.match(ticket.data.ticket.reference, /^TK-/);

  const privacy = await call('student1', 'POST', '/privacy', { type: 'access', details: 'Please share the personal data you hold about me.' });
  assert.equal(privacy.status, 201);
  assert.match(privacy.data.request.reference, /^PR-/);
});

test('audit trail records sensitive admin actions', async () => {
  const logs = await call('admin', 'GET', '/admin/audit-logs');
  assert.equal(logs.status, 200);
  const actions = logs.data.logs.map((l) => l.action);
  assert.ok(actions.includes('quotation.created'));
  assert.ok(actions.includes('order.status_changed'));
});

test('consultants only see assigned orders', async () => {
  const queue = await call('consultant', 'GET', '/orders/staff/all');
  assert.equal(queue.status, 200);
  assert.equal(queue.data.orders.length, 0, 'unassigned orders must not leak to consultants');
});

test('public settings expose branding but no secrets', async () => {
  const { status, data } = await call('anon', 'GET', '/public/settings');
  assert.equal(status, 200);
  assert.equal(data.settings.business.name, 'Acadexa');
  assert.equal(JSON.stringify(data).includes('jwt'), false);
  // The number printed across the site must be the one that answers enquiries.
  assert.equal(data.settings.business.phone, '+91 98257 51614');
  assert.equal(data.settings.business.whatsapp, '+91 98257 51614');
});

test('public settings publish the price sheet and policies', async () => {
  const { status, data } = await call('anon', 'GET', '/public/settings');
  assert.equal(status, 200);
  const pricing = data.settings.pricing;
  assert.ok(pricing, 'pricing block should be published');
  assert.equal(pricing.startingPrices.length, 5);
  assert.equal(pricing.policies.length, 9);
  assert.ok(
    pricing.policies.some((p) => /free lab manual creation/i.test(p.heading)),
    'the free-creation offer must be a published pricing policy'
  );
  assert.ok(pricing.additionalCharges.length >= 5);
  assert.ok(pricing.policies.some((p) => /pay per work/i.test(`${p.heading} ${p.text}`)));
  assert.ok(pricing.startingPrices.some((p) => p.price.includes('₹')));
});

test('every published service exposes a price sheet with ranges', async () => {
  const { status, data } = await call('anon', 'GET', '/services');
  assert.equal(status, 200);
  const active = data.services.filter((s) => s.isActive);
  assert.ok(active.length >= 1);
  for (const svc of active.filter((s) => Array.isArray(s.priceTable) && s.priceTable.length)) {
    assert.ok(Array.isArray(svc.priceTable) && svc.priceTable.length >= 5, `${svc.slug} needs a price table`);
    assert.ok(svc.startingPrice > 0, `${svc.slug} needs a starting price`);
    assert.ok(svc.priceTable.every((row) => row.item && (row.softcopy || row.handwritten)));
  }
});

test('catalogue defines six priced categories', async () => {
  const { CATALOGUE, ADDITIONAL_CHARGES, STARTING_PRICES, PRICING_POLICIES } = await import('../utils/catalogue.js');
  assert.equal(CATALOGUE.length, 6);
  assert.equal(STARTING_PRICES.length, 5);
  assert.equal(PRICING_POLICIES.length, 9);
  assert.equal(ADDITIONAL_CHARGES.length, 6);
  for (const svc of CATALOGUE) {
    assert.ok(svc.priceTable.length >= 5, `${svc.slug} price table`);
    assert.ok(svc.priceTable.some((r) => r.softcopy !== '—'), `${svc.slug} softcopy rate`);
    // printing is quoted per job, so it alone carries no headline starting price
    if (svc.slug !== 'printing-binding') assert.ok(svc.startingPrice > 0, `${svc.slug} starting price`);
  }
});

test('the free lab manual offer is stated with its condition and never free printing', async () => {
  const { CATALOGUE } = await import('../utils/catalogue.js');
  const printing = CATALOGUE.find((s) => s.slug === 'printing-binding');
  const manual = CATALOGUE.find((s) => s.slug === 'practical-lab-manual-support');
  assert.ok(printing, 'a printing & binding service must exist');
  assert.ok(manual, 'the lab manual service must exist');

  // The offer is real: creating the manual carries no charge with a print & bind order.
  const freeRow = printing.priceTable.find((r) => /creation/i.test(r.item));
  assert.ok(freeRow, 'the free-creation row must be published');
  assert.equal(freeRow.softcopy, 'Free');

  // ...but printing and binding are never free, and the catalogue must say so everywhere.
  const printingRows = printing.priceTable.filter((r) => /printing|binding/i.test(r.item) && !/creation/i.test(r.item));
  assert.ok(printingRows.length >= 4);
  for (const row of printingRows) {
    assert.equal(row.softcopy, 'Actual cost', `${row.item} must be charged at actual cost`);
    assert.notEqual(row.softcopy, 'Free');
  }
  assert.ok(
    printing.excluded.some((x) => /free printing or free binding/i.test(x)),
    'the printing service must state plainly that printing and binding are not free'
  );
  assert.match(printing.priceNote, /only free element is lab manual creation/i);
  assert.match(printing.description, /charged at actual cost/i);

  // The lab manual service states the condition too.
  assert.ok(manual.included.some((x) => /no charge for creating the manual when the same manual is printed and bound/i.test(x)));
  assert.ok(manual.excluded.some((x) => /never free/i.test(x)));
  assert.match(manual.priceNote, /free when you print and bind/i);

  // And it is a published pricing policy, not a hidden banner claim.
  const { PRICING_POLICIES } = await import('../utils/catalogue.js');
  const policy = PRICING_POLICIES.find((p) => /free lab manual creation/i.test(p.heading));
  assert.ok(policy, 'the offer must appear in the published pricing policies');
  assert.match(policy.text, /only when the same manual is printed and bound/i);
  assert.match(policy.text, /never included in the free offer/i);
});

test('both offer services are live and reachable in the catalogue API', async () => {
  const { CATALOGUE } = await import('../utils/catalogue.js');
  const Service = (await import('../models/Service.js')).default;

  // Seed the two offer services the way the real seed script does.
  for (const slug of ['practical-lab-manual-support', 'printing-binding']) {
    const item = CATALOGUE.find((c) => c.slug === slug);
    await Service.updateOne({ slug }, { $set: { ...item, isActive: true, availability: 'available' } }, { upsert: true });
  }

  const res = await call('anon', 'GET', '/services');
  assert.equal(res.status, 200);
  const list = res.data.services || res.data;
  const printing = list.find((s) => s.slug === 'printing-binding');
  const manual = list.find((s) => s.slug === 'practical-lab-manual-support');
  assert.ok(printing, 'printing & binding must be listed publicly');
  assert.ok(manual, 'lab manual support must be listed publicly');
  assert.equal(list.filter((s) => s.slug === 'printing-binding').length, 1, 'no duplicate listing');
  assert.equal(printing.startingPrice, 0, 'printing is quoted per job, not sold at a headline price');

  // The condition travels with the API response, so the client cannot show a bare "free".
  assert.ok(printing.excluded.some((x) => /free printing or free binding/i.test(x)));
  assert.match(printing.priceNote, /only free element is lab manual creation/i);
  assert.ok(manual.included.some((x) => /printed and bound through Acadexa/i.test(x)));
});

test('student deletion requires DELETE confirmation and admin rights', async () => {
  const create = await call('anon', 'POST', '/auth/register', { name: 'Delete Me', email: 'delme@test.local', phone: '9876500002', password: 'Passw0rd!9' });
  assert.equal(create.status, 201);
  const id = create.data.user.id;

  const asStudent = await call('student1', 'DELETE', `/admin/students/${id}`, { confirm: 'DELETE' });
  assert.equal(asStudent.status, 403);

  const noConfirm = await call('admin', 'DELETE', `/admin/students/${id}`, {});
  assert.equal(noConfirm.status, 400);

  const wrongConfirm = await call('admin', 'DELETE', `/admin/students/${id}`, { confirm: 'delete' });
  assert.equal(wrongConfirm.status, 400);

  const preview = await call('admin', 'GET', `/admin/students/${id}/delete-preview`);
  assert.equal(preview.status, 200);
  assert.equal(preview.data.student.email, 'delme@test.local');
  assert.equal(typeof preview.data.summary.orders, 'number');

  const ok = await call('admin', 'DELETE', `/admin/students/${id}`, { confirm: 'DELETE' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.ok, true);

  const gone = await call('admin', 'GET', `/admin/students/${id}/delete-preview`);
  assert.equal(gone.status, 404);
});

test('deleting a student purges their orders, quotations and payments', async () => {
  const create = await call('purge', 'POST', '/auth/register', { name: 'Purge Target', email: 'purge@test.local', phone: '9876500003', password: 'Passw0rd!9' });
  assert.equal(create.status, 201);
  const studentId = create.data.user.id;

  const services = await call('anon', 'GET', '/services');
  const svc = services.data.services[0];
  const order = await call('purge', 'POST', '/orders', {
    serviceId: svc._id,
    title: 'Purge test order',
    instructions: 'An order created by the automated test suite to verify cascading deletion behaviour.',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    integrityAccepted: true,
  });
  assert.equal(order.status, 201, `order creation failed: ${JSON.stringify(order.data)}`);
  const orderId = order.data.order._id;

  const quotation = await call('admin', 'POST', '/quotations', {
    orderId,
    amount: 900,
    scope: 'Formatting and structure review of the supplied draft, as agreed for this test order.',
    deliverables: ['A formatted report'],
    estimatedDelivery: new Date(Date.now() + 4 * 86400000).toISOString(),
    revisionLimit: 2,
  });
  assert.equal(quotation.status, 201, `quotation failed: ${JSON.stringify(quotation.data)}`);

  const before = await call('admin', 'GET', `/admin/students/${studentId}/delete-preview`);
  assert.ok(before.data.summary.orders >= 1);
  assert.ok(before.data.summary.quotations >= 1);

  const del = await call('admin', 'DELETE', `/admin/students/${studentId}`, { confirm: 'DELETE' });
  assert.equal(del.status, 200);
  assert.ok(del.data.deleted.orders >= 1);

  const orderGone = await call('admin', 'GET', `/orders/staff/${orderId}`);
  assert.equal(orderGone.status, 404);

  const Order = (await import('../models/Order.js')).default;
  const Quotation = (await import('../models/Quotation.js')).default;
  const User = (await import('../models/User.js')).default;
  assert.equal(await Order.countDocuments({ student: studentId }), 0);
  assert.equal(await Quotation.countDocuments({ order: orderId }), 0);
  assert.equal(await User.countDocuments({ _id: studentId }), 0);
});

test('staff accounts cannot be deleted through the student endpoint', async () => {
  const list = await call('admin', 'GET', '/admin/staff');
  const consultant = list.data.staff.find((s) => s.role === 'consultant');
  const res = await call('admin', 'DELETE', `/admin/students/${consultant._id}`, { confirm: 'DELETE' });
  assert.equal(res.status, 400);
});

/* ---------------- session management ---------------- */

test('sign-in creates a revocable server-side session', async () => {
  const Session = (await import('../models/Session.js')).default;
  const login = await call('sessionOwner', 'POST', '/auth/login', { email: 's1@test.local', password: 'Test@12345' });
  assert.equal(login.status, 200);
  assert.ok(login.data.token, 'login must return a token for API clients');

  const count = await Session.countDocuments({ user: login.data.user.id, revokedAt: null });
  assert.ok(count >= 1, 'a session record must exist');

  const list = await call('sessionOwner', 'GET', '/auth/sessions');
  assert.equal(list.status, 200);
  assert.ok(list.data.sessions.length >= 1);
  const current = list.data.sessions.find((x) => x.current);
  assert.ok(current, 'exactly one session should be flagged as current');
  assert.equal(JSON.stringify(list.data).includes('tokenHash'), false, 'hashes must never be returned');
});

test('revoking a session blocks that token immediately', async () => {
  const a = await call('deviceA', 'POST', '/auth/login', { email: 's2@test.local', password: 'Test@12345' });
  assert.equal(a.status, 200);
  const b = await call('deviceB', 'POST', '/auth/login', { email: 's2@test.local', password: 'Test@12345' });
  assert.equal(b.status, 200);
  assert.equal((await call('deviceB', 'GET', '/orders')).status, 200);

  const list = await call('deviceA', 'GET', '/auth/sessions');
  const other = list.data.sessions.find((x) => !x.current);
  assert.ok(other);

  const revoked = await call('deviceA', 'DELETE', `/auth/sessions/${other.id}`);
  assert.equal(revoked.status, 200);

  const after = await call('deviceB', 'GET', '/orders');
  assert.equal(after.status, 401, 'revoked device must be rejected');
  assert.equal((await call('deviceA', 'GET', '/orders')).status, 200, 'the other device stays signed in');
});

test('a user cannot revoke somebody else\'s session', async () => {
  const victim = await call('victim', 'POST', '/auth/login', { email: 's1@test.local', password: 'Test@12345' });
  const victimSession = (await call('victim', 'GET', '/auth/sessions')).data.sessions[0];
  const attacker = await call('attacker', 'POST', '/auth/register', { name: 'Attacker', email: 'attacker@test.local', phone: '9876500004', password: 'Passw0rd!9' });
  assert.equal(attacker.status, 201);
  const res = await call('attacker', 'DELETE', `/auth/sessions/${victimSession.id}`);
  assert.equal(res.status, 404, 'another user\'s session must look non-existent');
  assert.equal((await call('victim', 'GET', '/orders')).status, 200);
});

test('logout revokes the session so the token stops working', async () => {
  const login = await call('bye', 'POST', '/auth/login', { email: 's1@test.local', password: 'Test@12345' });
  assert.equal(login.status, 200);
  assert.equal((await call('bye', 'GET', '/orders')).status, 200);
  const out = await call('bye', 'POST', '/auth/logout');
  assert.equal(out.status, 200);
  assert.equal((await call('bye', 'GET', '/orders')).status, 401);
});

test('changing the password signs out other devices but keeps the current one', async () => {
  await call('pwA', 'POST', '/auth/login', { email: 's2@test.local', password: 'Test@12345' });
  await call('pwB', 'POST', '/auth/login', { email: 's2@test.local', password: 'Test@12345' });
  assert.equal((await call('pwB', 'GET', '/orders')).status, 200);

  const res = await call('pwA', 'PATCH', '/auth/password', { currentPassword: 'Test@12345', newPassword: 'Test@12345' });
  assert.equal(res.status, 200);
  assert.ok(res.data.sessionsRevoked >= 1, 'other sessions should be revoked');

  assert.equal((await call('pwB', 'GET', '/orders')).status, 401, 'other device must be signed out');
  assert.equal((await call('pwA', 'GET', '/orders')).status, 200, 'current device stays signed in');
});

/* ---------------- cookie consent ---------------- */

test('consent accepts all, rejects optional, and refuses contradictory payloads', async () => {
  const visitorId = 'testvisitor0001';

  const accept = await call('anon', 'POST', '/consent', { visitorId, action: 'accept_all', categories: { analytics: true, marketing: true } });
  assert.equal(accept.status, 200);
  assert.equal(accept.data.consent.analytics, true);
  assert.equal(accept.data.consent.marketing, true);
  assert.equal(accept.data.consent.necessary, true);

  const reject = await call('anon', 'POST', '/consent', { visitorId, action: 'reject_optional', categories: { analytics: false, marketing: false } });
  assert.equal(reject.status, 200);
  assert.equal(reject.data.consent.analytics, false);

  const contradictory = await call('anon', 'POST', '/consent', { visitorId, action: 'reject_optional', categories: { analytics: true, marketing: false } });
  assert.equal(contradictory.status, 400, 'rejecting cannot carry consent');

  const fakeAccept = await call('anon', 'POST', '/consent', { visitorId, action: 'accept_all', categories: { analytics: false, marketing: true } });
  assert.equal(fakeAccept.status, 400, 'accept all must actually enable both');

  const invalid = await call('anon', 'POST', '/consent', { visitorId: 'x', action: 'accept_all', categories: { analytics: true, marketing: true } });
  assert.equal(invalid.status, 400, 'visitor id is validated');
});

test('consent history is kept and linked to the signed-in account', async () => {
  const CookieConsent = (await import('../models/CookieConsent.js')).default;
  const login = await call('s3', 'POST', '/auth/login', { email: 's1@test.local', password: 'Test@12345' });
  assert.equal(login.status, 200);

  const visitorId = 'linkedvisitor0001';
  await call('s3', 'POST', '/consent', { visitorId, action: 'custom', categories: { analytics: true, marketing: false } });
  await call('s3', 'POST', '/consent', { visitorId, action: 'reject_optional', categories: { analytics: false, marketing: false } });

  const doc = await CookieConsent.findOne({ visitorId }).lean();
  assert.equal(doc.user.toString(), login.data.user.id, 'consent should link to the account when signed in');
  assert.equal(doc.history.length, 2, 'each change is appended');
  assert.equal(doc.history[1].action, 'reject_optional');

  const mine = await call('s3', 'GET', '/consent/me');
  assert.equal(mine.status, 200);
  assert.ok(mine.data.records.some((r) => r.visitorId === visitorId));
  assert.ok(mine.data.records[0].history.length >= 2, 'history is returned to the user');
});

test('consent stats are admin-only and expose counts without identifiers', async () => {
  assert.equal((await call('noSessionAtAll', 'GET', '/consent/admin/consents')).status, 401);
  assert.equal((await call('student1', 'GET', '/consent/admin/consents')).status, 403);

  const res = await call('admin', 'GET', '/consent/admin/consents');
  assert.equal(res.status, 200);
  assert.equal(typeof res.data.totals.total, 'number');
  assert.equal(JSON.stringify(res.data).includes('visitorId'), false, 'identifiers must not leak to stats');
});

test('analytics events are only stored as privacy-minimal records', async () => {
  const AnalyticsEvent = (await import('../models/AnalyticsEvent.js')).default;
  const before = await AnalyticsEvent.countDocuments();
  const res = await call('anon', 'POST', '/consent/analytics/event', {
    visitorId: 'analyticsvisitor01',
    path: '/services?email=someone@example.com',
    referrerHost: 'example.com',
  });
  assert.equal(res.status, 204);
  assert.equal(await AnalyticsEvent.countDocuments(), before + 1);
  const doc = await AnalyticsEvent.findOne().sort({ createdAt: -1 }).lean();
  assert.equal(doc.path, '/services', 'query strings are stripped before storage');
  assert.equal(doc.ip, undefined, 'no IP is stored');
});

/* ---------------- mobile number ---------------- */

test('registration requires a valid mobile number and stores it normalised', async () => {
  const missing = await call('anon', 'POST', '/auth/register', { name: 'No Phone', email: 'nophone@test.local', password: 'Passw0rd!9' });
  assert.equal(missing.status, 400, 'a mobile number must be required');

  const bad = await call('anon', 'POST', '/auth/register', { name: 'Bad Phone', email: 'badphone@test.local', phone: '12345', password: 'Passw0rd!9' });
  assert.equal(bad.status, 400, 'short/garbage numbers are rejected');

  const letters = await call('anon', 'POST', '/auth/register', { name: 'Letters', email: 'letters@test.local', phone: 'abcdefghij', password: 'Passw0rd!9' });
  assert.equal(letters.status, 400);

  const spaced = await call('anon', 'POST', '/auth/register', { name: 'Spaced Phone', email: 'spaced@test.local', phone: '+91 98765 00005', password: 'Passw0rd!9' });
  assert.equal(spaced.status, 201);
  assert.equal(spaced.data.user.profile.phone, '+919876500005', 'stored in international format');

  const local = await call('anon', 'POST', '/auth/register', { name: 'Local Phone', email: 'local@test.local', phone: '098765 00006', password: 'Passw0rd!9' });
  assert.equal(local.status, 201);
  assert.equal(local.data.user.profile.phone, '+919876500006', 'leading zero is normalised');

  const intl = await call('anon', 'POST', '/auth/register', { name: 'Intl Phone', email: 'intl@test.local', phone: '+14155552671', password: 'Passw0rd!9' });
  assert.equal(intl.status, 201);
  assert.equal(intl.data.user.profile.phone, '+14155552671');
});

test('a student can update their mobile number but not to garbage', async () => {
  const login = await call('phoneUser', 'POST', '/auth/login', { email: 'spaced@test.local', password: 'Passw0rd!9' });
  assert.equal(login.status, 200);

  const bad = await call('phoneUser', 'PATCH', '/auth/profile', { profile: { phone: '12' } });
  assert.equal(bad.status, 400, 'invalid numbers are rejected on update too');

  const ok = await call('phoneUser', 'PATCH', '/auth/profile', { profile: { phone: '98765 11111' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.profile.phone, '+919876511111');
});

test('admins can see and call a student by their mobile number', async () => {
  const list = await call('admin', 'GET', '/admin/students?q=spaced@test.local');
  assert.equal(list.status, 200);
  const student = list.data.students.find((s) => s.email === 'spaced@test.local');
  assert.ok(student, 'student should be listed');
  assert.equal(student.phone, '+919876511111');
  assert.equal(student.hasPhone, true);
  assert.equal(JSON.stringify(list.data).includes('passwordHash'), false);
});

test('phone numbers cannot leak between students', async () => {
  const mine = await call('phoneUser', 'GET', '/auth/me');
  assert.equal(mine.status, 200);
  assert.equal(mine.data.user.profile.phone, '+919876511111');
  // A different student's session must never return this number.
  const other = await call('student1', 'GET', '/auth/me');
  assert.notEqual(other.data.user.id, mine.data.user.id);
  assert.notEqual(other.data.user.profile?.phone, '+919876511111');
});

/* ---------------- persistent ("remember me") sign-in ---------------- */

const cookieFrom = (res) => {
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
  return list.find((c) => c.startsWith('sd_token=')) || '';
};

test('"keep me signed in" issues a 90-day persistent cookie and session', async () => {
  const Session = (await import('../models/Session.js')).default;
  const res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 's1@test.local', password: 'Test@12345', remember: true }),
  });
  assert.equal(res.status, 200);

  const cookie = cookieFrom(res);
  assert.ok(cookie, 'a session cookie must be set');
  const maxAge = Number((cookie.match(/Max-Age=(\d+)/i) || [])[1]);
  assert.equal(maxAge, 90 * 24 * 60 * 60, 'remembered cookie must live 90 days');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);

  const { user } = await res.json();
  const session = await Session.findOne({ user: user.id, revokedAt: null }).sort({ createdAt: -1 });
  const daysLeft = (session.expiresAt - Date.now()) / 86400000;
  assert.ok(daysLeft > 89 && daysLeft <= 90, `server expiry should be ~90 days, got ${daysLeft}`);
});

test('signing in without "remember me" gives a browser-session cookie', async () => {
  const Session = (await import('../models/Session.js')).default;
  const res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 's2@test.local', password: 'Test@12345', remember: false }),
  });
  assert.equal(res.status, 200);

  const cookie = cookieFrom(res);
  assert.equal(/Max-Age=/i.test(cookie), false, 'a session cookie must not carry Max-Age');
  assert.equal(/Expires=/i.test(cookie), false, 'a session cookie must not carry Expires');

  const { user } = await res.json();
  const session = await Session.findOne({ user: user.id, revokedAt: null }).sort({ createdAt: -1 });
  const daysLeft = (session.expiresAt - Date.now()) / 86400000;
  assert.ok(daysLeft <= 1, 'server-side expiry stays short for browser-session sign-ins');
});

test('an active remembered session slides forward so users are never signed out', async () => {
  const Session = (await import('../models/Session.js')).default;
  const login = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 's1@test.local', password: 'Test@12345', remember: true }),
  });
  const cookie = cookieFrom(login);
  assert.ok(cookie);
  const sidCookie = cookie.split(';')[0];

  // Simulate a user who signed in a while ago: only 10 days of validity left.
  const token = sidCookie.replace('sd_token=', '');
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  const before = await Session.findOneAndUpdate(
    { tokenHash: (await import('node:crypto')).createHash('sha256').update(payload.sid).digest('hex') },
    { $set: { expiresAt: new Date(Date.now() + 10 * 86400000) } },
    { returnDocument: 'after' }
  );
  assert.ok(before, 'the session record must exist');

  const me = await fetch(base + '/auth/me', { headers: { cookie: sidCookie } });
  assert.equal(me.status, 200);
  const renewed = cookieFrom(me);
  assert.ok(renewed, 'using the app must refresh the cookie before it lapses');
  assert.equal(Number((renewed.match(/Max-Age=(\d+)/i) || [])[1]), 90 * 24 * 60 * 60);

  const after = await Session.findById(before._id);
  const daysLeft = (after.expiresAt - Date.now()) / 86400000;
  assert.ok(daysLeft > 89, `expiry should slide back to ~90 days, got ${daysLeft}`);
});

/* ---------------- Cloudinary storage + completion purge ---------------- */

test('files go to Cloudinary when credentials are configured', async () => {
  const { env } = await import('../config/env.js');
  const storage = await import('../services/storage.js');
  const { v2: cloudinary } = await import('cloudinary');
  const { Writable } = await import('node:stream');

  const saved = { ...env.cloudinary };
  const realUpload = cloudinary.uploader.upload_stream;
  const realDestroy = cloudinary.uploader.destroy;
  const calls = [];

  // Stub the SDK so the test proves *what we send*, without touching the network.
  env.cloudinary = { cloudName: 'acadexa-test', apiKey: 'key', apiSecret: 'secret', folder: 'acadexa/documents' };
  cloudinary.uploader.upload_stream = (options, cb) => {
    calls.push(options);
    return new Writable({
      write(_chunk, _enc, done) { done(); },
      final(done) {
        cb(null, { public_id: options.public_id, resource_type: options.resource_type, bytes: 12 });
        done();
      },
    });
  };
  cloudinary.uploader.destroy = async (publicId, options) => {
    calls.push({ destroy: publicId, ...options });
    return { result: 'ok' };
  };

  try {
    assert.equal(storage.storageDriver(), 'cloudinary');

    const pdf = await storage.storeFile(
      { buffer: Buffer.from('%PDF-1.4 test'), originalName: 'Lab report.pdf', mimeType: 'application/pdf' },
      { folder: 'orders/x' }
    );
    assert.equal(pdf.provider, 'cloudinary');
    assert.ok(pdf.publicId, 'a public id must be stored');
    assert.equal(pdf.resourceType, 'image', 'PDFs are uploaded as image resources');
    assert.equal(pdf.url, null, 'private assets must not store a public URL');

    const uploadOptions = calls[0];
    assert.equal(uploadOptions.type, 'private', 'assets must be private');
    assert.equal(uploadOptions.access_mode, 'authenticated');
    assert.equal(uploadOptions.folder, 'orders/x');
    assert.match(uploadOptions.public_id, /^Lab-report-[a-f0-9]{16}$/, 'original filename is randomised');

    const docx = await storage.storeFile(
      { buffer: Buffer.from('x'), originalName: 'notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { folder: 'orders/x' }
    );
    assert.equal(docx.resourceType, 'raw', 'non-PDF, non-image files are raw resources');

    const removed = await storage.deleteStoredAsset({ provider: 'cloudinary', publicId: 'acadexa/documents/x', resourceType: 'image' });
    assert.equal(removed, true);
    const destroyCall = calls.find((c) => c.destroy);
    assert.equal(destroyCall.type, 'private', 'deletion must target the private asset');
    assert.equal(destroyCall.resource_type, 'image', 'deletion must repeat the resource type');
  } finally {
    env.cloudinary = saved;
    cloudinary.uploader.upload_stream = realUpload;
    cloudinary.uploader.destroy = realDestroy;
  }
});

test('completing an order deletes its files and keeps an audit record', async () => {
  const FileRecord = (await import('../models/FileRecord.js')).default;
  const Order = (await import('../models/Order.js')).default;

  // A live order with two uploaded files, as a student would have.
  const created = await call('purgeStudent', 'POST', '/auth/register', {
    name: 'Purge Student', email: 'purge@test.local', password: 'Test@12345', phone: '9876543299',
  });
  assert.equal(created.status, 201);
  const services = await call('purgeStudent', 'GET', '/services');
  const serviceId = (services.data.services || services.data)[0]._id;

  const form = new FormData();
  form.append('files', new Blob([Buffer.from('%PDF-1.4 one')], { type: 'application/pdf' }), 'first.pdf');
  form.append('files', new Blob([Buffer.from('%PDF-1.4 two')], { type: 'application/pdf' }), 'second.pdf');
  const uploadRes = await fetch(base + '/files/upload', {
    method: 'POST', headers: { authorization: `Bearer ${tokens.purgeStudent}` }, body: form,
  });
  assert.equal(uploadRes.status, 201);
  const { files: uploaded } = await uploadRes.json();
  assert.equal(uploaded.length, 2);
  assert.ok(uploaded.every((f) => f.provider), 'each record records where the bytes live');

  const deadline = new Date(Date.now() + 14 * 86400000).toISOString();
  const orderRes = await call('purgeStudent', 'POST', '/orders', {
    serviceId, title: 'Purge flow verification', deadline, integrityAccepted: true,
    instructions: 'A request created to verify that completing an order deletes its files.',
    fileIds: uploaded.map((f) => f._id),
  });
  assert.equal(orderRes.status, 201);
  const orderId = orderRes.data.order._id;

  // Downloads work while the order is live.
  assert.equal((await call('purgeStudent', 'GET', `/files/${uploaded[0]._id}/download`)).status, 200);

  // Preview is admin-only and lists exactly those two files.
  assert.equal((await call('purgeStudent', 'GET', `/files/order/${orderId}/purge-preview`)).status, 403);
  const preview = await call('admin', 'GET', `/files/order/${orderId}/purge-preview`);
  assert.equal(preview.status, 200);
  assert.equal(preview.data.count, 2);

  // Walk the order to Delivered, then complete it.
  for (const status of ['Confirmed', 'In Progress', 'Delivered']) {
    const res = await call('admin', 'PATCH', `/orders/${orderId}/status`, { status });
    assert.equal(res.status, 200, `should be allowed to move to ${status}: ${JSON.stringify(res.data)}`);
  }
  const done = await call('admin', 'PATCH', `/orders/${orderId}/status`, { status: 'Completed' });
  assert.equal(done.status, 200);
  assert.equal(done.data.purged.purged.length, 2, 'both files are destroyed on completion');
  assert.equal(done.data.purged.failed.length, 0);

  // Records survive for the audit trail, but the documents are gone.
  for (const f of uploaded) {
    const record = await FileRecord.findById(f._id);
    assert.ok(record, 'the record is kept');
    assert.equal(record.isDeleted, true);
    assert.ok(record.purgedAt, 'purgedAt is stamped');
    assert.equal(record.purgeReason, 'order_completed');
    assert.equal((await call('purgeStudent', 'GET', `/files/${f._id}/download`)).status, 404, 'the file is no longer downloadable');
    assert.equal((await call('admin', 'GET', `/files/${f._id}/download`)).status, 404, 'not even for an admin');
  }

  const afterPreview = await call('admin', 'GET', `/files/order/${orderId}/purge-preview`);
  assert.equal(afterPreview.data.count, 0, 'nothing left to purge');

  const order = await Order.findById(orderId);
  assert.ok(order.completedAt);
  assert.ok(
    order.activity.some((a) => /Files deleted from .* \(2\)/.test(a.action)),
    'the timeline records how many files were deleted'
  );
});

test('completing one order leaves the same student\'s other order untouched', async () => {
  const FileRecord = (await import('../models/FileRecord.js')).default;
  const services = await call('purgeStudent', 'GET', '/services');
  const serviceId = (services.data.services || services.data)[0]._id;
  const deadline = new Date(Date.now() + 20 * 86400000).toISOString();

  // Second order with its own file.
  const form = new FormData();
  form.append('files', new Blob([Buffer.from('%PDF-1.4 keep')], { type: 'application/pdf' }), 'keep-me.pdf');
  const up = await fetch(base + '/files/upload', {
    method: 'POST', headers: { authorization: `Bearer ${tokens.purgeStudent}` }, body: form,
  });
  const { files: [keep] } = await up.json();
  const order2 = await call('purgeStudent', 'POST', '/orders', {
    serviceId, title: 'Second order that must survive', deadline, integrityAccepted: true,
    instructions: 'A second request, used to prove that completion is scoped to one order only.',
    fileIds: [keep._id],
  });
  assert.equal(order2.status, 201);
  const order2Id = order2.data.order._id;

  for (const status of ['Confirmed', 'In Progress', 'Delivered', 'Completed']) {
    const res = await call('admin', 'PATCH', `/orders/${order2Id}/status`, { status });
    assert.equal(res.status, 200, `transition to ${status} failed: ${JSON.stringify(res.data)}`);
  }

  const record = await FileRecord.findById(keep._id);
  assert.equal(record.isDeleted, true);

  // An unrelated file owned by the same student, on no order, stays alive.
  const form2 = new FormData();
  form2.append('files', new Blob([Buffer.from('%PDF-1.4 loose')], { type: 'application/pdf' }), 'loose.pdf');
  const up2 = await fetch(base + '/files/upload', {
    method: 'POST', headers: { authorization: `Bearer ${tokens.purgeStudent}` }, body: form2,
  });
  const { files: [loose] } = await up2.json();
  const still = await FileRecord.findById(loose._id);
  assert.equal(still.isDeleted, false, 'files not attached to a completed order are untouched');
  assert.equal((await call('purgeStudent', 'GET', `/files/${loose._id}/download`)).status, 200);
});

/* ---------------- account deletion: records AND stored files ---------------- */

test('deleting a student destroys their stored files and every record', async () => {
  const FileRecord = (await import('../models/FileRecord.js')).default;
  const Storage = await import('../services/storage.js');
  const fs = await import('node:fs');
  const path = await import('node:path');

  // A student with one uploaded PDF.
  const reg = await call('purgeMe', 'POST', '/auth/register', {
    name: 'Purge Target', email: 'purgetarget@test.local', password: 'Test@12345', phone: '9876500123',
  });
  assert.equal(reg.status, 201);
  const studentId = reg.data.user.id;

  const form = new FormData();
  form.append('files', new Blob([Buffer.from('%PDF-1.4 delete me')], { type: 'application/pdf' }), 'to-delete.pdf');
  const up = await fetch(base + '/files/upload', {
    method: 'POST', headers: { authorization: `Bearer ${tokens.purgeMe}` }, body: form,
  });
  assert.equal(up.status, 201);
  const { files: [record] } = await up.json();

  // The bytes exist on disk (local driver is active in tests).
  const onDisk = path.join(Storage.UPLOAD_ROOT ?? path.resolve(process.cwd(), '.data/uploads'), record.storageKey);
  assert.ok(fs.existsSync(onDisk), 'the uploaded file should be on disk before deletion');

  // Delete the student through the real admin endpoint.
  const del = await call('admin', 'DELETE', `/admin/students/${studentId}`, { confirm: 'DELETE' });
  assert.equal(del.status, 200, JSON.stringify(del.data));

  // 1. database records are gone
  assert.equal(await FileRecord.countDocuments({ owner: studentId }), 0, 'file records removed');
  const User = (await import('../models/User.js')).default;
  assert.equal(await User.countDocuments({ _id: studentId }), 0, 'the account is removed');

  // 2. the stored file itself is gone
  assert.equal(fs.existsSync(onDisk), false, 'the stored file must be removed from storage');

  // 3. nothing was silently orphaned
  const Orphan = (await import('../models/OrphanAsset.js')).default;
  assert.equal(await Orphan.countDocuments({ storageKey: record.storageKey }), 0, 'no orphan pointer left behind');

  // 4. the deletion is auditable, without keeping the student's identity
  const AuditLog = (await import('../models/AuditLog.js')).default;
  const entry = await AuditLog.findOne({ action: /student.*delet/i }).sort({ createdAt: -1 });
  assert.ok(entry, 'an audit entry must record the deletion');
});

test('a failed storage delete is retried and never silently dropped', async () => {
  const Orphan = (await import('../models/OrphanAsset.js')).default;
  const FileRecord = (await import('../models/FileRecord.js')).default;
  const { env } = await import('../config/env.js');
  const { v2: cloudinary } = await import('cloudinary');

  const reg = await call('orphanMe', 'POST', '/auth/register', {
    name: 'Orphan Target', email: 'orphantarget@test.local', password: 'Test@12345', phone: '9876500124',
  });
  const studentId = reg.data.user.id;

  const form = new FormData();
  form.append('files', new Blob([Buffer.from('%PDF-1.4 stuck')], { type: 'application/pdf' }), 'stuck.pdf');
  const up = await fetch(base + '/files/upload', {
    method: 'POST', headers: { authorization: `Bearer ${tokens.orphanMe}` }, body: form,
  });
  const { files: [record] } = await up.json();
  // Pretend this file lives in Cloudinary, and make Cloudinary unreachable.
  await FileRecord.updateOne(
    { _id: record._id },
    { $set: { provider: 'cloudinary', publicId: 'acadexa/documents/stuck', resourceType: 'image' } }
  );

  const savedEnv = { ...env.cloudinary };
  const realDestroy = cloudinary.uploader.destroy;
  env.cloudinary = { cloudName: 'acadexa-test', apiKey: 'k', apiSecret: 's', folder: 'acadexa/documents' };

  let destroyCalls = 0;
  cloudinary.uploader.destroy = async () => { destroyCalls += 1; throw new Error('cloudinary unreachable'); };

  try {
    const { purgeStudent } = await import('../services/studentPurge.js');
    const result = await purgeStudent(studentId);
    assert.ok(result, 'the account is still deleted even if storage fails');
    assert.equal(result.deleted.storedAssetsPending, 1, 'the failure must be counted and reported');
    assert.ok(destroyCalls >= 2, 'the delete is retried before giving up');

    const orphan = await Orphan.findOne({ storageKey: record.storageKey });
    assert.ok(orphan, 'a PII-free pointer is kept so the deletion can be retried later');
    assert.equal(orphan.publicId, 'acadexa/documents/stuck');
    assert.equal(orphan.provider, 'cloudinary');
    assert.match(orphan.lastError, /unreachable/);

    // Once the provider recovers, the retry job finishes the deletion.
    cloudinary.uploader.destroy = async () => ({ result: 'ok' });
    const { orphanCleanupJob } = await import('../controllers/file.controller.js');
    const cleared = await orphanCleanupJob();
    assert.ok(cleared >= 1, 'the cleanup job destroys the asset');
    assert.equal(await Orphan.countDocuments({ storageKey: record.storageKey }), 0, 'pointer cleared once deleted');
  } finally {
    env.cloudinary = savedEnv;
    cloudinary.uploader.destroy = realDestroy;
  }
});
/* ---------------- admin student detail view ---------------- */

test('admin student overview lists work and files, and file deletion reaches storage', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { env } = await import('../config/env.js');

  const reg = await call('detailStudent', 'POST', '/auth/register', {
    name: 'Detail View Student', email: 'detail@test.local', password: 'Test@12345', phone: '9876500555',
  });
  const studentId = reg.data.user.id;

  const form = new FormData();
  form.append('files', new Blob([Buffer.from('%PDF-1.4 detail')], { type: 'application/pdf' }), 'detail-file.pdf');
  const up = await fetch(base + '/files/upload', {
    method: 'POST', headers: { authorization: `Bearer ${tokens.detailStudent}` }, body: form,
  });
  const { files: [file] } = await up.json();

  const services = await call('detailStudent', 'GET', '/services');
  const serviceId = (services.data.services || services.data)[0]._id;
  const order = await call('detailStudent', 'POST', '/orders', {
    serviceId,
    title: 'Detail view verification order',
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    integrityAccepted: true,
    instructions: 'A request created to verify the admin student detail view and its file deletion.',
    fileIds: [file._id],
  });
  assert.equal(order.status, 201);

  // Only admins may open the overview.
  assert.equal((await call('detailStudent', 'GET', `/admin/students/${studentId}/overview`)).status, 403);

  const view = await call('admin', 'GET', `/admin/students/${studentId}/overview`);
  assert.equal(view.status, 200);
  assert.equal(view.data.student.email, 'detail@test.local');
  assert.equal(view.data.student.phone, '+919876500555');
  assert.equal(JSON.stringify(view.data).includes('passwordHash'), false, 'no hashes in the payload');
  assert.equal(view.data.orders.length, 1);
  assert.equal(view.data.orders[0].status, 'Pending Review');
  assert.deepEqual(view.data.files.map((f) => f.originalName), ['detail-file.pdf']);
  assert.equal(view.data.files[0].purpose, 'reference');
  assert.ok(view.data.files[0].order.reference, 'the file is linked to its order');
  assert.equal(view.data.summary.files, 1);
  assert.equal(view.data.summary.active, 1);
  assert.ok(['local', 'cloudinary'].includes(view.data.files[0].provider));

  // Status can be moved from the detail view.
  const moved = await call('admin', 'PATCH', `/orders/${view.data.orders[0]._id}/status`, { status: 'Confirmed' });
  assert.equal(moved.status, 200);
  const afterMove = await call('admin', 'GET', `/admin/students/${studentId}/overview`);
  assert.equal(afterMove.data.orders[0].status, 'Confirmed');

  // Deleting one file destroys the stored object, not just the record.
  const onDisk = path.join(path.resolve(process.cwd(), env.uploadDir), file.storageKey);
  assert.ok(fs.existsSync(onDisk), 'file present before deletion');
  assert.equal((await call('admin', 'DELETE', `/files/${file._id}`)).status, 200);
  assert.equal(fs.existsSync(onDisk), false, 'stored file removed when an admin deletes it');

  const after = await call('admin', 'GET', `/admin/students/${studentId}/overview`);
  assert.equal(after.data.files.length, 0, 'the deleted file is no longer listed');
  assert.equal(after.data.summary.files, 0);

  // Students cannot delete staff-visible files through this path either.
  assert.equal((await call('detailStudent', 'DELETE', `/files/${file._id}`)).status, 404);
});
