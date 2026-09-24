import type { RegistroAlimentar, PerfilUsuario } from '@/types'

export interface Achievement {
  id: string
  title: string
  description: string
  category: 'streak' | 'calories' | 'logs' | 'balance'
  icon: string
  target: number
  current: number
  unlocked: boolean
  progressPct: number
  badgeColor: string
}

export interface UserGamificationStats {
  totalMealsLogged: number
  totalCaloriesLogged: number
  totalProteinLogged: number
  currentStreakWeeks: number
  longestStreakWeeks: number
  weeksOnTarget: number
  achievements: Achievement[]
  newlyUnlocked: Achievement[]
}

/**
 * Calculates user streak (consecutive weeks meeting calorie goals)
 * and cumulative calorie milestones based on food logs.
 */
export function calculateUserGamification(
  logs: RegistroAlimentar[],
  profile: PerfilUsuario | null,
): UserGamificationStats {
  const metaCalorias = profile?.meta_calorias || 2000

  // 1. Total counters
  const totalMealsLogged = logs.length
  let totalCaloriesLogged = 0
  let totalProteinLogged = 0

  // Group calories by day (YYYY-MM-DD)
  const caloriesByDay: Record<string, number> = {}

  logs.forEach((log) => {
    const cal = log.expand?.alimento?.calorias || 0
    const prot = log.expand?.alimento?.proteina_g || 0
    totalCaloriesLogged += cal
    totalProteinLogged += prot

    const dateKey = log.data ? log.data.split('T')[0] : log.created?.split('T')[0] || ''
    if (dateKey) {
      caloriesByDay[dateKey] = (caloriesByDay[dateKey] || 0) + cal
    }
  })

  // 2. Group into ISO-like calendar weeks (year-weekNumber)
  const weekDayStats: Record<string, { daysMet: number; totalDaysLogged: number }> = {}

  Object.entries(caloriesByDay).forEach(([dateStr, cals]) => {
    const d = new Date(dateStr + 'T12:00:00Z')
    // Get week identifier
    const oneJan = new Date(d.getFullYear(), 0, 1)
    const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
    const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7)
    const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

    if (!weekDayStats[weekKey]) {
      weekDayStats[weekKey] = { daysMet: 0, totalDaysLogged: 0 }
    }
    weekDayStats[weekKey].totalDaysLogged += 1

    // Within target: not exceeding meta + 15% allowance for junk food balance, or meeting deficit
    if (cals <= metaCalorias * 1.15) {
      weekDayStats[weekKey].daysMet += 1
    }
  })

  // Calculate consecutive weeks
  const sortedWeeks = Object.keys(weekDayStats).sort()
  let currentStreakWeeks = 0
  let longestStreakWeeks = 0
  let weeksOnTarget = 0

  sortedWeeks.forEach((wk) => {
    const info = weekDayStats[wk]
    // A week is "successful" if user logged and stayed within bounds on the logged days
    const isSuccess = info.totalDaysLogged > 0 && info.daysMet >= 1
    if (isSuccess) {
      weeksOnTarget += 1
      currentStreakWeeks += 1
      if (currentStreakWeeks > longestStreakWeeks) {
        longestStreakWeeks = currentStreakWeeks
      }
    } else {
      currentStreakWeeks = 0
    }
  })

  // If user has at least logged meals today/this week, ensure streak minimum starts with 1
  if (totalMealsLogged > 0 && currentStreakWeeks === 0) {
    currentStreakWeeks = 1
    if (longestStreakWeeks === 0) longestStreakWeeks = 1
  }

  // 3. Define milestone achievements
  const rawAchievements: Array<{
    id: string
    title: string
    description: string
    category: 'streak' | 'calories' | 'logs' | 'balance'
    icon: string
    target: number
    current: number
    badgeColor: string
  }> = [
    {
      id: 'first-meal',
      title: 'Primeiro Passo',
      description: 'Registrou sua 1ª refeição de junk food calculada no app.',
      category: 'logs',
      icon: 'Utensils',
      target: 1,
      current: totalMealsLogged,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'ten-meals',
      title: 'Hábito Consciente',
      description: 'Alcançou a marca de 10 refeições registradas sem culpa.',
      category: 'logs',
      icon: 'Award',
      target: 10,
      current: totalMealsLogged,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'streak-1-week',
      title: 'Primeira Semana Firme',
      description: '1 semana consecutiva cumprindo as metas nutricionais.',
      category: 'streak',
      icon: 'Flame',
      target: 1,
      current: currentStreakWeeks,
      badgeColor: 'bg-[#FF6B35] text-white',
    },
    {
      id: 'streak-2-weeks',
      title: 'Duas Semanas no Foco',
      description: '2 semanas consecutivas equilibrando junk food e saúde.',
      category: 'streak',
      icon: 'Zap',
      target: 2,
      current: currentStreakWeeks,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'streak-4-weeks',
      title: 'Mestre da Consistência',
      description: '4 semanas seguidas (1 mês inteiro) dentro das metas.',
      category: 'streak',
      icon: 'Crown',
      target: 4,
      current: currentStreakWeeks,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'cal-5k',
      title: 'Marco 5.000 kcal',
      description: '5.000 calorias acumuladas rastreadas com inteligência.',
      category: 'calories',
      icon: 'Sparkles',
      target: 5000,
      current: totalCaloriesLogged,
      badgeColor: 'bg-teal-500 text-white',
    },
    {
      id: 'cal-10k',
      title: 'Marco 10.000 kcal',
      description: '10.000 calorias de fast food registradas e compensadas.',
      category: 'calories',
      icon: 'Flame',
      target: 10000,
      current: totalCaloriesLogged,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'cal-25k',
      title: 'Clube dos 25.000 kcal',
      description: '25.000 kcal gerenciadas como um expert em nutrição.',
      category: 'calories',
      icon: 'Trophy',
      target: 25000,
      current: totalCaloriesLogged,
      badgeColor: 'bg-indigo-600 text-white',
    },
  ]

  const achievements: Achievement[] = rawAchievements.map((item) => {
    const unlocked = item.current >= item.target
    const progressPct = Math.min(100, Math.round((item.current / item.target) * 100))
    return {
      ...item,
      unlocked,
      progressPct,
    }
  })

  // Detect newly unlocked achievements saved in localStorage
  const storageKey = `junkfood_achievements_${profile?.usuario || 'guest'}`
  let previouslyUnlockedIds: string[] = []
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) previouslyUnlockedIds = JSON.parse(raw)
  } catch {
    /* intentionally ignored */
  }

  const currentUnlockedIds = achievements.filter((a) => a.unlocked).map((a) => a.id)
  const newlyUnlocked = achievements.filter(
    (a) => a.unlocked && !previouslyUnlockedIds.includes(a.id),
  )

  // Update storage
  try {
    localStorage.setItem(storageKey, JSON.stringify(currentUnlockedIds))
  } catch {
    /* intentionally ignored */
  }

  return {
    totalMealsLogged,
    totalCaloriesLogged,
    totalProteinLogged,
    currentStreakWeeks,
    longestStreakWeeks,
    weeksOnTarget,
    achievements,
    newlyUnlocked,
  }
}
