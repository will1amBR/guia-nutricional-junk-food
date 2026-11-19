import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchCatalogItems } from '@/services/nutrition'
import { fetchFavoriteIds, fetchFavorites, toggleFavorite } from '@/services/favorites'
import type { CatalogItem, CategoriaAlimento, Favorito } from '@/types'
import {
  Search,
  X,
  MapPin,
  Flame,
  ArrowUpDown,
  ChevronRight,
  Filter,
  Loader2,
  ShieldCheck,
  Plus,
  ArrowLeftRight,
  Sparkles,
  UserPlus,
  Lock,
  Heart,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const CATEGORIAS: { label: string; value: CategoriaAlimento | 'Todas' }[] = [
  { label: 'Todas', value: 'Todas' },
  { label: 'Hambúrgueres', value: 'Hamburguer' },
  { label: 'Pizza', value: 'Pizza' },
  { label: 'Sanduíches', value: 'Sanduiche' },
  { label: 'Frituras', value: 'Fritura' },
  { label: 'Doces', value: 'Doce' },
  { label: 'Bebidas', value: 'Bebida' },
  { label: 'Outros', value: 'Outros' },
]

export const CATEGORY_COLORS: Record<CategoriaAlimento, string> = {
  Hamburguer: 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30',
  Pizza: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30',
  Sanduiche: 'bg-[#F4A261]/10 text-[#E76F51] border-[#F4A261]/30',
  Fritura: 'bg-[#F9C74F]/20 text-[#D97706] border-[#F9C74F]/40',
  Doce: 'bg-[#B5838D]/15 text-[#9C4A69] border-[#B5838D]/30',
  Bebida: 'bg-[#2EC4B6]/10 text-[#25A89B] border-[#2EC4B6]/30',
  Outros: 'bg-[#8D99AE]/15 text-[#4A5568] border-[#8D99AE]/30',
}

export default function Catalog() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [sortBy, setSortBy] = useState<string>('calorias-desc')
  const [displayCount, setDisplayCount] = useState(9)

  // Favoritos (por usuário logado)
  const [favorites, setFavorites] = useState<Favorito[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCatalogItems()
      .then(setItems)
      .catch((err) => console.error('Erro ao carregar catálogo:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    fetchFavorites(user.id)
      .then((favs) => {
        setFavorites(favs)
        setFavoriteIds(new Set(favs.map((f) => f.alimento)))
      })
      .catch((err) => console.error('Erro ao carregar favoritos:', err))
  }, [user])

  const handleToggleFavorite = async (itemId: string) => {
    if (!user) return
    setFavoritePendingId(itemId)
    try {
      const { favorites: updated, isFavorite } = await toggleFavorite(user.id, itemId, favorites)
      setFavorites(updated)
      setFavoriteIds(new Set(updated.map((f) => f.alimento)))
      toast({
        title: isFavorite ? '❤️ Adicionado aos favoritos' : 'Removido dos favoritos',
      })
    } catch (err) {
      console.error('Erro ao alternar favorito:', err)
      toast({ title: 'Não foi possível atualizar os favoritos', variant: 'destructive' })
    } finally {
      setFavoritePendingId(null)
    }
  }

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory = selectedCategory === 'Todas' || item.categoria === selectedCategory
        const matchesFavorites = !showOnlyFavorites || favoriteIds.has(item.id)
        const term = search.toLowerCase().trim()
        const matchesSearch =
          !term ||
          item.nome.toLowerCase().includes(term) ||
          item.estabelecimento.toLowerCase().includes(term)

        return matchesCategory && matchesSearch && matchesFavorites
      })
      .sort((a, b) => {
        if (sortBy === 'calorias-desc') return b.calorias - a.calorias
        if (sortBy === 'calorias-asc') return a.calorias - b.calorias
        if (sortBy === 'proteina-desc') return (b.proteina_g || 0) - (a.proteina_g || 0)
        if (sortBy === 'nome-asc') return a.nome.localeCompare(b.nome, 'pt-BR')
        return 0
      })
  }, [items, search, selectedCategory, sortBy, showOnlyFavorites, favoriteIds])

  const visibleItems = filteredAndSortedItems.slice(0, displayCount)
  const hasMore = displayCount < filteredAndSortedItems.length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100/60">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Catálogo de Junk Foods
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Tabela nutricional completa com McDonald's, BK, KFC, Outback, Subway, Pizza Hut e
            feiras.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!user && (
            <Button
              asChild
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
            >
              <Link to="/signup">
                <UserPlus className="w-4 h-4" /> Cadastre-se grátis
              </Link>
            </Button>
          )}

          {(user?.is_admin || user?.email === 'william@korenambiental.com') && (
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
            >
              <Link to="/admin">
                <ShieldCheck className="w-4 h-4" /> Gerenciar Catálogo (Admin)
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Public Visitor Banner CTA */}
      {!user && (
        <div className="bg-gradient-to-r from-orange-500 via-[#FF6B35] to-[#E55A2B] rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Recomendações Personalizadas
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Cadastre-se para receber recomendações sob medida para sua saúde
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Você pode explorar todo o catálogo livremente. Crie sua conta grátis para
                desbloquear o cálculo de Momento & Lugar calibrado para suas metas de calorias,
                restrições e condições de saúde.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                asChild
                className="bg-white hover:bg-orange-50 text-[#FF6B35] font-extrabold text-sm h-11 px-6 rounded-xl shadow-md"
              >
                <Link to="/signup">Criar Conta Grátis</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:text-white font-semibold text-sm h-11 px-4 rounded-xl"
              >
                <Link to="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome ou estabelecimento (ex: McDonald's, Pizza...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 py-5 bg-white border-orange-100 focus-visible:ring-[#FF6B35] rounded-xl text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-56 shrink-0">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white border-orange-100 py-5 rounded-xl text-sm focus:ring-[#FF6B35]">
                <div className="flex items-center gap-2 text-gray-700">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Ordenar por" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calorias-desc">Mais calóricos</SelectItem>
                <SelectItem value="calorias-asc">Menos calóricos</SelectItem>
                <SelectItem value="proteina-desc">Mais proteicos</SelectItem>
                <SelectItem value="nome-asc">Nome (A - Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters Row: favoritos + categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-orange-200">
          {user && (
            <button
              type="button"
              onClick={() => setShowOnlyFavorites((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                showOnlyFavorites
                  ? 'bg-[#E63946] text-white border-[#E63946] shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#E63946]/50 hover:bg-red-50/50'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 shrink-0 ${
                  showOnlyFavorites ? 'fill-white' : 'text-[#E63946]'
                }`}
              />
              Meus Favoritos ({favoriteIds.size})
            </button>
          )}
          <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-1 hidden sm:block" />
          {CATEGORIAS.map((cat) => {
            const isSelected = selectedCategory === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                  isSelected
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mb-3" />
          <p className="text-sm text-gray-500">Carregando catálogo...</p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-orange-200 p-8">
          <p className="text-base font-semibold text-gray-700">Nenhum item encontrado.</p>
          <p className="text-xs text-gray-500 mt-1">
            {showOnlyFavorites
              ? 'Você ainda não favoritou nenhum item com esses filtros — toque no coração de um card para salvar.'
              : 'Tente buscar com outro termo ou limpar os filtros de categoria.'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearch('')
              setSelectedCategory('Todas')
              setShowOnlyFavorites(false)
            }}
            className="mt-4 border-orange-200 text-[#FF6B35] hover:bg-orange-50 text-xs"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((item) => {
              const catClass =
                CATEGORY_COLORS[item.categoria] || 'bg-gray-100 text-gray-800 border-gray-200'

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-orange-100/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Image with Badges */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-tr from-orange-100 to-amber-50">
                      <img
                        src={
                          item.imageUrl ||
                          item.imagem ||
                          'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                        }
                        alt={item.nome}
                        onError={(e) => {
                          // Fallback to appetizing placeholder if image fails
                          ;(e.target as HTMLImageElement).src =
                            'https://img.usecurling.com/p/800/600?q=delicious%20fast%20food'
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`${catClass} font-bold text-xs backdrop-blur-xs px-2.5 py-0.5 rounded-full`}
                        >
                          {item.categoria}
                        </Badge>
                        {user && favoriteIds.has(item.id) && (
                          <span
                            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-sm"
                            title="Está nos seus favoritos"
                          >
                            <Heart className="w-3.5 h-3.5 fill-[#E63946] text-[#E63946]" />
                          </span>
                        )}
                      </div>
                      {user && (
                        <div className="absolute top-3 right-3">
                          <button
                            type="button"
                            aria-label={
                              favoriteIds.has(item.id)
                                ? 'Remover dos favoritos'
                                : 'Adicionar aos favoritos'
                            }
                            onClick={() => handleToggleFavorite(item.id)}
                            disabled={favoritePendingId === item.id}
                            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xs transition-all duration-200 shadow-sm border ${
                              favoriteIds.has(item.id)
                                ? 'bg-white/95 border-[#E63946]/40'
                                : 'bg-white/85 border-white/60 hover:bg-white hover:scale-110'
                            }`}
                          >
                            {favoritePendingId === item.id ? (
                              <Loader2 className="w-4 h-4 text-[#E63946] animate-spin" />
                            ) : (
                              <Heart
                                className={`w-4.5 h-4.5 transition-colors ${
                                  favoriteIds.has(item.id)
                                    ? 'fill-[#E63946] text-[#E63946]'
                                    : 'text-gray-400'
                                }`}
                              />
                            )}
                          </button>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Flame className="w-3.5 h-3.5 text-[#FF6B35]" />
                          {item.calorias} kcal
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-[#2EC4B6]" />
                          <span className="font-semibold text-gray-700">
                            {item.estabelecimento}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#FF6B35] transition-colors line-clamp-1">
                          {item.nome}
                        </h3>
                      </div>

                      {/* Mini macros pill row */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-orange-50/50 rounded-xl border border-orange-100/50">
                        <div>
                          <span className="block text-[10px] text-gray-400 font-medium uppercase">
                            Proteínas
                          </span>
                          <span className="font-bold text-gray-800">{item.proteina_g || 0}g</span>
                        </div>
                        <div className="border-x border-orange-100">
                          <span className="block text-[10px] text-gray-400 font-medium uppercase">
                            Carbos
                          </span>
                          <span className="font-bold text-gray-800">
                            {item.carboidrato_g || 0}g
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400 font-medium uppercase">
                            Gorduras
                          </span>
                          <span className="font-bold text-gray-800">{item.gordura_g || 0}g</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    <Button
                      asChild
                      className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
                    >
                      <Link
                        to={`/catalog/${item.id}`}
                        className="flex items-center justify-center gap-1.5"
                      >
                        Ver Detalhes <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-orange-200 text-gray-700 hover:bg-orange-50 font-semibold rounded-xl text-xs h-8"
                    >
                      <Link
                        to={`/compare?item1=${item.id}`}
                        className="flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-[#FF6B35]" /> Comparar
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ver Mais Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setDisplayCount((prev) => prev + 6)}
                className="border-orange-200 text-gray-700 hover:bg-orange-50 px-8 py-5 text-sm font-semibold rounded-xl"
              >
                Ver mais junk foods ({filteredAndSortedItems.length - displayCount} restantes)
              </Button>
            </div>
          )}

          {/* Bottom Visitor CTA Card */}
          {!user && (
            <div className="mt-8 bg-white border border-orange-100 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-4 max-w-3xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6B35] flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Gostou do cardápio? Monte seu plano inteligente!
              </h3>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                Cadastre-se em segundos para registrar o que você comeu, acompanhar metas diárias,
                gerar relatórios semanais e saber o momento ideal para cada junk food.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-sm px-6 py-5 rounded-xl shadow-sm"
                >
                  <Link to="/signup">Cadastrar Gratuitamente</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto border-orange-200 text-gray-700 hover:bg-orange-50 text-sm py-5 rounded-xl"
                >
                  <Link to="/login">Entrar na minha conta</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
