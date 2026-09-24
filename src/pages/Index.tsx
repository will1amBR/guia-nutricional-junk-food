import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchCatalogItems, fetchDailyFoodLogs } from '@/services/nutrition'
import { calculateDailyTotals, rankCatalogRecommendations } from '@/services/recommendations'
import type { CatalogItem, RegistroAlimentar, RecommendationResult } from '@/types'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

export default function Index() {
  const { user, profile } = useAuth()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [todayLogs, setTodayLogs] = useState<RegistroAlimentar[]>([])
  const [loading, setLoading] = useState(true)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const loadData = async () => {
    if (!user) return
    try {
      const [catItems, logs] = await Promise.all([
        fetchCatalogItems(),
        fetchDailyFoodLogs(user.id, todayStr),
      ])
      setCatalog(catItems)
      setTodayLogs(logs)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Realtime subscription for food logs
    const unsubscribe = pb.collection('registros_alimentares').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
        if (user?.id) {
          fetchDailyFoodLogs(user.id, todayStr).then(setTodayLogs).catch(console.error)
        }
      }
    })

    return () => {
      unsubscribe.then((unsub) => unsub())
    }
  }, [user, todayStr])

  const totals = useMemo(() => calculateDailyTotals(todayLogs), [todayLogs])

  const recommendations = useMemo(() => {
    if (!catalog.length) return []
    return rankCatalogRecommendations(catalog, profile, todayLogs)
  }, [catalog, profile, todayLogs])

  const topJunkFood = recommendations[0] || null

  const metaCalorias = profile?.meta_calorias || 2000
  const remainingCalories = Math.max(0, metaCalorias - totals.calorias)
  const caloriesPercent = Math.min(100, Math.round((totals.calorias / metaCalorias) * 100))

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
        <Button
          asChild
          className="bg-[#2EC4B6] hover:bg-[#25A89B] text-white self-start sm:self-auto shadow-sm"
        >
          <Link to="/diet" className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> Registrar Refeição
          </Link>
        </Button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Calorias do Dia */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/70 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              Balanço Energético
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500">Calorias do Dia</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {remainingCalories.toLocaleString('pt-BR')}
            </span>
            <span className="text-sm font-medium text-gray-500">kcal restantes</span>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Consumido: {totals.calorias} kcal</span>
              <span>Meta: {metaCalorias} kcal</span>
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
                    src={rec.item.imagem}
                    alt={rec.item.nome}
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
            to="/profile"
            className="group bg-white p-5 rounded-2xl border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-100 text-[#2EC4B6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 group-hover:text-[#2EC4B6] transition-colors">
                Minha Dieta
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Ajuste restrições, condições e metas de calorias e macros.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
