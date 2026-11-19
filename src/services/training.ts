import pb from '@/lib/pocketbase/client'
import type { MetaTreino, ExercicioRegistro } from '@/types'

/** Retorna a segunda-feira (00:00) da semana corrente, segunda a domingo. */
export function getWeekStart(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day // volta até segunda
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Retorna o próximo domingo (23:59:59.999) da semana corrente. */
export function getWeekEnd(date = new Date()): Date {
  const end = getWeekStart(date)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

/** Chave estável da semana corrente (ex.: "2025-W23") para identificar a meta semanal. */
export function getWeekKey(date = new Date()): string {
  const d = new Date(date)
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
  const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** Busca a meta ativa (recorrente semanal) do usuário. */
export async function fetchActiveTrainingGoal(userId: string): Promise<MetaTreino | null> {
  try {
    return await pb
      .collection('metas_treino')
      .getFirstListItem<MetaTreino>(`usuario = "${userId}" && ativa = true`)
  } catch {
    return null
  }
}

export async function saveTrainingGoal(
  userId: string,
  data: { tipo_objetivo: 'minutos' | 'calorias'; valor_alvo: number },
  existingGoalId?: string,
): Promise<MetaTreino> {
  if (existingGoalId) {
    return await pb.collection('metas_treino').update<MetaTreino>(existingGoalId, data)
  }
  // Se já existe uma meta ativa, atualiza em vez de criar duplicada
  const existing = await fetchActiveTrainingGoal(userId)
  if (existing) {
    return await pb.collection('metas_treino').update<MetaTreino>(existing.id, data)
  }
  return await pb.collection('metas_treino').create<MetaTreino>({
    usuario: userId,
    ...data,
    ativa: true,
  })
}

/** Busca os exercícios registrados na semana corrente (segunda a domingo). */
export async function fetchWeeklyExercises(userId: string): Promise<ExercicioRegistro[]> {
  const start = getWeekStart()
  const end = getWeekEnd()
  const fmt = (d: Date) => d.toISOString().replace('T', ' ').replace('Z', 'Z')
  const records = await pb.collection('exercicios').getFullList<ExercicioRegistro>({
    filter: `usuario = "${userId}" && data >= "${fmt(start)}" && data <= "${fmt(end)}"`,
    sort: '-data',
  })
  return records
}
