import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState'
import { getContentByTopic } from '@/content/loader'
import { SYLLABUS, topicShortTitle } from '@/data/syllabus'
import type { BatchEntry } from '@/types/content'
import { cn } from '@/lib/utils'

export default function Part2B() {
  const [open, setOpen] = useState<BatchEntry | null>(null)

  const topics = useMemo(
    () =>
      SYLLABUS.filter((t) => t.group === 'viva').map((t) => ({
        topic: t,
        items: getContentByTopic('2B', t.id),
      })),
    [],
  )

  const total = topics.reduce((n, t) => n + t.items.length, 0)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="rounded bg-part2b px-2 py-0.5 text-xs font-bold text-white">
            Part 2B
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            Oral Examination — viva cases
          </h1>
        </div>
        <p className="mt-3 reading text-muted-foreground">
          An extended clinical vignette discussed with two examiners, testing clinical reasoning,
          anatomy, equipment handling and physical examination. Each case pairs staged examiner
          prompts with model answers and the competencies expected of the candidate.
        </p>
      </header>

      {total === 0 && (
        <div className="mt-8 max-w-2xl">
          <EmptyState
            title="No viva cases yet"
            description="Staged viva cases will appear under their topic as batches are authored and imported."
            hint="src/content/part-2b/*.json"
          />
        </div>
      )}

      <section aria-labelledby="viva-topics-heading" className="mt-8">
        <h2 id="viva-topics-heading" className="font-display text-xl font-semibold">
          Viva topic areas
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map(({ topic, items }) => (
            <Card
              key={topic.id}
              className={cn(
                items.length > 0 && 'border-part2b/40',
                items.length === 0 && 'border-dashed opacity-75',
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold leading-snug">
                  {topicShortTitle(topic)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Case in preparation</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setOpen(item)}
                          className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
                        >
                          {item.data.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Case detail */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.data.title}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(null)
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-lg sm:rounded-lg bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold leading-snug">
                {open.data.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11 min-w-11"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {open.data.checklist && (
              <>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Expected competencies
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {open.data.checklist.split('\n').filter(Boolean).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
            {open.data.model && (
              <>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Examiner prompts and model answers
                </h3>
                <p className="mt-2 whitespace-pre-line reading text-sm leading-relaxed">
                  {open.data.model}
                </p>
              </>
            )}
            {open.data.reference && (
              <p className="mt-6 border-t pt-3 text-xs text-muted-foreground">
                {open.data.reference}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
