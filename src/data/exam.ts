/**
 * Examination structure and logistics, condensed from the official
 * CIPS Examination Information Bulletin (WIP Board of Examination).
 * Shown in the Introduction section.
 */

export interface ExamPart {
  key: '1' | '2A' | '2B'
  name: string
  format: string
  duration: string
  weight: number
  summary: string
  details: string[]
}

export const EXAM_PARTS: ExamPart[] = [
  {
    key: '1',
    name: 'Part 1 — Theoretical Examination',
    format: '100 four-option multiple-choice questions',
    duration: '2 hours',
    weight: 20,
    summary:
      'A written MCQ paper covering ultrasound physics and equipment, musculoskeletal and spine anatomy, patient safety, image documentation, and the full breadth of chronic pain assessment and management.',
    details: [
      'Single-best-answer format, four options per question',
      'Content spans general ultrasound knowledge and chronic pain medicine',
      'Covers every procedure and clinical topic in the syllabus outline',
    ],
  },
  {
    key: '2A',
    name: 'Part 2A — Practical Examination',
    format: '4 procedures on a fresh cadaver, assessed by 2 examiners',
    duration: '60 minutes (15 min per procedure)',
    weight: 60,
    summary:
      'Candidates perform one procedure from each of four regions — spine, peripheral nerves, musculoskeletal joints, and musculoskeletal soft tissue — under live ultrasound guidance.',
    details: [
      'One procedure drawn from each of the four regions',
      'Performed on a fresh cadaver with ultrasound machine and instruments provided',
      'Each examiner scores every procedure independently',
      'The heaviest-weighted component of the composite score',
    ],
  },
  {
    key: '2B',
    name: 'Part 2B — Oral Examination',
    format: 'Extended medical vignette, questioned by 2 examiners',
    duration: 'Structured viva',
    weight: 20,
    summary:
      'An individual oral examination built around an extended clinical vignette, testing clinical reasoning, anatomical knowledge, equipment handling, and physical examination.',
    details: [
      'Sixteen defined viva topic areas, from cervical radicular pain to carpal tunnel syndrome',
      'Assesses reasoning and decision-making rather than recall alone',
      'The only part of the examination that may be conducted in a language other than English',
    ],
  },
]

export const SCORING = {
  description:
    'The final score is a criterion-referenced, weighted composite across all three parts.',
  weights: [
    { label: 'Part 2A — Practical (cadaver)', value: 60 },
    { label: 'Part 2B — Oral', value: 20 },
    { label: 'Part 1 — Written', value: 20 },
  ],
  retakePolicy:
    'There is no limit on attempts, but after three unsuccessful attempts a candidate must complete one additional year of practice before reapplying.',
}

export const ELIGIBILITY: { title: string; summary: string }[] = [
  {
    title: 'Medical licensure',
    summary: 'All licences to practise medicine must be valid, unrestricted and current at the time of the examination.',
  },
  {
    title: 'Residency training',
    summary: 'Satisfactory completion of a four-year ACGME-accredited residency (or international equivalent) that included pain management.',
  },
  {
    title: 'Board certification',
    summary: 'Current certification by an ABMS member board, or by an equivalent national specialist board in the country of residence.',
  },
  {
    title: 'Ultrasound training',
    summary: 'Formal ultrasound-in-pain-medicine training during residency/fellowship, or 20 Category-1 CME credits in pain medicine or musculoskeletal ultrasonography from an approved provider.',
  },
  {
    title: 'Clinical practice experience',
    summary: 'At least 12 months of clinical practice in pain medicine after residency; a 12-month pain fellowship may count toward this requirement.',
  },
  {
    title: 'Ethical and professional standing',
    summary: 'Two letters of recommendation from practising physicians and declarations covering licensure, privileges, conduct and health.',
  },
  {
    title: 'Declaration and consent',
    summary: 'Signed declaration and consent as set out in the CIPS examination application.',
  },
]

export const APPLICATION_NOTES: string[] = [
  'Applications are submitted through the online eCIPS system with all supporting documentation.',
  'Photo identification is required at the registration desk on examination day.',
  'Candidates must sit the examination within 2 years or 4 examination cycles of the original application, after which the fee is forfeited.',
  'Failing candidates receive a diagnostic report showing performance on each of the three parts.',
]
