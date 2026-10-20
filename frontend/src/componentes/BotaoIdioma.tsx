import { useIdioma } from '../contextos/IdiomaContext';
import { t } from '../i18n';

// globo + sigla da língua atual; ao clicar troca para a outra (PT <-> EN)
export default function BotaoIdioma({ className = 'nav-link' }: { className?: string }) {
  const { idioma, mudar } = useIdioma();

  return (
    <button
      type="button"
      className={className + ' botao-idioma'}
      onClick={() => mudar(idioma === 'pt' ? 'en' : 'pt')}
      title={t('idioma.mudar')}
      aria-label={t('idioma.mudar')}
    >
      <i className="bi bi-globe2" aria-hidden="true"></i>
      <span>{idioma.toUpperCase()}</span>
    </button>
  );
}
