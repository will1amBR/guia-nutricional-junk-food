import pb from '@/lib/pocketbase/client'
import type { Favorito } from '@/types'

/** Busca todos os favoritos do usuário (com o alimento expandido). */
export async function fetchFavorites(userId: string): Promise<Favorito[]> {
  const records = await pb.collection('favoritos').getFullList<Favorito>({
    filter: `usuario = "${userId}"`,
    sort: '-created',
    expand: 'alimento',
  })
  return records
}

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const records = await pb.collection('favoritos').getFullList<Favorito>({
    filter: `usuario = "${userId}"`,
  })
  return new Set(records.map((f) => f.alimento))
}

export async function addFavorite(userId: string, alimentoId: string): Promise<Favorito> {
  return await pb
    .collection('favoritos')
    .create<Favorito>({ usuario: userId, alimento: alimentoId }, { expand: 'alimento' })
}

export async function removeFavorite(favoritoId: string): Promise<boolean> {
  await pb.collection('favoritos').delete(favoritoId)
  return true
}

/** Alterna favorito: se o alimento está nos favoritos, remove; senão, cria. */
export async function toggleFavorite(
  userId: string,
  alimentoId: string,
  currentFavorites: Favorito[],
): Promise<{ favorites: Favorito[]; isFavorite: boolean }> {
  const existing = currentFavorites.find((f) => f.alimento === alimentoId)
  if (existing) {
    await removeFavorite(existing.id)
    const favorites = currentFavorites.filter((f) => f.id !== existing.id)
    return { favorites, isFavorite: false }
  }
  const created = await addFavorite(userId, alimentoId)
  return { favorites: [created, ...currentFavorites], isFavorite: true }
}
