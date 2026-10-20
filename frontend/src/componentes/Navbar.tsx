import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSessao } from '../contextos/SessaoContext';
import { useCarrinho } from '../contextos/CarrinhoContext';
import BotaoIdioma from './BotaoIdioma';
import Equalizador from './Equalizador';
import MenuMovel from './MenuMovel';
import { t } from '../i18n';
import { inicioAdmin, temAreaAdmin } from '../permissoes';

// link do menu: a página atual fica marcada com um mini equalizador por baixo
function Ligacao({ para, texto, exato = false, extra }: { para: string; texto: string; exato?: boolean; extra?: ReactNode }) {
  return (
    <NavLink to={para} end={exato} className="nav-link">
      {({ isActive }) => (
        <>
          {texto}
          {extra}
          {isActive && <span className="indicador-ativo"><Equalizador /></span>}
        </>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { utilizador, sair } = useSessao();
  const { artigos } = useCarrinho();
  const location = useLocation();
  const navigate = useNavigate();

  const [aberto, setAberto] = useState(false);
  const [rolado, setRolado] = useState(false);
  const [depoisDoHero, setDepoisDoHero] = useState(false);
  const [escondido, setEscondido] = useState(false);

  const naHome = location.pathname === '/';
  // o número salta sempre que muda (a key nova faz a animação repetir)
  const contador = artigos > 0 ? <span key={artigos} className="badge rounded-pill bg-light text-dark badge-carrinho">{artigos}</span> : null;

  // ao descer o menu esconde-se, ao subir volta; no início só mostra o logo depois do hero
  useEffect(() => {
    let ultimoY = window.scrollY;
    let pedido = 0;

    function aoRolar() {
      cancelAnimationFrame(pedido);
      pedido = requestAnimationFrame(() => {
        const y = window.scrollY;
        setRolado(y > 40);
        setDepoisDoHero(y > window.innerHeight * 0.6);
        if (Math.abs(y - ultimoY) > 6) {
          setEscondido(y > 160 && y > ultimoY);
          ultimoY = y;
        }
      });
    }

    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      window.removeEventListener('scroll', aoRolar);
      cancelAnimationFrame(pedido);
    };
  }, []);

  useEffect(() => {
    setAberto(false);
  }, [location]);

  const fechar = useCallback(() => setAberto(false), []);

  async function terminarSessao() {
    await sair();
    navigate('/');
  }

  const classes = ['menu-principal'];
  if (rolado) classes.push('rolado');
  if (escondido && !aberto) classes.push('escondido');
  if (naHome && !depoisDoHero) classes.push('topo-home');

  return (
    <>
      <header className={classes.join(' ')}>
        <nav className="menu-grelha container-fluid px-3 px-lg-4">
          <div className="menu-lado">
            <button className="menu-abrir d-lg-none" onClick={() => setAberto(true)} aria-label={t('menu.abrir')} aria-expanded={aberto}>
              <i className="bi bi-list"></i>
            </button>
            <ul className="menu-links d-none d-lg-flex">
              <li><Ligacao para="/" texto={t('menu.home')} exato /></li>
              <li><Ligacao para="/loja" texto={t('menu.loja')} /></li>
              <li><Ligacao para="/concertos" texto={t('menu.concertos')} /></li>
              <li><Ligacao para="/banda" texto={t('menu.banda')} /></li>
            </ul>
          </div>

          <Link to="/" className="menu-logo" aria-label={t('menu.inicio')}>
            <img src="media/img/logo/icon_won.webp" alt={t('menu.logo')} width="81" height="60" />
          </Link>

          <div className="menu-lado menu-lado-direito">
            <ul className="menu-links d-none d-lg-flex">
              {temAreaAdmin(utilizador) && <li><Ligacao para={inicioAdmin(utilizador)} texto={t('menu.admin')} /></li>}
              {utilizador ? (
                <>
                  <li><Ligacao para="/conta" texto={t('menu.conta')} /></li>
                  <li><button className="nav-link" onClick={terminarSessao}>{t('menu.sair')}</button></li>
                </>
              ) : (
                <li><Ligacao para="/login" texto={t('menu.entrar')} /></li>
              )}
              <li><Ligacao para="/carrinho" texto={t('menu.carrinho')} extra={contador} /></li>
              <li><BotaoIdioma /></li>
            </ul>

            {/* no modo hambúrguer: língua, conta e carrinho sempre à mão */}
            <div className="menu-icones d-flex d-lg-none">
              <BotaoIdioma />
              <NavLink to={utilizador ? '/conta' : '/login'} className="nav-link" aria-label={utilizador ? t('menu.minhaConta') : t('menu.entrar')}>
                <i className="bi bi-person"></i>
              </NavLink>
              <NavLink to="/carrinho" className="nav-link" aria-label={t('menu.carrinhoArtigos', { n: artigos })}>
                <i className="bi bi-bag"></i>
                {contador}
              </NavLink>
            </div>
          </div>
        </nav>
      </header>

      <MenuMovel aberto={aberto} fechar={fechar} sair={terminarSessao} />
    </>
  );
}
