import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Utensils, MapPin, Sparkles, X, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface InitialCravingAnswers {
  craving: string
  location: string
}

interface InitialCravingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (answers: InitialCravingAnswers) => void
  currentAnswers: InitialCravingAnswers
  availablePlaces: string[]
}

const QUICK_SUGGESTIONS = [
  'Hambúrguer',
  'Pizza',
  'Batata Frita',
  'Açaí',
  'Pastel',
  'Frango Frito',
  'Subway',
  'Doce / Milkshake',
  'Esfiha',
]

export function InitialCravingModal({
  open,
  onOpenChange,
  onApply,
  currentAnswers,
  availablePlaces,
}: InitialCravingModalProps) {
  const [craving, setCraving] = useState(currentAnswers.craving || '')
  const [location, setLocation] = useState(currentAnswers.location || 'todos')

  const handleSelectQuick = (sug: string) => {
    setCraving(sug)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply({
      craving: craving.trim(),
      location,
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setCraving('')
    setLocation('todos')
    onApply({
      craving: '',
      location: 'todos',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-orange-200">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-950">
                O que você quer comer hoje?
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Personalize as recomendações para o seu desejo e onde você está agora.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Pergunta 1: O que quer comer? */}
          <div className="space-y-2">
            <Label
              htmlFor="craving"
              className="text-xs font-bold text-gray-800 flex items-center gap-1.5"
            >
              <Utensils className="w-4 h-4 text-[#FF6B35]" /> 1. O que você quer comer?
            </Label>
            <Input
              id="craving"
              placeholder="Ex.: hambúrguer artesanal, pizza, açaí..."
              value={craving}
              onChange={(e) => setCraving(e.target.value)}
              className="rounded-xl border-orange-200 focus-visible:ring-[#FF6B35]"
            />

            {/* Sugestões rápidas */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_SUGGESTIONS.map((sug) => {
                const isSelected = craving.toLowerCase().includes(sug.toLowerCase())
                return (
                  <button
                    type="button"
                    key={sug}
                    onClick={() => handleSelectQuick(sug)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
                      isSelected
                        ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-xs'
                        : 'bg-orange-50/70 text-gray-700 border-orange-200/80 hover:bg-orange-100'
                    }`}
                  >
                    {sug}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pergunta 2: Onde você está? */}
          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="text-xs font-bold text-gray-800 flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-[#2EC4B6]" /> 2. Onde você está agora?
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location" className="rounded-xl border-orange-200">
                <SelectValue placeholder="Selecione o local ou rede" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="todos">Qualquer lugar / Todos os estabelecimentos</SelectItem>
                <SelectItem value="casa">Em casa / Delivery</SelectItem>
                {availablePlaces.map((place) => (
                  <SelectItem key={place} value={place}>
                    {place}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-orange-100">
            {craving || (location && location !== 'todos') ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-red-600 gap-1 px-2"
              >
                <X className="w-3.5 h-3.5" /> Limpar Filtro
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl"
              >
                Pular
              </Button>
              <Button
                type="submit"
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-xs rounded-xl px-4 gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" /> Ver Recomendações
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
