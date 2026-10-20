import { ESTADOS_ENVIO, dataHora } from '../formato';
import type { Envio } from '../tipos';
import { t } from '../i18n';

// transportadora, código e os passos da entrega, do mais recente para o mais antigo
export default function Rastreamento({ envio }: { envio: Envio }) {
  const eventos = [...envio.eventos].reverse();

  return (
    <div className="rastreamento">
      <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
        <span className="badge text-bg-light">{ESTADOS_ENVIO[envio.estado]}</span>
        <span className="small">
          {envio.transportadora} · <span className="preco">{envio.codigo_rastreio}</span>
        </span>
        {envio.url_rastreio?.startsWith('https://') && (
          <a href={envio.url_rastreio} target="_blank" rel="noreferrer noopener" className="small">
            {t('rastreio.seguir')} <i className="bi bi-box-arrow-up-right"></i>
          </a>
        )}
      </div>
      <ol className="linha-tempo">
        {eventos.map((evento, i) => (
          <li key={i} className={i === 0 ? 'atual' : ''}>
            <div className="fw-semibold">{ESTADOS_ENVIO[evento.estado]}</div>
            <div className="small">{evento.descricao}</div>
            <div className="text-secondary small">{dataHora(evento.criado_em)}{evento.local ? ' · ' + evento.local : ''}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
