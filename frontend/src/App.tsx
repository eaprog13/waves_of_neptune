import { lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './componentes/Layout';
import RotaProtegida from './componentes/RotaProtegida';
import { useSessao } from './contextos/SessaoContext';
import { inicioAdmin, pode } from './permissoes';
import Inicio from './paginas/Inicio';

// cada página só é descarregada quando é aberta (o início vem logo, é a primeira que se vê);
// a área de admin só quando alguém com permissões lá entra
const Loja = lazy(() => import('./paginas/Loja'));
const Produto = lazy(() => import('./paginas/Produto'));
const Carrinho = lazy(() => import('./paginas/Carrinho'));
const Checkout = lazy(() => import('./paginas/Checkout'));
const Login = lazy(() => import('./paginas/Login'));
const Registo = lazy(() => import('./paginas/Registo'));
const Conta = lazy(() => import('./paginas/Conta'));
const Banda = lazy(() => import('./paginas/Banda'));
const Concertos = lazy(() => import('./paginas/Concertos'));
const NewsletterCancelar = lazy(() => import('./paginas/NewsletterCancelar'));
const Pagamento = lazy(() => import('./paginas/Pagamento'));
const NaoEncontrado = lazy(() => import('./paginas/NaoEncontrado'));

const AdminLayout = lazy(() => import('./paginas/admin/AdminLayout'));
const Painel = lazy(() => import('./paginas/admin/Painel'));
const AdminProdutos = lazy(() => import('./paginas/admin/Produtos'));
const AdminCategorias = lazy(() => import('./paginas/admin/Categorias'));
const AdminEncomendas = lazy(() => import('./paginas/admin/Encomendas'));
const AdminConcertos = lazy(() => import('./paginas/admin/Concertos'));
const AdminNewsletter = lazy(() => import('./paginas/admin/Newsletter'));
const AdminSuporte = lazy(() => import('./paginas/admin/Suporte'));
const AdminUtilizadores = lazy(() => import('./paginas/admin/Utilizadores'));

// o painel é só para quem vê estatísticas; o suporte vai direto para as encomendas
function InicioAdmin() {
  const { utilizador } = useSessao();
  return pode(utilizador, 'estatisticas.ver') ? <Painel /> : <Navigate to={inicioAdmin(utilizador)} replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="loja" element={<Loja />} />
          <Route path="produto/:id" element={<Produto />} />
          <Route path="carrinho" element={<Carrinho />} />
          <Route path="concertos" element={<Concertos />} />
          <Route path="banda" element={<Banda />} />
          <Route path="login" element={<Login />} />
          <Route path="registo" element={<Registo />} />
          <Route path="newsletter/cancelar" element={<NewsletterCancelar />} />

          <Route element={<RotaProtegida />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="conta" element={<Conta />} />
            <Route path="pagamento/:id" element={<Pagamento />} />
          </Route>

          <Route element={<RotaProtegida areaAdmin />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<InicioAdmin />} />
              <Route element={<RotaProtegida permissao="produtos.gerir" />}>
                <Route path="produtos" element={<AdminProdutos />} />
              </Route>
              <Route element={<RotaProtegida permissao="categorias.gerir" />}>
                <Route path="categorias" element={<AdminCategorias />} />
              </Route>
              <Route element={<RotaProtegida permissao="encomendas.ver" />}>
                <Route path="encomendas" element={<AdminEncomendas />} />
              </Route>
              <Route element={<RotaProtegida permissao="tickets.gerir" />}>
                <Route path="suporte" element={<AdminSuporte />} />
              </Route>
              <Route element={<RotaProtegida permissao="bilhetes.ver" />}>
                <Route path="concertos" element={<AdminConcertos />} />
              </Route>
              <Route element={<RotaProtegida permissao="newsletter.ver" />}>
                <Route path="newsletter" element={<AdminNewsletter />} />
              </Route>
              <Route element={<RotaProtegida permissao="utilizadores.ver" />}>
                <Route path="utilizadores" element={<AdminUtilizadores />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NaoEncontrado />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
