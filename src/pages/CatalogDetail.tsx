import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchCatalogItemById,
  fetchCatalogItems,
  fetchDailyFoodLogs,
  addFoodLog,
} from '@/services/nutrition'
import { generateRecommendation } from '@/services/recommendations'
import type { CatalogItem, RegistroAlimentar, RecommendationResult } from '@/types'
import { CATEGORY_COLORS } from './Catalog'
import {
  MapPin,
  Clock,
  Heart,
  ChevronLeft,
  Flame,
  Sparkles,
  Info,
  Check,
  Plus,
  Loader2,
  ArrowLeftRight,
  UserPlus,
  Lock,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

// Daily Reference Values (2000 kcal diet basis)
const DAILY_VALUES = {
  calorias: 2000,
  proteina_g: 75,
  carboidrato_g: 300,
  gordura_g: 55,
  gordura_saturada_g: 22,
  gordura_trans_g: 2,
  acucar_g: 50,
  sodio_mg: 2000,
  fibra_g: 25,
}

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [item, setItem] = useState<CatalogItem | null>(null)
  const [allItems, setAllItems] = useState<CatalogItem[]>([])
  const [todayLogs, setTodayLogs] = useState<RegistroAlimentar[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToDiet, setAddingToDiet] = useState(false)
  const [isSavedInDiet, setIsSavedInDiet] = useState(false)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      fetchCatalogItemById(id),
      fetchCatalogItems(),
      user ? fetchDailyFoodLogs(user.id, todayStr) : Promise.resolve([]),
    ])
      .then(([singleItem, catalogList, logs]) => {
        setItem(singleItem)
        setAllItems(catalogList)
        setTodayLogs(logs)
        // Check if already in today's logs
        const exists = logs.some((l) => l.alimento === singleItem.id)
        setIsSavedInDiet(exists)
      })
      .catch((err) => {
        console.error('Erro ao carregar detalhes:', err)
        toast({
          variant: 'destructive',
          title: 'Item não encontrado',
          description: 'Não foi possível carregar as informações deste alimento.',
        })
        navigate('/catalog')
      })
      .finally(() => setLoading(false))
  }, [id, user, todayStr, navigate, toast])

  const recommendation: RecommendationResult | null = useMemo(() => {
    if (!item) return null
    return generateRecommendation(item, profile, todayLogs)
  }, [item, profile, todayLogs])

  const similarItems = useMemo(() => {
    if (!item || !allItems.length) return []
    return allItems
      .filter(
        (i) =>
          i.id !== item.id &&
          (i.categoria === item.categoria || i.estabelecimento === item.estabelecimento),
      )
      .slice(0, 3)
  }, [item, allItems])

  const handleToggleDiet = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/catalog/${item?.id || ''}` } } })
      return
    }
    if (!item || !recommendation) return

    setAddingToDiet(true)
    try {
      await addFoodLog(user.id, item.id, recommendation.melhorMomento.refeicao, todayStr)
      setIsSavedInDiet(true)
      toast({
        title: 'Adicionado à sua dieta!',
        description: `${item.nome} registrado no ${recommendation.melhorMomento.label} de hoje.`,
      })
    } catch (err) {
      console.error('Erro ao adicionar à dieta:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setAddingToDiet(false)
    }
  }

  if (loading || !item || !recommendation) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando detalhes nutricionais...</p>
      </div>
    )
  }

  const catClass = CATEGORY_COLORS[item.categoria] || 'bg-gray-100 text-gray-800'

  const nutritionRows = [
    {
      label: 'Calorias',
      value: `${item.calorias} kcal`,
      pct: Math.min(100, Math.round((item.calorias / DAILY_VALUES.calorias) * 100)),
      isHigh: item.calorias > 500,
    },
    {
      label: 'Proteínas',
      value: `${item.proteina_g || 0} g`,
      pct: Math.min(100, Math.round(((item.proteina_g || 0) / DAILY_VALUES.proteina_g) * 100)),
    },
    {
      label: 'Carboidratos',
      value: `${item.carboidrato_g || 0} g`,
      pct: Math.min(
        100,
        Math.round(((item.carboidrato_g || 0) / DAILY_VALUES.carboidrato_g) * 100),
      ),
    },
    {
      label: 'Gorduras totais',
      value: `${item.gordura_g || 0} g`,
      pct: Math.min(100, Math.round(((item.gordura_g || 0) / DAILY_VALUES.gordura_g) * 100)),
      isHigh: (item.gordura_g || 0) > 25,
    },
    {
      label: 'Gorduras saturadas',
      value: `${item.gordura_saturada_g || 0} g`,
      pct: Math.min(
        100,
        Math.round(((item.gordura_saturada_g || 0) / DAILY_VALUES.gordura_saturada_g) * 100),
      ),
      isHigh: (item.gordura_saturada_g || 0) > 8,
    },
    {
      label: 'Gorduras trans',
      value: `${item.gordura_trans_g || 0} g`,
      pct: Math.min(
        100,
        Math.round(((item.gordura_trans_g || 0) / DAILY_VALUES.gordura_trans_g) * 100),
      ),
    },
    {
      label: 'Açúcares',
      value: `${item.acucar_g || 0} g`,
      pct: Math.min(100, Math.round(((item.acucar_g || 0) / DAILY_VALUES.acucar_g) * 100)),
      isHigh: (item.acucar_g || 0) > 25,
    },
    {
      label: 'Sódio',
      value: `${item.sodio_mg || 0} mg`,
      pct: Math.min(100, Math.round(((item.sodio_mg || 0) / DAILY_VALUES.sodio_mg) * 100)),
      isHigh: (item.sodio_mg || 0) > 700,
    },
    {
      label: 'Fibras alimentares',
      value: `${item.fibra_g || 0} g`,
      pct: Math.min(100, Math.round(((item.fibra_g || 0) / DAILY_VALUES.fibra_g) * 100)),
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#FF6B35] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar ao Catálogo
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden bg-gradient-to-tr from-orange-100 to-amber-50">
            <img
              src={
                item.imageUrl ||
                item.imagem ||
                'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
              }
              alt={item.nome}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge
                variant="outline"
                className={`${catClass} font-bold text-xs backdrop-blur-md px-3 py-1 rounded-full`}
              >
                {item.categoria}
              </Badge>
            </div>
            <div className="absolute bottom-4 right-4">
              <span className="bg-black/75 backdrop-blur-md text-white text-sm font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <Flame className="w-4 h-4 text-[#FF6B35]" />
                {item.calorias} kcal
              </span>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-[#2EC4B6]" />
                <span className="font-semibold text-gray-800">{item.estabelecimento}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {item.nome}
              </h1>

              {/* Match Score Badge */}
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-xs font-bold text-orange-950">
                  {user ? (
                    <>
                      Compatibilidade com seu perfil:{' '}
                      <strong className="text-[#FF6B35]">{recommendation.matchScore}%</strong>
                    </>
                  ) : (
                    <>
                      Pontuação geral de equilíbrio:{' '}
                      <strong className="text-[#FF6B35]">{recommendation.matchScore}%</strong>
                      <span className="text-gray-400 font-normal"> (faça login para calibrar)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
              {user ? (
                <Button
                  onClick={handleToggleDiet}
                  disabled={addingToDiet}
                  className={`w-full sm:flex-1 py-6 font-bold text-sm rounded-xl transition-all shadow-sm ${
                    isSavedInDiet
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                  }`}
                >
                  {addingToDiet ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...
                    </>
                  ) : isSavedInDiet ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Adicionado à Dieta de Hoje
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2 fill-white" /> Adicionar à Minha Dieta
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full sm:flex-1 py-6 font-bold text-sm rounded-xl bg-[#FF6B35] hover:bg-[#E55A2B] text-white transition-all shadow-sm"
                >
                  <Link to="/signup">
                    <UserPlus className="w-4 h-4 mr-2" /> Cadastre-se para Salvar na Dieta
                  </Link>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto py-6 px-5 border-orange-200 text-gray-800 hover:bg-orange-50 font-bold text-sm rounded-xl transition-all shadow-xs gap-2"
              >
                <Link to={`/compare?item1=${item.id}`}>
                  <ArrowLeftRight className="w-4 h-4 text-[#FF6B35]" /> Comparar Alimento
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Callout if deslogado */}
      {!user && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Quer saber se este item cabe na sua meta de hoje?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Crie sua conta para que nosso algoritmo cruze o gasto calórico, sua meta de
                macronutrientes e suas restrições de saúde antes de você pedir.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              asChild
              size="sm"
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-xs h-9 px-4 rounded-xl"
            >
              <Link to="/signup">Criar Conta</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-orange-200 text-gray-700 hover:bg-orange-50 font-semibold text-xs h-9 px-3 rounded-xl"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Recommendations Highlight: MOMENTO & LUGAR (Sempre juntos) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-xl font-bold text-gray-900">
              Recomendações Inteligentes: Momento & Lugar
            </h2>
          </div>
          {!user && (
            <Badge variant="outline" className="border-orange-200 text-orange-700 text-[10px]">
              Sugestão Padrão
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Momento Indicado */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-[#FF6B35] border border-orange-100 shadow-sm relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF6B35]" /> Momento Indicado para Comer
              </span>
              {recommendation.melhorMomento.isNow && (
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] font-bold">
                  Janela Atual
                </Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                {recommendation.melhorMomento.label} ({recommendation.melhorMomento.horario})
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {recommendation.melhorMomento.justificativa}
              </p>
            </div>
          </div>

          {/* Card 2: Onde Encontrar */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-[#2EC4B6] border border-teal-100 shadow-sm relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2EC4B6]" /> Onde Encontrar
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold text-teal-700 border-teal-200"
              >
                Ponto Oficial
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                {recommendation.melhorLugar.estabelecimento}
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {recommendation.melhorLugar.justificativa}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nutritional Table */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tabela Nutricional Completa</h2>
            <p className="text-xs text-gray-500">
              Valores diários de referência (% VD) calculados com base em uma dieta padrão de 2.000
              kcal.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
            Porção padrão
          </span>
        </div>

        <div className="space-y-4">
          {nutritionRows.map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  {row.label}
                  {row.isHigh && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                      Elevado
                    </span>
                  )}
                </span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 mr-2">{row.value}</span>
                  <span className="text-xs text-gray-400">({row.pct}% VD)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    row.isHigh ? 'bg-red-500' : 'bg-[#FF6B35]'
                  }`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Confira também (Similar items) */}
      {similarItems.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-gray-900">Confira também</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {similarItems.map((similar) => (
              <Link
                key={similar.id}
                to={`/catalog/${similar.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-32 overflow-hidden bg-gray-100 relative">
                    <img
                      src={
                        similar.imageUrl ||
                        similar.imagem ||
                        'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                      }
                      alt={similar.nome}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2">
                      <span className="bg-black/75 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {similar.calorias} kcal
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-medium text-gray-400">
                      {similar.estabelecimento}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF6B35] line-clamp-1">
                      {similar.nome}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
