import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${page.url()} :: ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${page.url()} :: ${e.message.slice(0, 200)}`));

const visit = async (path, name, wait = 1400) => {
  await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `/home/user/shots/${name}.png`, fullPage: false });
  console.log('shot', name, await page.title());
};

await visit('/', 'home');
await visit('/services', 'services');
await visit('/services/practical-lab-manual-support', 'service-detail');
await visit('/services/presentation-viva-preparation', 'service-detail-presentation');
await visit('/pricing', 'pricing');
await visit('/faq', 'faq');
await visit('/contact', 'contact');
await visit('/privacy-policy', 'policy');
await visit('/login', 'login');

// login as student
await page.fill('#email', 'student@studentdesk.example');
await page.fill('#password', 'Student@12345');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => console.log('login redirect failed'));
await page.waitForTimeout(1500);
await page.screenshot({ path: '/home/user/shots/student-dashboard.png' });
console.log('student dashboard:', page.url());

for (const [path, name] of [['/dashboard/orders', 'student-orders'], ['/dashboard/quotations', 'student-quotations'], ['/dashboard/payments', 'student-payments'], ['/dashboard/requests/new', 'student-new-request'], ['/dashboard/support', 'student-support'], ['/dashboard/consultations', 'student-consultations'], ['/dashboard/privacy', 'student-privacy'], ['/dashboard/profile', 'student-profile']]) {
  await visit(path, name, 1200);
}

// open an order detail
await page.goto(BASE + '/dashboard/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const orderLink = page.locator('a[href*="/dashboard/orders/"]').first();
if (await orderLink.count()) {
  await orderLink.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/user/shots/student-order-detail.png' });
  console.log('order detail:', page.url());
}

// logout & login as admin
await page.goto(BASE + '/dashboard/profile');
await page.waitForTimeout(600);
await page.click('text=Sign out').catch(() => {});
await page.waitForTimeout(1200);
await page.goto(BASE + '/login');
await page.fill('#email', 'admin@studentdesk.example');
await page.fill('#password', 'Admin@12345');
await page.click('button[type=submit]');
await page.waitForURL('**/admin', { timeout: 15000 }).catch(() => console.log('admin redirect failed'));
await page.waitForTimeout(2200);
await page.screenshot({ path: '/home/user/shots/admin-dashboard.png' });
console.log('admin dashboard:', page.url());

for (const [path, name] of [['/admin/orders', 'admin-orders'], ['/admin/quotations', 'admin-quotations'], ['/admin/payments', 'admin-payments'], ['/admin/services', 'admin-services'], ['/admin/students', 'admin-students'], ['/admin/calendar', 'admin-calendar'], ['/admin/support', 'admin-support'], ['/admin/reports', 'admin-reports'], ['/admin/settings', 'admin-settings'], ['/admin/audit-logs', 'admin-audit'], ['/admin/team', 'admin-team'], ['/admin/privacy', 'admin-privacy']]) {
  await visit(path, name, 1300);
}

await page.goto(BASE + '/admin/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const ao = page.locator('a[href*="/admin/orders/"]').first();
if (await ao.count()) { await ao.click(); await page.waitForTimeout(1600); await page.screenshot({ path: '/home/user/shots/admin-order-detail.png' }); console.log('admin order:', page.url()); }

// mobile check
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 844 });
await m.goto(BASE + '/', { waitUntil: 'networkidle' });
await m.waitForTimeout(1200);
await m.screenshot({ path: '/home/user/shots/mobile-home.png' });
await m.click('button[aria-label="Open menu"]').catch(() => {});
await m.waitForTimeout(600);
await m.screenshot({ path: '/home/user/shots/mobile-menu.png' });

console.log('\n--- ERRORS (' + errors.length + ') ---');
console.log([...new Set(errors)].join('\n'));
await browser.close();
