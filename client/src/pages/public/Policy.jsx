import { Link } from 'react-router-dom';
import { FileText, ShieldCheck } from 'lucide-react';
import { PageHero } from '../../components/layout/PageHero';
import { useSettings } from '../../hooks/useSettings';

const LAST_UPDATED = '29 October 2026';

const DOCS = {
  privacy: {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    intro: 'This policy explains exactly what Acadexa collects, why, who can see it, how long it is kept and how you can act on your rights. It describes the platform as it is actually implemented — including its limits.',
    sections: [
      { h: 'Who we are', p: ['Acadexa is an academic support and consultancy service operating from Ahmedabad, Gujarat, India. For privacy questions, contact the support email published on the Contact page and mark your message “Privacy”. You can also submit a formal request through the Privacy Center in your dashboard.'] },
      { h: 'Information we collect', list: [
        'Account data: your name, email address and a hashed password. Passwords are stored using bcrypt hashing and are never visible to staff or returned to the browser.',
        'Mobile number: collected when you create an account so we can call you if a deadline, a quotation or a missing detail affects a live order. It is validated and stored in international format, shown only to you and to Acadexa staff working on your account, and never displayed publicly or shared with other students.',
        'Profile data (optional): institution, course, city and a short bio that you choose to add.',
        'Request data: service selected, request title, subject area, instructions, deliverables required, institutional guidelines, notes, preferred communication channel and deadline.',
        'Documents you upload: reference files and revision files, plus a record of original filename, validated type, size, purpose and retention date.',
        'Where your documents are stored: uploaded files are held in Cloudinary, a hosted file-storage provider, as private assets that cannot be opened from a public link. They are only ever served through our own authorised download route, which checks that you own the file or that you are Acadexa staff working on that order.',
        'Order and communication data: quotations, payments, invoices, order status history, messages, support tickets, reviews you submit and privacy requests.',
        'Technical data: IP address and a truncated user agent recorded in audit logs for sensitive administrative actions; a single essential cookie used to keep you signed in; sign-in session records (device user agent, IP and last-seen time) so you can review and revoke them.',
      ] },
      { h: 'What we do not collect', list: [
        'Payment card numbers, CVV codes or bank credentials — those are handled by the payment gateway, not by us.',
        'Advertising or cross-site tracking identifiers. No third-party advertising or analytics cookies are set, and no marketing tags run on this platform today.',
        'Sensitive personal data such as health, biometric or caste information, unless you voluntarily include it in a document you upload.',
      ] },
      { h: 'Why we process your data', p: ['We process your information to create and secure your account, review and deliver the services you request, issue quotations and receipts, communicate about your orders, meet accounting and tax obligations, resolve disputes, prevent misuse and improve the service. We rely on your consent, the performance of our contract with you, and legal obligations.'] },
      { h: 'When your documents are deleted', p: [
        'Documents are kept while an order is live, so you, your consultant and our support team can refer to them. When an order is marked completed, every file attached to that order — the files you uploaded and the deliverables we sent you — is permanently destroyed in file storage. We keep a minimal record (filename, size, purpose, the date of deletion and who deleted it) so the order history and audit trail stay accurate, but the document itself cannot be recovered by you, by staff, or by us. Files belonging to your other orders are not affected.',
        'You can also delete an individual file yourself before the order is completed, and you can request deletion of your account from the Privacy Center. Deleting your account destroys your stored documents as well as your database records.',
      ] },
      { h: 'Cookies, consent and choices', p: [
        'Acadexa uses one strictly necessary cookie and two optional categories. Optional categories are off until you turn them on, and rejecting them does not limit any part of the site.',
      ], table: {
        head: ['Category', 'What it is', 'Default', 'Control'],
        rows: [
          ['Strictly necessary', 'The httpOnly session cookie sd_token that keeps you signed in, and sameSite protection on authenticated requests. With "Keep me signed in" ticked it lasts up to 90 days and is renewed whenever you use the site; unticked, it is deleted when you close the browser.', 'Always on', 'Up to 90 days, or immediately when you sign out'],
          ['Analytics', 'First-party page-view counts stored in our own database: page path and a random visitor id. No IP, no query strings, no third-party tracker.', 'Off', 'Optional — switch on or off at any time'],
          ['Marketing', 'Reserved for advertising or remarketing tags. None are installed or loaded today.', 'Off', 'Optional — nothing loads either way'],
        ],
      } },
      { h: 'How consent is recorded and respected', p: [
        'When you choose Accept all, Reject optional or your own combination, the decision is saved on your device and a copy — with a random visitor id, never your IP address — is stored as a record of consent with the wording version and timestamp.',
        'The choice is enforced, not just decorated: analytics requests are only sent when analytics consent is active, and any future analytics or marketing script is mounted through a consent gate that refuses to load without permission.',
        'You can change your mind at any time using “Cookie preferences” in the footer. Your decision stays in force until you change it, and we keep the previous choices in the consent history so you can see what changed and when.',
        'Consent is never bundled: rejecting optional cookies leaves every feature available, and closing the banner counts as rejecting optional cookies rather than accepting them.',
      ] },
      { h: 'Sessions and active devices', p: [
        'Signing in creates a server-side session record alongside a signed, httpOnly cookie. The cookie cannot be read by JavaScript, and the database stores only a hash of the session identifier.',
        'Your Privacy Center lists every active device with its last-seen time, and you can sign out an individual device or all of them at once. Changing or resetting your password automatically revokes your other sessions.',
      ] },
      { h: 'Who can access your information', p: ['Access is role-based and enforced on the server for every request.', 'Students can access only their own records. Consultants can access only the orders assigned to them. Support staff can access tickets and order context required to answer you. Administrators can access records where there is an operational need, and sensitive actions are written to an audit log with actor, action, record reference and timestamp. Private internal notes are never shown to students.'] },
      { h: 'Documents and confidentiality', p: ['Uploaded files are not stored in a public web directory. Every download passes through an authenticated endpoint that checks ownership or assignment before streaming the file, and downloads are counted. File types and sizes are validated on the server. We do not claim absolute confidentiality or perfect security — no online system can — but access is restricted, logged where relevant and reviewed.'] },
      { h: 'Third parties', p: ['We use service providers for hosting, database storage, file storage (Cloudinary, for uploaded documents), transactional email and payment processing. They receive only the information needed to perform their function. We do not sell personal data. Where a provider processes data outside India, transfers rely on that provider\'s contractual safeguards.'] },
      { h: 'Retention', list: [
        'Uploaded files: 24 months from upload by default, then purged automatically by a scheduled job.',
        'Order, quotation, message and support records: retained while your account is active and for a reasonable period afterwards to handle disputes and statutory requirements.',
        'Payment and invoice records: retained for the period required by Indian tax and accounting law, even if you request deletion.',
        'Audit logs: retained for security and accountability purposes and reviewed periodically.',
      ] },
      { h: 'Your rights', p: ['You can access your account information at any time. From the Privacy Center you can request access to eligible personal data, correction of inaccurate data, an export copy, or deletion of eligible data. Each request receives a reference number and a status you can track. We respond within 30 days, and we will explain if a legal or accounting obligation prevents full deletion.'] },
      { h: 'Security measures', list: [
        'Passwords hashed with bcrypt; authentication via short-lived signed tokens in an httpOnly, sameSite cookie.',
        'Role-based authorisation and ownership checks enforced in the API, not only in the interface.',
        'Input validation with schema validation on every write, rate limiting on authentication and write endpoints, security headers and restricted CORS.',
        'Payment confirmation only after server-side signature verification or a signed webhook; duplicate payment events are rejected.',
        'Audit logging of sensitive administrative actions, with no passwords or private tokens stored in logs.',
      ] },
      { h: 'Children', p: ['The platform is intended for students aged 18 and above, or minors with verifiable parental consent where their institution permits such services. Contact us if you believe a minor has created an account without consent.'] },
      { h: 'Complaints', p: ['If you are unhappy with how we have handled your information, contact us first so we can resolve it. You may also escalate to the appropriate data-protection authority in your jurisdiction.'] },
      { h: 'Changes', p: [`We will publish any material change to this policy on this page with a new effective date. Where changes significantly affect your rights, we will notify you in-app or by email. Last updated: ${LAST_UPDATED}.`] },
    ],
  },
  terms: {
    title: 'Terms of Service',
    eyebrow: 'Legal',
    intro: 'These terms govern your use of Acadexa. By creating an account or submitting a request you agree to them. They are written to match how the platform actually operates.',
    sections: [
      { h: 'The service', p: ['Acadexa provides academic support across five categories: practical and lab manual support, assignment and notes support, project documentation, presentation and viva preparation, and technical and research support. All work is provided as guidance, drafting support, review, editing, formatting or explanation. The platform does not sit examinations, impersonate a student, or guarantee marks, grades or outcomes.'] },
      { h: 'Accounts', list: [
        'You must provide accurate information and keep your credentials confidential.',
        'One account per person. Accounts are personal and may not be shared or transferred.',
        'You are responsible for activity carried out under your account.',
        'We may suspend or deactivate accounts for misuse, abuse of staff, attempted fraud, or requests that breach the Academic Integrity Policy.',
      ] },
      { h: 'Requests and quotations', p: ['A submitted request is an invitation to quote, not a confirmed order. We may accept, decline or ask for further information. Quotations state the price, scope, deliverables, delivery estimate, revision allowance and expiry date. Work begins only after you accept the quotation and, where applicable, payment is verified. Changes to an accepted scope require a revised quotation and your fresh approval.'] },
      { h: 'Your responsibilities', list: [
        'Provide complete, accurate requirements and readable reference material.',
        'Respond to clarification requests in time to meet the agreed deadline.',
        'Comply with your institution\'s academic rules and declare assistance where required.',
        'Do not upload content you have no right to share, or material that infringes copyright or privacy.',
        'Do not ask for fabricated data, ghost-written assessed submissions, impersonation, or circumvention of institutional rules.',
      ] },
      { h: 'Deadlines and delivery', p: ['Estimated turnaround shown on a service page is indicative. The confirmed delivery date in your quotation is the reference deadline. Deadlines depend on timely responses from you; delays caused by missing information shift the delivery date, and changes are recorded on the order timeline. Deliverables are supplied in the formats stated in the quotation.'] },
      { h: 'Revisions', p: ['Revision allowances are stated in your quotation and are limited to the agreed scope and a defined period after delivery. Requests beyond the allowance or outside the scope are quoted separately. Revision history and previous deliverable versions are retained on the order.'] },
      { h: 'Fees and payment', p: ['Fees are as stated in the accepted quotation, in the stated currency. Payment is made through the integrated gateway and confirmed only after server-side verification. You are responsible for any bank or gateway charges disclosed at checkout. Invoices are available in your dashboard.'] },
      { h: 'Cancellation and refunds', p: ['Cancellations and refunds are governed by the Refund & Cancellation Policy published on this site, which forms part of these terms.'] },
      { h: 'Intellectual property', p: ['You retain ownership of the material you upload. You grant us a limited licence to review, edit and store that material solely to deliver the requested service. Deliverables are licensed to you for your own academic use. We retain ownership of the platform, its code, design and branding.'] },
      { h: 'Confidentiality', p: ['We treat your documents as confidential and restrict access to authorised personnel. Absolute confidentiality and perfect security cannot be guaranteed by any online service; we describe the measures we take in the Privacy Policy.'] },
      { h: 'Limitation of liability', p: ['Our services are support services. We are not responsible for your institution\'s assessment decisions, for the marks you receive, or for losses arising from your failure to comply with your institution\'s rules. To the extent permitted by law, our total liability for any claim is limited to the amount you paid for the specific order concerned.'] },
      { h: 'Governing law', p: ['These terms are governed by the laws of India, with courts at Ahmedabad, Gujarat having jurisdiction. Nothing here limits rights you have under applicable consumer-protection law.'] },
      { h: 'Changes', p: [`We may update these terms and will publish the effective date on this page. Continued use after an update constitutes acceptance. Last updated: ${LAST_UPDATED}.`] },
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    eyebrow: 'Legal',
    intro: 'This policy explains when an order can be cancelled and how refunds are assessed. It reflects the workflow implemented in the platform: cancellations are recorded on the order, refunds are processed against the verified payment record.',
    sections: [
      { h: 'Cancelling before work begins', p: ['You may cancel a request while it is awaiting review, quotation or payment from your order page. If a payment has already been verified but work has not started, the amount is refundable minus any payment-gateway charges already incurred and any third-party costs already committed on your behalf.'] },
      { h: 'Cancelling after work has begun', p: ['Once an order is in progress, cancellation is handled through support so that work completed can be assessed. Refunds in this situation are calculated against the proportion of the agreed scope already delivered. Any completed deliverables remain available to you.'] },
      { h: 'If we decline or cannot complete', p: ['If we decline your request after payment, or cannot complete it within the agreed terms, you receive a full refund of the amount paid for that order. If we deliver something materially outside the agreed scope, you may request correction first; if it cannot be corrected, a proportionate refund applies.'] },
      { h: 'Revisions instead of refunds', p: ['Where an issue falls within the agreed scope and revision allowance, the standard remedy is a revision rather than a refund. Refund requests are considered where the revision allowance has been exhausted or the issue falls outside what revisions can fix.'] },
      { h: 'Non-refundable situations', list: [
        'Work already delivered and accepted, where the complaint concerns academic outcomes (marks, grades, reviewer comments) rather than the agreed scope.',
        'Delays caused by information you did not provide, or by your failure to respond to clarification requests.',
        'Requests that breach the Academic Integrity Policy — although in those cases no charge is retained for prohibited work.',
        'Change of mind after substantial delivery.',
        'Third-party fees such as payment-gateway charges that the provider does not return.',
      ] },
      { h: 'How refunds are processed', p: ['Refunds are processed against the original verified payment through the same payment provider, and the refund status is recorded against the payment in your dashboard (Pending, Processed, or Partially Refunded). We initiate refunds within 5 working days of approval; your bank or provider may take a further 5–10 working days to credit the amount. Refunds are never issued in cash or to a different account.'] },
      { h: 'Consultation bookings', p: ['Consultation sessions may be rescheduled or cancelled up to 12 hours before the scheduled start at no charge. Later cancellations, or non-attendance, may not be refundable because the slot is reserved exclusively for you. If we cancel a session, you receive a full refund or a priority rebooking.'] },
      { h: 'Disputes', p: ['If you disagree with a refund decision, raise a support ticket quoting your order and payment reference. We will review the order timeline, messages and delivered files, and respond in writing. Nothing in this policy limits your statutory consumer rights.'] },
      { h: 'Chargebacks', p: ['Please contact us before initiating a chargeback so we can resolve the issue directly. Chargebacks raised without prior contact may lead to account suspension while the payment provider investigates.'] },
    ],
  },
  integrity: {
    title: 'Academic Integrity Policy',
    eyebrow: 'Legal',
    intro: 'Acadexa provides responsible academic support. This policy defines what we will and will not do, so that students know the boundaries before they order.',
    sections: [
      { h: 'Our position', p: ['Academic work submitted for assessment must be the student\'s own. We provide tutoring, structure, editing, formatting, feedback, explanation and technical guidance. We do not produce work that a student presents as their own original submission, and we do not fabricate or alter research data.'] },
      { h: 'What we help with', list: [
        'Explaining concepts, methods and tools so you can complete your own work.',
        'Structuring and formatting documents to your institution\'s template.',
        'Editing language, clarity and citation consistency in work you have written.',
        'Reviewing your draft and giving feedback on gaps and weaknesses.',
        'Preparing for a presentation or viva, including mock questioning.',
        'Debugging and reviewing code with an explanation of what went wrong.',
        'Planning a research approach, with guidance on method and sources.',
      ] },
      { h: 'What we will not do', list: [
        'Write a thesis, dissertation, assignment, report or paper for submission as your own work.',
        'Fabricate, alter or simulate experimental results, observations or survey data.',
        'Impersonate you in a viva, examination, interview or online class.',
        'Remove or disguise plagiarism in a way designed to evade detection.',
        'Write assessed submissions during an active examination or assessment window where rules prohibit assistance.',
        'Help circumvent institutional policies, software checks or academic misconduct procedures.',
      ] },
      { h: 'How we enforce it', p: ['Requests are reviewed before acceptance. A request that appears to breach this policy is declined with a written reason and any payment is refunded under the Refund Policy. Repeat attempts may lead to account suspension. Scope statements on each service page list the included and excluded work, and the academic-integrity condition must be accepted before a request can be submitted.'] },
      { h: 'Your responsibility', p: ['You remain responsible for your submission, for verifying the accuracy of any content and for complying with your institution\'s rules on external assistance. Where your institution requires disclosure of editing or guidance received, you must disclose it.'] },
      { h: 'Copyright and sources', p: ['You must have the right to share any material you upload. We will not reproduce substantial copyrighted text without attribution, and we will flag sources that require permission. Reference formatting follows standard style guides; the accuracy of citations remains your responsibility.'] },
      { h: 'Reporting a concern', p: ['If you believe a service, deliverable or interaction on this platform crosses an integrity line, contact us with the order reference. Concerns are reviewed and, where warranted, the order is cancelled and refunded.'] },
    ],
  },
};

export default function Policy({ page }) {
  const doc = DOCS[page] || DOCS.privacy;
  const { settings } = useSettings();
  const business = settings?.business || {};

  return (
    <>
      <PageHero eyebrow={doc.eyebrow} title={doc.title} description={doc.intro}>
        <p className="text-[12px] text-muted">Effective {LAST_UPDATED} · {business.name || 'Acadexa'}</p>
      </PageHero>

      <section className="py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[0.28fr_0.72fr]">
          <aside className="h-fit rounded-2xl border border-line bg-white p-4 lg:sticky lg:top-24">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-muted uppercase"><FileText className="size-3.5" aria-hidden /> On this page</p>
            <nav className="mt-3 space-y-1" aria-label="Policy sections">
              {doc.sections.map((s, i) => (
                <a key={s.h} href={`#s-${i}`} className="block rounded-lg px-2 py-1.5 text-[12.5px] text-muted hover:bg-mint hover:text-forest">{s.h}</a>
              ))}
            </nav>
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">Other policies</p>
              <div className="mt-2 space-y-1">
                {Object.entries(DOCS).filter(([k]) => k !== page).map(([k, v]) => (
                  <Link key={k} to={{ privacy: '/privacy-policy', terms: '/terms-of-service', refund: '/refund-policy', integrity: '/academic-integrity-policy' }[k]} className="block rounded-lg px-2 py-1.5 text-[12.5px] text-muted hover:bg-mint hover:text-forest">{v.title}</Link>
                ))}
              </div>
            </div>
          </aside>

          <article className="space-y-7 rounded-2xl border border-line bg-white p-6 sm:p-8">
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald/25 bg-mint px-4 py-3 text-[12.5px] leading-relaxed text-forest">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>This document describes the platform as implemented. Where a capability is limited — for example payment-provider integration in a test environment, or automated email delivery — the limitation is stated in the interface rather than hidden here.</p>
            </div>
            {doc.sections.map((s, i) => (
              <section key={s.h} id={`s-${i}`} className="scroll-mt-24">
                <h2 className="text-[16px] font-bold text-ink">{i + 1}. {s.h}</h2>
                {s.p?.map((p) => <p key={p} className="mt-2 text-[13.5px] leading-relaxed text-muted">{p}</p>)}
                {s.list && (
                  <ul className="mt-2.5 space-y-1.5">
                    {s.list.map((li) => (
                      <li key={li} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-muted">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden />{li}
                      </li>
                    ))}
                  </ul>
                )}
                {s.table && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-line">
                    <table className="w-full min-w-[560px] text-left text-[12.5px]">
                      <thead className="bg-canvas">
                        <tr>
                          {s.table.head.map((h) => (
                            <th key={h} scope="col" className="px-3 py-2 text-[11px] font-bold tracking-[0.08em] text-muted uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {s.table.rows.map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell, ci) => (
                              <td key={ci} className={`px-3 py-2 align-top ${ci === 0 ? 'font-semibold text-ink' : 'text-muted'}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
            <p className="border-t border-line pt-5 text-[12px] text-muted">
              Questions about this policy? Email {business.email || 'hello@acadexa.example'} or use the Contact form.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
