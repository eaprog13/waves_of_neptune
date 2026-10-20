import { t } from '../i18n';

// números das páginas com reticências quando são muitas (1 … 4 5 6 … 12)
function numeros(atual: number, total: number): (number | null)[] {
  const lista: (number | null)[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - atual) <= 1) {
      lista.push(p);
    } else if (lista[lista.length - 1] !== null) {
      lista.push(null);
    }
  }
  return lista;
}

export default function Paginacao({ pagina, paginas, mudar }: { pagina: number; paginas: number; mudar: (pagina: number) => void }) {
  if (paginas <= 1) {
    return null;
  }

  return (
    <nav className="paginacao mt-4" aria-label={t('paginacao.paginas')}>
      <ul className="pagination justify-content-center flex-wrap mb-0">
        <li className={'page-item' + (pagina === 1 ? ' disabled' : '')}>
          <button className="page-link" onClick={() => mudar(pagina - 1)} aria-label={t('paginacao.anterior')}><i className="bi bi-chevron-left"></i></button>
        </li>
        {numeros(pagina, paginas).map((p, i) =>
          p === null ? (
            <li key={'r' + i} className="page-item disabled"><span className="page-link">…</span></li>
          ) : (
            <li key={p} className={'page-item' + (p === pagina ? ' active' : '')}>
              <button className="page-link" onClick={() => mudar(p)} aria-current={p === pagina ? 'page' : undefined}>{p}</button>
            </li>
          )
        )}
        <li className={'page-item' + (pagina === paginas ? ' disabled' : '')}>
          <button className="page-link" onClick={() => mudar(pagina + 1)} aria-label={t('paginacao.seguinte')}><i className="bi bi-chevron-right"></i></button>
        </li>
      </ul>
    </nav>
  );
}
