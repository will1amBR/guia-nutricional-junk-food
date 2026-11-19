import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAllUserFoodLogs } from '@/services/nutrition'
import { calculateUserGamification, type UserGamificationStats } from '@/services/achievements'
import { fetchActiveTrainingGoal, fetchWeeklyExercises } from '@/services/training'
import type { ExercicioRegistro, MetaTreino, RegistroAlimentar } from '@/types'
import {
  Dumbbell,
  Trophy,
  Flame,
  Award,
  Zap,
  Crown,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  Target,
  ArrowRight,
  TrendingUp,
  Loader2,
  ShieldAlert,
  Utensils,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function Achievements() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [logs, setLogs] = useState<RegistroAlimentar[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserGamificationStats | null>(null)
  const [trainingGoal, setTrainingGoal] = useState<MetaTreino | null>(null)
  const [weeklyExercises, setWeeklyExercises] = useState<ExercicioRegistro[]>([])

  const loadData = async () => {
    if (!user) return
    try {
      const allLogs = await fetchAllUserFoodLogs(user.id)
      setLogs(allLogs)
      const calculated = calculateUserGamification(allLogs, profile)
      setStats(calculated)
      fetchActiveTrainingGoal(user.id).then(setTrainingGoal).catch(console.error)
      fetchWeeklyExercises(user.id).then(setWeeklyExercises).catch(console.error)

      // Alert if any new achievement unlocked
      if (calculated.newlyUnlocked.length > 0) {
        calculated.newlyUnlocked.forEach((ach) => {
          toast({
            title: `🎉 Conquista Desbloqueada: ${ach.title}!`,
            description: ach.description,
          })
        })
      }
    } catch (err) {
      console.error('Erro ao carregar conquistas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const unsubscribe = pb.collection('registros_alimentares').subscribe('*', () => {
      if (user?.id) {
        fetchAllUserFoodLogs(user.id)
          .then((allLogs) => {
            setLogs(allLogs)
            setStats(calculateUserGamification(allLogs, profile))
          })
          .catch(console.error)
      }
    })

    return () => {
      unsubscribe.then((unsub) => unsub())
    }
  }, [user, profile])

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Calculando seu streak e conquistas...</p>
      </div>
    )
  }

  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length
  const totalCount = stats.achievements.length
  const overallPct = Math.round((unlockedCount / totalCount) * 100)

  // Progresso da meta semanal de treino
  const weeklyMinutes = weeklyExercises.reduce((acc, e) => acc + (e.duracao_min || 0), 0)
  const weeklyCalories = weeklyExercises.reduce((acc, e) => acc + (e.calorias_queimadas || 0), 0)
  const weeklyCurrent = trainingGoal?.tipo_objetivo === 'calorias' ? weeklyCalories : weeklyMinutes
  const weeklyPct = trainingGoal
    ? Math.min(100, Math.round((weeklyCurrent / (trainingGoal.valor_alvo || 1)) * 100))
    : 0

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Streak & Conquistas
            </h1>
            <Badge className="bg-[#FF6B35] text-white text-[10px] font-bold">Gamificação</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Acompanhe suas semanas consecutivas dentro das metas e desbloqueie marcos nutricionais.
          </p>
        </div>

        <Button
          asChild
          className="bg-[#2EC4B6] hover:bg-[#25A89B] text-white text-xs font-bold rounded-xl gap-2 self-start sm:self-auto"
        >
          <Link to="/diet">
            <CalendarDays className="w-4 h-4" /> Registrar Refeição
          </Link>
        </Button>
      </div>

      {/* Streak Hero Card */}
      <div className="bg-gradient-to-tr from-[#FFF5EE] via-[#FFEADB] to-[#FFF0E5] rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#FF6B35]/15 text-[#FF6B35] px-3.5 py-1 rounded-full text-xs font-extrabold">
              <Flame className="w-4 h-4 fill-[#FF6B35]" />
              <span>STREAK SEMANAL ATIVO</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight">
                {stats.currentStreakWeeks}
              </span>
              <span className="text-lg sm:text-xl font-bold text-gray-700">
                {stats.currentStreakWeeks === 1 ? 'semana seguida' : 'semanas seguidas'} dentro das
                metas
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
              Você mantém consistência alimentar equilibrando fast foods com metas calóricas. Seu
              recorde histórico é de{' '}
              <strong className="text-gray-900">{stats.longestStreakWeeks} semanas</strong>!
            </p>
          </div>

          <div className="flex sm:flex-col items-center justify-center bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-orange-200/80 shadow-xs text-center shrink-0 min-w-[160px]">
            <Trophy className="w-10 h-10 text-amber-500 mb-1" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Conquistas
            </span>
            <span className="text-2xl font-black text-gray-900">
              {unlockedCount} / {totalCount}
            </span>
            <span className="text-[11px] font-bold text-[#FF6B35]">{overallPct}% concluído</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-6 border-t border-orange-200/60 space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>Progresso Geral de Conquistas</span>
            <span>
              {unlockedCount} de {totalCount} desbloqueadas
            </span>
          </div>
          <Progress value={overallPct} className="h-2.5 bg-orange-100" />
        </div>
      </div>

      {/* Treinos da Semana — meta semanal de treino */}
      {trainingGoal && (
        <div className="bg-gradient-to-tr from-teal-50 via-emerald-50/60 to-white rounded-3xl p-6 border border-teal-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-gray-900 text-base">Treinos da Semana</h2>
                <p className="text-xs text-gray-500">
                  Progresso da sua meta semanal de treino — movimento que sustenta o streak.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold shrink-0 self-start sm:self-auto ${
                weeklyPct >= 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}
            >
              {weeklyPct >= 100 ? 'Meta batida! 🎉' : `${weeklyPct}% da meta`}
            </Badge>
          </div>

          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>
              {weeklyMinutes} min • {weeklyCalories} kcal queimadas
            </span>
            <span>
              Meta:{' '}
              {trainingGoal.tipo_objetivo === 'calorias'
                ? `${trainingGoal.valor_alvo} kcal`
                : `${trainingGoal.valor_alvo} min`}
            </span>
          </div>
          <Progress value={weeklyPct} className="h-2.5 bg-teal-100" />
          {weeklyPct < 100 && (
            <p className="text-[11px] text-gray-500">
              Faltam{' '}
              <strong className="text-teal-700">
                {trainingGoal.tipo_objetivo === 'calorias'
                  ? `${trainingGoal.valor_alvo - weeklyCalories} kcal`
                  : `${trainingGoal.valor_alvo - weeklyMinutes} min`}
              </strong>{' '}
              para bater a meta semanal. Registre um treino na{' '}
              <Link to="/diet" className="underline font-semibold text-teal-700">
                Minha Dieta
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {/* 3 Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Calories Logged */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Acumulado
            </span>
            <Flame className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <span className="text-xs text-gray-500 font-medium">Calorias Gerenciadas</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {stats.totalCaloriesLogged.toLocaleString('pt-BR')} kcal
          </div>
          <p className="text-[11px] text-gray-400">Total rastreado em junk foods</p>
        </div>

        {/* Total Meals Logged */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              Frequência
            </span>
            <Utensils className="w-5 h-5 text-[#2EC4B6]" />
          </div>
          <span className="text-xs text-gray-500 font-medium">Refeições Registradas</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {stats.totalMealsLogged} {stats.totalMealsLogged === 1 ? 'refeição' : 'refeições'}
          </div>
          <p className="text-[11px] text-gray-400">Registros alimentares conscientes</p>
        </div>

        {/* Protein Logged */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Macronutrientes
            </span>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs text-gray-500 font-medium">Proteína Acumulada</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
            {stats.totalProteinLogged}g
          </div>
          <p className="text-[11px] text-gray-400">Suporte a massa muscular e saciedade</p>
        </div>
      </div>

      {/* Grid of Achievements Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FF6B35]" /> Galeria de Conquistas
          </h2>
          <span className="text-xs text-gray-500 font-semibold">
            {unlockedCount} de {totalCount} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.achievements.map((ach) => {
            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                  ach.unlocked
                    ? 'bg-white border-orange-200 shadow-sm hover:shadow-md'
                    : 'bg-gray-50/70 border-gray-200/80 opacity-75'
                }`}
              >
                {/* Icon box */}
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    ach.unlocked ? ach.badgeColor : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {ach.category === 'streak' ? (
                    <Flame className="w-6 h-6" />
                  ) : ach.category === 'calories' ? (
                    <Sparkles className="w-6 h-6" />
                  ) : ach.category === 'logs' ? (
                    <Utensils className="w-6 h-6" />
                  ) : (
                    <Trophy className="w-6 h-6" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-base text-gray-900">{ach.title}</h3>
                    {ach.unlocked ? (
                      <Badge className="bg-emerald-500 text-white font-bold text-[10px] gap-1 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Desbloqueada
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-400 border-gray-300 text-[10px]"
                      >
                        {ach.current} / {ach.target}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{ach.description}</p>

                  {/* Progress bar */}
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                      <span>{ach.unlocked ? '100% Concluído' : 'Em andamento'}</span>
                      <span>{ach.progressPct}%</span>
                    </div>
                    <Progress
                      value={ach.progressPct}
                      className={`h-2 ${ach.unlocked ? 'bg-emerald-100' : 'bg-gray-200'}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
