export interface ClosedWeekInfo {
  isCloseDay: boolean // Sunday (0) or Monday (1)
  closedWeekKey: string // Unique identifier for the closed week, e.g. "2025-W18" or "2025-04-21_2025-04-27"
  startDateStr: string // YYYY-MM-DD (Monday)
  endDateStr: string // YYYY-MM-DD (Sunday)
  formattedRange: string // e.g. "21 abr a 27 abr"
  dayName: 'domingo' | 'segunda-feira' | ''
}

/**
 * Returns info about the week that just closed, but ONLY if today is Sunday (day 0) or Monday (day 1).
 *
 * For Sunday (day 0):
 * - The week ending TODAY (started last Monday, ends today Sunday) is closing / has closed.
 *   Start = 6 days ago (Monday), End = today (Sunday).
 *
 * For Monday (day 1):
 * - The week that ended YESTERDAY (Sunday) just closed.
 *   Start = 7 days ago (last Monday), End = yesterday (Sunday).
 */
export function getClosedWeekInfo(referenceDate = new Date()): ClosedWeekInfo | null {
  const day = referenceDate.getDay() // 0 = Sunday, 1 = Monday, 2..6 = Tue..Sat

  if (day !== 0 && day !== 1) {
    return null
  }

  let start: Date
  let end: Date

  if (day === 0) {
    // Sunday: closes today
    end = new Date(referenceDate)
    start = new Date(referenceDate)
    start.setDate(referenceDate.getDate() - 6)
  } else {
    // Monday: closed yesterday
    end = new Date(referenceDate)
    end.setDate(referenceDate.getDate() - 1)
    start = new Date(referenceDate)
    start.setDate(referenceDate.getDate() - 7)
  }

  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  const formatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
  const formattedRange = `${formatter.format(start)} a ${formatter.format(end)}`

  const closedWeekKey = `${startStr}_${endStr}`

  return {
    isCloseDay: true,
    closedWeekKey,
    startDateStr: startStr,
    endDateStr: endStr,
    formattedRange,
    dayName: day === 0 ? 'domingo' : 'segunda-feira',
  }
}

/**
 * Checks if the user dismissed the banner for this specific closed week key.
 */
export function isWeeklyReportBannerDismissed(userId: string, weekKey: string): boolean {
  if (!userId || !weekKey) return false
  try {
    const storageKey = `junkfood_report_dismiss_${userId}`
    const stored = localStorage.getItem(storageKey)
    if (!stored) return false
    const parsed = JSON.parse(stored)
    return parsed.weekKey === weekKey
  } catch {
    return false
  }
}

/**
 * Persists the dismissal of the weekly report banner for this week.
 */
export function dismissWeeklyReportBanner(userId: string, weekKey: string): void {
  if (!userId || !weekKey) return
  try {
    const storageKey = `junkfood_report_dismiss_${userId}`
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        weekKey,
        dismissedAt: new Date().toISOString(),
      }),
    )
  } catch (err) {
    console.error('Erro ao salvar dispensa do lembrete:', err)
  }
}
