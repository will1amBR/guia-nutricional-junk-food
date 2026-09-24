import type {
  CatalogItem,
  PerfilUsuario,
  RegistroAlimentar,
  RecommendationResult,
  RefeicaoTipo,
} from '@/types'

export const MEAL_DEFINITIONS: Record<
  RefeicaoTipo,
  { label: string; horario: string; startHour: number; endHour: number }
> = {
  CafeDaManha: { label: 'Café da Manhã', horario: '07h às 09h', startHour: 6, endHour: 10 },
  LancheDaManha: {
    label: 'Lanche da Manhã',
    horario: '10h às 11h30',
    startHour: 10,
    endHour: 11.5,
  },
  Almoco: { label: 'Almoço', horario: '12h às 14h', startHour: 11.5, endHour: 14.5 },
  LancheDaTarde: { label: 'Lanche da Tarde', horario: '15h às 17h', startHour: 14.5, endHour: 18 },
  Jantar: { label: 'Jantar', horario: '19h às 21h', startHour: 18, endHour: 21.5 },
  Ceia: { label: 'Ceia', horario: '21h30 às 23h', startHour: 21.5, endHour: 24 },
}

export function getCurrentMealSlot(): RefeicaoTipo {
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60

  if (currentHour < 10) return 'CafeDaManha'
  if (currentHour < 11.5) return 'LancheDaManha'
  if (currentHour < 14.5) return 'Almoco'
  if (currentHour < 18) return 'LancheDaTarde'
  if (currentHour < 21.5) return 'Jantar'
  return 'Ceia'
}

/**
 * Establishment descriptions & dining profile
 */
const ESTABLISHMENT_REASONING: Record<string, { desc: string; suitedMeals: RefeicaoTipo[] }> = {
  "McDonald's": {
    desc: 'Rede rápida com drive-thru e delivery ágil, ideal para refeições práticas com controle de porção.',
    suitedMeals: ['LancheDaTarde', 'Almoco', 'Ceia'],
  },
  'Burger King': {
    desc: 'Grelhados com opções generosas de proteína, excelente para almoços substanciais pós-treino.',
    suitedMeals: ['Almoco', 'Jantar'],
  },
  'Pizza Hut': {
    desc: 'Pizzas com alto valor energético e carboidratos, perfeita para compartilhar em jantares sociais.',
    suitedMeals: ['Jantar', 'Ceia'],
  },
  Subway: {
    desc: 'Montagem customizável com ampla oferta de vegetais frescos e opções com menor teor de gordura.',
    suitedMeals: ['Almoco', 'LancheDaTarde', 'Jantar'],
  },
  "Habib's": {
    desc: 'Porções menores e salgados modulares (esfihas e coxinhas), ideais para lanches fracionados.',
    suitedMeals: ['LancheDaTarde', 'LancheDaManha', 'Ceia'],
  },
  Starbucks: {
    desc: 'Ambiente aconchegante com cafés energéticos e bebidas doces, ótimo para pausas produtivas à tarde.',
    suitedMeals: ['LancheDaManha', 'LancheDaTarde', 'CafeDaManha'],
  },
  "Bob's": {
    desc: 'Clássica cafeteria e fast food com sobremesas e milkshakes ideais para recarga calórica pontual.',
    suitedMeals: ['LancheDaTarde', 'Ceia'],
  },
  Giraffas: {
    desc: 'Opções completas com pratos executivos brasileiros (arroz, feijão, proteína), excelente no almoço.',
    suitedMeals: ['Almoco', 'Jantar'],
  },
}

export function calculateDailyTotals(logs: RegistroAlimentar[]) {
  return logs.reduce(
    (acc, curr) => {
      const food = curr.expand?.alimento
      if (food) {
        acc.calorias += food.calorias || 0
        acc.proteina_g += food.proteina_g || 0
        acc.carboidrato_g += food.carboidrato_g || 0
        acc.gordura_g += food.gordura_g || 0
        acc.sodio_mg += food.sodio_mg || 0
        acc.acucar_g += food.acucar_g || 0
      }
      return acc
    },
    { calorias: 0, proteina_g: 0, carboidrato_g: 0, gordura_g: 0, sodio_mg: 0, acucar_g: 0 },
  )
}

export function generateRecommendation(
  item: CatalogItem,
  profile: PerfilUsuario | null,
  todayLogs: RegistroAlimentar[],
): RecommendationResult {
  const currentSlot = getCurrentMealSlot()
  const metaCalorias = profile?.meta_calorias || 2000
  const totals = calculateDailyTotals(todayLogs)
  const remainingCalories = Math.max(0, metaCalorias - totals.calorias)

  const condicoes = profile?.condicoes || ['Nenhuma']
  const dieta = profile?.dieta_atual || ['Onivora']
  const restricoes = profile?.restricoes || []

  // 1. Time Fit Evaluation
  let idealMeal: RefeicaoTipo = 'LancheDaTarde'
  let timeScore = 80
  let timeJustification = ''

  // Meal slot suitability based on food calories and category
  if (item.calorias >= 500) {
    idealMeal = currentSlot === 'Jantar' ? 'Jantar' : 'Almoco'
    if (remainingCalories >= item.calorias) {
      timeScore = 90
      timeJustification = `Item com densidade energética alta (${item.calorias} kcal). Encaixa com segurança no ${MEAL_DEFINITIONS[idealMeal].label}, aproveitando sua folga de ${remainingCalories} kcal diárias.`
    } else {
      timeScore = 65
      timeJustification = `Item substancial (${item.calorias} kcal) no ${MEAL_DEFINITIONS[idealMeal].label}. Consumir moderadamente, pois resta apenas ${remainingCalories} kcal de meta.`
    }
  } else if (item.calorias >= 300) {
    idealMeal = currentSlot === 'Almoco' ? 'Almoco' : 'LancheDaTarde'
    timeScore = 88
    timeJustification = `Aporte moderado (${item.calorias} kcal). Excelente para o ${MEAL_DEFINITIONS[idealMeal].label} (${MEAL_DEFINITIONS[idealMeal].horario}) para sustentar o gasto metabólico sem estufamento.`
  } else {
    // Under 300 kcal
    idealMeal =
      currentSlot === 'Ceia'
        ? 'Ceia'
        : currentSlot === 'LancheDaManha'
          ? 'LancheDaManha'
          : 'LancheDaTarde'
    timeScore = 92
    timeJustification = `Baixo impacto calórico (${item.calorias} kcal). Perfeito para o ${MEAL_DEFINITIONS[idealMeal].label} como encaixe leve sem comprometer o balanço do dia.`
  }

  // Health conditions adjustments to time/meal
  if (condicoes.includes('Hipertensao') && (item.sodio_mg || 0) > 600) {
    if (idealMeal === 'Jantar' || idealMeal === 'Ceia') {
      idealMeal = 'Almoco'
      timeScore -= 15
      timeJustification = `Atenção à pressão: alto teor de sódio (${item.sodio_mg}mg). Removido da noite e recomendado exclusivamente para o Almoço para maior eliminação ao longo do dia com boa hidratação.`
    } else {
      timeJustification += ` Por conter ${item.sodio_mg}mg de sódio, consuma no almoço acompanhado de bastante água.`
    }
  }

  if (
    (condicoes.includes('DiabetesTipo1') || condicoes.includes('DiabetesTipo2')) &&
    (item.acucar_g || 0) > 30
  ) {
    timeScore -= 25
    timeJustification = `Alto teor de açúcares simples (${item.acucar_g}g). Se for consumir, prefira logo após o almoço junto com fibras para amortecer o pico glicêmico.`
  }

  const isNow = idealMeal === currentSlot

  // 2. Profile Fit
  let profileScore = 85
  let profileNotes: string[] = []

  if (dieta.includes('Vegana') || dieta.includes('Vegetariana')) {
    const isVeggieFriendly =
      item.categoria === 'Doce' ||
      item.categoria === 'Bebida' ||
      item.nome.toLowerCase().includes('batata') ||
      item.nome.toLowerCase().includes('açaí')
    if (!isVeggieFriendly && (item.categoria === 'Hamburguer' || item.categoria === 'Pizza')) {
      profileScore = 40
      profileNotes.push('Pode conter derivados de origem animal; verifique os ingredientes.')
    } else {
      profileScore = 90
      profileNotes.push('Compatível com suas escolhas alimentares.')
    }
  }

  if (condicoes.includes('ColesterolAlto') && (item.gordura_saturada_g || 0) > 5) {
    profileScore -= 15
    profileNotes.push(`Gordura saturada relevante (${item.gordura_saturada_g}g).`)
  }

  if (
    restricoes.includes('IntoleranciaLactose') &&
    (item.nome.toLowerCase().includes('milkshake') ||
      item.nome.toLowerCase().includes('catupiry') ||
      item.categoria === 'Pizza')
  ) {
    profileScore -= 20
    profileNotes.push('Atenção: contém laticínios.')
  }

  // 3. Macro Fit
  let macroScore = 80
  const metaProt = profile?.meta_proteina_pct || 25
  if (metaProt >= 30 && (item.proteina_g || 0) >= 20) {
    macroScore += 15
    profileNotes.push(
      `Rico em proteínas (${item.proteina_g}g), excelente para sua meta de hipertrofia.`,
    )
  } else if ((item.proteina_g || 0) < 5 && item.categoria !== 'Bebida') {
    macroScore -= 10
  }

  // Calculate composite score (0-100)
  const combined = Math.min(
    99,
    Math.max(45, Math.round(0.5 * timeScore + 0.3 * profileScore + 0.2 * macroScore)),
  )

  // 4. Place Fit
  const estInfo = ESTABLISHMENT_REASONING[item.estabelecimento] || {
    desc: 'Estabelecimento renomado com estrutura completa e atendimento ágil.',
    suitedMeals: ['Almoco', 'LancheDaTarde', 'Jantar'],
  }

  let placeJustification = `${estInfo.desc} Harmoniza perfeitamente com sua pedida de ${item.nome}.`
  if (estInfo.suitedMeals.includes(idealMeal)) {
    placeJustification += ` Excelente ambiente para o ${MEAL_DEFINITIONS[idealMeal].label}.`
  }

  const justificativaGeral =
    profileNotes.length > 0 ? `${timeJustification} ${profileNotes.join(' ')}` : timeJustification

  return {
    item,
    matchScore: combined,
    melhorMomento: {
      refeicao: idealMeal,
      label: MEAL_DEFINITIONS[idealMeal].label,
      horario: MEAL_DEFINITIONS[idealMeal].horario,
      isNow,
      justificativa: timeJustification,
    },
    melhorLugar: {
      estabelecimento: item.estabelecimento,
      justificativa: placeJustification,
    },
    justificativaGeral,
  }
}

export function rankCatalogRecommendations(
  catalog: CatalogItem[],
  profile: PerfilUsuario | null,
  todayLogs: RegistroAlimentar[],
): RecommendationResult[] {
  const scored = catalog.map((item) => generateRecommendation(item, profile, todayLogs))
  // Sort descending by score
  return scored.sort((a, b) => b.matchScore - a.matchScore)
}
