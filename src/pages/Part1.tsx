import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState'
import { getContent } from '@/content/loader'
import { topicById, topicShortTitle } from '@/data/syllabus'
import { cn } from '@/lib/utils'

export default function Part1() {
  const all = useMemo(() => getContent('1'), [])
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const topics = useMemo(() => {
    const ids = [...new Set(all.map((e) => e.data.topic))]
    return ids
      .map((id) => topicById(id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
  }, [all])

  const questions = useMemo(
    () => (topicFilter ? all.filter((e) => e.data.topic === topicFilter) : all),
    [all, topicFilter],
  )

  const current = questions[Math.min(index, questions.length - 1)]
  const answered = selected !== null

  function pick(i: number) {
    if (!answered) setSelected(i)
  }

  function next() {
    setSelected(null)
    setIndex((i) => (i + 1) % questions.length)
  }

  function filterBy(id: string | null) {
    setTopicFilter(id)
    setIndex(0)
    setSelected(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="rounded bg-part1 px-2 py-0.5 text-xs font-bold text-white">Part 1</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            Theoretical Examination — MCQ practice
          </h1>
        </div>
        <p className="mt-3 reading text-muted-foreground">
          100 four-option single-best-answer questions in two hours. Practice items load from
          authored batches and are grouped by syllabus topic.
        </p>
      </header>

      {questions.length === 0 ? (
        <div className="mt-8 max-w-2xl">
          <EmptyState
            title="No questions yet"
            description="MCQ batches will appear here as they are authored and imported."
            hint="src/content/part-1/*.json"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Topic filter */}
          <aside aria-label="Filter by syllabus topic">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Topics
            </h2>
            <ul className="mt-3 space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => filterBy(null)}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm transition-colors min-h-11',
                    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    topicFilter === null && 'bg-secondary font-semibold text-secondary-foreground',
                  )}
                >
                  All topics
                  <span className="ml-2 text-xs text-muted-foreground">{all.length}</span>
                </button>
              </li>
              {topics.map((t) => {
                const n = all.filter((e) => e.data.topic === t.id).length
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => filterBy(t.id)}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-left text-sm transition-colors min-h-11',
                        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        topicFilter === t.id &&
                          'bg-secondary font-semibold text-secondary-foreground',
                      )}
                    >
                      {topicShortTitle(t)}
                      <span className="ml-2 text-xs text-muted-foreground">{n}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Question player */}
          <section aria-live="polite">
            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {index + 1} of {questions.length}
              </span>
              {current && (
                <Badge variant="secondary">
                  {current.data.status === 'sample' ? 'Bulletin sample' : current.data.status}
                </Badge>
              )}
            </div>

            {current && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl leading-snug">
                    {current.data.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2" role="listbox" aria-label="Answer options">
                    {current.data.options.map((opt, i) => {
                      const isCorrect = i === current.data.correct
                      const isPicked = i === selected
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => pick(i)}
                          disabled={answered}
                          aria-pressed={isPicked}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors min-h-11',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            !answered && 'hover:border-primary hover:bg-muted cursor-pointer',
                            answered && isCorrect && 'border-part1 bg-part1-soft font-medium',
                            answered && isPicked && !isCorrect && 'border-destructive bg-red-50',
                            answered && !isPicked && !isCorrect && 'opacity-60',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                              answered && isCorrect && 'border-part1 bg-part1 text-white',
                              answered && isPicked && !isCorrect && 'border-destructive text-destructive',
                            )}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>
                            {opt.text}
                            {answered && (isCorrect || isPicked) && (
                              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                {opt.explanation}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {answered && (
                    <div className="mt-5 space-y-3 border-t pt-4">
                      {selected === current.data.correct ? (
                        <p className="text-sm font-semibold text-part1">Correct.</p>
                      ) : (
                        <p className="text-sm font-semibold text-destructive">
                          Not quite — review the explanation above.
                        </p>
                      )}
                      {current.data.teaching && (
                        <p className="reading text-sm leading-relaxed">{current.data.teaching}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{current.data.reference}</p>
                      <Button onClick={next} className="min-h-11">
                        {questions.length > 1 ? 'Next question' : 'Restart'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
