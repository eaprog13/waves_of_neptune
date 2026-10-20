import { NavLink, Outlet } from 'react-router-dom';
import { useSessao } from '../../contextos/SessaoContext';
import { pode } from '../../permissoes';
import type { Permissao } from '../../tipos';
import { t, type Chave } from '../../i18n';

const MENU: { para: string; texto: Chave; icone: string; permissao: Permissao; exato?: boolean }[] = [
  { para: '/admin', texto: 'admin.painel', icone: 'bi-speedometer2', permissao: 'estatisticas.ver', exato: true },
  { para: '/admin/produtos', texto: 'admin.produtos', icone: 'bi-box-seam', permissao: 'produtos.gerir' },
  { para: '/admin/categorias', texto: 'admin.categorias', icone: 'bi-tags', permissao: 'categorias.gerir' },
  { para: '/admin/encomendas', texto: 'admin.encomendas', icone: 'bi-receipt', permissao: 'encomendas.ver' },
  { para: '/admin/suporte', texto: 'admin.suporte', icone: 'bi-life-preserver', permissao: 'tickets.gerir' },
  { para: '/admin/concertos', texto: 'admin.concertos', icone: 'bi-ticket-perforated', permissao: 'bilhetes.ver' },
  { para: '/admin/newsletter', texto: 'admin.newsletter', icone: 'bi-envelope-paper', permissao: 'newsletter.ver' },
  { para: '/admin/utilizadores', texto: 'admin.utilizadores', icone: 'bi-people', permissao: 'utilizadores.ver' },
];

export default function AdminLayout() {
  const { utilizador } = useSessao();

  return (
    <div className="container-fluid container-xl py-4">
      <div className="row g-4">
        <aside className="col-lg-2">
          <p className="text-secondary text-uppercase small mb-2">{t('admin.titulo')}</p>
          <nav className="nav nav-pills flex-row flex-lg-column gap-1 menu-admin overflow-auto flex-nowrap">
            {MENU.filter((item) => pode(utilizador, item.permissao)).map((item) => (
              <NavLink key={item.para} to={item.para} end={item.exato} className="nav-link text-nowrap">
                <i className={'bi me-2 ' + item.icone}></i>{t(item.texto)}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="col-lg-10">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
