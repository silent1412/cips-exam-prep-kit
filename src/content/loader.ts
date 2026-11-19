import type { BatchEntry, Part } from '@/types/content'

/**
 * Content loader.
 *
 * Authoring batches are plain JSON arrays of BatchEntry, dropped into:
 *   src/content/part-1/*.json   (MCQs)
 *   src/content/part-2a/*.json  (procedure guides)
 *   src/content/part-2b/*.json  (viva cases)
 *
 * They are bundled at build time via import.meta.glob, so adding a file
 * and rebuilding is all that is required. Entries are deduplicated by id
 * (later files win), so corrected batches can be re-imported safely.
 */

const modules = import.meta.glob('./part-*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, BatchEntry[]>

const byPart: Record<Part, Map<string, BatchEntry>> = {
  '1': new Map(),
  '2A': new Map(),
  '2B': new Map(),
}

for (const entries of Object.values(modules)) {
  for (const entry of entries) {
    const part = entry?.data?.part
    if (part === '1' || part === '2A' || part === '2B') {
      byPart[part].set(entry.id, entry)
    }
  }
}

export function getContent(part: Part): BatchEntry[] {
  return [...byPart[part].values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function getContentByTopic(part: Part, topicId: string): BatchEntry[] {
  return getContent(part).filter((e) => e.data.topic === topicId)
}

export function contentCounts(): Record<Part, number> {
  return {
    '1': byPart['1'].size,
    '2A': byPart['2A'].size,
    '2B': byPart['2B'].size,
  }
}
