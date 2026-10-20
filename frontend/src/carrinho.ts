// lógica do carrinho: funções puras que recebem a lista e devolvem uma lista nova
import type { Produto } from './tipos';

export interface ItemCarrinho {
  id: number;
  nome: string;
  preco: number;
  imagem: string | null;
  stock: number;
  quantidade: number;
}

const CHAVE = 'won_carrinho';

export function lerCarrinho(): ItemCarrinho[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

export function guardarCarrinho(itens: ItemCarrinho[]) {
  localStorage.setItem(CHAVE, JSON.stringify(itens));
}

// a quantidade fica sempre entre 1 e o stock disponível
function limitar(quantidade: number, stock: number) {
  return Math.max(1, Math.min(stock, Math.floor(quantidade) || 1));
}

export function adicionar(itens: ItemCarrinho[], produto: Produto, quantidade = 1): ItemCarrinho[] {
  const existente = itens.find((item) => item.id === produto.id);
  if (existente) {
    return atualizarQuantidade(itens, produto.id, existente.quantidade + quantidade);
  }

  const novo: ItemCarrinho = {
    id: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    imagem: produto.imagem,
    stock: produto.stock,
    quantidade: limitar(quantidade, produto.stock),
  };
  return [...itens, novo];
}

export function atualizarQuantidade(itens: ItemCarrinho[], id: number, quantidade: number): ItemCarrinho[] {
  return itens.map((item) => (item.id === id ? { ...item, quantidade: limitar(quantidade, item.stock) } : item));
}

export function remover(itens: ItemCarrinho[], id: number): ItemCarrinho[] {
  return itens.filter((item) => item.id !== id);
}

// atualiza preço e stock com os dados atuais da loja e tira o que já não existe ou esgotou
export function sincronizar(itens: ItemCarrinho[], produtos: Produto[]): ItemCarrinho[] {
  const resultado: ItemCarrinho[] = [];
  for (const item of itens) {
    const produto = produtos.find((p) => p.id === item.id);
    if (produto && produto.stock > 0) {
      resultado.push({
        ...item,
        nome: produto.nome,
        preco: produto.preco,
        imagem: produto.imagem,
        stock: produto.stock,
        quantidade: limitar(item.quantidade, produto.stock),
      });
    }
  }
  return resultado;
}

export function subtotal(item: ItemCarrinho) {
  return item.preco * item.quantidade;
}

export function total(itens: ItemCarrinho[]) {
  return itens.reduce((soma, item) => soma + subtotal(item), 0);
}

export function totalArtigos(itens: ItemCarrinho[]) {
  return itens.reduce((soma, item) => soma + item.quantidade, 0);
}
