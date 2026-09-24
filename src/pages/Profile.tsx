import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import type { DietaTipo, RestricaoTipo, CondicaoSaude } from '@/types'
import {
  User,
  Utensils,
  HeartPulse,
  Target,
  Info,
  Check,
  Loader2,
  Mail,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'

const DIET_OPTIONS: { label: string; value: DietaTipo }[] = [
  { label: 'Onívora (sem restrições gerais)', value: 'Onivora' },
  { label: 'Vegetariana', value: 'Vegetariana' },
  { label: 'Vegana', value: 'Vegana' },
  { label: 'Low Carb (baixo carboidrato)', value: 'LowCarb' },
  { label: 'Cetogênica (Keto)', value: 'Cetogenica' },
  { label: 'Sem restrição', value: 'SemRestricao' },
]

const RESTRICTION_OPTIONS: { label: string; value: RestricaoTipo }[] = [
  { label: 'Sem glúten', value: 'SemGluten' },
  { label: 'Sem lactose', value: 'SemLactose' },
  { label: 'Sem frutos do mar', value: 'SemFrutosDoMar' },
  { label: 'Intolerância à lactose', value: 'IntoleranciaLactose' },
  { label: 'Alergia a amendoim', value: 'AlergiaAmendoim' },
  { label: 'Alergia a soja', value: 'AlergiaSoja' },
]

const HEALTH_CONDITIONS: {
  label: string
  value: CondicaoSaude
  tooltip: string
}[] = [
  {
    label: 'Hipertensão (pressão alta)',
    value: 'Hipertensao',
    tooltip:
      'Prioriza alimentos com menor teor de sódio e recomenda consumo durante horários de maior hidratação diurna.',
  },
  {
    label: 'Diabetes tipo 1',
    value: 'DiabetesTipo1',
    tooltip: 'Monitora açúcares rápidos e equilibra carboidratos com proteínas e fibras.',
  },
  {
    label: 'Diabetes tipo 2',
    value: 'DiabetesTipo2',
    tooltip: 'Evita picos glicêmicos, sugerindo junções ricas em fibras e gorduras boas.',
  },
  {
    label: 'Colesterol alto (Dislipidemia)',
    value: 'ColesterolAlto',
    tooltip: 'Alerta sobre gorduras saturadas e trans, priorizando opções mais magras.',
  },
  {
    label: 'Doença renal',
    value: 'DoencaRenal',
    tooltip: 'Ajusta sobrecargas de sódio, potássio e excesso proteico em horários noturnos.',
  },
  {
    label: 'Obesidade',
    value: 'Obesidade',
    tooltip: 'Foca no déficit calórico controlado e saciedade através de fibras e proteínas.',
  },
  {
    label: 'Nenhuma condição',
    value: 'Nenhuma',
    tooltip: 'Sem restrições médicas específicas declaradas.',
  },
]

export default function Profile() {
  const { user, profile, updateProfileData, refreshProfile } = useAuth()
  const { toast } = useToast()

  // Form states
  const [userName, setUserName] = useState(user?.name || '')
  const [savingUser, setSavingUser] = useState(false)

  // Email change inline form
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [requestingEmailChange, setRequestingEmailChange] = useState(false)
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false)

  // Dieta Atual Tab
  const [dietaAtual, setDietaAtual] = useState<DietaTipo[]>(profile?.dieta_atual || ['Onivora'])
  const [restricoes, setRestricoes] = useState<RestricaoTipo[]>(profile?.restricoes || [])
  const [savingDiet, setSavingDiet] = useState(false)

  // Condicoes Tab
  const [condicoes, setCondicoes] = useState<CondicaoSaude[]>(profile?.condicoes || ['Nenhuma'])
  const [savingConditions, setSavingConditions] = useState(false)

  // Metas Tab
  const [metaCalorias, setMetaCalorias] = useState<number>(profile?.meta_calorias || 2000)
  const [metaProteina, setMetaProteina] = useState<number>(profile?.meta_proteina_pct || 25)
  const [metaCarbo, setMetaCarbo] = useState<number>(profile?.meta_carboidrato_pct || 50)
  const [metaGordura, setMetaGordura] = useState<number>(profile?.meta_gordura_pct || 25)
  const [savingMetas, setSavingMetas] = useState(false)

  const macroSum = metaProteina + metaCarbo + metaGordura
  const isMacroValid = macroSum === 100

  // 1. Save Personal Data
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingUser(true)
    try {
      await pb.collection('users').update(user.id, { name: userName })
      await refreshProfile()
      toast({
        title: 'Dados salvos!',
        description: 'Seu nome foi atualizado com sucesso.',
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar seu nome.',
      })
    } finally {
      setSavingUser(false)
    }
  }

  // Email Change Request
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    setRequestingEmailChange(true)
    try {
      await pb.collection('users').requestEmailChange(newEmail)
      setEmailChangeSuccess(true)
      toast({
        title: 'Confirmação enviada!',
        description: 'Confirme o novo email pelo link enviado à nova caixa postal.',
      })
    } catch (err) {
      console.error('Email change error:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar email',
        description: 'Verifique se o email é válido ou se já está em uso.',
      })
    } finally {
      setRequestingEmailChange(false)
    }
  }

  // 2. Save Diet Tab
  const handleSaveDiet = async () => {
    setSavingDiet(true)
    try {
      await updateProfileData({
        dieta_atual: dietaAtual.length ? dietaAtual : ['SemRestricao'],
        restricoes,
      })
      toast({
        title: 'Dieta atualizada!',
        description: 'Suas preferências de alimentação foram salvas.',
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
      })
    } finally {
      setSavingDiet(false)
    }
  }

  // 3. Save Conditions Tab
  const handleSaveConditions = async () => {
    setSavingConditions(true)
    try {
      await updateProfileData({
        condicoes: condicoes.length ? condicoes : ['Nenhuma'],
      })
      toast({
        title: 'Condições de saúde atualizadas!',
        description: 'O recomendador agora levará em conta seu histórico de saúde.',
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
      })
    } finally {
      setSavingConditions(false)
    }
  }

  // 4. Save Metas Tab
  const handleSaveMetas = async () => {
    if (!isMacroValid) {
      toast({
        variant: 'destructive',
        title: 'A soma dos macronutrientes deve ser 100%',
        description: `Atualmente a soma está em ${macroSum}%. Ajuste os percentuais.`,
      })
      return
    }

    setSavingMetas(true)
    try {
      await updateProfileData({
        meta_calorias: Number(metaCalorias),
        meta_proteina_pct: metaProteina,
        meta_carboidrato_pct: metaCarbo,
        meta_gordura_pct: metaGordura,
      })
      toast({
        title: 'Metas alimentares salvas!',
        description: 'Seus objetivos diários foram atualizados.',
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
      })
    } finally {
      setSavingMetas(false)
    }
  }

  const getInitial = (name?: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="h-20 w-20 ring-4 ring-orange-200 ring-offset-2">
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback className="bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] text-white font-extrabold text-3xl">
            {getInitial(user?.name)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center sm:text-left space-y-1 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{user?.name}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6B35] border border-orange-200">
              Meta: {profile?.meta_calorias || 2000} kcal/dia
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-[#2EC4B6] border border-teal-200">
              Dieta: {profile?.dieta_atual?.[0] || 'Onívora'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="bg-white border border-orange-100 p-1 rounded-xl w-full grid grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger
            value="dados"
            className="py-2.5 rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
          >
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger
            value="dieta"
            className="py-2.5 rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
          >
            Dieta Atual
          </TabsTrigger>
          <TabsTrigger
            value="condicoes"
            className="py-2.5 rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
          >
            Condições de Saúde
          </TabsTrigger>
          <TabsTrigger
            value="metas"
            className="py-2.5 rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white"
          >
            Metas Alimentares
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dados Pessoais */}
        <TabsContent value="dados">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Seus Dados de Cadastro</h2>
              <p className="text-xs text-gray-500">Atualize suas informações de identificação.</p>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="focus-visible:ring-[#FF6B35]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label>Email</Label>
                  <button
                    type="button"
                    onClick={() => setShowEmailChange(!showEmailChange)}
                    className="text-xs text-[#FF6B35] hover:underline font-medium"
                  >
                    Alterar email
                  </button>
                </div>
                <Input value={user?.email || ''} disabled className="bg-gray-50 text-gray-500" />
              </div>

              <Button
                type="submit"
                disabled={savingUser}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
              >
                {savingUser ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </form>

            {/* Email change flow */}
            {showEmailChange && (
              <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200 space-y-3 max-w-lg animate-fade-in">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#FF6B35]" /> Solicitar Alteração de Email
                </h4>

                {emailChangeSuccess ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    Confirme o novo email pelo link enviado para <strong>{newEmail}</strong>.
                  </p>
                ) : (
                  <form onSubmit={handleRequestEmailChange} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="newEmail" className="text-xs">
                        Novo endereço de email
                      </Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="novo@email.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        className="bg-white focus-visible:ring-[#FF6B35]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={requestingEmailChange}
                      size="sm"
                      className="bg-[#2EC4B6] hover:bg-[#25A89B] text-white text-xs"
                    >
                      {requestingEmailChange ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        'Enviar link de confirmação'
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Dieta Atual */}
        <TabsContent value="dieta">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tipo de Dieta e Restrições</h2>
              <p className="text-xs text-gray-500">
                O motor utilizará esses parâmetros para descartar ou aprovar opções de junk food.
              </p>
            </div>

            {/* Diet type */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-800">Tipo de Dieta Primária</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIET_OPTIONS.map((opt) => {
                  const isChecked = dietaAtual.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#FF6B35] bg-orange-50/60 font-semibold text-gray-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDietaAtual([opt.value])
                          } else {
                            setDietaAtual([])
                          }
                        }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Restrictions */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <Label className="text-sm font-bold text-gray-800">
                Restrições Alimentares / Intolerâncias
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESTRICTION_OPTIONS.map((opt) => {
                  const isChecked = restricoes.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#2EC4B6] bg-teal-50/50 font-semibold text-gray-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRestricoes([...restricoes, opt.value])
                          } else {
                            setRestricoes(restricoes.filter((v) => v !== opt.value))
                          }
                        }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Button
              onClick={handleSaveDiet}
              disabled={savingDiet}
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
            >
              {savingDiet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Dieta'}
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Condições de Saúde */}
        <TabsContent value="condicoes">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Condições de Saúde</h2>
              <p className="text-xs text-gray-500">
                Essas informações refinam o horário ideal e os avisos nutricionais de cada alimento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HEALTH_CONDITIONS.map((cond) => {
                const isChecked = condicoes.includes(cond.value)
                return (
                  <div
                    key={cond.value}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isChecked
                        ? 'border-red-300 bg-red-50/40 text-gray-900 font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (cond.value === 'Nenhuma') {
                            setCondicoes(['Nenhuma'])
                            return
                          }
                          const cleaned = condicoes.filter((c) => c !== 'Nenhuma')
                          if (checked) {
                            setCondicoes([...cleaned, cond.value])
                          } else {
                            const remaining = cleaned.filter((c) => c !== cond.value)
                            setCondicoes(remaining.length ? remaining : ['Nenhuma'])
                          }
                        }}
                      />
                      <span className="text-sm">{cond.label}</span>
                    </label>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600 p-1">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        <p>{cond.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )
              })}
            </div>

            <Button
              onClick={handleSaveConditions}
              disabled={savingConditions}
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
            >
              {savingConditions ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Salvar Condições'
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Tab 4: Metas Alimentares */}
        <TabsContent value="metas">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Metas Calóricas e de Macronutrientes
              </h2>
              <p className="text-xs text-gray-500">
                Ajuste os valores diários desejados. A soma dos percentuais de macros deve ser igual
                a 100%.
              </p>
            </div>

            <div className="space-y-6 max-w-xl">
              {/* Daily Calorie Goal */}
              <div className="space-y-2">
                <Label htmlFor="metaCal">Meta Calórica Diária (kcal)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="metaCal"
                    type="number"
                    min={1200}
                    max={5000}
                    step={50}
                    value={metaCalorias}
                    onChange={(e) => setMetaCalorias(Number(e.target.value))}
                    className="focus-visible:ring-[#FF6B35] max-w-[200px]"
                  />
                  <span className="text-xs text-gray-500 font-medium">kcal por dia</span>
                </div>
              </div>

              {/* Macro Sliders */}
              <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-orange-200">
                  <span className="text-sm font-bold text-gray-800">
                    Distribuição de Macronutrientes
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      isMacroValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Soma: {macroSum}% {isMacroValid ? '✓' : '(Deve ser 100%)'}
                  </span>
                </div>

                {/* Protein Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Proteína (10% - 50%)</span>
                    <span className="text-[#FF6B35] font-bold">{metaProteina}%</span>
                  </div>
                  <Slider
                    value={[metaProteina]}
                    min={10}
                    max={50}
                    step={1}
                    onValueChange={(val) => setMetaProteina(val[0])}
                  />
                </div>

                {/* Carbs Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Carboidratos (10% - 70%)</span>
                    <span className="text-amber-600 font-bold">{metaCarbo}%</span>
                  </div>
                  <Slider
                    value={[metaCarbo]}
                    min={10}
                    max={70}
                    step={1}
                    onValueChange={(val) => setMetaCarbo(val[0])}
                  />
                </div>

                {/* Fat Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Gordura (10% - 45%)</span>
                    <span className="text-[#2EC4B6] font-bold">{metaGordura}%</span>
                  </div>
                  <Slider
                    value={[metaGordura]}
                    min={10}
                    max={45}
                    step={1}
                    onValueChange={(val) => setMetaGordura(val[0])}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveMetas}
                disabled={savingMetas || !isMacroValid}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
              >
                {savingMetas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Metas'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
