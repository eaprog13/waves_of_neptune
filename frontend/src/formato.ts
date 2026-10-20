import { regiao, t } from './i18n';
import type { CategoriaTicket, EstadoEncomenda, EstadoEnvio, EstadoPagamento, EstadoTicket, PrioridadeTicket } from './tipos';

// preços e datas no formato da língua escolhida (15,00 € em português, €15.00 em inglês)
export function euros(valor: number) {
  return new Intl.NumberFormat(regiao(), { style: 'currency', currency: 'EUR' }).format(valor);
}

// a base de dados devolve '2026-11-20 21:30:00'; com o T fica no formato ISO, que todos os browsers leem como hora local

export function data(texto: string) {
  return new Date(texto.replace(' ', 'T')).toLocaleDateString(regiao(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function dataHora(texto: string) {
  return new Date(texto.replace(' ', 'T')).toLocaleString(regiao(), {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function jaPassou(texto: string) {
  return new Date(texto.replace(' ', 'T')) <= new Date();
}

export function imagemProduto(imagem: string | null) {
  return imagem ? 'uploads/produtos/' + imagem : 'media/img/logo/won_vert1.jpg';
}

export function imagemConcerto(imagem: string | null) {
  return imagem ? 'uploads/concertos/' + imagem : 'media/img/tour/foto-1.jpg';
}

// o texto é um getter: é lido na altura em que aparece, já na língua escolhida
function estado(chave: EstadoEncomenda, cor: string) {
  return { get texto() { return t(`estado.${chave}` as const); }, cor };
}

export const ESTADOS: Record<EstadoEncomenda, { texto: string; cor: string }> = {
  pendente: estado('pendente', 'warning'),
  em_preparacao: estado('em_preparacao', 'secondary'),
  enviada: estado('enviada', 'light'),
  entregue: estado('entregue', 'success'),
  cancelada: estado('cancelada', 'danger'),
};

export const PAGAMENTO: Record<EstadoPagamento, { texto: string; cor: string }> = {
  por_pagar: { get texto() { return t('pagamento.por_pagar'); }, cor: 'warning' },
  pago: { get texto() { return t('pagamento.pago'); }, cor: 'success' },
  reembolsado: { get texto() { return t('pagamento.reembolsado'); }, cor: 'secondary' },
};

export const ESTADOS_ENVIO: Record<EstadoEnvio, string> = {
  get em_preparacao() { return t('envio.em_preparacao'); },
  get enviada() { return t('envio.enviada'); },
  get em_transito() { return t('envio.em_transito'); },
  get em_distribuicao() { return t('envio.em_distribuicao'); },
  get entregue() { return t('envio.entregue'); },
  get devolvida() { return t('envio.devolvida'); },
  get incidente() { return t('envio.incidente'); },
};

export const CATEGORIAS_TICKET: Record<CategoriaTicket, string> = {
  get atraso() { return t('ticket.atraso'); },
  get danificado() { return t('ticket.danificado'); },
  get produto_errado() { return t('ticket.produto_errado'); },
  get em_falta() { return t('ticket.em_falta'); },
  get devolucao() { return t('ticket.devolucao'); },
  get pagamento() { return t('ticket.pagamento'); },
  get outro() { return t('ticket.outro'); },
};

export const PRIORIDADES_TICKET: Record<PrioridadeTicket, { texto: string; cor: string }> = {
  baixa: { get texto() { return t('prioridade.baixa'); }, cor: 'secondary' },
  normal: { get texto() { return t('prioridade.normal'); }, cor: 'light' },
  alta: { get texto() { return t('prioridade.alta'); }, cor: 'warning' },
  urgente: { get texto() { return t('prioridade.urgente'); }, cor: 'danger' },
};

export const ESTADOS_TICKET: Record<EstadoTicket, { texto: string; cor: string }> = {
  aberto: { get texto() { return t('eticket.aberto'); }, cor: 'warning' },
  em_analise: { get texto() { return t('eticket.em_analise'); }, cor: 'light' },
  a_aguardar_cliente: { get texto() { return t('eticket.a_aguardar_cliente'); }, cor: 'secondary' },
  resolvido: { get texto() { return t('eticket.resolvido'); }, cor: 'success' },
  fechado: { get texto() { return t('eticket.fechado'); }, cor: 'dark' },
};
