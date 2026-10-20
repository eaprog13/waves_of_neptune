import { t } from '../i18n';

export default function Carregando() {
  return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-light" role="status">
        <span className="visually-hidden">{t('geral.carregar')}</span>
      </div>
    </div>
  );
}
