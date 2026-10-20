import { Link } from 'react-router-dom';
import { t } from '../i18n';

export default function NaoEncontrado() {
  return (
    <div className="container py-5 text-center">
      <p className="display-1 fw-bold">404</p>
      <h1 className="h3">{t('erro404.titulo')}</h1>
      <p className="text-secondary">{t('erro404.texto')}</p>
      <Link to="/" className="btn btn-outline-light mt-2">{t('geral.voltarInicio')}</Link>
    </div>
  );
}
