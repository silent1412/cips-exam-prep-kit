/**
 * CIPS syllabus topic index — aligned with work/site-integration/topic-map.json.
 * IDs are stable server IDs; do not renumber.
 */

export type SyllabusGroup =
  | 'general'
  | 'chronic-pain'
  | 'spine'
  | 'nerves'
  | 'musculoskeletal'
  | 'viva'

export interface SyllabusTopic {
  id: string
  title: string
  group: SyllabusGroup
}

export const GROUP_LABELS: Record<SyllabusGroup, string> = {
  general: 'General knowledge',
  'chronic-pain': 'Chronic pain',
  spine: 'Spine',
  nerves: 'Peripheral nerves',
  musculoskeletal: 'Musculoskeletal',
  viva: 'Viva topics',
}

function topic(id: string, title: string): SyllabusTopic {
  const group = title.split(':')[0].toLowerCase().replace(/\s+/g, '-') as SyllabusGroup
  return { id, title, group }
}

export const SYLLABUS: SyllabusTopic[] = [
  ['syllabus-0', 'General knowledge: ultrasound physics and principles'],
  ['syllabus-1', 'General knowledge: musculoskeletal and spine anatomy'],
  ['syllabus-2', 'General knowledge: ultrasound equipment and handling'],
  ['syllabus-3', 'General knowledge: patient safety and image documentation'],
  ['syllabus-4', 'Chronic pain: syndromes, assessment and clinical reasoning'],
  ['syllabus-5', 'Chronic pain: treatment guidelines and therapeutic modalities'],
  ['syllabus-6', 'Chronic pain: multidisciplinary care and alternative treatments'],
  ['syllabus-7', 'Spine: cervical medial branch block'],
  ['syllabus-8', 'Spine: cervical selective nerve root block'],
  ['syllabus-9', 'Spine: thoracic medial branch / facet joint block'],
  ['syllabus-10', 'Spine: lumbar medial branch / facet joint block'],
  ['syllabus-11', 'Spine: lumbar selective nerve root block'],
  ['syllabus-12', 'Spine: subarachnoid injection'],
  ['syllabus-13', 'Spine: caudal epidural injection'],
  ['syllabus-14', 'Spine: sacroiliac joint injection'],
  ['syllabus-15', 'Nerves: cervical sympathetic trunk'],
  ['syllabus-16', 'Nerves: suprascapular nerve'],
  ['syllabus-17', 'Nerves: ilioinguinal / iliohypogastric nerve'],
  ['syllabus-18', 'Nerves: greater occipital nerve'],
  ['syllabus-19', 'Nerves: median nerve at wrist'],
  ['syllabus-20', 'Nerves: ulnar nerve at cubital canal'],
  ['syllabus-21', 'Nerves: intercostal nerve'],
  ['syllabus-22', 'Nerves: saphenous nerve above knee'],
  ['syllabus-23', 'Nerves: tibial nerve at tarsal canal'],
  ['syllabus-24', 'Nerves: pudendal nerve'],
  ['syllabus-25', 'Nerves: lateral femoral cutaneous block'],
  ['syllabus-26', 'Musculoskeletal: AC joint'],
  ['syllabus-27', 'Musculoskeletal: biceps tendon (peri)'],
  ['syllabus-28', 'Musculoskeletal: glenohumeral joint'],
  ['syllabus-29', 'Musculoskeletal: subdeltoid bursa'],
  ['syllabus-30', 'Musculoskeletal: elbow joint'],
  ['syllabus-31', 'Musculoskeletal: epicondylosis tendon sheath injection / fenestration'],
  ['syllabus-32', 'Musculoskeletal: first MCP joint'],
  ['syllabus-33', 'Musculoskeletal: piriformis injection'],
  ['syllabus-34', 'Musculoskeletal: hip joint injection'],
  ['syllabus-35', 'Musculoskeletal: trochanteric bursa, sub-gluteus maximus, medius and minimus'],
  ['syllabus-36', 'Musculoskeletal: knee joint injection'],
  ['syllabus-37', 'Musculoskeletal: distal ITB peritendon injection'],
  ['syllabus-38', 'Musculoskeletal: tibiotalar joint injection'],
  ['syllabus-39', 'Musculoskeletal: subtalar joint injection'],
  ['syllabus-40', 'Musculoskeletal: first MTP injection'],
  ['syllabus-41', 'Viva: peripheral nerve injury'],
  ['syllabus-42', 'Viva: headache'],
  ['syllabus-43', 'Viva: cervical radicular pain'],
  ['syllabus-44', 'Viva: cervical facet pain'],
  ['syllabus-45', 'Viva: occipital neuralgia'],
  ['syllabus-46', 'Viva: shoulder pain'],
  ['syllabus-47', 'Viva: thoracic pain'],
  ['syllabus-48', 'Viva: lumbosacral radicular pain'],
  ['syllabus-49', 'Viva: lumbar facet pain'],
  ['syllabus-50', 'Viva: sacroiliac joint pain'],
  ['syllabus-51', 'Viva: knee pain'],
  ['syllabus-52', 'Viva: hip pain'],
  ['syllabus-53', 'Viva: carpal tunnel syndrome'],
  ['syllabus-54', 'Viva: meralgia paresthetica'],
  ['syllabus-55', 'Viva: foot pain'],
  ['syllabus-56', 'Viva: musculoskeletal pain and disability'],
].map(([id, title]) => topic(id, title))

export function topicById(id: string): SyllabusTopic | undefined {
  return SYLLABUS.find((t) => t.id === id)
}

/** Short label without the group prefix, e.g. "suprascapular nerve" */
export function topicShortTitle(t: SyllabusTopic): string {
  const i = t.title.indexOf(':')
  return i === -1 ? t.title : t.title.slice(i + 1).trim()
}

/**
 * Part 2A regions — one procedure is drawn from each region in the
 * practical examination (bulletin, Examination Description).
 */
export const PART_2A_REGIONS: { label: string; topicIds: string[] }[] = [
  {
    label: 'Spine',
    topicIds: ['syllabus-7', 'syllabus-8', 'syllabus-9', 'syllabus-10', 'syllabus-13'],
  },
  {
    label: 'Peripheral nerves',
    topicIds: ['syllabus-16', 'syllabus-17', 'syllabus-24', 'syllabus-20', 'syllabus-25'],
  },
  {
    label: 'Musculoskeletal — joints',
    topicIds: ['syllabus-26', 'syllabus-28', 'syllabus-34', 'syllabus-36', 'syllabus-38'],
  },
  {
    label: 'Musculoskeletal — soft tissue',
    topicIds: ['syllabus-27', 'syllabus-29', 'syllabus-31', 'syllabus-33', 'syllabus-35'],
  },
]
