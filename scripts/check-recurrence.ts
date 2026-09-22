// Run with: npm run test:recurrence

import { nextDue, describeRepeat, describeNext, formatNext } from '@/lib/recurrence'

let failed = 0
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      got ${JSON.stringify(got)}${ok ? '' : `\n      want ${JSON.stringify(want)}`}`)
}

const now = new Date(2026, 8, 22, 14, 0) // Tue 22 Sep 2026, 2:00 PM local

check('every 15 days from today',
  nextDue('2026-09-22', null, 15, 'day', now), { due_date: '2026-10-07', due_time: null })

check('monthly from the 31st clamps to Feb',
  nextDue('2026-01-31', null, 1, 'month', new Date(2026, 0, 31, 23, 0)), { due_date: '2026-02-28', due_time: null })

check('monthly keeps the 15th',
  nextDue('2026-09-15', '09:00:00', 1, 'month', now), { due_date: '2026-10-15', due_time: '09:00:00' })

check('every 4 hours crosses midnight',
  nextDue('2026-09-22', '23:00:00', 4, 'hour', new Date(2026, 8, 22, 23, 30)), { due_date: '2026-09-23', due_time: '03:00:00' })

check('missed for 10 days lands in the future, not the past',
  nextDue('2026-09-12', null, 1, 'day', now), { due_date: '2026-09-23', due_time: null })

check('weekly missed for a month keeps the weekday (Tue)',
  nextDue('2026-08-18', null, 1, 'week', now), { due_date: '2026-09-29', due_time: null })

check('a daily task due later today still moves to tomorrow',
  nextDue('2026-09-22', '18:00:00', 1, 'day', now), { due_date: '2026-09-23', due_time: '18:00:00' })

check('labels', [describeRepeat(1, 'day'), describeRepeat(15, 'day'), describeRepeat(4, 'hour')],
  ['Every day', 'Every 15 days', 'Every 4 hours'])

// Dates render in the viewer's locale, so build the expectation the same way.
const day = new Date(2026, 9, 7).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const time = new Date(2026, 0, 1, 15, 30).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
check('next description', describeNext({ due_date: '2026-10-07', due_time: '15:30:00' }), `next ${day} at ${time}`)
check('next on its own', formatNext({ due_date: '2026-10-07', due_time: null }), day)

check('completing a monthly task early still moves a full month',
  nextDue('2026-09-30', null, 1, 'month', now), { due_date: '2026-10-30', due_time: null })

console.log(failed === 0 ? '\nAll recurrence checks passed' : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
