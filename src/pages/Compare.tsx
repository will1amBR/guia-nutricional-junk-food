import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { fetchCatalogItems } from '@/services/nutrition'
import { useAuth } from '@/contexts/AuthContext'
import type { CatalogItem } from '@/types'
import {
  ArrowLeftRight,
  Flame,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Search,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  MapPin,
  Utensils,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NutriRow {
  key: keyof CatalogItem
  label: string
  unit: string
  // higherIsBetter: true for protein/fiber, false for calories, sodium, fat, sugar
  higherIsBetter: boolean
  toleranceDiff?: number
}

const COMPARISON_ROWS: NutriRow[] = [
  { key: 'calorias', label: 'Calorias', unit: 'kcal', higherIsBetter: false },
  { key: 'proteina_g', label: 'Proteínas', unit: 'g', higherIsBetter: true },
  { key: 'carboidrato_g', label: 'Carboidratos', unit: 'g', higherIsBetter: false },
  { key: 'acucar_g', label: 'Açúcares', unit: 'g', higherIsBetter: false },
  { key: 'gordura_g', label: 'Gorduras Totais', unit: 'g', higherIsBetter: false },
  { key: 'gordura_saturada_g', label: 'Gordura Saturada', unit: 'g', higherIsBetter: false },
  { key: 'sodio_mg', label: 'Sódio', unit: 'mg', higherIsBetter: false },
  { key: 'fibra_g', label: 'Fibras', unit: 'g', higherIsBetter: true },
]

export default function Compare() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  const item1Id = searchParams.get('item1') || ''
  const item2Id = searchParams.get('item2') || ''

  useEffect(() => {
    fetchCatalogItems()
      .then((items) => {
        setCatalog(items)
        // If neither selected, select first two as sensible defaults
        if (!item1Id && !item2Id && items.length >= 2) {
          setSearchParams({ item1: items[0].id, item2: items[1].id }, { replace: true })
        } else if (!item1Id && items.length > 0) {
          setSearchParams(
            { item1: items[0].id, item2: item2Id || items[1]?.id || items[0].id },
            { replace: true },
          )
        }
      })
      .catch((err) => console.error('Erro ao carregar catálogo para comparador:', err))
      .finally(() => setLoading(false))
  }, [])

  const selectedItem1 = useMemo(
    () => catalog.find((i) => i.id === item1Id) || catalog[0] || null,
    [catalog, item1Id],
  )
  const selectedItem2 = useMemo(
    () => catalog.find((i) => i.id === item2Id) || catalog[1] || null,
    [catalog, item2Id],
  )

  const handleSelect1 = (id: string) => {
    setSearchParams({ item1: id, item2: selectedItem2?.id || '' })
  }

  const handleSelect2 = (id: string) => {
    setSearchParams({ item1: selectedItem1?.id || '', item2: id })
  }

  const handleSwap = () => {
    if (selectedItem1 && selectedItem2) {
      setSearchParams({ item1: selectedItem2.id, item2: selectedItem1.id })
    }
  }

  // Generate Profile-tailored verdict
  const verdict = useMemo(() => {
    if (!selectedItem1 || !selectedItem2) return null

    const condicoes = profile?.condicoes || ['Nenhuma']
    const hasHipertensao = condicoes.includes('Hipertensao')
    const hasDiabetes = condicoes.includes('DiabetesTipo1') || condicoes.includes('DiabetesTipo2')
    const dietTypes = profile?.dieta_atual || ['Onivora']
    const isLowCarb = dietTypes.includes('LowCarb') || dietTypes.includes('Cetogenica')

    let item1Points = 0
    let item2Points = 0
    const reasons: string[] = []

    // 1. Calories check
    if (selectedItem1.calorias < selectedItem2.calorias) {
      item1Points += 1
      reasons.push(
        `${selectedItem1.nome} tem menos calorias (${selectedItem1.calorias} vs ${selectedItem2.calorias} kcal).`,
      )
    } else if (selectedItem2.calorias < selectedItem1.calorias) {
      item2Points += 1
      reasons.push(
        `${selectedItem2.nome} tem menos calorias (${selectedItem2.calorias} vs ${selectedItem1.calorias} kcal).`,
      )
    }

    // 2. Protein check
    const p1 = selectedItem1.proteina_g || 0
    const p2 = selectedItem2.proteina_g || 0
    if (p1 > p2) {
      item1Points += 1.5
      reasons.push(
        `${selectedItem1.nome} oferece mais proteínas (${p1}g vs ${p2}g), auxiliando na saciedade.`,
      )
    } else if (p2 > p1) {
      item2Points += 1.5
      reasons.push(
        `${selectedItem2.nome} oferece mais proteínas (${p2}g vs ${p1}g), auxiliando na saciedade.`,
      )
    }

    // 3. Health conditions check: Hypertension & Sodium
    const s1 = selectedItem1.sodio_mg || 0
    const s2 = selectedItem2.sodio_mg || 0
    if (hasHipertensao) {
      if (s1 < s2) {
        item1Points += 2
        reasons.push(
          `Como você marcou Hipertensão, ${selectedItem1.nome} é muito mais seguro (${s1}mg vs ${s2}mg de sódio).`,
        )
      } else if (s2 < s1) {
        item2Points += 2
        reasons.push(
          `Como você marcou Hipertensão, ${selectedItem2.nome} é muito mais seguro (${s2}mg vs ${s1}mg de sódio).`,
        )
      }
    } else {
      if (s1 < s2) item1Points += 0.5
      else if (s2 < s1) item2Points += 0.5
    }

    // 4. Diabetes or Low-Carb: Sugars & Carbs
    const c1 = selectedItem1.carboidrato_g || 0
    const c2 = selectedItem2.carboidrato_g || 0
    const ac1 = selectedItem1.acucar_g || 0
    const ac2 = selectedItem2.acucar_g || 0

    if (hasDiabetes || isLowCarb) {
      if (c1 < c2 || ac1 < ac2) {
        item1Points += 2
        reasons.push(
          `Para seu controle glicêmico / low-carb, ${selectedItem1.nome} tem menor carga de carboidratos/açúcar (${c1}g vs ${c2}g).`,
        )
      } else if (c2 < c1 || ac2 < ac1) {
        item2Points += 2
        reasons.push(
          `Para seu controle glicêmico / low-carb, ${selectedItem2.nome} tem menor carga de carboidratos/açúcar (${c2}g vs ${c1}g).`,
        )
      }
    }

    let winner = selectedItem1
    let winnerTitle = `Opção mais equilibrada: ${selectedItem1.nome}`
    if (item2Points > item1Points) {
      winner = selectedItem2
      winnerTitle = `Opção mais equilibrada: ${selectedItem2.nome}`
    } else if (item1Points === item2Points) {
      winnerTitle = 'Empate técnico nutricional'
    }

    return {
      winner,
      winnerTitle,
      reasons,
      score1: item1Points,
      score2: item2Points,
    }
  }, [selectedItem1, selectedItem2, profile])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando comparador nutricional...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Comparador Lado a Lado
            </h1>
            <Badge className="bg-[#FF6B35] text-white font-bold text-xs">Novo</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Compare 2 itens do cardápio lado a lado e veja qual se encaixa melhor nas suas metas e
            saúde.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="border-orange-200 text-gray-700 hover:bg-orange-50 font-semibold text-xs h-9 self-start sm:self-auto"
        >
          <Link to="/catalog">Explorar Catálogo</Link>
        </Button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-orange-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Selector 1 */}
          <div className="md:col-span-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
              Primeiro Item
            </span>
            <Select value={selectedItem1?.id} onValueChange={handleSelect1}>
              <SelectTrigger className="bg-orange-50/50 border-orange-200 rounded-xl py-5 text-sm font-semibold">
                <SelectValue placeholder="Selecione o item 1" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {catalog.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                    disabled={item.id === selectedItem2?.id}
                  >
                    {item.nome} ({item.estabelecimento} - {item.calorias} kcal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="rounded-full w-10 h-10 border-orange-200 text-[#FF6B35] hover:bg-orange-100"
              title="Inverter posições"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Selector 2 */}
          <div className="md:col-span-5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2EC4B6]">
              Segundo Item
            </span>
            <Select value={selectedItem2?.id} onValueChange={handleSelect2}>
              <SelectTrigger className="bg-teal-50/50 border-teal-200 rounded-xl py-5 text-sm font-semibold">
                <SelectValue placeholder="Selecione o item 2" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {catalog.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                    disabled={item.id === selectedItem1?.id}
                  >
                    {item.nome} ({item.estabelecimento} - {item.calorias} kcal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Cards Header */}
        {selectedItem1 && selectedItem2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-orange-50/70 to-white rounded-2xl p-4 border-2 border-orange-200 flex items-center gap-4 shadow-2xs">
              <img
                src={
                  selectedItem1.imageUrl ||
                  selectedItem1.imagem ||
                  'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }
                alt={selectedItem1.nome}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="border-orange-200 text-[#FF6B35] text-[10px] font-bold"
                >
                  {selectedItem1.categoria}
                </Badge>
                <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                  {selectedItem1.nome}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-[#2EC4B6]" />
                  <span>{selectedItem1.estabelecimento}</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-teal-50/70 to-white rounded-2xl p-4 border-2 border-teal-200 flex items-center gap-4 shadow-2xs">
              <img
                src={
                  selectedItem2.imageUrl ||
                  selectedItem2.imagem ||
                  'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }
                alt={selectedItem2.nome}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="border-teal-200 text-[#2EC4B6] text-[10px] font-bold"
                >
                  {selectedItem2.categoria}
                </Badge>
                <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                  {selectedItem2.nome}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-[#2EC4B6]" />
                  <span>{selectedItem2.estabelecimento}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selectedItem1 && selectedItem2 && (
        <Card className="rounded-3xl border-orange-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 border-b border-orange-100 bg-orange-50/30 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-gray-900">
                  Tabela Nutricional Comparativa
                </h2>
                <p className="text-xs text-gray-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                  Verde indica o valor mais favorável para a saúde (menos calorias/sódio ou mais
                  proteínas/fibras).
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs font-bold">
                <span className="text-[#FF6B35]">{selectedItem1.nome}</span>
                <span className="text-gray-300">vs</span>
                <span className="text-[#2EC4B6]">{selectedItem2.nome}</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {COMPARISON_ROWS.map((row) => {
                const val1 = Number(selectedItem1[row.key] ?? 0)
                const val2 = Number(selectedItem2[row.key] ?? 0)
                const maxVal = Math.max(val1, val2, 1)

                let winner: 1 | 2 | 0 = 0
                if (val1 !== val2) {
                  if (row.higherIsBetter) {
                    winner = val1 > val2 ? 1 : 2
                  } else {
                    winner = val1 < val2 ? 1 : 2
                  }
                }

                const width1 = Math.round((val1 / maxVal) * 100)
                const width2 = Math.round((val2 / maxVal) * 100)

                return (
                  <div key={row.key} className="p-4 sm:p-5 hover:bg-orange-50/20 transition-colors">
                    {/* Row Label */}
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                      <span className="text-sm text-gray-900">{row.label}</span>
                      <span className="text-[11px] text-gray-400 font-normal">
                        {row.higherIsBetter ? 'Quanto maior, melhor' : 'Quanto menor, melhor'}
                      </span>
                    </div>

                    {/* Dual comparison row */}
                    <div className="grid grid-cols-2 gap-4 items-center">
                      {/* Left: Item 1 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-600 truncate max-w-[120px]">
                            {selectedItem1.nome}
                          </span>
                          <span
                            className={`font-extrabold text-sm px-2 py-0.5 rounded-md ${
                              winner === 1
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : winner === 2
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'text-gray-800'
                            }`}
                          >
                            {val1} {row.unit}
                            {winner === 1 && ' ✓'}
                          </span>
                        </div>
                        {/* Bar */}
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              winner === 1 ? 'bg-emerald-500' : 'bg-[#FF6B35]'
                            }`}
                            style={{ width: `${width1}%` }}
                          />
                        </div>
                      </div>

                      {/* Right: Item 2 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-600 truncate max-w-[120px]">
                            {selectedItem2.nome}
                          </span>
                          <span
                            className={`font-extrabold text-sm px-2 py-0.5 rounded-md ${
                              winner === 2
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : winner === 1
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'text-gray-800'
                            }`}
                          >
                            {val2} {row.unit}
                            {winner === 2 && ' ✓'}
                          </span>
                        </div>
                        {/* Bar */}
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              winner === 2 ? 'bg-emerald-500' : 'bg-[#2EC4B6]'
                            }`}
                            style={{ width: `${width2}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Veredicto Personalizado */}
      {verdict && (
        <div className="bg-gradient-to-br from-white to-amber-50/60 rounded-3xl p-6 sm:p-8 border-2 border-orange-200 shadow-md space-y-4">
          <div className="flex items-center gap-2.5 text-[#FF6B35]">
            <Sparkles className="w-6 h-6" />
            <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">
              Veredicto Personalizado para seu Perfil
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-base text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {verdict.winnerTitle}
              </span>
              {profile && (
                <span className="text-xs text-gray-500">
                  Calibrado para dieta: {profile.dieta_atual?.join(', ') || 'Onívora'}
                  {profile.condicoes?.length > 0 && profile.condicoes[0] !== 'Nenhuma'
                    ? ` • Condições: ${profile.condicoes.join(', ')}`
                    : ''}
                </span>
              )}
            </div>

            <ul className="space-y-2 pt-1 text-xs sm:text-sm text-gray-700">
              {verdict.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF6B35] font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              💡 <strong>Dica do Guia:</strong> Escolher a versão com mais proteína e menor teor de
              sódio mantém sua adesão à dieta sem comprometer seu prazer.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                asChild
                size="sm"
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-xs"
              >
                <Link to={`/catalog/${selectedItem1.id}`}>Ver {selectedItem1.nome}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-teal-300 text-teal-800 hover:bg-teal-50 font-bold text-xs"
              >
                <Link to={`/catalog/${selectedItem2.id}`}>Ver {selectedItem2.nome}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
