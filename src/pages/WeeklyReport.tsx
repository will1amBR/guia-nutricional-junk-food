import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchWeeklyFoodLogs, fetchCatalogItems } from '@/services/nutrition'
import type { RegistroAlimentar, CatalogItem } from '@/types'
import {
  Share2,
  Copy,
  Check,
  Calendar,
  Flame,
  Award,
  AlertCircle,
  TrendingUp,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Utensils,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

export default function WeeklyReport() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0) // 0 = current week, -1 = last week
  const [logs, setLogs] = useState<RegistroAlimentar[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Calculate Monday to Sunday date range based on offset
  const { startDateStr, endDateStr, formattedRange } = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diffToMonday = (day === 0 ? -6 : 1 - day) + currentWeekOffset * 7

    const start = new Date(now)
    start.setDate(now.getDate() + diffToMonday)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const formatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
    const formatted = `${formatter.format(start)} a ${formatter.format(end)}`

    return { startDateStr: startStr, endDateStr: endStr, formattedRange: formatted }
  }, [currentWeekOffset])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        const [wLogs, cat] = await Promise.all([
          fetchWeeklyFoodLogs(user.id, startDateStr, endDateStr),
          fetchCatalogItems(),
        ])
        setLogs(wLogs)
        setCatalog(cat)
      } catch (err) {
        console.error('Erro ao carregar relatório semanal:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, startDateStr, endDateStr])

  // Aggregated metrics
  const stats = useMemo(() => {
    const totalItems = logs.length
    const totalCalories = logs.reduce((acc, l) => acc + (l.expand?.alimento?.calorias || 0), 0)
    const totalProt = logs.reduce((acc, l) => acc + (l.expand?.alimento?.proteina_g || 0), 0)
    const totalCarb = logs.reduce((acc, l) => acc + (l.expand?.alimento?.carboidrato_g || 0), 0)
    const totalFat = logs.reduce((acc, l) => acc + (l.expand?.alimento?.gordura_g || 0), 0)
    const totalSodio = logs.reduce((acc, l) => acc + (l.expand?.alimento?.sodio_mg || 0), 0)

    const daysCount = 7
    const avgDailyCalories = Math.round(totalCalories / daysCount)
    const targetDailyCalories = profile?.meta_calorias || 2000

    // Count by food
    const foodCounts: Record<string, { item: CatalogItem; count: number }> = {}
    logs.forEach((log) => {
      const food = log.expand?.alimento
      if (food) {
        if (!foodCounts[food.id]) {
          foodCounts[food.id] = { item: food, count: 0 }
        }
        foodCounts[food.id].count += 1
      }
    })

    const topConsumed = Object.values(foodCounts).sort((a, b) => b.count - a.count)

    // Best choice (lowest cal or highest protein/cal ratio) and most caloric
    let bestChoice: CatalogItem | null = null
    let mostCaloric: CatalogItem | null = null

    if (logs.length > 0) {
      const uniqueFoods = Object.values(foodCounts).map((f) => f.item)
      bestChoice = [...uniqueFoods].sort(
        (a, b) => (b.proteina_g || 0) / (b.calorias || 1) - (a.proteina_g || 0) / (a.calorias || 1),
      )[0]
      mostCaloric = [...uniqueFoods].sort((a, b) => b.calorias - a.calorias)[0]
    }

    return {
      totalItems,
      totalCalories,
      totalProt,
      totalCarb,
      totalFat,
      totalSodio,
      avgDailyCalories,
      targetDailyCalories,
      topConsumed,
      bestChoice,
      mostCaloric,
    }
  }, [logs, profile])

  // Build shareable text summary
  const shareableText = useMemo(() => {
    return (
      `📊 *Meu Relatório Semanal — Guia JunkFood*\n` +
      `🗓️ Semana: ${formattedRange}\n\n` +
      `🍔 Junk foods consumidos: ${stats.totalItems} itens\n` +
      `🔥 Total de calorias: ${stats.totalCalories.toLocaleString('pt-BR')} kcal\n` +
      `⚡ Média diária de junk food: ${stats.avgDailyCalories} kcal/dia (Meta total: ${stats.targetDailyCalories} kcal)\n` +
      `🥩 Proteínas totais: ${stats.totalProt}g | 🥖 Carbos: ${stats.totalCarb}g | 🥑 Gorduras: ${stats.totalFat}g\n` +
      (stats.bestChoice
        ? `⭐ Melhor escolha proteica: ${stats.bestChoice.nome} (${stats.bestChoice.proteina_g}g prot)\n`
        : '') +
      (stats.topConsumed[0]
        ? `🏆 Mais pedido: ${stats.topConsumed[0].item.nome} (${stats.topConsumed[0].count}x)\n`
        : '') +
      `\nPlanejei minhas refeições com estratégia pelo *Guia Nutricional de Junk Food*!`
    )
  }, [stats, formattedRange])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableText)
      setCopied(true)
      toast({
        title: 'Copiado para a área de transferência!',
        description: 'Agora é só colar no WhatsApp, grupo de amigos ou enviar ao nutricionista.',
      })
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto.',
      })
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Relatório Semanal - Guia JunkFood',
          text: shareableText,
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy()
    }
  }

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareableText)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Calculando seu relatório da semana...</p>
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
              Relatório Semanal
            </h1>
            <Badge className="bg-orange-100 text-[#FF6B35] font-bold text-xs border-orange-200">
              Progresso
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Resumo completo das suas refeições, calorias e equilíbrio dos junk foods consumidos.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="border-orange-200 text-gray-700 hover:bg-orange-50 font-semibold text-xs h-9 gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </Button>

          <Button
            onClick={handleWhatsAppShare}
            className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
          >
            <Share2 className="w-4 h-4" /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
          className="text-gray-600 hover:text-[#FF6B35] gap-1 text-xs"
        >
          <ChevronLeft className="w-4 h-4" /> Semana Anterior
        </Button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#FF6B35]" />
          <span className="font-extrabold text-sm sm:text-base text-gray-900">
            {formattedRange}
          </span>
          {currentWeekOffset === 0 && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
              Semana Atual
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentWeekOffset >= 0}
          onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
          className="text-gray-600 hover:text-[#FF6B35] gap-1 text-xs"
        >
          Próxima Semana <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-orange-100 shadow-sm bg-white">
          <CardContent className="p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Junk Foods Registrados
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-gray-900">{stats.totalItems}</span>
              <span className="text-xs text-gray-500">refeições</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Média de {(stats.totalItems / 7).toFixed(1)} itens/dia
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-orange-100 shadow-sm bg-white">
          <CardContent className="p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Calorias Totais da Semana
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats.totalCalories.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-[#FF6B35] font-bold">kcal</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Média diária: <strong>{stats.avgDailyCalories} kcal</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-orange-100 shadow-sm bg-white">
          <CardContent className="p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Proteína Acumulada
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#2EC4B6]">{stats.totalProt}g</span>
              <span className="text-xs text-gray-500">massa muscular</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              ~{Math.round(stats.totalProt / 7)}g de proteína/dia em junk foods
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-orange-100 shadow-sm bg-white">
          <CardContent className="p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Sódio Acumulado
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-600">
                {(stats.totalSodio / 1000).toFixed(1)}g
              </span>
              <span className="text-xs text-gray-500">sódio</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              {(stats.totalSodio / 7).toFixed(0)}mg de sódio/dia médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Highlights: Best choice & Most consumed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Nutritional Match */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 rounded-3xl p-6 border border-emerald-200 space-y-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base">Melhor Escolha Proteica da Semana</h3>
          </div>

          {stats.bestChoice ? (
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
              <img
                src={
                  stats.bestChoice.imageUrl ||
                  stats.bestChoice.imagem ||
                  'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }
                alt={stats.bestChoice.nome}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-gray-900">{stats.bestChoice.nome}</h4>
                <p className="text-xs text-gray-500">{stats.bestChoice.estabelecimento}</p>
                <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 bg-emerald-50"
                  >
                    {stats.bestChoice.proteina_g}g Proteína
                  </Badge>
                  <span className="text-gray-500">{stats.bestChoice.calorias} kcal</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Nenhum alimento registrado nesta semana.</p>
          )}

          <p className="text-xs text-emerald-900 leading-relaxed">
            Parabéns! Priorizar opções com alto teor de proteína garante maior saciedade e preserva
            sua massa magra mesmo em dias de junk food.
          </p>
        </div>

        {/* Most caloric / Most Consumed */}
        <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/80 rounded-3xl p-6 border border-orange-200 space-y-4">
          <div className="flex items-center gap-2 text-orange-900">
            <Flame className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="font-extrabold text-base">Prato Mais Frequente / Calórico</h3>
          </div>

          {stats.topConsumed[0] ? (
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-orange-100 shadow-2xs">
              <img
                src={
                  stats.topConsumed[0].item.imageUrl ||
                  stats.topConsumed[0].item.imagem ||
                  'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }
                alt={stats.topConsumed[0].item.nome}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                }}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-gray-900">
                  {stats.topConsumed[0].item.nome}
                </h4>
                <p className="text-xs text-gray-500">{stats.topConsumed[0].item.estabelecimento}</p>
                <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                  <Badge className="bg-[#FF6B35] text-white">
                    Consumido {stats.topConsumed[0].count}x na semana
                  </Badge>
                  <span className="text-gray-500">{stats.topConsumed[0].item.calorias} kcal</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Nenhum consumo registrado ainda.</p>
          )}

          <p className="text-xs text-orange-950 leading-relaxed">
            Dica do Guia: Se o mesmo item aparece várias vezes na semana, compense ajustando os
            acompanhamentos (troque refrigerante normal por zero e porções grandes por médias).
          </p>
        </div>
      </div>

      {/* Consumed list table */}
      <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-lg text-gray-900">Histórico de Junk Foods da Semana</h3>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-gray-500 space-y-2">
            <Utensils className="w-8 h-8 text-orange-300 mx-auto" />
            <p className="text-sm font-semibold">Nenhuma refeição registrada nesta semana.</p>
            <p className="text-xs text-gray-400">
              Registre o que você consome na aba "Minha Dieta" para gerar seu relatório completo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const food = log.expand?.alimento
              if (!food) return null

              const logDate = new Date(log.data)
              const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'numeric',
              }).format(logDate)

              return (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        food.imageUrl ||
                        food.imagem ||
                        'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                      }
                      alt={food.nome}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                      }}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{food.nome}</h4>
                      <span className="text-xs text-gray-500">
                        {food.estabelecimento} • {log.refeicao} ({formattedDate})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-gray-900 block">
                      {food.calorias} kcal
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {food.proteina_g || 0}g prot • {food.carboidrato_g || 0}g carb
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Share Box Preview */}
      <div className="bg-gradient-to-r from-orange-100/70 to-amber-100/70 rounded-3xl p-6 border border-orange-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-gray-900">
              Prévia da Mensagem para Compartilhar
            </h3>
            <p className="text-xs text-gray-600">
              Copie o texto formatado para enviar no WhatsApp ou nas suas redes sociais.
            </p>
          </div>
          <Button
            onClick={handleCopy}
            className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-xs gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Agora'}
          </Button>
        </div>

        <pre className="bg-white/90 p-4 rounded-2xl text-xs text-gray-800 font-mono whitespace-pre-wrap border border-orange-200/60 leading-relaxed">
          {shareableText}
        </pre>
      </div>
    </div>
  )
}
