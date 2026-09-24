import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchCatalogItems, fetchDailyFoodLogs } from '@/services/nutrition'
import { fetchDailyExercises, calculateDailyExerciseTotals } from '@/services/exercise'
import { calculateDailyTotals, rankCatalogRecommendations } from '@/services/recommendations'
import type {
  CatalogItem,
  RegistroAlimentar,
  RecommendationResult,
  ExercicioRegistro,
} from '@/types'
import {
  Flame,
  Target,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  BookOpen,
  UserCheck,
  CalendarCheck,
  ChevronRight,
  Loader2,
  Activity,
  Dumbbell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { InitialCravingModal, type InitialCravingAnswers } from '@/components/InitialCravingModal'
import { fetchAllUserFoodLogs } from '@/services/nutrition'
import { calculateUserGamification, type UserGamificationStats } from '@/services/achievements'
import {
  SlidersHorizontal,
  Trophy,
  Award,
  Utensils,
  X,
  BarChart3,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import {
  getClosedWeekInfo,
  isWeeklyReportBannerDismissed,
  dismissWeeklyReportBanner,
  type ClosedWeekInfo,
} from '@/services/weeklyReminder'

export default function Index() {
  const { user, profile } = useAuth()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [todayLogs, setTodayLogs] = useState<RegistroAlimentar[]>([])
  const [todayExercises, setTodayExercises] = useState<ExercicioRegistro[]>([])
  const [allLogs, setAllLogs] = useState<RegistroAlimentar[]>([])
  const [loading, setLoading] = useState(true)

  // Weekly report reminder banner state
  const [closedWeekInfo, setClosedWeekInfo] = useState<ClosedWeekInfo | null>(null)
  const [closedWeekHasLogs, setClosedWeekHasLogs] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Initial craving modal state (shown on entry, re-openable)
  const [cravingModalOpen, setCravingModalOpen] = useState(false)
  const [cravingAnswers, setCravingAnswers] = useState<InitialCravingAnswers>(() => {
    try {
      const saved = sessionStorage.getItem('junkfood_craving_answers')
      if (saved) return JSON.parse(saved)
    } catch {
      /* intentionally ignored */
    }
    return { craving: '', location: 'todos' }
  })

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const loadData = async () => {
    if (!user) return
    try {
      const weekInfo = getClosedWeekInfo()
      setClosedWeekInfo(weekInfo)

      const isDismissed = weekInfo
        ? isWeeklyReportBannerDismissed(user.id, weekInfo.closedWeekKey)
        : false
      setBannerDismissed(isDismissed)

      const [catItems, logs, exercises, allUserLogs] = await Promise.all([
        fetchCatalogItems(),
        fetchDailyFoodLogs(user.id, todayStr),
        fetchDailyExercises(user.id, todayStr),
        fetchAllUserFoodLogs(user.id),
      ])
      setCatalog(catItems)
      setTodayLogs(logs)
      setTodayExercises(exercises)
      setAllLogs(allUserLogs)

      // Check if user has food logs in the closed week
      if (weekInfo && allUserLogs.length > 0) {
        const hasLogsInClosedWeek = allUserLogs.some((l) => {
          const d = (l.data || '').split('T')[0]
          return d >= weekInfo.startDateStr && d <= weekInfo.endDateStr
        })
        setClosedWeekHasLogs(hasLogsInClosedWeek)
      } else {
        setClosedWeekHasLogs(false)
      }

      // Always show prompt on entry if not answered in this session yet
      const hasAnsweredSession = sessionStorage.getItem('junkfood_craving_session_prompted')
      if (!hasAnsweredSession) {
        setCravingModalOpen(true)
        sessionStorage.setItem('junkfood_craving_session_prompted', 'true')
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismissWeeklyBanner = () => {
    if (!user || !closedWeekInfo) return
    dismissWeeklyReportBanner(user.id, closedWeekInfo.closedWeekKey)
    setBannerDismissed(true)
  }

  const handleApplyCraving = (answers: InitialCravingAnswers) => {
    setCravingAnswers(answers)
    try {
      sessionStorage.setItem('junkfood_craving_answers', JSON.stringify(answers))
    } catch {
      /* intentionally ignored */
    }
  }

  const availablePlaces = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((item) => {
      if (item.estabelecimento) set.add(item.estabelecimento)
    })
    return Array.from(set).sort()
  }, [catalog])

  useEffect(() => {
    loadData()

    // Realtime subscription for food logs
    const unsubFoods = pb.collection('registros_alimentares').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
        if (user?.id) {
          fetchDailyFoodLogs(user.id, todayStr).then(setTodayLogs).catch(console.error)
        }
      }
    })

    // Realtime subscription for exercises
    const unsubExercises = pb.collection('exercicios').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
        if (user?.id) {
          fetchDailyExercises(user.id, todayStr).then(setTodayExercises).catch(console.error)
        }
      }
    })

    return () => {
      unsubFoods.then((unsub) => unsub())
      unsubExercises.then((unsub) => unsub())
    }
  }, [user, todayStr])

  const totals = useMemo(() => calculateDailyTotals(todayLogs), [todayLogs])
  const exerciseTotals = useMemo(
    () => calculateDailyExerciseTotals(todayExercises),
    [todayExercises],
  )

  // Gamification & streak stats
  const gamificationStats = useMemo(() => {
    return calculateUserGamification(allLogs, profile)
  }, [allLogs, profile])

  // Recommendations filtered by user craving & location
  const recommendations = useMemo(() => {
    if (!catalog.length) return []
    let baseList = catalog

    // Filter by location if selected and not 'todos'
    if (
      cravingAnswers.location &&
      cravingAnswers.location !== 'todos' &&
      cravingAnswers.location !== 'casa'
    ) {
      baseList = baseList.filter(
        (c) => c.estabelecimento.toLowerCase() === cravingAnswers.location.toLowerCase(),
      )
    }

    // Filter or boost by craving keyword
    if (cravingAnswers.craving) {
      const q = cravingAnswers.craving.toLowerCase()
      const matching = baseList.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.categoria.toLowerCase().includes(q) ||
          c.estabelecimento.toLowerCase().includes(q),
      )
      if (matching.length > 0) {
        baseList = matching
      }
    }

    // Rank list with moment + place algorithm
    return rankCatalogRecommendations(baseList, profile, todayLogs)
  }, [catalog, profile, todayLogs, cravingAnswers])

  const topJunkFood = recommendations[0] || null

  const metaCalorias = profile?.meta_calorias || 2000
  const caloriasQueimadas = exerciseTotals.totalCaloriesBurned
  const metaAjustada = metaCalorias + caloriasQueimadas
  const remainingCalories = Math.max(0, metaAjustada - totals.calorias)
  const caloriesPercent = Math.min(
    100,
    Math.round((totals.calorias / Math.max(1, metaAjustada)) * 100),
  )

  // Macros in grams target: protein (4 kcal/g), carbs (4 kcal/g), fat (9 kcal/g)
  const metaProtGrams = Math.round((((profile?.meta_proteina_pct || 25) / 100) * metaCalorias) / 4)
  const metaCarbGrams = Math.round(
    (((profile?.meta_carboidrato_pct || 50) / 100) * metaCalorias) / 4,
  )
  const metaFatGrams = Math.round((((profile?.meta_gordura_pct || 25) / 100) * metaCalorias) / 9)

  const protPercent = Math.min(100, Math.round((totals.proteina_g / (metaProtGrams || 1)) * 100))
  const carbPercent = Math.min(100, Math.round((totals.carboidrato_g / (metaCarbGrams || 1)) * 100))
  const fatPercent = Math.min(100, Math.round((totals.gordura_g / (metaFatGrams || 1)) * 100))

  // Formatted date in PT-BR
  const formattedToday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Montando seu dashboard nutricional...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-orange-100/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Olá, <span className="text-[#FF6B35]">{user?.name || 'Amigo'}</span> 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 capitalize mt-1">
            {formattedToday} •{' '}
            <span className="text-gray-500 font-normal">
              Vamos encontrar a melhor junk food para você hoje!
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setCravingModalOpen(true)}
            className="border-orange-200 text-gray-700 hover:bg-orange-50 font-semibold text-xs h-9 gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6B35]" /> Mudar desejo/local
          </Button>

          <Button
            asChild
            className="bg-[#2EC4B6] hover:bg-[#25A89B] text-white text-xs h-9 shadow-sm"
          >
            <Link to="/diet" className="flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> Registrar Refeição
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner Lembrete de Fechamento de Semana (Domingo e Segunda) */}
      {closedWeekInfo && closedWeekHasLogs && !bannerDismissed && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 sm:p-6 shadow-lg border border-indigo-700/50 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-indigo-950 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                    <Bell className="w-3 h-3 fill-indigo-950" /> Fechamento Semanal
                  </span>
                  <span className="text-xs text-indigo-200">
                    Semana de {closedWeekInfo.formattedRange}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Sua semana fechou — confira seu relatório!
                </h3>
                <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
                  Você registrou refeições nesta semana que se encerrou. Veja a média de calorias,
                  melhores escolhas proteicas e gere seu resumo para compartilhar no WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <Button
                asChild
                className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold text-xs h-10 px-5 rounded-xl shadow-md gap-1.5"
              >
                <Link to="/report">
                  Ver Relatório <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissWeeklyBanner}
                className="text-indigo-200 hover:text-white hover:bg-white/10 text-xs h-10 px-3 rounded-xl"
                title="Dispensar lembrete desta semana"
              >
                Dispensar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Craving / Location Active Filter Banner */}
      {(cravingAnswers.craving ||
        (cravingAnswers.location && cravingAnswers.location !== 'todos')) && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-gray-800">
            <Sparkles className="w-4 h-4 text-[#FF6B35] shrink-0" />
            <span>
              Filtrando recomendações para:{' '}
              {cravingAnswers.craving && (
                <strong className="text-[#FF6B35] font-bold">"{cravingAnswers.craving}"</strong>
              )}
              {cravingAnswers.craving && cravingAnswers.location !== 'todos' && ' em '}
              {cravingAnswers.location !== 'todos' && (
                <strong className="text-teal-700 font-bold">
                  {cravingAnswers.location === 'casa'
                    ? 'Em casa / Delivery'
                    : cravingAnswers.location}
                </strong>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleApplyCraving({ craving: '', location: 'todos' })}
              className="text-[11px] h-7 px-2 text-gray-500 hover:text-red-600 gap-1"
            >
              <X className="w-3 h-3" /> Limpar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCravingModalOpen(true)}
              className="text-[11px] h-7 px-2.5 border-orange-300 text-orange-800 hover:bg-orange-100/70"
            >
              Alterar
            </Button>
          </div>
        </div>
      )}

      {/* Streak & Achievements mini banner */}
      <div className="bg-white border border-orange-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-gray-900">
                Streak: {gamificationStats.currentStreakWeeks}{' '}
                {gamificationStats.currentStreakWeeks === 1 ? 'semana seguida' : 'semanas seguidas'}
              </span>
              <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-amber-200">
                Em dia
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {gamificationStats.totalCaloriesLogged.toLocaleString('pt-BR')} kcal rastreadas •{' '}
              {gamificationStats.achievements.filter((a) => a.unlocked).length} conquistas
              desbloqueadas
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="border-orange-200 text-gray-700 hover:bg-orange-50 text-xs font-semibold h-9 rounded-xl gap-1.5 self-start sm:self-auto"
        >
          <Link to="/achievements">
            <Trophy className="w-4 h-4 text-amber-500" /> Ver Minhas Conquistas
          </Link>
        </Button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Calorias do Dia com Exercício */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/70 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              Balanço Ajustado
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500">Calorias Restantes do Dia</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {remainingCalories.toLocaleString('pt-BR')}
            </span>
            <span className="text-sm font-medium text-gray-500">kcal restantes</span>
          </div>

          {/* Exercise mini-tag */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <Activity className="w-3.5 h-3.5" />
            <span>
              +{caloriasQueimadas} kcal de exercício ({exerciseTotals.totalMinutes} min)
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Consumo: {totals.calorias} kcal</span>
              <span>Limite: {metaAjustada} kcal</span>
            </div>
            <Progress value={caloriesPercent} className="h-2 bg-orange-100" />
          </div>
        </div>

        {/* Card 2: Metas Hoje */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/70 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
              Macronutrientes
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#2EC4B6] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500">Metas Hoje</h3>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>
                  Proteínas ({totals.proteina_g}g / {metaProtGrams}g)
                </span>
                <span className="text-[#FF6B35]">{protPercent}%</span>
              </div>
              <Progress value={protPercent} className="h-1.5 bg-orange-100" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>
                  Carboidratos ({totals.carboidrato_g}g / {metaCarbGrams}g)
                </span>
                <span className="text-amber-600">{carbPercent}%</span>
              </div>
              <Progress value={carbPercent} className="h-1.5 bg-amber-100" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>
                  Gorduras ({totals.gordura_g}g / {metaFatGrams}g)
                </span>
                <span className="text-teal-600">{fatPercent}%</span>
              </div>
              <Progress value={fatPercent} className="h-1.5 bg-teal-100" />
            </div>
          </div>
        </div>

        {/* Card 3: Junk Food do Dia */}
        <div className="bg-gradient-to-br from-[#FFF5EE] to-[#FFEBD9] rounded-2xl p-6 shadow-sm border border-orange-200 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#FF6B35] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" /> Junk Food do Dia
              </span>
              {topJunkFood && (
                <span className="text-xs font-extrabold text-[#FF6B35] bg-white px-2 py-0.5 rounded-full shadow-xs">
                  {topJunkFood.matchScore}% match
                </span>
              )}
            </div>

            {topJunkFood ? (
              <div className="space-y-2 mt-2">
                <h4 className="font-bold text-lg text-gray-900 leading-tight">
                  {topJunkFood.item.nome}
                </h4>
                <div className="flex flex-col gap-1 text-xs text-gray-700">
                  <div className="flex items-center gap-1.5 font-medium text-[#FF6B35]">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {topJunkFood.melhorMomento.label} ({topJunkFood.melhorMomento.horario})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-[#2EC4B6]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{topJunkFood.melhorLugar.estabelecimento}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                  {topJunkFood.melhorMomento.justificativa}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma recomendação disponível no momento.</p>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-orange-200/60">
            <Button
              asChild
              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs font-bold shadow-sm"
              size="sm"
            >
              <Link to="/recommendations" className="flex items-center justify-center gap-1">
                Explorar Recomendações <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Seção: Recomendações para Hoje */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6B35]" /> Recomendações para Hoje
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Melhores opções avaliando simultaneamente o{' '}
              <strong className="text-gray-800">Momento</strong> e o{' '}
              <strong className="text-gray-800">Lugar</strong>.
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-xs sm:text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] flex items-center gap-1"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scrollable horizontal cards */}
        <div className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-orange-200">
          {recommendations.slice(0, 5).map((rec) => (
            <Link
              key={rec.item.id}
              to={`/catalog/${rec.item.id}`}
              className="group min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shrink-0"
            >
              <div>
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <img
                    src={
                      rec.item.imageUrl ||
                      rec.item.imagem ||
                      'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                    }
                    alt={rec.item.nome}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge className="bg-[#FF6B35] hover:bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                      {rec.matchScore}% Match
                    </Badge>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {rec.item.calorias} kcal
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#FF6B35] transition-colors line-clamp-1">
                    {rec.item.nome}
                  </h3>

                  <div className="space-y-1.5 text-xs">
                    {/* Momento */}
                    <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-[#FF6B35]" />
                      <span className="font-medium truncate">
                        {rec.melhorMomento.label} ({rec.melhorMomento.horario})
                      </span>
                    </div>

                    {/* Lugar */}
                    <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50 px-2 py-1 rounded-md">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2EC4B6]" />
                      <span className="font-medium truncate">
                        {rec.melhorLugar.estabelecimento}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {rec.melhorMomento.justificativa}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="w-full text-center text-xs font-bold text-[#FF6B35] group-hover:underline flex items-center justify-center gap-1">
                  Ver detalhes nutricionais <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Seção: Acesso Rápido */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            to="/assistant"
            className="group bg-white p-5 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-[#FF6B35] transition-colors">
                Assistente de IA
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Tire dúvidas instantâneas: "Posso comer Whopper hoje?".
              </p>
            </div>
          </Link>

          <Link
            to="/report"
            className="group bg-white p-5 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Relatório Semanal
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Veja seu progresso dos últimos 7 dias e compartilhe no WhatsApp.
              </p>
            </div>
          </Link>

          <Link
            to="/catalog"
            className="group bg-white p-5 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-[#FF6B35] transition-colors">
                Ver Catálogo
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Tabela nutricional completa com filtros por categoria e estabelecimento.
              </p>
            </div>
          </Link>

          <Link
            to="/achievements"
            className="group bg-white p-5 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Streak & Conquistas
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Acompanhe semanas consecutivas e marcos de calorias acumuladas.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Initial Craving Onboarding Modal */}
      <InitialCravingModal
        open={cravingModalOpen}
        onOpenChange={setCravingModalOpen}
        onApply={handleApplyCraving}
        currentAnswers={cravingAnswers}
        availablePlaces={availablePlaces}
      />
    </div>
  )
}
