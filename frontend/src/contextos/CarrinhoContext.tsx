import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { get } from '../api';
import * as carrinho from '../carrinho';
import type { ItemCarrinho } from '../carrinho';
import type { Produto } from '../tipos';

interface Carrinho {
  itens: ItemCarrinho[];
  total: number;
  artigos: number;
  adicionar: (produto: Produto, quantidade?: number) => void;
  atualizar: (id: number, quantidade: number) => void;
  remover: (id: number) => void;
  limpar: () => void;
}

const CarrinhoContext = createContext<Carrinho | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(carrinho.lerCarrinho);

  useEffect(() => {
    carrinho.guardarCarrinho(itens);
  }, [itens]);

  // ao abrir o site confirma os preços e o stock (só se houver alguma coisa no carrinho)
  useEffect(() => {
    if (carrinho.lerCarrinho().length === 0) {
      return;
    }
    get<Produto[]>('produtos.php')
      .then((produtos) => setItens((atuais) => carrinho.sincronizar(atuais, produtos)))
      .catch(() => {});
  }, []);

  const valor: Carrinho = {
    itens,
    total: carrinho.total(itens),
    artigos: carrinho.totalArtigos(itens),
    adicionar: (produto, quantidade = 1) => setItens((atuais) => carrinho.adicionar(atuais, produto, quantidade)),
    atualizar: (id, quantidade) => setItens((atuais) => carrinho.atualizarQuantidade(atuais, id, quantidade)),
    remover: (id) => setItens((atuais) => carrinho.remover(atuais, id)),
    limpar: () => setItens([]),
  };

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  const valor = useContext(CarrinhoContext);
  if (!valor) {
    throw new Error('useCarrinho tem de estar dentro do CarrinhoProvider');
  }
  return valor;
}
