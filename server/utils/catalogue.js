/**
 * Service catalogue derived from the published pricing sheet (INR, pay-per-work).
 * Prices are indicative starting rates; the final amount is confirmed in a quotation.
 * `priceTable` rows keep the sheet's softcopy / handwritten columns as display strings so
 * ranges survive intact; `startingPrice` holds the lowest numeric figure for sorting and
 * "from" badges.
 */

const NA = '—';

export const PRICING_POLICIES = [
  { heading: 'Pay per work', text: 'There is no monthly subscription or membership. You pay only for the service you request.' },
  { heading: 'Quotation first', text: 'Custom orders are priced only after we review your requirements and uploaded files.' },
  { heading: 'Approval before payment', text: 'You approve the final quotation before any payment is made. The agreed amount does not change without your fresh approval.' },
  { heading: 'Page definition', text: 'Unless otherwise specified, one page means one side of an A4 sheet.' },
  { heading: 'Handwritten work', text: 'Your quotation states whether handwritten work includes physical delivery or only scanned digital copies.' },
  { heading: 'Bulk orders', text: 'A discount of approximately 5–10% may be offered where order size and costs allow. It is applied in the quotation, not automatically.' },
  { heading: 'Revisions', text: 'Corrections within the agreed scope follow the confirmed order terms. New requirements may attract additional charges.' },
  { heading: 'Free lab manual creation', text: 'Lab manual creation is free only when the same manual is printed and bound through Acadexa. Printing, binding, courier and delivery are charged at actual cost and are never included in the free offer.' },
  { heading: 'Academic integrity', text: 'Services cover guidance, editing, formatting, transcription, explanation and feedback. Prohibited assessed submissions are not completed on your behalf.' },
];

export const ADDITIONAL_CHARGES = [
  { label: 'Urgent delivery within 24 hours', charge: '25–40% extra' },
  { label: 'Detailed handwritten diagram', charge: '₹20–₹50 each' },
  { label: 'Printing', charge: 'Actual cost' },
  { label: 'Binding', charge: 'Actual cost' },
  { label: 'Courier or delivery', charge: 'Actual cost' },
  { label: 'Revision beyond the agreed scope', charge: 'Separate quotation' },
];

export const STARTING_PRICES = [
  { label: 'Basic softcopy service', price: '₹49' },
  { label: 'Handwritten work', price: '₹15 per page' },
  { label: 'Basic presentation (5–8 slides)', price: '₹99' },
  { label: 'Basic school practical file', price: '₹250' },
  { label: 'Basic project-documentation service', price: '₹149' },
];

const money = (low, high) => (high && high !== low ? `₹${low}–₹${high}` : `₹${low}`);

const row = (item, softLow, softHigh, handLow, handHigh, extra = {}) => ({
  item,
  softcopy: softLow == null ? NA : money(softLow, softHigh),
  handwritten: handLow == null ? NA : money(handLow, handHigh),
  ...extra,
});

export const CATALOGUE = [
  {
    name: 'Practical & Lab Manual Support',
    slug: 'practical-lab-manual-support',
    category: 'Practical & Lab Manuals',
    icon: 'ClipboardCheck',
    shortDescription: 'Practical-record formatting, transcription, diagrams and manual preparation — softcopy or handwritten.',
    description:
      'Support for practical records and laboratory manuals: procedure write-ups, observation tables, calculations, diagrams and complete files. Work is prepared from the readings and material you supply, formatted to your institution\'s record book. Choose softcopy delivery (typed, print-ready) or handwritten work; the quotation states whether handwritten work includes physical delivery or scanned copies only.',
    pricingModel: 'quotation',
    startingPrice: 10,
    turnaroundEstimate: '2–5 working days',
    revisionLimit: 2,
    revisionPolicy: 'Two corrections within the agreed scope in 7 days of delivery. New experiments, extra diagrams or format changes are quoted separately.',
    acceptedFormats: ['PDF', 'DOCX', 'XLSX', 'Images of handwritten notes'],
    included: [
      'Procedure, theory and result sections formatted to your record book',
      'Observation tables, calculations and error discussion',
      'Diagrams and flowcharts (charged per diagram where applicable)',
      'Complete practical file assembly with index and page numbers',
      'Typing and formatting of an existing manual at per-page rates',
      'No charge for creating the manual when the same manual is printed and bound through Acadexa',
    ],
    excluded: [
      'Fabricating experimental readings',
      'Performing the practical on your behalf',
      'Printing, binding, courier and delivery charges (billed at actual cost — never free)',
      'Free creation when the manual is printed or bound somewhere else',
    ],
    requirements: [
      'Your raw observations and readings',
      'Institution record-book format or sample page',
      'Experiment list and syllabus copy',
      'Preferred delivery: softcopy or handwritten',
    ],
    priceNote: 'Per-experiment, per-diagram and per-page rates are shown below. Handwritten prices assume identical content; delivery of physical copies is quoted separately. Lab manual creation is free when you print and bind that same manual through Acadexa — printing and binding are charged at actual cost.',
    priceTable: [
      row('Simple school practical (per experiment)', 15, 25, 30, 45),
      row('College practical (per experiment)', 25, 40, 40, 70),
      row('Technical / code-based practical (per experiment)', 35, 60, 60, 100),
      row('Diagram or flowchart (each)', 10, 25, 20, 40),
      row('Complete school practical file', 99, 249, 250, 500),
      row('Complete college practical file', 199, 499, 500, 1000),
      row('Typing and formatting an existing manual (per page)', 10, 20, null, null),
    ],
  },

  {
    name: 'Assignment & Notes Support',
    slug: 'assignment-notes-support',
    category: 'Assignments & Notes',
    icon: 'FileText',
    shortDescription: 'Notes preparation, assignment formatting, proofreading and transcription at per-page rates.',
    description:
      'Support with notes, assignment formatting, proofreading and transcription. Send the source material — handwritten pages, a rough draft or supplied content — and receive clean, consistently formatted notes or assignments. Transcription is limited to material you own or are authorised to use.',
    pricingModel: 'quotation',
    startingPrice: 8,
    turnaroundEstimate: '1–4 working days',
    revisionLimit: 2,
    revisionPolicy: 'Two corrections within the agreed scope in 7 days of delivery. Additional pages or re-typing after acceptance are charged at the per-page rate.',
    acceptedFormats: ['PDF', 'DOCX', 'TXT', 'Images of handwritten pages'],
    included: [
      'Typing from handwritten notes or supplied material',
      'Consistent headings, spacing and page layout',
      'Language proofreading and punctuation correction',
      'Condensed revision notes (5-page sets)',
    ],
    excluded: [
      'Writing assessed assignments for submission as your own work',
      'Answering examination questions during an active assessment',
      'Scanning or postage of physical pages',
    ],
    requirements: [
      'Source pages or draft file clearly legible',
      'Page count and required format',
      'Handwriting legibility notes if applicable',
      'Deadline and preferred delivery format',
    ],
    priceNote: 'One page means one side of an A4 sheet unless stated otherwise. Handwritten output is scanned unless physical delivery is agreed in the quotation.',
    priceTable: [
      row('Simple school notes (per page)', 8, 15, 15, 25),
      row('College notes (per page)', 10, 20, 20, 35),
      row('Assignment formatting (per page)', 8, 15, 15, 25),
      row('Proofreading (per page)', 10, 20, 15, 30),
      row('Typing from handwritten notes (per page)', 10, 20, null, null),
      row('Revision notes (5 pages)', 49, 99, 100, 175),
      row('Transcription from supplied material (per page)', 8, 15, 15, 25),
    ],
  },

  {
    name: 'Project Documentation',
    slug: 'project-documentation',
    category: 'Project Documentation',
    icon: 'BookOpen',
    shortDescription: 'Synopsis, mini-project and college project reports, SRS, diagrams and technical documentation.',
    description:
      'Documentation support for your own project work: synopsis, report structure, SRS, diagrams and technical documentation written from the material and results you provide. Formatting follows your university template. Custom development, research-heavy documentation and complex diagrams are quoted separately.',
    pricingModel: 'quotation',
    startingPrice: 20,
    turnaroundEstimate: '4–10 working days',
    revisionLimit: 3,
    revisionPolicy: 'Three corrections within the agreed scope in 10 days of delivery. Content expansion or additional diagrams are re-quoted.',
    acceptedFormats: ['DOCX', 'PDF', 'ZIP with assets', 'Images'],
    included: [
      'Synopsis and chapter structuring to your format',
      'SRS and technical documentation drafting from your inputs',
      'ER diagrams and flowcharts (per diagram)',
      'Figure/table numbering, references and front matter',
    ],
    excluded: [
      'Producing results or experiments you did not obtain',
      'Complete software development (quoted separately)',
      'Printing, binding or courier',
    ],
    requirements: [
      'Project brief, synopsis or draft chapters',
      'University format document',
      'Results, screenshots or datasets',
      'Page target and deadline',
    ],
    priceNote: 'Page bands follow the published sheet. Research-heavy or custom-development requests require a separate quotation.',
    priceTable: [
      row('Basic project synopsis', 99, 199, 150, 300),
      row('Mini-project report (10–20 pages)', 149, 299, 250, 500),
      row('College project report (30–50 pages)', 299, 699, 600, 1200),
      row('Software Requirements Specification (SRS)', 199, 499, 400, 800),
      row('ER diagram or flowchart (each)', 20, 50, 30, 70),
      row('Project-report formatting', 99, 299, null, null),
      row('Technical documentation (10 pages)', 149, 399, 300, 600),
    ],
  },

  {
    name: 'Presentation & Viva Preparation',
    slug: 'presentation-viva-preparation',
    category: 'Presentation & Viva',
    icon: 'Presentation',
    shortDescription: 'Slide decks, speaker notes, viva question sheets and one-to-one viva practice.',
    description:
      'Presentation and viva support built from your own submission: clean slide structure, speaker notes you can actually say out loud, a viva question sheet with guidance, and a one-to-one practice session where you defend your own work.',
    pricingModel: 'quotation',
    startingPrice: 49,
    turnaroundEstimate: '1–4 working days',
    revisionLimit: 2,
    revisionPolicy: 'Two rounds of slide or notes corrections within the agreed scope. Additional slides are charged per the published bands.',
    acceptedFormats: ['PDF', 'PPTX', 'DOCX'],
    included: [
      'Slide design and visual hierarchy to the agreed slide count',
      'Speaker notes for each slide',
      'Viva question sheet (20 questions) with guidance',
      'One-to-one viva practice session (30 minutes)',
    ],
    excluded: [
      'Attending the viva or presentation on your behalf',
      'Slide templates licensed to your institution',
    ],
    requirements: [
      'Report, synopsis or draft content',
      'Required slide count and time limit',
      'Institution slide template if prescribed',
      'Preferred slot for the practice session',
    ],
    priceNote: 'Handwritten output is not offered for presentations. Practice sessions are booked separately in the Consultations area.',
    priceTable: [
      row('Basic presentation (5–8 slides)', 99, 149, null, null),
      row('College presentation (10–15 slides)', 149, 299, null, null),
      row('Project presentation (15–20 slides)', 249, 499, null, null),
      row('Speaker notes for a presentation', 49, 99, null, null),
      row('Viva preparation sheet (20 questions)', 49, 99, 100, 180),
      row('One-to-one viva practice (30 minutes)', 99, 199, null, null),
    ],
  },

  {
    name: 'Technical & Research Support',
    slug: 'technical-research-support',
    category: 'Technical & Research',
    icon: 'Microscope',
    shortDescription: 'Programming explanations, debugging guidance, project sessions and research-draft feedback.',
    description:
      'Technical and research support focused on your understanding: concept explanations, debugging guidance, project setup help, research-paper formatting and feedback on research drafts. You keep authorship; we explain, review and format. Pricing depends on subject, complexity and the amount of review required.',
    pricingModel: 'quotation',
    startingPrice: 29,
    turnaroundEstimate: '2–6 working days',
    revisionLimit: 2,
    revisionPolicy: 'Two corrections within the agreed scope. Deeper review or additional questions are re-quoted.',
    acceptedFormats: ['ZIP', 'PDF', 'DOCX', 'TXT', 'Screenshots'],
    included: [
      'Programming concept explanations and code review',
      'Debugging guidance for small coding issues',
      'Project setup or deployment guidance',
      'Research-paper and research-presentation formatting',
      'Proofreading a research draft up to 5 pages',
      'Research-methodology consultation session',
    ],
    excluded: [
      'Completing assessed assignments or writing the paper for you',
      'Fabricating data, citations or experimental results',
      'Guaranteeing publication or acceptance',
    ],
    requirements: [
      'Code snapshot, error description or draft',
      'Language, framework or subject area',
      'What you have already tried',
      'Preferred session slot for consultations',
    ],
    priceNote: 'Per-question and per-session rates are shown below. Work beyond the stated scope is quoted after review.',
    priceTable: [
      row('Programming concept explanation (per question)', 29, 79, null, null),
      row('Small coding-issue debugging guidance', 49, 149, null, null),
      row('Project guidance session (30 minutes)', 99, 199, null, null),
      row('Project setup or deployment guidance', 149, 399, null, null),
      row('Research-paper formatting', 99, 299, null, null),
      row('Proofreading a research draft (up to 5 pages)', 99, 199, null, null),
      row('Research presentation formatting', 149, 299, null, null),
      row('Research-methodology consultation (30 minutes)', 149, 299, null, null),
    ],
  },
  {
    name: 'Printing & Binding',
    slug: 'printing-binding',
    category: 'Printing & Binding',
    icon: 'Printer',
    shortDescription: 'Print and bind lab manuals, project reports or notes — and the creation of the lab manual costs nothing.',
    description:
      'Send a print-ready file, or let us create the lab manual first, then choose paper, colour and binding and collect from campus or have it delivered. Printing and binding are charged at actual cost for the pages and binding type you choose, and are quoted per job before anything is printed. The one free part is the creation of the lab manual itself: when the manual you asked us to create is printed and bound through Acadexa, no creation charge is added to the order.',
    pricingModel: 'quotation',
    startingPrice: 0,
    turnaroundEstimate: '1–3 working days',
    revisionLimit: 1,
    revisionPolicy: 'Printing is repeated free of charge where the fault is ours (misprint, wrong binding, missing pages). Reprints caused by a changed file or a new page count are quoted again.',
    acceptedFormats: ['PDF', 'DOCX', 'Images of handwritten notes'],
    included: [
      'Black & white or colour printing on the paper you choose, per page',
      'Spiral, soft or hard binding, quoted per copy',
      'Free creation of the lab manual when the same manual is printed and bound here',
      'Page-count and margin check before printing, so nothing is cut off at the binding edge',
      'Campus pickup or courier, quoted at actual cost',
    ],
    excluded: [
      'Free printing or free binding — both are always charged at actual cost',
      'Free creation when the manual is printed or bound by someone else',
      'Copyrighted material supplied without the right to reproduce it',
    ],
    requirements: [
      'A print-ready PDF, or a request for us to create the lab manual first',
      'Page count, paper preference, colour or black & white',
      'Binding type and number of copies',
      'Pickup or delivery address and deadline',
    ],
    priceNote: 'Printing and binding are quoted per job at actual cost — the only free element is lab manual creation, and only when that manual is printed and bound through Acadexa.',
    priceTable: [
      { item: 'Printing — black & white (per page)', softcopy: 'Actual cost', handwritten: '—', note: 'Depends on paper, sides and volume' },
      { item: 'Printing — colour (per page)', softcopy: 'Actual cost', handwritten: '—', note: 'Depends on paper, sides and volume' },
      { item: 'Spiral binding (per copy)', softcopy: 'Actual cost', handwritten: '—', note: 'Quoted per copy' },
      { item: 'Soft or hard binding (per copy)', softcopy: 'Actual cost', handwritten: '—', note: 'Quoted per copy' },
      { item: 'Lab manual creation, with a print & bind order', softcopy: 'Free', handwritten: '—', note: 'Creation only — printing and binding are charged' },
    ],
  },
];

/** Slugs from the earlier catalogue that are retired by this price sheet. */
export const RETIRED_SLUGS = [
  'laboratory-manual-support',
  'practical-documentation',
  'research-guidance',
  'research-paper-editing',
  'proofreading-formatting',
  'programming-guidance',
  'technical-consultancy',
  'personalized-academic-consultation',

];
