import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { contentCounts } from '@/content/loader'
import { GROUP_LABELS, SYLLABUS, type SyllabusGroup } from '@/data/syllabus'
import { EXAM_PARTS } from '@/data/exam'

const PART_STYLE = {
  '1': { badge: 'bg-part1 text-white', ring: 'hover:border-part1' },
  '2A': { badge: 'bg-part2a text-white', ring: 'hover:border-part2a' },
  '2B': { badge: 'bg-part2b text-white', ring: 'hover:border-part2b' },
} as const

const PART_ROUTE = { '1': '/part-1', '2A': '/part-2a', '2B': '/part-2b' } as const

const GROUP_ORDER: SyllabusGroup[] = [
  'general',
  'chronic-pain',
  'spine',
  'nerves',
  'musculoskeletal',
  'viva',
]

export default function Home() {
  const counts = contentCounts()

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          World Institute of Pain · Board of Examination
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold leading-tight">
          CIPS Examination Preparation KIT
        </h1>
        <p className="mt-4 reading text-lg leading-relaxed text-muted-foreground">
          A structured study companion for the Certified Interventional Pain Sonologist
          examination — the three-part assessment of ultrasound-guided interventional pain
          medicine: a written MCQ paper, a hands-on cadaver practical, and an oral viva.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/introduction"
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start with the exam format
          </Link>
          <Link
            to="/part-1"
            className="inline-flex h-11 items-center rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Practice MCQs
          </Link>
        </div>
      </section>

      {/* Three parts */}
      <section aria-labelledby="parts-heading" className="mt-14">
        <h2 id="parts-heading" className="font-display text-2xl font-semibold">
          The three parts of the examination
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {EXAM_PARTS.map((part) => (
            <Link key={part.key} to={PART_ROUTE[part.key]} className="group">
              <Card
                className={`h-full border-2 border-transparent transition-colors ${PART_STYLE[part.key].ring}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${PART_STYLE[part.key].badge}`}
                    >
                      Part {part.key}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {part.weight}% of score
                    </span>
                  </div>
                  <CardTitle className="font-display text-lg leading-snug">
                    {part.name.split('—')[1]?.trim() ?? part.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{part.format}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{part.duration}</p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    {counts[part.key]} item{counts[part.key] === 1 ? '' : 's'} loaded →
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Syllabus overview */}
      <section aria-labelledby="syllabus-heading" className="mt-14">
        <h2 id="syllabus-heading" className="font-display text-2xl font-semibold">
          Syllabus at a glance
        </h2>
        <p className="mt-2 reading text-muted-foreground">
          {SYLLABUS.length} syllabus topics across {GROUP_ORDER.length} domains, drawn from the
          examination content outline.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUP_ORDER.map((group) => {
            const topics = SYLLABUS.filter((t) => t.group === group)
            return (
              <Card key={group}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{GROUP_LABELS[group]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-display font-semibold text-primary">
                    {topics.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    topic{topics.length === 1 ? '' : 's'}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
