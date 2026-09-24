import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Utensils,
  Sparkles,
  MessageSquare,
  Share2,
  ShieldCheck,
  Flame,
  ArrowRight,
  Target,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Bot,
  BarChart3,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'bk' | 'mcdonalds' | 'pizza' | 'subway'>('bk')

  const realWorldExamples = [
    {
      id: 'bk',
      tag: 'Burger King no Jantar',
      question: 'Estou no Burger King e quero um sanduíche de carne — qual escolher? Whopper?',
      userContext: 'Meta de 2.000 kcal/dia • Já consumiu 1.450 kcal hoje • Foco em proteína',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      answer: {
        title: 'Diagnóstico Nutricional Instantâneo:',
        verdict:
          'O Whopper clássico (677 kcal, 28g proteína) cabe com folga no seu orçamento restante (550 kcal de saldo com tolerância flexível) se você evitar a batata frita média (+365 kcal) e optar por água ou refrigerante zero.',
        alternative:
          'Quer economizar ainda mais para a ceia? O Whopper Jr. entrega 340 kcal e 14g de proteína com o mesmo sabor defumado da grelha.',
        avoid:
          'Evite o Whopper Furioso hoje (840 kcal e 1.450mg de sódio), pois ultrapassaria sua meta diária de calorias e sódio.',
        macros: { kcal: 677, prot: '28g', carb: '57g', gord: '38g' },
      },
    },
    {
      id: 'mcdonalds',
      tag: "McDonald's no Almoço",
      question:
        "Estou no McDonald's no almoço: Quarto de Libra ou Big Mac? Qual combina melhor com treino?",
      userContext: 'Dieta hipertrófica • Treino de força às 17h • Meta de 140g de proteína',
      badgeColor: 'bg-red-100 text-red-900 border-red-300',
      answer: {
        title: 'Diagnóstico Nutricional Instantâneo:',
        verdict:
          'O Quarto de Libra com Queijo é a melhor escolha! Ele oferece 30g de proteína de alto valor biológico com 520 kcal (densidade proteica superior ao Big Mac, que tem 25g de proteína para 540 kcal).',
        alternative:
          'Se preferir petiscar: 10 Chicken McNuggets fornecem 23g de proteína com apenas 420 kcal.',
        avoid:
          'Molhos extras e milkshakes após o almoço, que somariam mais de 60g de açúcar simples antes do seu treino.',
        macros: { kcal: 520, prot: '30g', carb: '41g', gord: '26g' },
      },
    },
    {
      id: 'pizza',
      tag: 'Sexta-feira à Noite',
      question: 'Quero pizza à noite mas tenho hipertensão: posso comer sem estourar o sódio?',
      userContext: 'Condição: Hipertensão cadastrada no perfil • Limite de sódio monitorado',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      answer: {
        title: 'Diagnóstico Nutricional Instantâneo:',
        verdict:
          'Sim, com estratégia! 2 fatias de Pizza Margherita ou Frango com Catupiry somam ~560 kcal e cerca de 1.100mg de sódio, mantendo você dentro da margem diária de segurança.',
        alternative:
          'Acompanhe com bastante água com gás e limão exprimido (o potássio auxilia no balanço eletrolítico celular).',
        avoid:
          'Pizzas com quatro queijos + pepperoni + borda recheada, que facilmente ultrapassam 2.500mg de sódio em apenas duas fatias.',
        macros: { kcal: 580, prot: '22g', carb: '64g', sodio: '1.140mg' },
      },
    },
    {
      id: 'subway',
      tag: 'Lanche Rápido na Correria',
      question: 'Subway Frango Teriyaki ou Carne Supreme: como montar sem virar bomba calórica?',
      userContext: 'Dieta Equilibrada • Refeição intermediária da tarde',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      answer: {
        title: 'Diagnóstico Nutricional Instantâneo:',
        verdict:
          'O Frango Teriyaki de 15cm é imbatível na tarde: 26g de proteína com apenas 6g de gordura total e 380 kcal.',
        alternative:
          'Turbine os vegetais frescos (alface, tomate, pepino, pimentão) para somar 4g de fibras saciantes sem calorias extras.',
        avoid:
          'Molhos como maionese temperada ou barbecue em excesso; prefira azeite moderado ou mostarda e mel com parcimônia.',
        macros: { kcal: 380, prot: '26g', carb: '52g', gord: '6g' },
      },
    },
  ]

  const currentExample = realWorldExamples.find((ex) => ex.id === activeTab) || realWorldExamples[0]

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#1F2937] font-sans selection:bg-[#FF6B35] selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 block leading-none">
                Guia <span className="text-[#FF6B35]">JunkFood</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#2EC4B6]">
                Estratégia Nutricional
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#como-funciona" className="hover:text-[#FF6B35] transition-colors">
              Como Funciona
            </a>
            <a href="#exemplos-reais" className="hover:text-[#FF6B35] transition-colors">
              Casos Reais
            </a>
            <a href="#catalogo" className="hover:text-[#FF6B35] transition-colors">
              Catálogo & Fast Food
            </a>
            <a href="#assistente" className="hover:text-[#FF6B35] transition-colors">
              Assistente IA
            </a>
            <a href="#faq" className="hover:text-[#FF6B35] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button
                asChild
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl shadow-md shadow-orange-500/20 text-sm"
              >
                <Link to="/app" className="flex items-center gap-1.5">
                  Acessar Meu Painel <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50 text-sm font-semibold"
                >
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl shadow-md shadow-orange-500/20 text-sm"
                >
                  <Link to="/signup">Criar Conta Grátis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-orange-300/30 via-amber-200/40 to-teal-200/30 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="bg-orange-100/90 text-orange-800 border-orange-200 font-bold px-3.5 py-1 text-xs sm:text-sm rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#FF6B35]" />
            Coma junk food com inteligência, sem culpa e sem perder seus resultados
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Descubra o <span className="text-[#FF6B35]">Melhor Momento</span> e o{' '}
            <span className="text-[#2EC4B6]">Melhor Lugar</span> para seu Fast Food.
          </h1>

          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Um motor nutricional inteligente aliado a uma <strong>IA especializada</strong> que
            analisa seu perfil, suas metas e o momento do dia para indicar exatamente o que pedir no
            McDonald's, Burger King, Outback, Subway, Pizza Hut e feiras de rua.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-extrabold text-base px-8 py-6 rounded-2xl shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02]"
            >
              <Link to="/signup" className="flex items-center justify-center gap-2">
                Começar Agora — É Grátis <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-orange-200 text-gray-800 hover:bg-orange-50/80 font-bold text-base px-7 py-6 rounded-2xl"
            >
              <a href="#exemplos-reais">Ver Exemplos Práticos</a>
            </Button>
          </div>

          {/* Social Proof badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
              <span>Base com 25+ itens reais do Brasil</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
              <span>Assistente de IA nativo com Skip Cloud</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
              <span>Relatório semanal para compartilhar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Interactive Case Studies (Exemplos Reais) */}
      <section id="exemplos-reais" className="py-16 sm:py-24 bg-white border-y border-orange-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge className="bg-teal-100 text-teal-800 border-teal-200 font-bold px-3 py-1 rounded-full text-xs">
              Casos Reais do Cotidiano
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Dúvidas do mundo real resolvidas em segundos
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Veja como o Guia JunkFood e o Assistente de IA respondem a situações reais onde você
              só quer comer bem sem sabotar sua saúde.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {realWorldExamples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setActiveTab(ex.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                  activeTab === ex.id
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md shadow-orange-500/20 scale-[1.02]'
                    : 'bg-orange-50/50 text-gray-700 border-orange-100 hover:bg-orange-100'
                }`}
              >
                {ex.tag}
              </button>
            ))}
          </div>

          {/* Example Card Box */}
          <div className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-3xl border-2 border-orange-200 p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-200/30 rounded-bl-full pointer-events-none -z-0" />

            <div className="relative z-10 space-y-6">
              {/* Question bubble */}
              <div className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF6B35] flex items-center justify-center shrink-0 font-bold text-sm">
                  💬
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Dúvida do Usuário no Balcão:
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                    "{currentExample.question}"
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                    <Target className="w-3.5 h-3.5 text-[#2EC4B6]" />
                    <span>{currentExample.userContext}</span>
                  </p>
                </div>
              </div>

              {/* Assistant Answer Box */}
              <div className="bg-gradient-to-tr from-orange-50/80 to-white rounded-2xl p-6 sm:p-8 border border-orange-200/80 space-y-4">
                <div className="flex items-center gap-2.5 text-[#FF6B35]">
                  <Bot className="w-6 h-6" />
                  <span className="font-extrabold text-sm sm:text-base uppercase tracking-wider">
                    {currentExample.answer.title}
                  </span>
                </div>

                <p className="text-base sm:text-lg text-gray-800 font-semibold leading-relaxed">
                  {currentExample.answer.verdict}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-4">
                    <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Dica de Ouro & Alternativa
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                      {currentExample.answer.alternative}
                    </p>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4">
                    <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Atenção & O que evitar
                    </span>
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                      {currentExample.answer.avoid}
                    </p>
                  </div>
                </div>

                {/* Macro pill summary */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-orange-100">
                  <span className="text-xs font-bold text-gray-500">
                    Dados do prato recomendado:
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-white border-orange-200 text-gray-800 font-bold text-xs py-1"
                  >
                    🔥 {currentExample.answer.macros.kcal} kcal
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white border-orange-200 text-gray-800 font-bold text-xs py-1"
                  >
                    🥩 {currentExample.answer.macros.prot} proteína
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white border-orange-200 text-gray-800 font-bold text-xs py-1"
                  >
                    🥖 {currentExample.answer.macros.carb} carboidratos
                  </Badge>
                  {currentExample.answer.macros.sodio && (
                    <Badge
                      variant="outline"
                      className="bg-white border-orange-200 text-gray-800 font-bold text-xs py-1"
                    >
                      🧂 {currentExample.answer.macros.sodio} sódio
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars / Features */}
      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-bold px-3 py-1 rounded-full text-xs">
              Tecnologia Nutricional
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Tudo o que você precisa para comer junk food sem neura
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Combinamos dados laboratoriais das principais franquias com inteligência artificial
              para oferecer recomendações que cabem na sua rotina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <Card className="rounded-2xl border-orange-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6B35] flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Momento & Lugar</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Algoritmo ponderado (50% momento do dia, 30% perfil individual, 20% balanço de
                  macros) para calcular a hora perfeita para cada indulgência.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 2 */}
            <Card className="rounded-2xl border-orange-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-[#2EC4B6] flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Assistente IA Nativo</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Chatbot alimentado por IA nativa Skip Cloud com acesso direto ao seu histórico
                  alimentar e perfil de saúde para orientações hiperpersonalizadas.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 3 */}
            <Card className="rounded-2xl border-orange-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Catálogo Aberto e Dinâmico</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  McDonald's, BK, Subway, KFC, Outback, China in Box e até pastéis de feira. Admins
                  podem adicionar e calibrar itens novos direto pelo app.
                </p>
              </CardContent>
            </Card>

            {/* Pillar 4 */}
            <Card className="rounded-2xl border-orange-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Relatório Semanal</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Resumo visual dos junk foods consumidos na semana, balanço de calorias e macros, e
                  botão com 1 clique para compartilhar no WhatsApp.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Catalog Preview / Fast Food Brands */}
      <section id="catalogo" className="py-16 bg-white border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Badge className="bg-orange-100 text-[#FF6B35] border-orange-200 font-bold px-3 py-1 rounded-full text-xs">
            Grandes Redes e Clássicos de Rua
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Tabelas nutricionais auditadas das marcas que você mais frequenta
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto pt-2">
            {[
              "McDonald's",
              'Burger King',
              'Subway',
              'Pizza Hut',
              'Outback',
              'KFC',
              'China in Box',
              "Habib's",
              "Bob's",
              'Starbucks',
              'Giraffas',
              'Pastelaria de Feira',
              'Açaí Concept',
            ].map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 bg-[#FFF9F2] text-gray-800 rounded-full font-bold text-xs sm:text-sm border border-orange-200/80 shadow-2xs hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-bold px-3 py-1 rounded-full text-xs">
            Tire Suas Dúvidas
          </Badge>
          <h2 className="text-3xl font-extrabold text-gray-900">Perguntas Frequentes</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem
            value="item-1"
            className="bg-white rounded-2xl border border-orange-100 px-5 shadow-xs"
          >
            <AccordionTrigger className="font-bold text-gray-900 text-left hover:text-[#FF6B35]">
              O app incentiva a comer junk food todos os dias?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-600 leading-relaxed">
              Não. O objetivo é a redução de danos e a adesão sustentável à dieta. Todos nós comemos
              fast food ocasionalmente — o Guia JunkFood ensina você a escolher a melhor opção para
              seu corpo quando esse momento chegar, evitando exageros desnecessários.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-2"
            className="bg-white rounded-2xl border border-orange-100 px-5 shadow-xs"
          >
            <AccordionTrigger className="font-bold text-gray-900 text-left hover:text-[#FF6B35]">
              Como o assistente de IA sabe o que me recomendar?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-600 leading-relaxed">
              Ele utiliza a tecnologia nativa do Skip Cloud com leitura direta das suas preferências
              (dieta onívora, low-carb, vegana, etc.), restrições alimentares (glúten, lactose) e
              histórico de refeições registradas no dia e na semana.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-3"
            className="bg-white rounded-2xl border border-orange-100 px-5 shadow-xs"
          >
            <AccordionTrigger className="font-bold text-gray-900 text-left hover:text-[#FF6B35]">
              Posso compartilhar meus resultados com meu nutricionista ou amigos?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-600 leading-relaxed">
              Sim! A funcionalidade de Relatório Semanal gera um resumo completo dos junk foods
              consumidos, média de calorias e macros, que você pode copiar em texto ou enviar direto
              pelo WhatsApp via compartilhamento nativo.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Pronto para comer seu fast food favorito com inteligência?
          </h2>
          <p className="text-base sm:text-lg text-orange-100 max-w-2xl mx-auto">
            Crie sua conta em 30 segundos, personalize sua dieta e tenha sempre no bolso o melhor
            conselheiro nutricional.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-white text-[#FF6B35] hover:bg-orange-50 font-extrabold text-base px-8 py-6 rounded-2xl shadow-xl transition-transform hover:scale-105"
            >
              <Link to="/signup">Criar Conta Gratuita</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 font-bold text-base px-8 py-6 rounded-2xl"
            >
              <Link to="/login">Já tenho conta (Entrar)</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-bold text-xs">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-gray-800">Guia Nutricional Junk Food</span>
          </div>
          <p>© {new Date().getFullYear()} Guia JunkFood. Fins informativos e educacionais.</p>
        </div>
      </footer>
    </div>
  )
}
