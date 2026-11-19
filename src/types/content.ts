/**
 * Content schema — mirrors the JSON handoff contract in
 * ../content/CONTENT-CONTRACT.md. Authoring batches are dropped into
 * src/content/part-1 | part-2a | part-2b as JSON arrays of BatchEntry.
 */

export type Part = '1' | '2A' | '2B'

export interface SourceAuditEntry {
  claim: string
  sourceFile: string
  chapter: string
  printedPages: string
  pdfPages: string
  verification: string
}

export interface McqOption {
  text: string
  explanation: string
}

export interface ContentData {
  part: Part
  /** MCQ stem (Part 1) or case/procedure title (Part 2A/2B) */
  title: string
  /** Exact syllabus ID, e.g. "syllabus-16" */
  topic: string
  status: 'draft' | 'sample' | 'published'
  teaching: string
  reference: string
  learningObjective: string
  contentId: string
  sourceAudit: SourceAuditEntry[]
  reviewNotes: string[]
  reviewStatus: string
  /** Part 1: exactly 4 options */
  options: McqOption[]
  /** Part 1: zero-based index of the correct option */
  correct: number
  /** Part 2A: technical checklist; Part 2B: expected competencies */
  checklist: string
  /** Part 2A: structured procedure guide; Part 2B: examiner prompts + model answers */
  model: string
}

export interface BatchEntry {
  id: string
  kind: 'question'
  data: ContentData
}
