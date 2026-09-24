import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from '@/services/nutrition'
import type { CatalogItem, CategoriaAlimento } from '@/types'
import {
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Check,
  AlertTriangle,
  ArrowLeft,
  Utensils,
  Store,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

const CATEGORIAS_LIST: CategoriaAlimento[] = [
  'Hamburguer',
  'Pizza',
  'Sanduiche',
  'Fritura',
  'Doce',
  'Bebida',
  'Outros',
]

const DEFAULT_ITEM_FORM: Omit<CatalogItem, 'id' | 'created' | 'updated'> = {
  nome: '',
  estabelecimento: '',
  categoria: 'Hamburguer',
  calorias: 500,
  proteina_g: 20,
  carboidrato_g: 40,
  gordura_g: 20,
  gordura_saturada_g: 6,
  gordura_trans_g: 0,
  acucar_g: 5,
  sodio_mg: 800,
  fibra_g: 2,
  imagem: 'https://img.usecurling.com/p/800/600?q=fast%20food',
}

export default function CatalogAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(DEFAULT_ITEM_FORM)
  const [saving, setSaving] = useState(false)

  // Delete Dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [itemToDeleteName, setItemToDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Guard: if user is not admin
  useEffect(() => {
    if (user && !user.is_admin && user.email !== 'william@korenambiental.com') {
      toast({
        variant: 'destructive',
        title: 'Acesso Restrito',
        description: 'Você precisa ser administrador para acessar esta área.',
      })
      navigate('/app')
    }
  }, [user, navigate, toast])

  const loadItems = async () => {
    try {
      const data = await fetchCatalogItems()
      setItems(data)
    } catch (err) {
      console.error('Erro ao carregar itens:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar catálogo',
        description: 'Verifique sua conexão.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return items
    return items.filter(
      (item) =>
        item.nome.toLowerCase().includes(term) ||
        item.estabelecimento.toLowerCase().includes(term) ||
        item.categoria.toLowerCase().includes(term),
    )
  }, [items, search])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData(DEFAULT_ITEM_FORM)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingId(item.id)
    setFormData({
      nome: item.nome,
      estabelecimento: item.estabelecimento,
      categoria: item.categoria,
      calorias: item.calorias,
      proteina_g: item.proteina_g || 0,
      carboidrato_g: item.carboidrato_g || 0,
      gordura_g: item.gordura_g || 0,
      gordura_saturada_g: item.gordura_saturada_g || 0,
      gordura_trans_g: item.gordura_trans_g || 0,
      acucar_g: item.acucar_g || 0,
      sodio_mg: item.sodio_mg || 0,
      fibra_g: item.fibra_g || 0,
      imagem: item.imagem || 'https://img.usecurling.com/p/800/600?q=fast%20food',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim() || !formData.estabelecimento.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Informe pelo menos o nome e o estabelecimento.',
      })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateCatalogItem(editingId, formData)
        toast({
          title: 'Item atualizado!',
          description: `${formData.nome} salvo com sucesso.`,
        })
      } else {
        await createCatalogItem(formData)
        toast({
          title: 'Item cadastrado!',
          description: `${formData.nome} adicionado ao catálogo.`,
        })
      }
      setIsModalOpen(false)
      loadItems()
    } catch (err: any) {
      console.error('Erro ao salvar item:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: err.message || 'Verifique as permissões de admin.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = (item: CatalogItem) => {
    setDeleteId(item.id)
    setItemToDeleteName(item.nome)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteCatalogItem(deleteId)
      toast({
        title: 'Item removido!',
        description: 'O item foi excluído do catálogo.',
      })
      setDeleteId(null)
      loadItems()
    } catch (err: any) {
      console.error('Erro ao deletar item:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: err.message || 'Não foi possível remover o item.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Gerenciar Catálogo (Admin)
            </h1>
            <Badge className="bg-red-600 text-white font-bold text-[10px]">Superuser</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Cadastre novos pratos, estabelecimentos e valores nutricionais direto no banco de dados.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-md shadow-orange-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Novo Item no Catálogo
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar no catálogo por nome, estabelecimento ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 py-5 bg-white border-orange-100 focus-visible:ring-[#FF6B35] rounded-xl text-sm"
        />
      </div>

      {/* Items Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mb-3" />
          <p className="text-sm text-gray-500">Carregando itens para gerenciamento...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-orange-200 p-8">
          <Utensils className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-base font-semibold text-gray-700">Nenhum item encontrado.</p>
          <Button
            onClick={handleOpenCreate}
            className="mt-4 bg-[#FF6B35] hover:bg-[#E55A2B] text-white text-xs"
          >
            Cadastrar primeiro item
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-sm">
          <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex justify-between items-center text-xs font-bold text-gray-600">
            <span>Total: {filteredItems.length} itens cadastrados</span>
            <span>Clique para editar ou remover</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-orange-50/30 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-orange-100"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-gray-900">{item.nome}</h4>
                      <Badge variant="outline" className="text-[10px] font-bold py-0">
                        {item.categoria}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-[#2EC4B6]" />
                      <strong>{item.estabelecimento}</strong> •{' '}
                      <span className="text-[#FF6B35] font-bold">{item.calorias} kcal</span> •{' '}
                      <span>{item.proteina_g || 0}g prot</span> •{' '}
                      <span>{item.carboidrato_g || 0}g carb</span> •{' '}
                      <span>{item.gordura_g || 0}g gord</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="border-orange-200 text-gray-700 hover:bg-orange-50 text-xs h-8 gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleConfirmDelete(item)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingId ? 'Editar Item do Catálogo' : 'Cadastrar Novo Item no Catálogo'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Preencha os dados de nome, franquia e tabela nutricional oficial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-bold">
                  Nome do Item *
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Whopper Duplo com Queijo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estabelecimento" className="text-xs font-bold">
                  Estabelecimento / Franquia *
                </Label>
                <Input
                  id="estabelecimento"
                  placeholder="Ex: Burger King, Outback, Feira..."
                  value={formData.estabelecimento}
                  onChange={(e) => setFormData({ ...formData, estabelecimento: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="categoria" className="text-xs font-bold">
                  Categoria
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(val: CategoriaAlimento) =>
                    setFormData({ ...formData, categoria: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_LIST.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calorias" className="text-xs font-bold">
                  Calorias (kcal) *
                </Label>
                <Input
                  id="calorias"
                  type="number"
                  value={formData.calorias}
                  onChange={(e) => setFormData({ ...formData, calorias: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Macros row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proteina" className="text-xs font-bold">
                  Proteínas (g)
                </Label>
                <Input
                  id="proteina"
                  type="number"
                  step="0.1"
                  value={formData.proteina_g}
                  onChange={(e) => setFormData({ ...formData, proteina_g: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="carbo" className="text-xs font-bold">
                  Carboidratos (g)
                </Label>
                <Input
                  id="carbo"
                  type="number"
                  step="0.1"
                  value={formData.carboidrato_g}
                  onChange={(e) =>
                    setFormData({ ...formData, carboidrato_g: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gordura" className="text-xs font-bold">
                  Gorduras Totais (g)
                </Label>
                <Input
                  id="gordura"
                  type="number"
                  step="0.1"
                  value={formData.gordura_g}
                  onChange={(e) => setFormData({ ...formData, gordura_g: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Micro / Detailed nutrition */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sodio" className="text-[11px] font-semibold">
                  Sódio (mg)
                </Label>
                <Input
                  id="sodio"
                  type="number"
                  value={formData.sodio_mg}
                  onChange={(e) => setFormData({ ...formData, sodio_mg: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="acucar" className="text-[11px] font-semibold">
                  Açúcar (g)
                </Label>
                <Input
                  id="acucar"
                  type="number"
                  step="0.1"
                  value={formData.acucar_g}
                  onChange={(e) => setFormData({ ...formData, acucar_g: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fibra" className="text-[11px] font-semibold">
                  Fibras (g)
                </Label>
                <Input
                  id="fibra"
                  type="number"
                  step="0.1"
                  value={formData.fibra_g}
                  onChange={(e) => setFormData({ ...formData, fibra_g: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gord_sat" className="text-[11px] font-semibold">
                  Gord. Saturada (g)
                </Label>
                <Input
                  id="gord_sat"
                  type="number"
                  step="0.1"
                  value={formData.gordura_saturada_g}
                  onChange={(e) =>
                    setFormData({ ...formData, gordura_saturada_g: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imagem" className="text-xs font-bold">
                URL da Imagem (UseCurling CDN)
              </Label>
              <Input
                id="imagem"
                placeholder="https://img.usecurling.com/p/800/600?q=..."
                value={formData.imagem}
                onChange={(e) => setFormData({ ...formData, imagem: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Excluir item do catálogo
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 pt-2">
              Deseja realmente remover <strong>{itemToDeleteName}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
