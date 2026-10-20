import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessao } from '../contextos/SessaoContext';
import { pode, temAreaAdmin } from '../permissoes';
import type { Permissao } from '../tipos';
import Carregando from './Carregando';

// sem sessão vai para o login (e volta depois); sem a permissão não entra
// (é só para a navegação: a API verifica sempre outra vez)
export default function RotaProtegida({ permissao, areaAdmin = false }: { permissao?: Permissao; areaAdmin?: boolean }) {
  const { utilizador, carregado } = useSessao();
  const location = useLocation();

  if (!carregado) {
    return <Carregando />;
  }
  if (!utilizador) {
    return <Navigate to="/login" replace state={{ voltar: location.pathname }} />;
  }
  if ((areaAdmin && !temAreaAdmin(utilizador)) || (permissao && !pode(utilizador, permissao))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
