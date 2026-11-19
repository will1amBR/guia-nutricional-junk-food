import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchActiveTrainingGoal,
  fetchWeeklyExercises,
  getWeekStart,
  getWeekEnd,
  saveTrainingGoal,
} from '@/services/training'
import pb from '@/lib/pocketbase/client'
import type { ExercicioRegistro, MetaTreino } from '@/types'
import { Dumbbell, Loader2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

/** Formata uma data como YYYY-MM-DD no fuso local (sem UTC shift). */
function toYMDLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Some os minutos e calorias de uma lista de exercícios. */
function sumExercises(list: ExercicioRegistro[]) {
  const minutes = list.reduce((acc, e) => acc + (e.duracao_min || 0), 0)
  const calories = list.reduce((acc, e) => acc + (e.calorias_queimadas || 0), 0)
  return { minutes, calories }
}

export default function WeeklyTrainingGoal() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [goal, setGoal] = useState<MetaTreino | null>(null)
  const [weekly, setWeekly] = useState<ExercicioRegistro[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [tipo, setTipo] = useState<'minutos' | 'calorias'>('minutos')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      try {
        const [g, ex] = await Promise.all([
          fetchActiveTrainingGoal(user.id),
          fetchWeeklyExercises(user.id),
        ])
        if (cancelled) return
        setGoal(g)
        setWeekly(ex)
      } catch (err) {
        console.error('Erro ao carregar meta de treino:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  const totals = useMemo(() => sumExercises(weekly), [weekly])
  const weekRange = useMemo(() => {
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d)
    return `${fmt(getWeekStart())} a ${fmt(getWeekEnd())}`
  }, [])

  const current = tipo === 'minutos' ? totals.minutes : totals.calories
  const target = goal?.valor_alvo || 0
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const unitLabel = goal?.tipo_objetivo === 'calorias' ? 'kcal' : 'min'

  const refresh = async () => {
    if (!user) return
    const [g, ex] = await Promise.all([
      fetchActiveTrainingGoal(user.id),
      fetchWeeklyExercises(user.id),
    ])
    setGoal(g)
    setWeekly(ex)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const n = parseInt(valor, 10)
    if (!n || n <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Informe um número maior que zero.',
      })
      return
    }
    setSaving(true)
    try {
      await saveTrainingGoal(user.id, { tipo_objetivo: tipo, valor_alvo: n }, goal?.id)
      toast({
        title: 'Meta salva!',
        description: `Sua meta semanal de ${n} ${tipo === 'calorias' ? 'kcal' : 'min'} foi salva.`,
      })
      await refresh()
      setEditing(false)
      setValor('')
    } catch (err) {
      console.error('Erro ao salvar meta:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar meta',
        description: 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (g: MetaTreino | null) => {
    setTipo(g?.tipo_objetivo ?? 'minutos')
    setValor(g?.valor_alvo ? String(g.valor_alvo) : '')
    setEditing(true)
  }

  const handleRemove = async () => {
    if (!goal || !user) return
    setSaving(true)
    try {
      await pb.collection('metas_treino').delete(goal.id)
      toast({ title: 'Meta removida', description: 'Você pode criar uma nova quando quiser.' })
      setGoal(null)
      setEditing(false)
    } catch (err) {
      console.error('Erro ao remover meta:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover meta',
        description: 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-teal-600" /> Carregando meta semanal...
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900 text-base">Meta Semanal de Treino</h2>
            <p className="text-xs text-gray-500 capitalize">
              Semana de {weekRange} • acompanhe junto com o streak
            </p>
          </div>
        </div>
        {goal && !editing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => startEdit(goal)}
            className="text-xs h-8 border-teal-200 text-teal-700 hover:bg-teal-50 gap-1.5 self-start sm:self-auto"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar meta
          </Button>
        )}
      </div>

      {/* Editing form */}
      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Tipo de objetivo</label>
              <div className="flex gap-2">
                {(['minutos', 'calorias'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                      tipo === t
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-teal-50'
                    }`}
                  >
                    {t === 'minutos' ? 'Minutos por semana' : 'Calorias por semana'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {tipo === 'minutos' ? 'Minutos por semana' : 'Calorias por semana'}
              </label>
              <Input
                type="number"
                min={1}
                max={tipo === 'minutos' ? 2000 : 10000}
                placeholder={tipo === 'minutos' ? 'Ex: 150' : 'Ex: 1200'}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="rounded-xl border-teal-100 text-sm"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            {goal && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="text-xs h-9 border-gray-200 text-gray-600"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-9 gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Salvar meta
            </Button>
          </div>
        </form>
      ) : goal ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-2xl font-extrabold text-teal-700">
                {current}{' '}
                <span className="text-sm font-bold text-gray-400">
                  / {target} {unitLabel}
                </span>
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {totals.minutes} min • {totals.calories} kcal queimadas na semana
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold border ${
                pct >= 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : pct >= 50
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {pct >= 100 ? 'Meta batida! 🎉' : `${pct}% da meta`}
            </Badge>
          </div>
          <Progress value={pct} className="h-3 bg-teal-100" />
          {pct >= 100 ? (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" /> Você bateu a meta de treino desta semana.
              Continue acompanhando o streak!
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Faltam{' '}
              <strong className="text-teal-700">
                {target - current} {unitLabel}
              </strong>{' '}
              para bater sua meta semanal.
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6 bg-teal-50/40 rounded-xl border border-dashed border-teal-200 p-4">
          <p className="text-sm font-semibold text-gray-700">
            Nenhuma meta semanal definida ainda.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Defina um objetivo de minutos ou calorias por semana para acompanhar seus treinos.
          </p>
          <Button
            size="sm"
            onClick={() => startEdit(null)}
            className="mt-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Definir meta semanal
          </Button>
        </div>
      )}
    </section>
  )
}
