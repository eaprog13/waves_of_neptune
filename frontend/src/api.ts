// pedidos à API em PHP. Os POST levam sempre o token CSRF no header.
// todos levam a língua (X-Idioma): o PHP responde com os textos e as mensagens nessa língua
import { idioma, t } from './i18n';

// o token fica só em memória (nunca no localStorage) e volta a vir do servidor sempre que a sessão muda
let tokenCsrf = '';

export function definirToken(token: string) {
  tokenCsrf = token;
}

// erro vindo da API: a mensagem já vem na língua do pedido; detalhes tem o resto da resposta (ex.: reiniciar)
export class ErroApi extends Error {
  estado: number;
  detalhes: Record<string, unknown>;

  constructor(mensagem: string, estado: number, detalhes: Record<string, unknown> = {}) {
    super(mensagem);
    this.estado = estado;
    this.detalhes = detalhes;
  }
}

async function pedir<T>(url: string, opcoes: RequestInit): Promise<T> {
  // same-origin: o cookie da sessão vai em todos os pedidos
  const headers = { 'X-Idioma': idioma(), ...(opcoes.headers as Record<string, string> | undefined) };
  const resposta = await fetch('api/' + url, { credentials: 'same-origin', ...opcoes, headers });
  // uma resposta sem JSON (ex.: erro do servidor) não rebenta, cai na mensagem genérica
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new ErroApi(dados.erro ?? t('geral.erro'), resposta.status, dados);
  }
  return dados as T;
}

export function get<T>(url: string) {
  return pedir<T>(url, { method: 'GET' });
}

// dados normais vão em JSON, ficheiros vão num FormData
export function post<T>(url: string, dados: object | FormData) {
  const comFicheiros = dados instanceof FormData;
  const headers: Record<string, string> = { 'X-CSRF-Token': tokenCsrf };
  if (!comFicheiros) {
    headers['Content-Type'] = 'application/json';
  }

  return pedir<T>(url, {
    method: 'POST',
    headers,
    body: comFicheiros ? dados : JSON.stringify(dados),
  });
}

export function mensagemErro(erro: unknown) {
  return erro instanceof Error ? erro.message : t('geral.erro');
}
