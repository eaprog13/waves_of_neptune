import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSessao } from '../contextos/SessaoContext';
import { t } from '../i18n';
import { inicioAdmin, temAreaAdmin } from '../permissoes';
import BotaoIdioma from './BotaoIdioma';

interface Props {
  aberto: boolean;
  fechar: () => void;
  sair: () => void;
}

// menu do telemóvel em ecrã inteiro: os links entram um a um por cima das estrelas e da onda
export default function MenuMovel({ aberto, fechar, sair }: Props) {
  const { utilizador } = useSessao();

  const links = [
    { para: '/', texto: t('menu.home'), exato: true },
    { para: '/loja', texto: t('menu.loja') },
    { para: '/concertos', texto: t('menu.concertos') },
    { para: '/banda', texto: t('menu.banda') },
    { para: '/carrinho', texto: t('menu.carrinho') },
  ];
  if (temAreaAdmin(utilizador)) links.push({ para: inicioAdmin(utilizador), texto: t('menu.admin') });
  links.push(utilizador ? { para: '/conta', texto: t('menu.conta') } : { para: '/login', texto: t('menu.entrar') });

  // com o menu aberto a página não faz scroll e a tecla Esc fecha
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = 'hidden';
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    window.addEventListener('keydown', tecla);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', tecla);
    };
  }, [aberto, fechar]);

  return (
    <div className={'menu-movel' + (aberto ? ' aberto' : '')} inert={!aberto} role="dialog" aria-modal="true" aria-label={t('menu.menu')}>
      <div className="hero-estrelas"></div>

      <button className="menu-fechar" onClick={fechar} aria-label={t('menu.fecharMenu')}>
        <i className="bi bi-x-lg"></i>
      </button>

      <nav className="menu-movel-links">
        {links.map((link, i) => (
          <NavLink key={link.para} to={link.para} end={link.exato} style={{ transitionDelay: aberto ? 120 + i * 70 + 'ms' : '0ms' }}>
            {link.texto}
          </NavLink>
        ))}
        {utilizador && (
          <button onClick={sair} style={{ transitionDelay: aberto ? 120 + links.length * 70 + 'ms' : '0ms' }}>{t('menu.sair')}</button>
        )}
      </nav>

      <BotaoIdioma className="menu-movel-idioma" />
      <p className="menu-movel-rodape">Post-Rock ✦ Prog Metal ✦ Funk ✦ Fusion</p>
      <div className="onda onda-1"></div>
    </div>
  );
}
