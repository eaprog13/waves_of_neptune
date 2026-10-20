import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from 'react';
import { definirIdioma, idioma as idiomaInicial, t, type Idioma } from '../i18n';

interface ContextoIdioma {
  idioma: Idioma;
  mudar: (novo: Idioma) => void;
}

const IdiomaContext = createContext<ContextoIdioma | null>(null);

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial);

  // a língua da página (leitores de ecrã, tradução do browser), o título e a descrição do separador
  useEffect(() => {
    document.documentElement.lang = idioma;
    document.title = t('site.titulo');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('site.descricao'));
  }, [idioma]);

  function mudar(novo: Idioma) {
    definirIdioma(novo);
    setIdioma(novo);
  }

  // a key nova faz o site voltar a desenhar-se do zero: todos os textos mudam
  // e as páginas voltam a pedir os produtos e concertos à API, já na nova língua
  return (
    <IdiomaContext.Provider value={{ idioma, mudar }}>
      <Fragment key={idioma}>{children}</Fragment>
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  const valor = useContext(IdiomaContext);
  if (!valor) {
    throw new Error('useIdioma tem de estar dentro do IdiomaProvider');
  }
  return valor;
}
