import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchCatalogItems, fetchDailyFoodLogs, addFoodLog } from '@/services/nutrition'
import { calculateDailyTotals, rankCatalogRecommendations } from '@/services/recommendations'
import type { CatalogItem, RegistroAlimentar, RecommendationResult } from '@/types'
import {
  Sparkles,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  ChevronRight,
  Flame,
  Info,
  Loader2,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function Recommendations() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [todayLogs, setTodayLogs] = useState<RegistroAlimentar[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'momento' | 'lugar'>('momento')
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({})
  const [addingId, setAddingId] = useState<string | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const loadData = async () => {
    if (!user) return
    try {
      const [catList, logs] = await Promise.all([
        fetchCatalogItems(),
        fetchDailyFoodLogs(user.id, todayStr),
      ])
      setCatalog(catList)
      setTodayLogs(logs)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Realtime sync
    const unsubscribe = pb.collection('registros_alimentares').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'delete') {
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

  const metaCalorias = profile?.meta_calorias || 2000
  const remainingCalories = Math.max(0, metaCalorias - totals.calorias)
  const progressPct = Math.min(100, Math.round((totals.calorias / metaCalorias) * 100))

  const toggleWhy = (id: string) => {
    setExpandedWhy((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleAddToDiet = async (rec: RecommendationResult) => {
    if (!user) return
    setAddingId(rec.item.id)
    try {
      await addFoodLog(user.id, rec.item.id, rec.melhorMomento.refeicao, todayStr)
      toast({
        title: 'Adicionado à sua dieta!',
        description: `${rec.item.nome} registrado no ${rec.melhorMomento.label} de hoje.`,
      })
      // refresh logs
      const updated = await fetchDailyFoodLogs(user.id, todayStr)
      setTodayLogs(updated)
    } catch (err) {
      console.error('Erro ao adicionar:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar',
        description: 'Tente novamente.',
      })
    } finally {
      setAddingId(null)
    }
  }

  // Group by establishment for "Por Lugar" tab
  const groupedByPlace = useMemo(() => {
    const groups: Record<string, RecommendationResult[]> = {}
    recommendations.forEach((rec) => {
      const place = rec.melhorLugar.estabelecimento
      if (!groups[place]) groups[place] = []
      groups[place].push(rec)
    })
    return groups
  }, [recommendations])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Calculando as melhores opções para hoje...</p>
      </div>
    )
  }

  const renderCard = (rec: RecommendationResult) => {
    const isAdded = todayLogs.some((l) => l.alimento === rec.item.id)
    const isExpanded = !!expandedWhy[rec.item.id]

    return (
      <div
        key={rec.item.id}
        className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          {/* Thumbnail & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 relative">
              <img
                src={rec.item.imagem}
                alt={rec.item.nome}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {rec.item.calorias} kcal
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-500">
                {rec.item.estabelecimento}
              </span>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{rec.item.nome}</h3>

              {/* Combined Badges: MOMENTO + LUGAR */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200/60 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                  {rec.melhorMomento.isNow ? (
                    <strong className="text-emerald-700">
                      Agora ({rec.melhorMomento.horario})
                    </strong>
                  ) : (
                    <span>
                      {rec.melhorMomento.label} ({rec.melhorMomento.horario})
                    </span>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#2EC4B6]" />
                  {rec.melhorLugar.estabelecimento}
                </span>
              </div>
            </div>
          </div>

          {/* Match Score & Action */}
          <div className="flex items-center sm:flex-col justify-between sm:justify-center items-end sm:items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            {/* Match Circle */}
            <div className="flex items-center gap-2 sm:flex-col">
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-orange-50 border-2 border-[#FF6B35]">
                <span className="text-xs font-extrabold text-[#FF6B35]">{rec.matchScore}%</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Match
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAddToDiet(rec)}
                disabled={addingId === rec.item.id}
                className={`text-xs font-bold rounded-xl transition-all ${
                  isAdded
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white shadow-xs'
                }`}
              >
                {addingId === rec.item.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" /> Na dieta
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar à dieta
                  </>
                )}
              </Button>

              <Button asChild variant="outline" size="sm" className="text-xs border-orange-200">
                <Link to={`/catalog/${rec.item.id}`}>Detalhes</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable "Por quê?" section */}
        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => toggleWhy(rec.item.id)}
            className="flex items-center justify-between w-full text-left text-xs font-bold text-gray-700 hover:text-[#FF6B35] py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" /> Por que recomendamos este momento
              e lugar?
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 p-3.5 bg-orange-50/50 rounded-xl border border-orange-100 text-xs text-gray-700 space-y-2 animate-fade-in">
              <div>
                <strong className="text-orange-900 block mb-0.5">Momento ideal:</strong>
                {rec.melhorMomento.justificativa}
              </div>
              <div>
                <strong className="text-teal-900 block mb-0.5">Estabelecimento ideal:</strong>
                {rec.melhorLugar.justificativa}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-orange-100/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Recomendações Personalizadas
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Sugestões inteligentes sincronizando o <strong className="text-gray-900">Momento</strong>{' '}
          e o <strong className="text-gray-900">Lugar</strong> perfeitos para cada junk food.
        </p>
      </div>

      {/* Context Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF6B35]" />
            <span className="text-sm font-semibold text-gray-800">
              Hoje você já consumiu{' '}
              <strong className="text-gray-900">{totals.calorias} kcal</strong>. Restam{' '}
              <strong className="text-[#FF6B35]">{remainingCalories} kcal</strong> para a meta de{' '}
              {metaCalorias} kcal.
            </span>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md self-start sm:self-auto">
            {progressPct}% atingido
          </span>
        </div>
        <Progress value={progressPct} className="h-2.5 bg-orange-100" />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'momento' | 'lugar')}
        className="space-y-6"
      >
        <TabsList className="bg-white border border-orange-100 p-1 rounded-xl">
          <TabsTrigger
            value="momento"
            className="rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
          >
            Por Momento (Horário Ideal)
          </TabsTrigger>
          <TabsTrigger
            value="lugar"
            className="rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
          >
            Por Lugar (Estabelecimento)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Por Momento */}
        <TabsContent value="momento" className="space-y-4">
          {recommendations.map(renderCard)}
        </TabsContent>

        {/* Tab 2: Por Lugar */}
        <TabsContent value="lugar" className="space-y-8">
          {Object.entries(groupedByPlace).map(([place, items]) => (
            <div key={place} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-orange-200">
                <MapPin className="w-5 h-5 text-[#2EC4B6]" />
                <h2 className="text-xl font-bold text-gray-900">{place}</h2>
                <Badge
                  variant="outline"
                  className="text-xs font-semibold text-gray-500 border-gray-300 ml-2"
                >
                  {items.length} {items.length === 1 ? 'opção' : 'opções'}
                </Badge>
              </div>

              <div className="space-y-4">{items.map(renderCard)}</div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
