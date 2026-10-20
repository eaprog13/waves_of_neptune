import type { NavigateFunction } from 'react-router-dom';
import { post } from './api';
import { t } from './i18n';

// pede à API para iniciar o pagamento e devolve para onde mandar o cliente:
// o fornecedor simulado devolve uma página da loja (#/pagamento/5), um fornecedor real devolve o endereço dele
export async function iniciarPagamento(tipo: 'encomenda' | 'bilhete', id: number) {
  const resposta = await post<{ pagamento_id: number; url: string; valor: number }>('pagamentos.php', { acao: 'iniciar', tipo, id });
  return resposta.url;
}

// só segue para páginas da loja ou para um endereço https do fornecedor (nunca javascript: ou outros)
export function irParaPagamento(url: string, navigate: NavigateFunction) {
  if (url.startsWith('#/')) {
    navigate(url.slice(1));
  } else if (url.startsWith('https://')) {
    window.location.assign(url);
  } else {
    throw new Error(t('pagamento.urlInvalido'));
  }
}
