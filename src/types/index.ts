export type CategoriaAlimento =
  | 'Hamburguer'
  | 'Pizza'
  | 'Sanduiche'
  | 'Fritura'
  | 'Doce'
  | 'Bebida'
  | 'Outros'

export type DietaTipo =
  | 'Onivora'
  | 'Vegetariana'
  | 'Vegana'
  | 'LowCarb'
  | 'Cetogenica'
  | 'SemRestricao'

export type RestricaoTipo =
  | 'SemGluten'
  | 'SemLactose'
  | 'SemFrutosDoMar'
  | 'IntoleranciaLactose'
  | 'AlergiaAmendoim'
  | 'AlergiaSoja'

export type CondicaoSaude =
  | 'Hipertensao'
  | 'DiabetesTipo1'
  | 'DiabetesTipo2'
  | 'ColesterolAlto'
  | 'DoencaRenal'
  | 'Obesidade'
  | 'Nenhuma'

export type RefeicaoTipo =
  | 'CafeDaManha'
  | 'LancheDaManha'
  | 'Almoco'
  | 'LancheDaTarde'
  | 'Jantar'
  | 'Ceia'

export interface CatalogItem {
  id: string
  nome: string
  categoria: CategoriaAlimento
  estabelecimento: string
  calorias: number
  proteina_g?: number
  carboidrato_g?: number
  gordura_g?: number
  gordura_saturada_g?: number
  gordura_trans_g?: number
  acucar_g?: number
  sodio_mg?: number
  fibra_g?: number
  imagem?: string
  created?: string
  updated?: string
}

export interface PerfilUsuario {
  id: string
  usuario: string
  dieta_atual: DietaTipo[]
  restricoes: RestricaoTipo[]
  condicoes: CondicaoSaude[]
  meta_calorias: number
  meta_proteina_pct: number
  meta_carboidrato_pct: number
  meta_gordura_pct: number
  created?: string
  updated?: string
}

export interface RegistroAlimentar {
  id: string
  usuario: string
  alimento: string
  data: string
  refeicao: RefeicaoTipo
  created?: string
  updated?: string
  expand?: {
    alimento?: CatalogItem
  }
}

export interface UserAuth {
  id: string
  email: string
  name: string
  avatar?: string
  is_admin?: boolean
}

export interface RecommendationResult {
  item: CatalogItem
  matchScore: number
  melhorMomento: {
    refeicao: RefeicaoTipo
    label: string
    horario: string
    isNow: boolean
    justificativa: string
  }
  melhorLugar: {
    estabelecimento: string
    justificativa: string
  }
  justificativaGeral: string
}
