/**
 * English — the reference dictionary.
 *
 * Structure notes:
 *  - Every user-facing string lives here, not in components, so the three
 *    languages cannot drift and a translator only ever edits these files.
 *  - `faq.items` is one flat corpus; the FAQ page groups it and the homepage
 *    reuses the first six, so no question is translated twice.
 *  - Numbers, prices, the brand name and the phone number are never translated.
 */
export default {
  language: {
    label: "Language",
    choose: "Choose language",
    current: "Current language: {{language}}",
    switched: "Language changed to {{language}}",
  },

  common: {
    free: "Free",
    charged: "Charged",
    login: "Login",
    getStarted: "Get Started",
    signOut: "Sign out",
    dashboard: "Dashboard",
    profileSettings: "Profile & settings",
    settings: "Settings",
    goToDashboard: "Go to dashboard",
    loading: "Loading…",
    close: "Close",
    cancel: "Cancel",
    back: "Back",
    details: "Details",
    additionalCharges: "Additional charges",
    help: "Help",
    from: "from {{price}}",
    perPage: "per page",
    outOfFive: "{{rating}} out of 5",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainNav: "Main",
    mobileNav: "Mobile",
    appearance: "Appearance",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    whatsapp: "WhatsApp",
    callNow: "Call now",
    phone: "Phone",
    email: "Email",
    address: "Address",
    somethingWentWrong: "Something went wrong. Please try again.",
  },

  nav: {
    home: "Home",
    about: "About Us",
    services: "Services",
    howItWorks: "How It Works",
    pricing: "Pricing",
    faq: "FAQs",
    contact: "Contact",
  },

  footer: {
    tagline:
      "Professional Academic Support. Personalized Guidance. Complete Confidentiality.",
    columns: {
      company: "Company",
      services: "Services",
      support: "Support",
      legal: "Legal",
    },
    links: {
      about: "About us",
      howItWorks: "How it works",
      pricing: "Pricing",
      contact: "Contact",
      services: "All services",
      labManual: "Lab manual support",
      printing: "Printing & binding",
      assignments: "Assignments & notes",
      projects: "Project documentation",
      technical: "Technical & research",
      faq: "FAQs",
      login: "Student login",
      register: "Create an account",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      refund: "Refunds & cancellation",
      integrity: "Academic Integrity",
      cookies: "Cookie Policy",
    },
    whatsappAvailable: "WhatsApp {{compact}}",
    copyright: "© {{year}} {{name}}. All rights reserved.",
    disclaimer:
      "Academic support only: guidance, editing, formatting and feedback. We do not write assessed submissions or fabricate results.",
    integrityNote:
      "Academic support services only. Students remain responsible for their institution's academic-integrity rules.",
  },

  home: {
    hero: {
      badgeMobile: "Free lab manual creation",
      headline: "Your Academic Work, Made Simpler.",
      subtext:
        "Practical manuals, assignments, project reports, presentations and technical or research support — billed per item, with written quotations, organised tracking and private document handling.",
      browse: "Browse all services",
      quote: "Or request a quote",
      points: [
        "Pay per work — no subscription",
        "Written quotations",
        "Private file handling",
      ],
    },
    academicSubmissions: {
      eyebrow: "New on Acadexa",
      headline: "All Your Academic Submissions, Handled by Us!",
      description:
        "From lab manuals to academic documentation and other submission-related work, Acadexa is here to make your academic submission process easier and more convenient.",
      cta: "Explore All Services",
    },
    trust: {
      eyebrow: "Trust & privacy",
      heading: "Confidentiality is built into how the platform works",
      sub: "These are the practices actually implemented in Acadexa — not marketing claims.",
      items: [
        {
          title: "Private documents by default",
          text: "Files are never on a public URL. Every download is authorised on the server.",
        },
        {
          title: "Transparent quotations",
          text: "Scope, deliverables, revisions and validity are written down before you pay.",
        },
        {
          title: "Clearly defined scope",
          text: "Each service lists what is included and what is out of scope — no ambiguity.",
        },
        {
          title: "Responsible assistance",
          text: "Guidance, editing and feedback only. Nothing that breaches academic integrity.",
        },
      ],
    },
    services: {
      eyebrow: "Services",
      heading: "Support across every academic deliverable",
      sub: "Six service categories — now including printing and binding — each with a published price sheet, documented scope and revision terms. Work is billed per item — per experiment, page, diagram, slide or session — with no subscription.",
      cta: "All services",
    },
    how: {
      eyebrow: "How it works",
      heading: "From request to delivery in five clear steps",
      sub: "Every step is recorded against your order reference, so you always know what has been agreed and what happens next.",
      ctaProcess: "See the full process",
      ctaAccount: "Create an account",
      steps: [
        {
          title: "Choose a service",
          text: "Browse the catalogue, compare scope and starting prices, and open the service that fits.",
        },
        {
          title: "Share requirements",
          text: "Describe what you need, set a deadline and attach reference documents privately.",
        },
        {
          title: "Receive a quotation",
          text: "We review the request and send a written quotation with scope, price and revisions.",
        },
        {
          title: "Approve and pay",
          text: "Accept the quotation, verify the terms and complete payment through a verified gateway.",
        },
        {
          title: "Track to delivery",
          text: "Follow progress, message the team, download agreed deliverables and request revisions.",
        },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      heading: "Pay per work, with starting prices published",
      sub: "No subscription or membership. Rates are per experiment, page, diagram, slide or session. Final amounts depend on complexity, length and deadline — confirmed in writing before you pay.",
      cta: "Full rate card",
      noteTitle: "Starting prices apply to eligible basic work only.",
      noteBody:
        "Urgent delivery within 24 hours carries a 25–40% surcharge. Printing, binding and courier are charged at actual cost. Bulk orders may receive 5–10% off where costs allow.",
      categories: "Service categories",
      openSheet: "Open a service for its price sheet",
    },
    why: {
      eyebrow: "Why choose us",
      heading: "A dependable process, not just pretty documents",
      sub: "Acadexa is built around the parts of academic support that usually go wrong: unclear scope, informal pricing, lost files and silence after payment. Each of those has a system behind it here.",
      integrity:
        "We provide guidance, editing, formatting and feedback. We do not write assessed submissions for students, fabricate results or misrepresent authorship.",
      items: [
        {
          title: "Student-focused support",
          text: "Written for deadlines, formats and rubrics you actually have to meet.",
        },
        {
          title: "Professional communication",
          text: "Order-linked messages, clear replies and no scattered WhatsApp threads.",
        },
        {
          title: "Clear quotations",
          text: "Itemised scope and revision terms you approve before work starts.",
        },
        {
          title: "Organised order management",
          text: "Every request has a reference, a timeline and a single place to track it.",
        },
        {
          title: "Privacy-conscious handling",
          text: "Minimum data collection, restricted internal access and retention limits.",
        },
        {
          title: "Reliable progress updates",
          text: "Status changes and delivery notifications as the work moves forward.",
        },
      ],
    },
    reviews: {
      eyebrow: "Student feedback",
      heading: "Published with student permission",
      sub: "Only feedback submitted after a completed order and approved for publication appears here.",
    },
    faqTeaser: {
      eyebrow: "FAQs",
      heading: "Questions students ask first",
      sub: "Can't find what you need? Open a support ticket from your dashboard or use the contact form — replies usually arrive within one working day.",
      cta: "All FAQs",
    },
    faqs: {
      eyebrow: "FAQs",
      heading: "Questions students ask first",
      sub: "Can't find what you need? Open a support ticket from your dashboard or use the contact form — replies usually arrive within one working day.",
      items: [
        {
          q: "What academic services are available?",
          a: "Six categories: practical and lab manual support, assignment and notes support, project documentation, presentation and viva preparation, and technical and research support. Each service page lists exactly what is included, what is excluded and the per-item rates.",
        },
        {
          q: "How do I place a request?",
          a: "Create a free student account, choose a service, submit your requirements with reference files and a deadline. You receive a reference number immediately and can track the request from your dashboard.",
        },
        {
          q: "How does pricing work?",
          a: "You pay per work — there is no subscription. Rates are published per item: per experiment, page, diagram, slide or session, with separate softcopy and handwritten columns where both are offered. Starting prices begin at ₹15 per page for handwritten work and ₹49 for basic softcopy work. You always approve a written quotation before paying.",
        },
        {
          q: "What counts as one page?",
          a: "Unless stated otherwise in your quotation, one page means one side of an A4 sheet.",
        },
        {
          q: "Is lab manual creation really free?",
          a: "Yes — when you print and bind that same lab manual through Acadexa, no charge is added for creating it. The offer is tied to the print and bind job, so the printing, binding and any delivery are charged at actual cost and are never free. If you print the manual elsewhere, creation is priced normally from the published rates.",
        },
        {
          q: "Does handwritten work include delivery?",
          a: "Your quotation states whether handwritten work includes physical delivery or only scanned digital copies. Printing, binding and courier are charged at actual cost.",
        },
      ],
    },
    cta: {
      badge: "Start with a written quotation",
      heading: "Tell us what you\'re working on",
      sub: "Submit your requirements with reference files and a deadline. You'll receive a reference number immediately and a scoped quotation after review.",
      primary: "Create free account",
      secondary: "Talk to us first",
      points: [
        "No payment before approval",
        "Deadline confirmed in writing",
        "Files stay private",
      ],
    },
  },

  offer: {
    badge: "Free lab manual creation",
    headline: "Your Lab Manual, Created Free!",
    supporting:
      "Get your lab manual created at no extra cost when you print and bind it through Acadexa.",
    condition:
      "Free creation applies only when you print and bind the same manual through Acadexa. Printing, binding and delivery are charged at actual cost — they are never free.",
    shortCondition:
      "Free creation with a print & bind order. Printing and binding are charged separately.",
    primaryCta: "Create Your Lab Manual",
    secondaryCta: "Explore Printing Services",
    oneLiner: "Lab manual creation free when you print and bind with Acadexa.",
  },

  contactBlock: {
    eyebrow: "Contact & bulk printing",
    heading: "Free creation, paid printing — and one number to call",
    intro:
      "Manual creation is free when you print and bind through Acadexa. Printing, binding, delivery and consultancy are charged at actual cost and are quoted to you before you pay.",
    callAria: "Call Acadexa on {{phone}}",
    whatsappAria: "Message Acadexa on WhatsApp at {{phone}}",
    free: {
      chip: "Free",
      title: "Free Lab Manual Creation",
      body: "Get your lab manual created at no extra cost when you print and bind it through Acadexa.",
      condition:
        "Free creation with a print & bind order. Printing and binding are charged separately.",
      cta: "See the lab manual service",
      footnote: "The print & bind quote is shared before the run.",
    },
    consultancy: {
      chip: "Charged",
      title: "Consultancy Services",
      body: "For any consultancy-related work, contact or WhatsApp {{phone}}.",
      condition:
        "Scope, fees and timeline are agreed in writing before any work starts.",
      cta: "Contact for Consultancy",
    },
    bulk: {
      chip: "Charged",
      title: "Bulk Printing & Doorstep Delivery",
      body: "Ordering multiple printed documents? Acadexa can arrange delivery to your location.",
      condition:
        "For bulk orders, delivery details, and pricing, message us at {{phone}}.",
      cta: "Enquire About Bulk Printing",
    },
    footerNote:
      "One number for consultancy and bulk printing. Orders, quotations and payments stay on the platform.",
    whatsappBtn: "WhatsApp {{phone}}",
    callBtn: "Call now",
  },

  servicesPage: {
    eyebrow: "Service catalogue",
    title: "Every service, scope and starting price in one place",
    description:
      "Filter by category, search by keyword and open any service to see exactly what is included, what is excluded, what we need from you and how revisions work.",
    searchLabel: "Search services",
    searchPlaceholder: "Search services, e.g. “research”, “viva”, “formatting”",
    clearSearch: "Clear search",
    sortLabel: "Sort services",
    sort: {
      order: "Recommended",
      name: "Name (A–Z)",
      priceAsc: "Price: low to high",
      priceDesc: "Price: high to low",
    },
    all: "All",
    oneService: "{{count}} service",
    manyServices: "{{count}} services",
    emptyTitle: "No services match that search",
    emptyBody:
      "Try a different keyword or clear the filters to see the full catalogue.",
    emptyAction: "Clear filters",
    errorTitle: "The catalogue could not be loaded",
    errorBody: "Check your connection and try again.",
  },

  serviceDetail: {
    back: "All services",
    startingFrom: "Starting from",
    pricing: "Pricing",
    quotedPerJob: "Quoted per job",
    priceNote:
      "Pay per work — no subscription. Rates below are indicative ranges; the final amount depends on pages, complexity and deadline, and is confirmed in your quotation.",
    request: "Request this service",
    ask: "Ask a question",
    approvedBefore: "Approved before work begins",
    priceSheet: "Price sheet",
    payPerWork: "Pay per work",
    additionalCharges: "Additional charges",
    notSureTitle: "Not sure which line applies?",
    notSureBody:
      "Describe the work and attach your files. We will map it to the right rows and send a written quotation — no payment until you approve it.",
    included: "What's included",
    includedWork: "Included work",
    notIncluded: "Not included",
    requirements: "What we need from you",
    requirementsTitle: "Required information",
    terms: "Terms you\'re agreeing to",
    termsPricing: "Pricing method.",
    termsPricingFixed:
      "Fixed price for the standard scope stated above, confirmed in your quotation.",
    termsPricingCustom:
      "Custom quotation based on volume, complexity and deadline, sent for your approval before payment.",
    termsTurnaround: "Estimated turnaround.",
    termsTurnaroundBody:
      "{{estimate}}. The confirmed delivery date appears in your quotation and replaces this estimate.",
    termsRevisions: "Revisions.",
    integrity: "Academic integrity.",
    serviceFaqs: "Service FAQs",
    process: "How your request proceeds",
    processSteps: [
      "Submit requirements and files",
      "Review and quotation",
      "Approve scope and pay",
      "Work in progress",
      "Delivery and revisions",
    ],
    confidentiality: "Confidentiality",
    confidentialityBody:
      "Reference documents are stored privately and can only be downloaded through authorised links by you and the team member assigned to your order.",
    whatYoullGetIntro:
      "Everything you receive, what is excluded, and what we need from you — all confirmed before you pay.",
    turnaround: "Turnaround",
    revisions: "Revisions",
    formats: "Accepted formats",
    revision: "{{count}} revision",
    revisionsCount: "{{count}} revisions",
    notFoundTitle: "Service not found",
    notFoundBody:
      "This service may have been unpublished or the link is incorrect.",
    notFoundCta: "Browse all services",
  },

  catalog: {
    "practical-lab-manual-support": {
      name: "Practical & Lab Manual Support",
      shortDescription:
        "Practical-record formatting, transcription, diagrams and manual preparation — softcopy or handwritten.",
    },
    "assignment-notes-support": {
      name: "Assignment & Notes Support",
      shortDescription:
        "Notes preparation, assignment formatting, proofreading and transcription at per-page rates.",
    },
    "project-documentation": {
      name: "Project Documentation",
      shortDescription:
        "Synopsis, mini-project and college project reports, SRS, diagrams and technical documentation.",
    },
    "presentation-viva-preparation": {
      name: "Presentation & Viva Preparation",
      shortDescription:
        "Slide decks, speaker notes, viva question sheets and one-to-one viva practice.",
    },
    "technical-research-support": {
      name: "Technical & Research Support",
      shortDescription:
        "Programming explanations, debugging guidance, project sessions and research-draft feedback.",
    },
    "printing-binding": {
      name: "Printing & Binding",
      shortDescription:
        "Print and bind lab manuals, project reports or notes — and the creation of the lab manual costs nothing.",
    },
  },

  pricingPage: {
    eyebrow: "Pricing",
    title: "Pay per work — transparent rates, quoted before you commit",
    description:
      "All prices are in Indian Rupees and are indicative starting rates. Complexity, length, deadline and requirements change the final amount, which you approve in writing before paying. There is no monthly subscription.",
    chips: [
      "No subscription",
      "Quotation before payment",
      "Handwritten or softcopy",
      "Bulk discounts where costs allow",
    ],
    featured: "How we bill",
    models: [
      {
        name: "Pay per work",
        tagline: "No subscription, no membership",
        description:
          "Every service is priced per task — per experiment, per page, per diagram, per slide or per session. You pay only for the work you request.",
        points: [
          "No recurring billing",
          "Per-item rates published",
          "Bulk orders may get 5–10% off",
          "Nothing charged before approval",
        ],
        cta: "Browse the catalogue",
      },
      {
        name: "Published starting price",
        tagline: "Know the floor before you ask",
        description:
          "Entry-level prices are shown on every service so you can judge the minimum cost before submitting a request. They apply only to eligible basic work.",
        points: [
          "Basic softcopy from ₹49",
          "Handwritten from ₹15 per page",
          "Basic presentation ₹99",
          "Final price confirmed before payment",
        ],
        cta: "See starting prices",
      },
      {
        name: "Custom quotation",
        tagline: "Priced after review",
        description:
          "Volume, complexity, handwriting effort, diagrams and deadline all move the price. We review your files and quote precisely instead of guessing.",
        points: [
          "Written scope and deliverables",
          "Handwritten vs softcopy stated",
          "Urgent delivery quoted separately",
          "Quote valid 7 days by default",
        ],
        cta: "Request a quote",
      },
    ],
    rateCardTitle: "Published rate card",
    rateCardNote:
      "Every row below is an indicative starting rate in INR. The quotation you receive is the price that applies.",
    startingPricesEyebrow: "Recommended starting prices",
    startingPricesHeading: "The minimum you can expect to pay",
    startingPricesSub:
      "These entry-level figures apply only to eligible basic work. The final price is always confirmed in your quotation before payment.",
    fullRateCard: "Full service rate card",
    fullRateCardSub:
      "Softcopy and handwritten columns are shown where both are offered. Open a service to see inclusions, exclusions, requirements and revision terms.",
    urgentTitle: "Urgent delivery",
    urgentBody:
      "Work required within 24 hours carries a 25–40% surcharge and is subject to availability. We confirm before starting.",
    noSubStrong: "Subscriptions are not offered.",
    noSubBody:
      "There is no monthly plan, membership or auto-renewal. Every order is quoted and paid separately, and nothing bills you automatically. Printing, binding and courier are optional and charged at actual cost.",
  },

  contactPage: {
    eyebrow: "Contact",
    title: "Talk to us before you commit",
    description:
      "Ask about scope, turnaround or pricing, or flag an issue with an existing order. Enquiries are answered within one working day.",
    formHeading: "Send an enquiry",
    formSub: "Fields marked with an asterisk are required.",
    name: "Full name",
    email: "Email address",
    phone: "Mobile number",
    category: "Category",
    message: "How can we help?",
    messageHint: "Avoid sharing personal documents here",
    messagePlaceholder:
      "Tell us about your requirement, deadline and any relevant details…",
    consent:
      "I agree to be contacted about this enquiry and have read the Privacy Policy.",
    submit: "Send enquiry",
    submitting: "Sending…",
    privacyNote: "Don't include payment details or passwords in messages.",
    successTitle: "Enquiry received",
    successBody:
      "Your reference is {{reference}}. We will reply to the email address you provided within one working day.",
    successAgain: "Send another enquiry",
    direct: "Direct contact",
    directEmail: "Email",
    whatsappLabel: "WhatsApp: {{phone}}",
    whatsappNote: "Optional channel — order records stay on the platform.",
    hours: "Mon–Sat, 10:00–19:00 IST",
    existing: "Existing order?",
    existingBody:
      "Message directly on the order so the conversation stays attached to your files and timeline. For payments, document access or privacy issues, raise a support ticket from your dashboard.",
    signIn: "Sign in",
    createAccount: "Create account",
    response: "Response expectations",
    expectation: {
      enquiries: "Enquiries: within 1 working day",
      quotation: "Quotation after complete requirements: 1–2 working days",
      tickets:
        "Support tickets: within 1 working day, urgent payment issues prioritised",
      privacy:
        "Privacy requests: acknowledged immediately, resolved within 30 days",
    },
    categories: [
      "Service enquiry",
      "Quotation request",
      "Existing order",
      "Payment or refund",
      "Document access",
      "Technical problem",
      "Privacy request",
      "Academic integrity question",
    ],
  },

  faqPage: {
    eyebrow: "FAQs",
    title: "Answers before you ask",
    description:
      "How ordering, quotations, files, payments, privacy and academic integrity work at Acadexa.",
    searchLabel: "Search FAQs",
    searchPlaceholder: "Search questions and answers…",
    clearSearch: "Clear search",
    all: "All topics",
    emptyTitle: "No answers match that search",
    emptyBody:
      "Try a different word, or contact us and we will answer directly.",
    emptyAction: "Clear search",
    stillStuck: "Still stuck?",
    stillStuckBody:
      "Send us the question with your order reference and we will reply within one working day.",
    contactCta: "Contact us",
  },

  faq: {
    groups: [
      { id: "services", label: "Services & ordering" },
      { id: "pricing", label: "Quotations & pricing" },
      { id: "files", label: "Files & delivery" },
      { id: "payments", label: "Payments & refunds" },
      { id: "privacy", label: "Privacy & documents" },
      { id: "integrity", label: "Academic integrity" },
    ],
    items: [
      {
        group: "services",
        q: "What services can I request?",
        a: "Six categories: practical and lab manual support, assignment and notes support, project documentation, presentation and viva preparation, technical and research support, and printing and binding. Each service page lists inclusions, exclusions, requirements, per-item rates and revision terms.",
      },
      {
        group: "services",
        q: "How do I place a request?",
        a: "Create a free student account, choose a service, submit your requirements with reference files and a deadline. You receive a reference number immediately and can track the request from your dashboard.",
      },
      {
        group: "services",
        q: "What counts as one page?",
        a: "Unless stated otherwise in your quotation, one page means one side of an A4 sheet.",
      },
      {
        group: "services",
        q: "Can I request something that is not in the catalogue?",
        a: "Choose the closest service and describe your requirement in detail, or contact us. If it can be supported within our academic-integrity rules, we will add it to a custom quotation.",
      },
      {
        group: "pricing",
        q: "Is lab manual creation really free?",
        a: "Creation is free when you print and bind that same lab manual through Acadexa — no creation charge is added to your order. The offer is conditional: printing, binding and delivery are charged at actual cost, and they are never free. If the manual is printed or bound elsewhere, creation is priced from the published lab manual rates like any other request.",
      },
      {
        group: "pricing",
        q: "How does pricing work?",
        a: "You pay per work — there is no subscription. Some services have published starting prices for a standard scope; others are quoted individually because effort depends on volume, complexity, source quality and deadline. In both cases you approve a written quotation before paying.",
      },
      {
        group: "pricing",
        q: "What does a quotation include?",
        a: "A quotation reference, the price and currency, the agreed scope, deliverable list, estimated completion date, included revisions, any additional charges, payment terms, and an expiry date (seven days by default).",
      },
      {
        group: "pricing",
        q: "What if I need to change the scope after accepting?",
        a: "Changes to an accepted quotation go through an explicit revision: we issue a new quotation version, and work continues only after you approve it. The earlier version stays on record for audit.",
      },
      {
        group: "pricing",
        q: "Do you offer discounts for bulk orders?",
        a: "A discount of approximately 5–10% may be offered when order size and costs allow. It is applied inside the quotation — it is never assumed automatically.",
      },
      {
        group: "pricing",
        q: "What if I need it within 24 hours?",
        a: "Urgent delivery within 24 hours carries a 25–40% surcharge and depends on availability. We confirm whether we can meet the slot before you pay.",
      },
      {
        group: "pricing",
        q: "What happens if a quotation expires?",
        a: "Expired quotations cannot be accepted. Contact us and we will re-issue an updated quotation with current availability and pricing.",
      },
      {
        group: "files",
        q: "Which file formats can I upload?",
        a: "PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, PNG, JPG and ZIP, up to the size limit shown on the upload form (10 MB per file by default). Format and size are validated on the server.",
      },
      {
        group: "files",
        q: "How do I receive the deliverable?",
        a: "Deliverables are uploaded to your order and become available in your dashboard. Downloads require an authenticated, authorised request — files are not reachable through public URLs.",
      },
      {
        group: "files",
        q: "Does handwritten work include delivery?",
        a: "Your quotation states whether handwritten work includes physical delivery or only scanned digital copies. Printing, binding and courier are charged at actual cost.",
      },
      {
        group: "files",
        q: "How many revisions do I get?",
        a: "Revision limits are stated in your quotation and on the service page — typically two or three, within the agreed scope and a defined period after delivery. Extra work outside the agreed scope is quoted separately.",
      },
      {
        group: "files",
        q: "What is the usual turnaround?",
        a: "Each service shows an estimated turnaround. After reviewing your requirements we confirm a delivery date in the quotation, which becomes the deadline we work to.",
      },
      {
        group: "payments",
        q: "Which payment methods are supported?",
        a: "Payments are processed through a payment gateway supporting the methods the provider offers in your region. We never receive or store raw card details.",
      },
      {
        group: "payments",
        q: "When is my order confirmed?",
        a: "Only after the payment is verified on our server — either through signature verification of the provider response or a signed webhook. A browser redirect back to our site does not by itself confirm a payment.",
      },
      {
        group: "payments",
        q: "Can I get a receipt?",
        a: "Yes. Every verified payment has a receipt with a reference, invoice number and verification timestamp, available in Payments & Receipts.",
      },
      {
        group: "payments",
        q: "What is the cancellation and refund policy?",
        a: "Before work begins, cancellations are refundable minus charges already incurred (such as gateway fees). After work has started, refunds are assessed against work completed. Refunds are processed to the original payment method and can take several business days to appear.",
      },
      {
        group: "privacy",
        q: "Who can see my documents?",
        a: "Only you and the specific team member assigned to your order. Administrators with a need to know can access files for support and quality checks, and those actions are logged.",
      },
      {
        group: "privacy",
        q: "How long is my data retained?",
        a: "Uploaded files are retained for 24 months by default and then purged automatically. Invoices and payment records are kept for the period required by tax law. You can request access, correction or deletion from your Privacy Center.",
      },
      {
        group: "privacy",
        q: "Do you share my information with third parties?",
        a: "Only with service providers required to operate the platform — payment processing, email delivery and hosting — and only to the extent necessary. Details are listed in the Privacy Policy.",
      },
      {
        group: "integrity",
        q: "Do you complete assignments for students?",
        a: "No. We provide tutoring, guidance, editing, formatting and feedback. Students remain responsible for their submissions and their institution’s rules. We do not fabricate data, write assessed submissions for you, or impersonate you.",
      },
      {
        group: "integrity",
        q: "What kind of help is not allowed?",
        a: "We do not complete assessed submissions for students, fabricate or alter experimental data, write theses or papers to be submitted as your own work, impersonate you in a viva, or help circumvent institutional rules.",
      },
    ],
  },

  auth: {
    loginTitle: "Welcome back",
    loginSub: "Sign in to track orders, quotations and deliverables.",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    fullName: "Full name",
    phone: "Mobile number",
    phoneHint: "Used only to contact you about an order.",
    remember: "Keep me signed in on this device",
    forgot: "Forgot password?",
    signIn: "Sign in",
    signingIn: "Signing in…",
    noAccount: "New to Acadexa?",
    createAccount: "Create an account",
    registerTitle: "Create your account",
    registerSub: "Free to create. You pay only for the work you approve.",
    haveAccount: "Already have an account?",
    terms:
      "I accept the Terms of Service and Privacy Policy, and the academic-integrity terms.",
    termsLink: "Terms of Service and Privacy Policy",
    passwordHint: "At least 8 characters. Mix letters, numbers and a symbol.",
    strength: { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" },
    creating: "Creating account…",
    create: "Create account",
    forgotTitle: "Reset your password",
    forgotSub:
      "Enter your email and we will send a reset link if the account exists.",
    sendLink: "Send reset link",
    sending: "Sending…",
    backToLogin: "Back to sign in",
    resetTitle: "Choose a new password",
    newPassword: "New password",
    updatePassword: "Update password",
    welcomeBack: "Welcome back, {{name}}",
    accountCreated: "Account created",
    resetSent: "If that address is registered, a reset link is on its way.",
    passwordUpdated: "Password updated — you can sign in now.",
  },

  validation: {
    email: "Enter a valid email address",
    passwordMin: "Use at least 8 characters",
    passwordsMatch: "Passwords do not match",
    termsRequired: "Please accept the Terms of Service and Privacy Policy",
    passwordRequired: "Enter your password",
    passwordShort: "Use at least 8 characters",
    passwordLong: "That password is too long",
    nameShort: "Please enter your full name",
    nameLong: "That name is too long",
    phoneRequired:
      "A mobile number is required so we can call you about an order",
    phoneInvalid:
      "Enter a valid mobile number — 10 digits, or include your country code",
    termsRequired: "Please accept the Terms of Service and Privacy Policy",
    passwordMismatch: "Passwords do not match",
    messageShort: "Please add a little more detail (20+ characters)",
    categoryRequired: "Choose a category",
    consentRequired: "Please confirm we may contact you about this enquiry",
    required: "This field is required",
  },

  status: {
    pending_review: "Pending Review",
    quotation_sent: "Quotation Sent",
    more_information_required: "More Information Required",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    delivered: "Delivered",
    revision_requested: "Revision Requested",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
    refund_pending: "Refund Pending",
    draft: "Draft",
    pending: "Pending",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired",
    revised: "Revised",
    verified: "Verified",
    failed: "Failed",
    refunded: "Refunded",

    created: "Created",
  },

  about: {
    eyebrow: "About Acadexa",
    title: "Built for students, run with integrity",
    description:
      "Acadexa is an academic support platform for practical manuals, assignments, project reports, presentations and technical or research help — plus printing, binding and doorstep delivery. Everything is billed per item with a written quotation you approve before paying.",
    integrityHeading: "Our academic-integrity promise",
    integrityBody:
      "We tutor, guide, edit, format and give feedback. We never complete assessed submissions for students, fabricate data, or impersonate anyone. You remain responsible for your submissions and the rules of your institution.",
    privacyHeading: "Your documents stay private",
    privacyBody:
      "Files are never on a public URL. Downloads require your authenticated session, and administrator access for support or quality checks is logged.",
  },

  howItWorks: {
    eyebrow: "How it works",
    title: "From request to delivery in five clear steps",
    description:
      "Every step is recorded against your order reference, so you always know what has been agreed and what happens next.",
    steps: [
      {
        title: "Choose a service",
        text: "Browse the catalogue, compare scope and starting prices, and open the service that fits.",
      },
      {
        title: "Share requirements",
        text: "Describe what you need, set a deadline and attach reference documents privately.",
      },
      {
        title: "Receive a quotation",
        text: "We review the request and send a written quotation with scope, price and revisions.",
      },
      {
        title: "Approve and pay",
        text: "Accept the quotation, verify the terms and complete payment through a verified gateway.",
      },
      {
        title: "Track to delivery",
        text: "Follow progress, message the team, download agreed deliverables and request revisions.",
      },
    ],
    cta: "See the full process",
  },

  policy: {
    title: "Privacy Policy",
    intro:
      "This privacy notice explains how Acadexa collects, uses and protects your personal information. It applies to the website, the dashboard and every order placed through the platform.",
    sections: [
      {
        title: "What we collect",
        text: "Name, email, phone, institution (optional), order details, uploaded documents, quotation and payment records, and device/session information needed to keep the site secure.",
      },
      {
        title: "How we use it",
        text: "To deliver your orders, send quotations and receipts, operate the platform, prevent misuse, and meet legal obligations. We never sell your data.",
      },
      {
        title: "Who sees your documents",
        text: "Only you and the team member assigned to your order. Administrators access files only for support or quality checks, and those actions are logged.",
      },
      {
        title: "Retention",
        text: "Uploaded files are kept for 24 months by default and then purged automatically. Invoices and payment records are kept for the period required by tax law.",
      },
      {
        title: "Your rights",
        text: "Access, correct, export or delete your data from the Privacy Center. We respond within 30 days.",
      },
      {
        title: "Contact",
        text: "Questions about this notice: use the Contact page or WhatsApp +91 98257 51614.",
      },
    ],
  },

  cookie: {
    banner: {
      title: "You choose what we store",
      body: "One essential cookie keeps you signed in — that one is required. Analytics and marketing are off until you turn them on, and rejecting them changes nothing about how the site works. Read our Privacy Policy.",
      acceptAll: "Accept all",
      rejectOptional: "Reject optional",
      customise: "Customise preferences",
      dismiss: "Dismiss and reject optional cookies",
    },
    preferences: {
      title: "Cookie preferences",
      description:
        "Choose how Acadexa may store information on this device. You can change this at any time.",
      alwaysOn: "Always on",
      optional: "Optional",
      whatThisCovers: "What this covers",
      hideDetails: "Hide details",
      link: "Cookie preferences",
      savedNotice: "Your choice is saved on this device. Last saved: {{date}}.",
      notYet: "not yet decided",
    },
    categories: {
      necessary: {
        name: "Essential",
        summary: "Keeps you signed in and the site working.",
        detail:
          "Session and security cookies that remember your login and protect the site. Cannot be switched off.",
      },
      analytics: {
        name: "Analytics",
        summary: "Helps us improve the site.",
        detail:
          "Anonymous usage statistics so we can fix problems and make the site easier to use.",
      },
      marketing: {
        name: "Marketing",
        summary: "Tells you about services and offers.",
        detail: "Information about Acadexa services you may find useful.",
      },
    },
    alwaysOn: "Always on",
    optional: "Optional",
  },

  notifications: {
    title: "Notifications",
    markAllRead: "Mark all read",
    caughtUp: "You're all caught up.",
  },

  error: {
    notFoundTitle: "Page not found",
    notFoundBody: "The link may be wrong or the page may have been removed.",
    notFoundCta: "Go to the homepage",
    somethingWentWrong: "Something went wrong.",
    retry: "Try again",
  },

  dashboard: {
    sections: {
      overview: "Overview",
      business: "Business",
      operations: "Operations",
      governance: "Governance",
      account: "Account",
    },
    items: {
      dashboard: "Dashboard",
      myOrders: "My Orders",
      quotations: "Quotations",
      paymentsReceipts: "Payments & Receipts",
      ordersRequests: "Orders & Requests",
      supportInbox: "Support Inbox",
      reviews: "Reviews",
      servicesPricing: "Services & Pricing",
      teamWorkload: "Team & Workload",
      reports: "Reports",
      privacyRequests: "Privacy Requests",
      auditLogs: "Audit Logs",
      systemSettings: "System Settings",
      documents: "Documents",
      messages: "Messages",
      consultations: "Consultations",
      supportTickets: "Support Tickets",
      privacyCenter: "Privacy Center",
      profileSettings: "Profile & Settings",
    },
    browseServices: "Browse services",
    searchOrders: "Search orders",
    publicSite: "Public site",
    accountSettings: "Account settings",
    signOut: "Sign out",
  },

  preloader: {
    title: "Acadexa",
    line1: "Your academic work, made simpler.",
    line2: "Getting everything ready…",
  },

  serviceCard: {
    customQuotation: "Custom quotation",
    limitedAvailability: "Limited availability",
  },

  priceTable: {
    caption: "Published price ranges by item",
    footnote:
      "Indicative ranges. Final price is confirmed in your quotation after review · one page = one side of an A4 sheet unless stated.",
  },
  /** Confirmation / status screens shared across enquiry, order and payment flows. */
  confirmation: {
    enquiryReceived: "Enquiry received",
    orderPlaced: "Order placed",
    paymentSuccess: "Payment confirmed",
    paymentPending: "Payment pending",
    paymentFailed: "Payment failed",
    referenceLabel: "Reference number",
    summary: "Summary",
    nextSteps: "What happens next",
    expectedResponse: "Expected response",
    viewOrder: "View order details",
    returnHome: "Return to homepage",
    contactWhatsApp: "Contact on WhatsApp",
    contactPhone: "Call us",
    keepReference:
      "Please save this reference number — you'll need it to track your enquiry or order.",
  },

  /** Timeline stages used on confirmation pages. */
  timeline: {
    enquiryReceived: "Enquiry received",
    requirementsReviewed: "Requirements reviewed",
    quotationShared: "Quotation shared",
    customerApproval: "Your approval",
    orderProcessing: "Order processing",
    deliverablesReady: "Deliverables ready",
    paymentVerified: "Payment verified",
    paymentAwaiting: "Awaiting your payment",
  },

  /** "What You'll Get" checklist section. */
  whatYoullGet: {
    heading: "What you'll get",
    deliverables: "Deliverables",
    revisions: "Revisions included",
    delivery: "Expected delivery",
    conditions: "Conditions",
    exclusions: "Not included",
    customerResponsibilities: "What we need from you",
    printCopy: "Printed and bound copy",
    digitalCopy: "Digital PDF copy",
    scannedCopy: "Scanned copy",
  },

  /** Contact form additions. */
  contactForm: {
    phone: "Mobile number",
    phonePlaceholder: "+91 98257 51614",
    phoneHint:
      "Required — we\'ll use it to discuss your enquiry and share quotations.",
    phoneRequired:
      "A mobile number is required so we can call you about an order.",
    phoneInvalid:
      "Enter a valid mobile number — 10 digits, or include your country code.",
    deadline: "Required by",
    deadlineLabel: "Deadline",
    deadlinePlaceholder: "Select a date",
    deadlineRequired: "Please choose when you need the work completed.",
    deadlinePast: "The deadline must be a future date.",
    fileUpload: "Attach files (optional)",
    fileUploadHint:
      "PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, PNG, JPG, ZIP — up to 10 MB each.",
    fileTooLarge: "One file exceeds 10 MB.",
    fileTypeRejected: "Some files were rejected (unsupported type).",
    duplicateSubmission:
      "Your enquiry is already being processed. Please wait.",
    submitting: "Sending your enquiry…",
  },

  /** Rupee formatting hints. */
  money: {
    perPage: "/page",
    startingFrom: "Starting from",
    quotedPerJob: "Quoted per job",
  },
  /** About page */
  about: {
    eyebrow: "About us",
    title: "A small, focused academic support practice",
    description:
      "Acadexa exists to make academic documentation, research support and technical guidance easier to access, easier to understand and safer to entrust — without crossing the line into doing a student's assessed work for them.",
    offerHeading: "Save time and money: your lab manual, created free",
    offerSub1:
      "A practical file is usually two jobs: writing it up, then getting it printed and bound. Acadexa combines them. When you place a printing and binding order for a lab manual with us, the creation of that manual costs nothing — the record is formatted, typed and assembled without a separate creation charge.",
    offerSub2:
      "That is the practical advantage: you spend once, on the printed copy you were going to need anyway, instead of paying for the write-up and then paying again to have it printed.",
    offerConditionStrong: "What is free, and what is not.",
    freeCreation: "Free creation",
    freeCreationDesc:
      "Formatting, typing and assembling the lab manual is included at no charge with a print and bind order.",
    printingBinding: "Printing & binding at actual cost",
    printingBindingDesc:
      "Pages, paper, colour and binding are quoted per job before anything is printed, so the printed copy is the only thing you pay for.",
    whatWeDo: "What we do",
    whatWeDo1:
      "Acadexa is an academic support and consultancy platform. Students submit a request describing what they need — a laboratory manual formatted to department standards, guidance on a research question, editing for a manuscript, a project report aligned to a university template, slides and viva preparation, or a technical debugging session.",
    whatWeDo2:
      "Every request is reviewed before it is accepted, priced in writing, and tracked from submission to delivery inside a single order record. Reference documents are stored privately and shared only with the person assigned to that order.",
    whatWeDo3:
      "We operate as a small practice and deliberately keep the scope narrow: work we can do well, with clear limits, documented in advance. As the practice grows, consultants and support staff are added under the same access rules and confidentiality obligations.",
    ourMission: "Our mission",
    missionText:
      "Give students organised, transparent and responsible academic support so that documentation and formatting stop consuming the time meant for learning.",
    ourVision: "Our vision",
    visionText:
      "To be a trustworthy consultancy students return to — known for clear terms, careful handling of private documents and guidance that respects academic rules.",
    servicePhilosophy: "Service philosophy",
    howWeDecide: "How we decide what we will and won't take on",
    honestyNote: "A note on honesty",
    honestyText:
      "This page deliberately contains no invented company history, fictional team members, unverified qualifications or fabricated success statistics. What is described here reflects how the platform actually operates today.",
    browseServices: "Browse services",
    contactUs: "Contact us",
  },

  /** How it works page */
  howItWorks: {
    eyebrow: "How it works",
    title: "A documented process from first request to final delivery",
    description:
      "Each order moves through validated stages. The platform records who did what and when, so the agreed scope, price and delivery date always have a reference.",
    availableStages: "Available order stages",
    stagesNote:
      "Not every order uses every stage — a fixed-price service may skip straight from confirmation to delivery. The backend validates which transitions are permitted and records a timestamp and actor for each one.",
    readyToStart: "Ready to start?",
    readySub:
      "Create an account, submit a request and receive a written quotation.",
    getStarted: "Get started",
    browseServices: "Browse services",
    privacyStep: "Privacy at every step",
    privacyText:
      "Files are private by default; access is checked on the server for every download, not just in the interface.",
    deadlineStep: "Deadlines in writing",
    deadlineText:
      "The confirmed delivery date replaces estimates. Any change is recorded and notified.",
    transparentStep: "Transparent terms",
    transparentText:
      "Scope, revisions, payment terms and refund conditions are all visible before you approve.",
    step1Title: "Select a service",
    step1Detail:
      "Compare the catalogue, read the included and excluded work, and confirm the service matches what you need.",
    step1Note:
      "Service pages state requirements and revision terms before you start.",
    step2Title: "Submit requirements",
    step2Detail:
      "Describe the task, set your deadline, choose your preferred communication channel and attach reference documents privately.",
    step2Note:
      "Uploads are validated for type and size, and stored outside the public web root.",
    step3Title: "Receive a quotation",
    step3Detail:
      "Your request is reviewed. We may ask for clarification, then send a written quotation with scope, deliverables, price and revisions.",
    step3Note:
      "Quotations carry a reference, an expiry date and a recorded version history.",
    step4Title: "Approve scope & terms",
    step4Detail:
      "Accept or decline in one click. Acceptance is recorded with a timestamp, and any later change needs a fresh approval.",
    step4Note: "Payment is only requested after the scope is approved.",
    step5Title: "Track until delivery",
    step5Detail:
      "Follow the timeline, message the team on the order, then download the agreed deliverables from your dashboard.",
    step5Note:
      "Deliverables are versioned; earlier versions remain accessible.",
    step6Title: "Request revisions",
    step6Detail:
      "If something falls short of the agreed scope, request a revision within the stated limit and period.",
    step6Note: "Limits come from the quotation, never unbounded.",
  },

  /** FAQ page */
  faqPage: {
    eyebrow: "FAQs",
    title: "Answers to the questions that come up most",
    description:
      "Search across every answer, or filter by topic. If your question isn't covered, our support inbox is one click away.",
    searchPlaceholder: "Search FAQs…",
    clearSearch: "Clear search",
    stillNeedHelp: "Still need help?",
    stillNeedHelpSub:
      "Send a message, or raise a ticket from your dashboard once you're signed in.",
    contactUs: "Contact us",
    supportTickets: "Support tickets",
    noAnswersMatched: "No answers matched",
    noAnswersSub:
      "Try a broader search term, or contact support and we'll answer directly.",
  },

  /** Auth pages */
  auth: {
    signInTitle: "Sign in to your account",
    signInSub:
      "Access your requests, quotations, deliverables and order history.",
    newAccount: "New to Acadexa?",
    createAccount: "Create an account",
    welcomeBack: "Welcome back, {{name}}",
    signInButton: "Sign in",
    createAccountTitle: "Create your student account",
    createAccountSub:
      "Free to create. You only pay after approving a written quotation.",
    alreadyHaveAccount: "Already have an account?",
    signInLink: "Sign in",
    fullName: "Full name",
    namePlaceholder: "Aarav Patel",
    nameHint: "Used for order updates",
    emailAddress: "Email address",
    emailPlaceholder: "you@college.edu",
    mobileNumber: "Mobile number",
    phonePlaceholder: "+91 98765 43210",
    phoneHint:
      "So the team can call you about a live order — never shared with other students",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPassword: "Confirm password",
    confirmPlaceholder: "Re-enter your password",
    passwordStrength: ["Very weak", "Weak", "Fair", "Good", "Strong"],
    termsAgree:
      "I agree to the Terms of Service, Privacy Policy and Academic Integrity Policy.",
    createAccountButton: "Create account",
    dataNote:
      "We collect only your name and email to start. Extra profile details stay optional.",
    keepSignedIn: "Keep me signed in on this device (90 days)",
    forgotPassword: "Forgot password?",
    forgotPasswordTitle: "Forgot password",
    resetPasswordTitle: "Reset password",
    emailForReset: "Email address",
    resetLinkSent:
      "If an account exists for that email, a reset link has been sent.",
    setNewPassword: "Set new password",
    newPasswordPlaceholder: "New password",
    confirmNewPassword: "Confirm new password",
    resetButton: "Reset password",
    createAccountSuccess: "Account created — welcome to Acadexa",
    demoAccount: "Demo student account (seeded): {{email}} / {{password}}",
    staffAccounts: "Staff and administrator accounts are issued separately.",
  },

  /** Common */
  common: {
    from: "from {{price}}",
    details: "Details",
    additionalCharges: "Additional charges",
    somethingWentWrong: "Something went wrong. Please try again.",
  },

  /** Validation messages */
  validation: {
    nameShort: "Please enter your full name",
    email: "Enter a valid email address",
    categoryRequired: "Please select a service category",
    messageShort:
      "Please tell us more about your requirement (at least 20 characters)",
    consentRequired: "Please consent to proceed",
    passwordMin: "Use at least 8 characters",
    passwordsMatch: "Passwords do not match",
    termsRequired: "Please accept the Terms of Service and Privacy Policy",
    passwordRequired: "Please enter your password",
  },
};
