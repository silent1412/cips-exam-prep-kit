import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APPLICATION_NOTES, ELIGIBILITY, EXAM_PARTS, SCORING } from '@/data/exam'

const PART_ACCENT = {
  '1': 'border-l-part1',
  '2A': 'border-l-part2a',
  '2B': 'border-l-part2b',
} as const

export default function Introduction() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Introduction</h1>
        <p className="mt-3 reading text-lg leading-relaxed text-muted-foreground">
          The Certified Interventional Pain Sonologist (CIPS) credential is awarded by the World
          Institute of Pain Board of Examination to physicians who demonstrate knowledge and
          practical skill in ultrasound-guided interventional pain medicine. This page summarises
          how the examination is organised, as published in the official CIPS Examination
          Information Bulletin.
        </p>
      </header>

      {/* Exam parts */}
      <section aria-labelledby="format-heading" className="mt-12">
        <h2 id="format-heading" className="font-display text-2xl font-semibold">
          Examination format
        </h2>
        <p className="mt-2 reading text-muted-foreground">
          The examination is administered in English (except Part 2B) and consists of three parts.
          For the practical and oral examinations, each candidate is assessed by two examiners.
        </p>
        <div className="mt-6 space-y-4">
          {EXAM_PARTS.map((part) => (
            <Card key={part.key} className={`border-l-4 ${PART_ACCENT[part.key]}`}>
              <CardHeader>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <CardTitle className="font-display text-xl">{part.name}</CardTitle>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {part.weight}% of composite score
                  </span>
                </div>
                <p className="text-sm font-medium text-primary">
                  {part.format} · {part.duration}
                </p>
              </CardHeader>
              <CardContent>
                <p className="reading text-sm leading-relaxed">{part.summary}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {part.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section aria-labelledby="scoring-heading" className="mt-12">
        <h2 id="scoring-heading" className="font-display text-2xl font-semibold">
          Scoring
        </h2>
        <p className="mt-2 reading text-muted-foreground">{SCORING.description}</p>
        <div className="mt-5 space-y-3" role="list">
          {SCORING.weights.map((w) => (
            <div key={w.label} role="listitem">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{w.label}</span>
                <span className="font-semibold text-primary">{w.value}%</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${w.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 reading text-sm text-muted-foreground">{SCORING.retakePolicy}</p>
      </section>

      {/* Eligibility */}
      <section aria-labelledby="eligibility-heading" className="mt-12">
        <h2 id="eligibility-heading" className="font-display text-2xl font-semibold">
          Eligibility requirements
        </h2>
        <p className="mt-2 reading text-muted-foreground">
          Seven requirements must be met before a candidate may sit the examination.
        </p>
        <Accordion type="single" collapsible className="mt-5 max-w-3xl">
          {ELIGIBILITY.map((req, i) => (
            <AccordionItem key={req.title} value={`req-${i}`}>
              <AccordionTrigger className="text-left">
                <span>
                  <span className="mr-2 font-semibold text-primary">{i + 1}.</span>
                  {req.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="reading text-sm leading-relaxed text-muted-foreground">
                {req.summary}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Application notes */}
      <section aria-labelledby="apply-heading" className="mt-12">
        <h2 id="apply-heading" className="font-display text-2xl font-semibold">
          Applying and sitting the examination
        </h2>
        <Card className="mt-5 max-w-3xl">
          <CardContent className="pt-6">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {APPLICATION_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
