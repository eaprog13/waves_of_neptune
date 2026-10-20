import type { Permissao, Utilizador } from './tipos';

// só serve para mostrar ou esconder botões e páginas: quem decide é sempre o servidor
export function pode(utilizador: Utilizador | null, permissao: Permissao) {
  return !!utilizador?.permissoes.includes(permissao);
}

export function temAreaAdmin(utilizador: Utilizador | null) {
  return !!utilizador && utilizador.permissoes.length > 0;
}

// a primeira página da área de admin a que o utilizador tem acesso
export function inicioAdmin(utilizador: Utilizador | null) {
  if (pode(utilizador, 'estatisticas.ver')) return '/admin';
  if (pode(utilizador, 'encomendas.ver')) return '/admin/encomendas';
  if (pode(utilizador, 'bilhetes.ver')) return '/admin/concertos';
  return '/';
}
