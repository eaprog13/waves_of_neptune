import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import CartaoProduto from '../componentes/CartaoProduto';
import Carregando from '../componentes/Carregando';
import FaixaGeneros from '../componentes/FaixaGeneros';
import Imagem from '../componentes/Imagem';
import Revelar from '../componentes/Revelar';
import type { Categoria, Produto } from '../tipos';
import { t } from '../i18n';

// a newsletter fica no fim da página: vem depois, com o zod (validação), sem atrasar o início
const Newsletter = lazy(() => import('../componentes/Newsletter'));

export default function Inicio() {
  const [destaques, setDestaques] = useState<Produto[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const hero = useRef<HTMLDivElement>(null);

  useEffect(() => {
    get<Produto[]>('produtos.php?destaque=1&limite=4').then(setDestaques).catch(() => setDestaques([]));
    get<Categoria[]>('categorias.php').then(setCategorias).catch(() => {});
  }, []);

  // parallax: o logo e as estrelas seguem o rato (só com rato, no telemóvel fica parado)
  // muda variáveis CSS diretamente, sem voltar a desenhar o componente
  function mexerRato(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || !hero.current) return;
    const caixa = hero.current.getBoundingClientRect();
    hero.current.style.setProperty('--mx', ((e.clientX - caixa.left) / caixa.width - 0.5).toFixed(3));
    hero.current.style.setProperty('--my', ((e.clientY - caixa.top) / caixa.height - 0.5).toFixed(3));
  }

  function centrar() {
    hero.current?.style.setProperty('--mx', '0');
    hero.current?.style.setProperty('--my', '0');
  }

  function descer() {
    document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <div className="hero" ref={hero} onPointerMove={mexerRato} onPointerLeave={centrar}>
        <div className="hero-fundo"></div>
        <div className="hero-estrelas"></div>

        <div className="hero-conteudo text-center px-3">
          <button className="hero-descer" onClick={descer} aria-label={t('inicio.descer')}>
            <i className="bi bi-chevron-double-down"></i>
          </button>
        </div>

        <div className="onda onda-1"></div>
        <div className="onda onda-2"></div>
      </div>

      <FaixaGeneros />

      <section id="destaques" className="container container-cards-bg py-5 mt-5 rounded-3 text-center">
        <Revelar>
          <h1 className="eco" data-texto="Echoes of Neptune">Echoes of Neptune</h1>
          <p className="text-secondary">{t('inicio.album')}</p>
        </Revelar>

        <div className="row g-4 mt-3 px-2">
          {destaques === null && <Carregando />}
          {destaques?.map((produto, i) => (
            <div key={produto.id} className="col-12 col-sm-6 col-lg-3">
              <Revelar atraso={i * 120} className="h-100">
                <CartaoProduto produto={produto} />
              </Revelar>
            </div>
          ))}
        </div>

        <Revelar>
          <Link to="/loja" className="btn btn-outline-light mt-5 px-5">{t('inicio.verTodos')}</Link>
        </Revelar>
      </section>

      {categorias.length > 0 && (
        <section className="container container-cards-bg py-5 mt-5 rounded-3 text-center">
          <Revelar>
            <h2>{t('inicio.categorias')}</h2>
            <p className="text-secondary">{t('inicio.merch')}</p>
          </Revelar>
          <div className="row g-4 mt-3 px-2">
            {categorias.map((categoria, i) => (
              <div key={categoria.id} className="col-6 col-md-3">
                <Revelar atraso={i * 100} className="h-100">
                  <Link to={'/loja?categoria=' + categoria.id} className="text-decoration-none">
                    <div className="fundo-escuro rounded-3 h-100">
                      <div className="card h-100 card-escrita p-4 cartao-categoria">
                        <h3 className="h5 mb-1">{categoria.nome}</h3>
                        <span className="etiqueta-pequena">{t('inicio.nProdutos', { n: categoria.total_produtos })}</span>
                      </div>
                    </div>
                  </Link>
                </Revelar>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container py-5 mt-5">
        <div className="row g-4 justify-content-center">
          <Revelar className="col-12 col-md-6">
            <div className="text-center fundo-escuro rounded-3 h-100">
              <div className="card h-100 card-escrita">
                <Imagem src="media/img/music/album.webp" className="card-img-top" alt={t('inicio.capa')} width="720" height="720" />
                <div className="card-body">
                  <h2>{t('inicio.banda')}</h2>
                  <p className="text-secondary">Post-rock · Prog metal · Funk · Fusion</p>
                  <p>{t('inicio.bandaTexto')}</p>
                  <Link to="/banda" className="btn btn-outline-light w-100">{t('inicio.lerMais')}</Link>
                </div>
              </div>
            </div>
          </Revelar>
        </div>
      </section>

      <Suspense fallback={null}>
        <Newsletter />
      </Suspense>
    </>
  );
}
