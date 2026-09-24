import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchDailyFoodLogs,
  fetchCatalogItems,
  addFoodLog,
  removeFoodLog,
} from '@/services/nutrition'
import {
  MEAL_DEFINITIONS,
  calculateDailyTotals,
  rankCatalogRecommendations,
} from '@/services/recommendations'
import type { CatalogItem, RegistroAlimentar, RefeicaoTipo } from '@/types'
import {
  CalendarDays,
  Plus,
  Trash2,
  Clock,
  Flame,
  Search,
  Sparkles,
  MapPin,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const MEAL_SLOTS: RefeicaoTipo[] = [
  'CafeDaManha',
  'LancheDaManha',
  'Almoco',
  'LancheDaTarde',
  'Jantar',
  'Ceia',
]

export default function Diet() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [logs, setLogs] = useState<RegistroAlimentar[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add Food Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [targetSlot, setTargetSlot] = useState<RefeicaoTipo>('Almoco')
  const [modalSearch, setModalSearch] = useState('')
  const [modalCategory, setModalCategory] = useState<string>('Todas')
  const [addingFoodId, setAddingFoodId] = useState<string | null>(null)

  // Delete Dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0]
  }, [selectedDate])

  const loadData = async () => {
    if (!user) return
    try {
      const [userLogs, allCatalog] = await Promise.all([
        fetchDailyFoodLogs(user.id, selectedDateStr),
        fetchCatalogItems(),
      ])
      setLogs(userLogs)
      setCatalog(allCatalog)
    } catch (err) {
      console.error('Erro ao carregar dados da dieta:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Realtime subscription
    const unsubscribe = pb.collection('registros_alimentares').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'delete') {
        if (user?.id) {
          fetchDailyFoodLogs(user.id, selectedDateStr).then(setLogs).catch(console.error)
        }
      }
    })

    return () => {
      unsubscribe.then((unsub) => unsub())
    }
  }, [user, selectedDateStr])

  const totals = useMemo(() => calculateDailyTotals(logs), [logs])
  const metaCalorias = profile?.meta_calorias || 2000

  // Target macros in grams
  const metaProtGrams = Math.round((((profile?.meta_proteina_pct || 25) / 100) * metaCalorias) / 4)
  const metaCarbGrams = Math.round(
    (((profile?.meta_carboidrato_pct || 50) / 100) * metaCalorias) / 4,
  )
  const metaFatGrams = Math.round((((profile?.meta_gordura_pct || 25) / 100) * metaCalorias) / 9)

  const caloriesPercent = Math.min(100, Math.round((totals.calorias / metaCalorias) * 100))
  const protPercent = Math.min(100, Math.round((totals.proteina_g / (metaProtGrams || 1)) * 100))
  const carbPercent = Math.min(100, Math.round((totals.carboidrato_g / (metaCarbGrams || 1)) * 100))
  const fatPercent = Math.min(100, Math.round((totals.gordura_g / (metaFatGrams || 1)) * 100))

  // Week navigation (Monday - Sunday around selected date)
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate)
    const day = curr.getDay() // 0 is Sunday
    // Adjust to make Monday the first day (0)
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(curr)
    monday.setDate(curr.getDate() + diffToMonday)

    const days: {
      date: Date
      dateStr: string
      label: string
      isToday: boolean
      isSelected: boolean
    }[] = []
    const todayYMD = new Date().toISOString().split('T')[0]

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dStr = d.toISOString().split('T')[0]
      const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).slice(0, 3)
      days.push({
        date: d,
        dateStr: dStr,
        label,
        isToday: dStr === todayYMD,
        isSelected: dStr === selectedDateStr,
      })
    }
    return days
  }, [selectedDate, selectedDateStr])

  const openAddModal = (slot: RefeicaoTipo) => {
    setTargetSlot(slot)
    setModalSearch('')
    setModalCategory('Todas')
    setModalOpen(true)
  }

  const handleAddFood = async (food: CatalogItem) => {
    if (!user) return
    setAddingFoodId(food.id)
    try {
      await addFoodLog(user.id, food.id, targetSlot, selectedDateStr)
      toast({
        title: 'Alimento adicionado!',
        description: `${food.nome} registrado em ${MEAL_DEFINITIONS[targetSlot].label}.`,
      })
      const updated = await fetchDailyFoodLogs(user.id, selectedDateStr)
      setLogs(updated)
      setModalOpen(false)
    } catch (err) {
      console.error('Erro ao adicionar:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar',
        description: 'Tente novamente.',
      })
    } finally {
      setAddingFoodId(null)
    }
  }

  const confirmDelete = (log: RegistroAlimentar) => {
    const name = log.expand?.alimento?.nome || 'este alimento'
    setItemToDelete({ id: log.id, name })
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      await removeFoodLog(itemToDelete.id)
      toast({
        title: 'Removido!',
        description: 'Alimento removido da sua refeição.',
      })
      setLogs((prev) => prev.filter((l) => l.id !== itemToDelete.id))
      setDeleteConfirmOpen(false)
    } catch (err) {
      console.error('Erro ao deletar:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Tente novamente.',
      })
    } finally {
      setDeleting(false)
      setItemToDelete(null)
    }
  }

  // Filter items in modal
  const modalFilteredItems = useMemo(() => {
    return catalog.filter((food) => {
      const matchCat = modalCategory === 'Todas' || food.categoria === modalCategory
      const term = modalSearch.toLowerCase().trim()
      const matchSearch =
        !term ||
        food.nome.toLowerCase().includes(term) ||
        food.estabelecimento.toLowerCase().includes(term)
      return matchCat && matchSearch
    })
  }, [catalog, modalSearch, modalCategory])

  // Recommended junk foods for current modal slot
  const modalRecommendations = useMemo(() => {
    if (!catalog.length) return []
    const scored = rankCatalogRecommendations(catalog, profile, logs)
    // Prioritize those whose ideal slot matches targetSlot
    return scored.filter((r) => r.melhorMomento.refeicao === targetSlot).slice(0, 3)
  }, [catalog, profile, logs, targetSlot])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando seu plano alimentar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-orange-100/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Minha Dieta
        </h1>
        <p className="text-sm sm:text-base text-gray-600 capitalize">
          {new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(selectedDate)}
        </p>
      </div>

      {/* Week Navigator */}
      <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Navegação Semanal
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500"
              onClick={() => {
                const prev = new Date(selectedDate)
                prev.setDate(prev.getDate() - 7)
                setSelectedDate(prev)
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 border-orange-200 text-[#FF6B35]"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500"
              onClick={() => {
                const next = new Date(selectedDate)
                next.setDate(next.getDate() + 7)
                setSelectedDate(next)
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 7 Days Bar */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {weekDays.map((wd) => (
            <button
              key={wd.dateStr}
              type="button"
              onClick={() => setSelectedDate(wd.date)}
              className={`flex flex-col items-center justify-center py-2.5 sm:py-3 rounded-xl transition-all duration-200 border ${
                wd.isSelected
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md shadow-orange-500/20 scale-[1.02]'
                  : wd.isToday
                    ? 'bg-orange-50 text-[#FF6B35] border-orange-200'
                    : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
              }`}
            >
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">
                {wd.label}
              </span>
              <span className="text-sm sm:text-base font-extrabold mt-0.5">
                {wd.date.getDate()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Day Overview: Calories & Macros */}
      <div className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm space-y-6">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-lg font-bold text-gray-900">Visão Geral do Dia</h2>
            <span className="text-sm font-semibold text-gray-600">
              <strong className="text-gray-900">{totals.calorias}</strong> / {metaCalorias} kcal
            </span>
          </div>
          <Progress value={caloriesPercent} className="h-3 bg-orange-100" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          {/* Protein */}
          <div className="space-y-1.5 bg-orange-50/40 p-3.5 rounded-xl border border-orange-100/60">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Proteínas</span>
              <span className="text-[#FF6B35]">
                {totals.proteina_g}g / {metaProtGrams}g ({protPercent}%)
              </span>
            </div>
            <Progress value={protPercent} className="h-2 bg-orange-100" />
          </div>

          {/* Carbs */}
          <div className="space-y-1.5 bg-amber-50/40 p-3.5 rounded-xl border border-amber-100/60">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Carboidratos</span>
              <span className="text-amber-600">
                {totals.carboidrato_g}g / {metaCarbGrams}g ({carbPercent}%)
              </span>
            </div>
            <Progress value={carbPercent} className="h-2 bg-amber-100" />
          </div>

          {/* Fat */}
          <div className="space-y-1.5 bg-teal-50/40 p-3.5 rounded-xl border border-teal-100/60">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Gorduras</span>
              <span className="text-[#2EC4B6]">
                {totals.gordura_g}g / {metaFatGrams}g ({fatPercent}%)
              </span>
            </div>
            <Progress value={fatPercent} className="h-2 bg-teal-100" />
          </div>
        </div>
      </div>

      {/* Meal Timeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Linha do Tempo das Refeições</h2>

        <div className="space-y-4">
          {MEAL_SLOTS.map((slot) => {
            const def = MEAL_DEFINITIONS[slot]
            const slotLogs = logs.filter((l) => l.refeicao === slot)
            const slotCalories = slotLogs.reduce(
              (acc, curr) => acc + (curr.expand?.alimento?.calorias || 0),
              0,
            )

            return (
              <div
                key={slot}
                className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 space-y-4 hover:border-orange-200 transition-colors"
              >
                {/* Slot Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center font-bold text-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{def.label}</h3>
                      <span className="text-xs text-gray-500">{def.horario}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs font-bold text-gray-700 bg-orange-50 px-3 py-1 rounded-full">
                      {slotCalories} kcal
                    </span>
                    <Button
                      size="sm"
                      onClick={() => openAddModal(slot)}
                      className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs font-semibold rounded-xl h-8 px-3"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Logged Foods List */}
                {slotLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    Nenhum alimento registrado para esta refeição.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slotLogs.map((log) => {
                      const food = log.expand?.alimento
                      if (!food) return null

                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-orange-50/40 border border-orange-100/70"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                              <img
                                src={food.imagem}
                                alt={food.nome}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                                {food.nome}
                              </h4>
                              <span className="text-[11px] text-gray-500">
                                {food.estabelecimento} •{' '}
                                <strong className="text-gray-700">{food.calorias} kcal</strong>
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(log)}
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Add Food Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Adicionar Alimento em {MEAL_DEFINITIONS[targetSlot].label}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Selecione do catálogo ou confira as junk foods recomendadas para este momento.
            </DialogDescription>
          </DialogHeader>

          {/* Search bar inside modal */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou lugar..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="pl-9 text-sm focus-visible:ring-[#FF6B35]"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-4 pr-1 scrollbar-thin">
            {/* Recommended Section in Modal */}
            {modalRecommendations.length > 0 && !modalSearch && (
              <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B35] mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Junk Foods Recomendadas para {MEAL_DEFINITIONS[targetSlot].label}</span>
                </div>
                <div className="space-y-2">
                  {modalRecommendations.map((rec) => (
                    <div
                      key={rec.item.id}
                      className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-orange-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rec.item.imagem}
                          alt={rec.item.nome}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-bold text-xs text-gray-900 line-clamp-1">
                            {rec.item.nome}
                          </p>
                          <span className="text-[11px] text-gray-500">
                            {rec.item.estabelecimento} • {rec.item.calorias} kcal
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddFood(rec.item)}
                        disabled={addingFoodId === rec.item.id}
                        className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs h-7 px-2.5"
                      >
                        {addingFoodId === rec.item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Adicionar'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full catalog list */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Todos os itens do catálogo
              </span>
              {modalFilteredItems.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-orange-50/50 border border-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={food.imagem}
                      alt={food.nome}
                      className="w-11 h-11 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{food.nome}</h4>
                      <span className="text-xs text-gray-500">
                        {food.estabelecimento} •{' '}
                        <strong className="text-gray-700">{food.calorias} kcal</strong>
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddFood(food)}
                    disabled={addingFoodId === food.id}
                    className="border-orange-200 text-[#FF6B35] hover:bg-orange-50 text-xs h-8"
                  >
                    {addingFoodId === food.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Adicionar'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Remover alimento
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 pt-2">
              Deseja realmente remover <strong>{itemToDelete?.name}</strong> da sua refeição?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Removendo...' : 'Sim, remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
