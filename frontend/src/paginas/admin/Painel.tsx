import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../../api';
import Carregando from '../../componentes/Carregando';
import { ESTADOS, euros } from '../../formato';
import type { EstadoEncomenda, Estatisticas } from '../../tipos';
import { t } from '../../i18n';

export default function Painel() {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);

  useEffect(() => {
    get<Estatisticas>('admin/estatisticas.php').then(setEstatisticas).catch(() => {});
  }, []);

  if (!estatisticas) {
    return <Carregando />;
  }

  const numeros = [
    { texto: t('painel.vendas'), valor: euros(estatisticas.total_vendas), icone: 'bi-cash-stack' },
    { texto: t('admin.encomendas'), valor: estatisticas.total_encomendas, icone: 'bi-receipt' },
    { texto: t('painel.porTratar'), valor: estatisticas.pendentes, icone: 'bi-hourglass-split' },
    { texto: t('painel.clientes'), valor: estatisticas.total_clientes, icone: 'bi-people' },
    { texto: t('admin.produtos'), valor: estatisticas.total_produtos, icone: 'bi-box-seam' },
  ];

  return (
    <>
      <h1 className="h3 fw-bold mb-4">{t('admin.painel')}</h1>

      <div className="row g-3 mb-4">
        {numeros.map((n) => (
          <div key={n.texto} className="col-6 col-md-4 col-xl">
            <div className="painel p-3 h-100">
              <i className={'bi fs-4 ' + n.icone}></i>
              <div className="numero-painel">{n.valor}</div>
              <div className="text-secondary small">{n.texto}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="painel p-4 h-100">
            <h2 className="h6 fw-bold mb-3">{t('painel.porEstado')}</h2>
            {(Object.keys(ESTADOS) as EstadoEncomenda[]).map((estado) => {
              const total = estatisticas.por_estado[estado] ?? 0;
              const percentagem = estatisticas.total_encomendas ? (total / estatisticas.total_encomendas) * 100 : 0;
              return (
                <div key={estado} className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{ESTADOS[estado].texto}</span><span>{total}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className={'progress-bar bg-' + ESTADOS[estado].cor} style={{ width: percentagem + '%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="painel p-4 h-100">
            <h2 className="h6 fw-bold mb-3">{t('painel.maisVendidos')}</h2>
            {estatisticas.mais_vendidos.length === 0 ? (
              <p className="text-secondary small mb-0">{t('painel.semVendas')}</p>
            ) : (
              <table className="table table-sm align-middle mb-0">
                <thead><tr><th>{t('painel.produto')}</th><th className="text-end">{t('painel.qtd')}</th><th className="text-end">{t('geral.total')}</th></tr></thead>
                <tbody>
                  {estatisticas.mais_vendidos.map((p) => (
                    <tr key={p.nome_produto}>
                      <td>{p.nome_produto}</td>
                      <td className="text-end">{p.quantidade}</td>
                      <td className="text-end">{euros(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="col-lg-3">
          <div className="painel p-4 h-100">
            <h2 className="h6 fw-bold mb-3">{t('painel.stockBaixo')}</h2>
            {estatisticas.stock_baixo.length === 0 ? (
              <p className="text-secondary small mb-0">{t('painel.semFaltas')}</p>
            ) : (
              <ul className="list-unstyled small mb-3">
                {estatisticas.stock_baixo.map((p) => (
                  <li key={p.id} className="d-flex justify-content-between py-1">
                    <span>{p.nome}</span>
                    <span className={p.stock === 0 ? 'text-danger' : 'text-warning'}>{p.stock}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/produtos" className="btn btn-sm btn-outline-light">{t('painel.gerirProdutos')}</Link>
          </div>
        </div>
      </div>
    </>
  );
}
