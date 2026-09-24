import pb from '@/lib/pocketbase/client'
import type { CatalogItem, PerfilUsuario, RegistroAlimentar } from '@/types'

export async function fetchCatalogItems(): Promise<CatalogItem[]> {
  const records = await pb.collection('catalog').getFullList<CatalogItem>({
    sort: 'nome',
  })
  return records
}

export async function fetchCatalogItemById(id: string): Promise<CatalogItem> {
  const record = await pb.collection('catalog').getOne<CatalogItem>(id)
  return record
}

export async function fetchUserProfile(userId: string): Promise<PerfilUsuario | null> {
  try {
    const record = await pb
      .collection('perfis')
      .getFirstListItem<PerfilUsuario>(`usuario = "${userId}"`)
    return record
  } catch (err: unknown) {
    // If not found, return null so we can create one
    return null
  }
}

export async function saveUserProfile(
  userId: string,
  data: Partial<Omit<PerfilUsuario, 'id' | 'usuario' | 'created' | 'updated'>>,
  existingProfileId?: string,
): Promise<PerfilUsuario> {
  if (existingProfileId) {
    return await pb.collection('perfis').update<PerfilUsuario>(existingProfileId, data)
  }

  // Check if exists
  const existing = await fetchUserProfile(userId)
  if (existing) {
    return await pb.collection('perfis').update<PerfilUsuario>(existing.id, data)
  }

  return await pb.collection('perfis').create<PerfilUsuario>({
    usuario: userId,
    dieta_atual: data.dieta_atual ?? ['Onivora'],
    restricoes: data.restricoes ?? [],
    condicoes: data.condicoes ?? ['Nenhuma'],
    meta_calorias: data.meta_calorias ?? 2000,
    meta_proteina_pct: data.meta_proteina_pct ?? 25,
    meta_carboidrato_pct: data.meta_carboidrato_pct ?? 50,
    meta_gordura_pct: data.meta_gordura_pct ?? 25,
  })
}

export async function fetchDailyFoodLogs(
  userId: string,
  dateStr: string,
): Promise<RegistroAlimentar[]> {
  // dateStr in YYYY-MM-DD
  const startOfDay = `${dateStr} 00:00:00.000Z`
  const endOfDay = `${dateStr} 23:59:59.999Z`

  const records = await pb.collection('registros_alimentares').getFullList<RegistroAlimentar>({
    filter: `usuario = "${userId}" && data >= "${startOfDay}" && data <= "${endOfDay}"`,
    sort: 'created',
    expand: 'alimento',
  })
  return records
}

export async function addFoodLog(
  userId: string,
  alimentoId: string,
  refeicao: RegistroAlimentar['refeicao'],
  dateStr?: string,
): Promise<RegistroAlimentar> {
  const d = dateStr ? new Date(`${dateStr}T12:00:00.000Z`) : new Date()
  const formattedDate = d.toISOString().split('T')[0] + ' 12:00:00.000Z'

  return await pb.collection('registros_alimentares').create<RegistroAlimentar>(
    {
      usuario: userId,
      alimento: alimentoId,
      data: formattedDate,
      refeicao,
    },
    { expand: 'alimento' },
  )
}

export async function removeFoodLog(logId: string): Promise<boolean> {
  await pb.collection('registros_alimentares').delete(logId)
  return true
}
