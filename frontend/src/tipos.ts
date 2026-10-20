export type TipoUtilizador = 'cliente' | 'suporte' | 'admin';

export type Permissao =
  | 'estatisticas.ver'
  | 'produtos.gerir'
  | 'categorias.gerir'
  | 'encomendas.ver'
  | 'encomendas.gerir'
  | 'concertos.gerir'
  | 'bilhetes.ver'
  | 'utilizadores.ver'
  | 'utilizadores.gerir'
  | 'newsletter.ver'
  | 'newsletter.enviar'
  | 'tickets.gerir';

// as permissões vêm do servidor (api/nucleo/autorizacao.php); o front-end só as usa para mostrar ou esconder
export interface Utilizador {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUtilizador;
  permissoes: Permissao[];
}

export interface Categoria {
  id: number;
  nome: string;
  nome_en?: string | null; // só na área de admin
  total_produtos: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  stock: number;
  categoria_id: number;
  categoria: string;
  destaque: boolean;
  nome_en?: string | null; // só na área de admin
  descricao_en?: string | null;
}

export interface PaginaProdutos {
  produtos: Produto[];
  total: number;
  pagina: number;
  paginas: number;
  por_pagina: number;
}

export type EstadoEncomenda = 'pendente' | 'em_preparacao' | 'enviada' | 'entregue' | 'cancelada';

export interface ItemEncomenda {
  product_id: number | null;
  nome_produto: string;
  quantidade: number;
  subtotal: number;
}

export interface DadosEnvio {
  nome: string;
  telefone: string;
  morada: string;
  codigo_postal: string;
  cidade: string;
}

export type EstadoPagamento = 'por_pagar' | 'pago' | 'reembolsado';

export type EstadoEnvio = 'em_preparacao' | 'enviada' | 'em_transito' | 'em_distribuicao' | 'entregue' | 'devolvida' | 'incidente';

export interface EventoEnvio {
  estado: EstadoEnvio;
  descricao: string;
  local: string | null;
  criado_em: string;
}

export interface Envio {
  id: number;
  order_id: number;
  transportadora: string;
  codigo_rastreio: string;
  url_rastreio: string | null;
  estado: EstadoEnvio;
  atualizado_em: string;
  eventos: EventoEnvio[];
}

export interface Encomenda {
  id: number;
  user_id: number;
  data: string;
  estado: EstadoEncomenda;
  pagamento: EstadoPagamento;
  envio?: Envio | null;
  total: number;
  nome_envio: string;
  telefone: string;
  morada: string;
  codigo_postal: string;
  cidade: string;
  itens: ItemEncomenda[];
  cliente?: string;
  email?: string;
}

export interface Perfil {
  id: number;
  nome: string;
  email: string;
  tipo_utilizador: TipoUtilizador;
  telefone: string | null;
  morada: string | null;
  codigo_postal: string | null;
  cidade: string | null;
  dois_fatores: boolean;
}

export interface UtilizadorAdmin {
  id: number;
  nome: string;
  email: string;
  tipo_utilizador: TipoUtilizador;
  cidade: string | null;
  criado_em: string;
  encomendas: number;
  total_gasto: number;
}

export interface Estatisticas {
  total_vendas: number;
  total_encomendas: number;
  pendentes: number;
  total_clientes: number;
  total_produtos: number;
  por_estado: Partial<Record<EstadoEncomenda, number>>;
  mais_vendidos: { nome_produto: string; quantidade: number; total: number }[];
  stock_baixo: { id: number; nome: string; stock: number }[];
}

export interface Concerto {
  id: number;
  titulo: string;
  local: string;
  cidade: string;
  data: string;
  descricao: string | null;
  imagem: string | null;
  preco: number;
  lotacao: number;
  vendidos: number;
  disponiveis: number;
  estado: 'agendado' | 'cancelado';
  passado: boolean;
  titulo_en?: string | null; // só na área de admin
  descricao_en?: string | null;
}

export interface Bilhete {
  id: number;
  quantidade: number;
  total: number;
  codigo: string;
  estado: 'reservado' | 'cancelado';
  pagamento: EstadoPagamento;
  criado_em: string;
  concerto_id?: number;
  titulo?: string;
  local?: string;
  cidade?: string;
  data?: string;
  estado_concerto?: 'agendado' | 'cancelado';
  nome?: string;
  email?: string;
}

export interface Subscritor {
  id: number;
  email: string;
  ativo: boolean;
  consentimento_em: string;
  criado_em: string;
  cancelado_em: string | null;
}

export interface Pagamento {
  id: number;
  tipo: 'encomenda' | 'bilhete';
  referencia_id: number;
  valor: number;
  moeda: string;
  fornecedor: string;
  estado: 'pendente' | 'pago' | 'falhado' | 'cancelado' | 'reembolsado';
  criado_em: string;
  pago_em: string | null;
  simulado: boolean;
}

export type CategoriaTicket = 'atraso' | 'danificado' | 'produto_errado' | 'em_falta' | 'devolucao' | 'pagamento' | 'outro';
export type PrioridadeTicket = 'baixa' | 'normal' | 'alta' | 'urgente';
export type EstadoTicket = 'aberto' | 'em_analise' | 'a_aguardar_cliente' | 'resolvido' | 'fechado';

export interface Ticket {
  id: number;
  user_id: number;
  order_id: number | null;
  atribuido_a: number | null;
  atribuido_nome: string | null;
  assunto: string;
  categoria: CategoriaTicket;
  prioridade: PrioridadeTicket;
  estado: EstadoTicket;
  reaberturas: number;
  criado_em: string;
  atualizado_em: string;
  resolvido_em: string | null;
  cliente: string;
  email: string;
}

export interface MensagemTicket {
  id: number;
  mensagem: string;
  interna: boolean;
  equipa: boolean;
  autor: string;
  criado_em: string;
}

export interface DetalheTicket {
  ticket: Ticket;
  mensagens: MensagemTicket[];
  equipa?: { id: number; nome: string }[];
}
