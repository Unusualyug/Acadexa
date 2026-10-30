import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(`console: ${m.text().slice(0, 160)}`); });
const log = (...a) => console.log('•', ...a);

// 1. student submits a request through the UI
await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
await page.fill('#email', 'student@studentdesk.example');
await page.fill('#password', 'Student@12345');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard');
log('student logged in');

await page.goto(BASE + '/dashboard/requests/new', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const svcOptions = await page.locator('#serviceId option').allTextContents();
const target = svcOptions.find((o) => o.includes('Assignment & Notes')) || svcOptions[1];
await page.selectOption('#serviceId', { label: target });
await page.fill('#title', 'Proofread seminar report ' + Date.now());
await page.fill('#instructions', 'Please proofread my 40-page seminar report for grammar, punctuation and consistent heading styles. The file is uploaded here.');
await page.setInputFiles('input[type=file]', { name: 'draft.txt', mimeType: 'text/plain', buffer: Buffer.from('Sample seminar draft content for proofreading test.') });
await page.waitForTimeout(2500);
await page.check('input[name=integrityAccepted]');
await page.click('button:has-text("Submit request")');
await page.waitForURL(/\/dashboard\/orders\//, { timeout: 20000 });
await page.waitForTimeout(1500);
const orderUrl = page.url();
log('request submitted →', orderUrl);
await page.screenshot({ path: '/home/user/shots/flow-order-created.png' });

// 2. admin issues quotation
await page.goto(BASE + '/dashboard/profile');
await page.click('text=Sign out').catch(() => {});
await page.waitForTimeout(800);
await page.goto(BASE + '/login');
await page.fill('#email', 'admin@studentdesk.example');
await page.fill('#password', 'Admin@12345');
await page.click('button[type=submit]');
await page.waitForURL('**/admin');
const orderId = orderUrl.split('/').pop();
await page.goto(`${BASE}/admin/orders/${orderId}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.click('button:has-text("Create quotation")');
await page.waitForTimeout(600);
await page.fill('#amount', '750');
await page.fill('#estimatedDelivery', new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10));
await page.fill('#scope', 'Full language proofreading of the 40-page report, heading consistency and reference list formatting.');
await page.fill('#deliverables', 'Tracked-changes DOCX\nClean PDF');
await page.click('button:has-text("Send quotation")');
await page.waitForTimeout(2000);
log('quotation sent');
await page.screenshot({ path: '/home/user/shots/flow-quotation-created.png' });

// 3. student accepts + pays via sandbox modal
await page.goto(BASE + '/login');
await page.fill('#email', 'student@studentdesk.example');
await page.fill('#password', 'Student@12345');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard');
await page.goto(`${BASE}/dashboard/orders/${orderId}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.click('button:has-text("Accept quotation")').catch(async () => {
  await page.click('button:has-text("Quotation")');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Accept quotation")');
});
await page.waitForTimeout(2000);
log('quotation accepted');
await page.goto(`${BASE}/dashboard/payments`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: '/home/user/shots/flow-awaiting-payment.png' });
await page.click('button:has-text("Pay now")');
await page.waitForTimeout(800);
await page.click('button:has-text("Continue to payment")');
await page.waitForTimeout(1800);
await page.screenshot({ path: '/home/user/shots/flow-checkout.png' });
await page.click('button:has-text("Pay ₹")');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/home/user/shots/flow-paid.png' });
const bodyText = await page.textContent('body');
log('payment verified:', bodyText.includes('verified') || bodyText.includes('Receipt') ? 'yes' : 'check screenshot');

// 4. admin uploads deliverable
await page.goto(BASE + '/dashboard/profile');
await page.click('text=Sign out').catch(() => {});
await page.waitForTimeout(700);
await page.goto(BASE + '/login');
await page.fill('#email', 'admin@studentdesk.example');
await page.fill('#password', 'Admin@12345');
await page.click('button[type=submit]');
await page.waitForURL('**/admin');
await page.goto(`${BASE}/admin/orders/${orderId}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.selectOption('#status', { label: 'In Progress' }).catch(() => {});
await page.click('button:has-text("Update status")').catch(() => {});
await page.waitForTimeout(1500);
await page.click('button:has-text("Upload deliverables")').catch(() => {});
await page.waitForTimeout(700);
const dz = page.locator('input[type=file]');
if (await dz.count()) await dz.last().setInputFiles({ name: 'deliverable.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test deliverable') });
await page.waitForTimeout(600);
await page.click('button:has-text("Upload & notify")');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/home/user/shots/flow-delivered.png' });
log('deliverable uploaded, status now Delivered?', (await page.textContent('body')).includes('Delivered'));

console.log('\nERRORS:', errors.length ? [...new Set(errors)].join('\n') : 'none');
await b.close();
