import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Rodape from './Rodape';
import Carregando from './Carregando';
import { useCarrinho } from '../contextos/CarrinhoContext';

// páginas que mantêm o fundo com o logo repetido
const PAGINAS_COM_FUNDO = ['/conta', '/carrinho', '/checkout'];

export default function Layout() {
  const { pathname } = useLocation();
  const { itens } = useCarrinho();
  // com o carrinho vazio não mostra o logo por trás da mensagem
  const carrinhoVazio = pathname === '/carrinho' && itens.length === 0;
  const comLogo = PAGINAS_COM_FUNDO.includes(pathname) && !carrinhoVazio;

  // cada página nova abre no topo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      {/* fundo: o logo repetido (só em algumas páginas), as estrelas subtis e a poeira estelar (em todas) */}
      {comLogo && <div className="fundo-logo" aria-hidden="true"></div>}
      <div className="ceu-estrelado" aria-hidden="true"></div>
      <div className="poeira-estelar" aria-hidden="true"></div>
      <Navbar />
      <main className={pathname === '/' ? 'conteudo conteudo-hero' : 'conteudo'}>
        <Suspense fallback={<Carregando />}>
          <Outlet />
        </Suspense>
      </main>
      <Rodape />
    </>
  );
}
