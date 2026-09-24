import pb from '@/lib/pocketbase/client'
import type { ExercicioRegistro, IntensidadeExercicio } from '@/types'

/**
 * Estimativa simples de calorias queimadas baseada em MET (Metabolic Equivalent of Task).
 * Fórmula: Calorias = MET * peso (kg, padrão 70) * (duração em minutos / 60)
 */
export const EXERCISE_METS: Record<
  string,
  { label: string; Leve: number; Moderada: number; Intensa: number }
> = {
  Caminhada: { label: 'Caminhada', Leve: 2.8, Moderada: 3.8, Intensa: 5.0 },
  Corrida: { label: 'Corrida / Esteira', Leve: 6.0, Moderada: 8.5, Intensa: 11.5 },
  Musculacao: { label: 'Musculação / Força', Leve: 3.5, Moderada: 5.0, Intensa: 6.5 },
  Ciclismo: { label: 'Ciclismo / Bike', Leve: 4.0, Moderada: 6.8, Intensa: 10.0 },
  Natacao: { label: 'Natação', Leve: 5.0, Moderada: 7.0, Intensa: 9.8 },
  Funcional: { label: 'Funcional / Crossfit / HIIT', Leve: 5.0, Moderada: 7.5, Intensa: 10.5 },
  Luta: { label: 'Lutas / Boxe / Muay Thai', Leve: 5.5, Moderada: 8.0, Intensa: 11.0 },
  Futebol: { label: 'Futebol / Esporte coletivo', Leve: 5.0, Moderada: 7.0, Intensa: 9.0 },
  Outro: { label: 'Outro exercício', Leve: 3.5, Moderada: 5.5, Intensa: 7.5 },
}

export function estimateExerciseCalories(
  tipo: string,
  duracaoMin: number,
  intensidade: IntensidadeExercicio,
  weightKg = 70,
): number {
  const metObj = EXERCISE_METS[tipo] || EXERCISE_METS.Outro
  const met = metObj[intensidade] || 5.0
  const durationHours = Math.max(1, duracaoMin) / 60
  return Math.round(met * weightKg * durationHours)
}

export async function fetchDailyExercises(
  userId: string,
  dateStr: string,
): Promise<ExercicioRegistro[]> {
  const startOfDay = `${dateStr} 00:00:00.000Z`
  const endOfDay = `${dateStr} 23:59:59.999Z`

  const records = await pb.collection('exercicios').getFullList<ExercicioRegistro>({
    filter: `usuario = "${userId}" && data >= "${startOfDay}" && data <= "${endOfDay}"`,
    sort: '-created',
  })
  return records
}

export async function addExerciseLog(
  userId: string,
  data: {
    tipo: string
    duracao_min: number
    intensidade: IntensidadeExercicio
    calorias_queimadas?: number
    data?: string
    observacao?: string
  },
): Promise<ExercicioRegistro> {
  const d = data.data ? new Date(`${data.data}T12:00:00.000Z`) : new Date()
  const formattedDate = d.toISOString().split('T')[0] + ' 12:00:00.000Z'

  const calories =
    data.calorias_queimadas && data.calorias_queimadas > 0
      ? data.calorias_queimadas
      : estimateExerciseCalories(data.tipo, data.duracao_min, data.intensidade)

  const record = await pb.collection('exercicios').create<ExercicioRegistro>({
    usuario: userId,
    tipo: data.tipo,
    duracao_min: data.duracao_min,
    intensidade: data.intensidade,
    calorias_queimadas: calories,
    data: formattedDate,
    observacao: data.observacao || '',
  })
  return record
}

export async function removeExerciseLog(id: string): Promise<boolean> {
  await pb.collection('exercicios').delete(id)
  return true
}

export function calculateDailyExerciseTotals(exercises: ExercicioRegistro[]) {
  const totalCaloriesBurned = exercises.reduce(
    (acc, curr) => acc + (curr.calorias_queimadas || 0),
    0,
  )
  const totalMinutes = exercises.reduce((acc, curr) => acc + (curr.duracao_min || 0), 0)
  return {
    totalCaloriesBurned,
    totalMinutes,
    count: exercises.length,
  }
}
