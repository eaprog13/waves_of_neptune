import { Fragment, useEffect, useState } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import { ESTADOS, PAGAMENTO, data, euros } from '../../formato';
import type { Encomenda, Envio, EstadoEncomenda } from '../../tipos';
import GestaoEnvio from './GestaoEnvio';
import { t } from '../../i18n';

export default function Encomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[] | null>(null);
  const [filtro, setFiltro] = useState('');
  const [aberta, setAberta] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  // o envio muda sem voltar a carregar a lista (e a encomenda pode passar a enviada/entregue)
  function atualizarEnvio(id: number, envio: Envio | null) {
    setEncomendas((atuais) => atuais?.map((e) => (e.id === id ? { ...e, envio } : e)) ?? null);
    carregar();
  }

  function carregar() {
    get<Encomenda[]>('admin/encomendas.php?estado=' + filtro).then(setEncomendas).catch(() => setEncomendas([]));
  }

  useEffect(() => {
    setEncomendas(null);
    carregar();
  }, [filtro]);

  async function mudarEstado(encomenda: Encomenda, estado: EstadoEncomenda) {
    if (estado === 'cancelada' && !confirm(t('aencomendas.confirmarCancelar', { id: encomenda.id }))) {
      return;
    }
    try {
      await post('admin/encomendas.php', { id: encomenda.id, estado });
      setMensagem({ tipo: 'success', texto: t('aencomendas.mudou', { id: encomenda.id, estado: ESTADOS[estado].texto }) });
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
    carregar();
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 fw-bold mb-0">{t('admin.encomendas')}</h1>
        <select className="form-select w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label={t('aencomendas.filtrar')}>
          <option value="">{t('aencomendas.todos')}</option>
          {(Object.keys(ESTADOS) as EstadoEncomenda[]).map((estado) => (
            <option key={estado} value={estado}>{ESTADOS[estado].texto}</option>
          ))}
        </select>
      </div>

      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}

      {encomendas === null && <Carregando />}
      {encomendas?.length === 0 && <div className="painel p-5 text-center text-secondary">{t('aencomendas.nenhuma')}</div>}

      {encomendas && encomendas.length > 0 && (
        <div className="painel table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr><th>#</th><th>{t('geral.data')}</th><th>{t('geral.cliente')}</th><th className="text-end">{t('geral.total')}</th><th>{t('geral.estado')}</th><th></th></tr>
            </thead>
            <tbody>
              {encomendas.map((encomenda) => (
                <Fragment key={encomenda.id}>
                  <tr>
                    <td className="fw-semibold">{encomenda.id}</td>
                    <td className="text-nowrap">{data(encomenda.data)}</td>
                    <td>{encomenda.cliente}<div className="text-secondary small">{encomenda.email}</div></td>
                    <td className="text-end">
                      {euros(encomenda.total)}
                      <div><span className={'badge text-bg-' + PAGAMENTO[encomenda.pagamento].cor}>{PAGAMENTO[encomenda.pagamento].texto}</span></div>
                    </td>
                    <td>
                      {encomenda.estado === 'cancelada' ? (
                        <span className="badge text-bg-danger">{ESTADOS.cancelada.texto}</span>
                      ) : (
                        <select className={'form-select form-select-sm border-' + ESTADOS[encomenda.estado].cor} value={encomenda.estado} onChange={(e) => mudarEstado(encomenda, e.target.value as EstadoEncomenda)} aria-label={t('aencomendas.estadoDe', { id: encomenda.id })}>
                          {(Object.keys(ESTADOS) as EstadoEncomenda[]).map((estado) => (
                            <option key={estado} value={estado}>{ESTADOS[estado].texto}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setAberta(aberta === encomenda.id ? null : encomenda.id)}>
                        {aberta === encomenda.id ? t('geral.fechar') : t('aencomendas.detalhes')}
                      </button>
                    </td>
                  </tr>
                  {aberta === encomenda.id && (
                    <tr>
                      <td colSpan={6} className="bg-body-tertiary">
                        <div className="row g-3 small p-2">
                          <div className="col-md-7">
                            {encomenda.itens.map((item, i) => (
                              <div key={i} className="d-flex justify-content-between py-1 border-bottom border-secondary-subtle">
                                <span>{item.quantidade} × {item.nome_produto}</span><span>{euros(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="col-md-5">
                            <div className="fw-semibold">{t('conta.envio')}</div>
                            {encomenda.nome_envio} · {encomenda.telefone}<br />
                            {encomenda.morada}<br />
                            {encomenda.codigo_postal} {encomenda.cidade}
                          </div>
                        </div>
                        <div className="small px-2">
                          <GestaoEnvio encomenda={encomenda} atualizado={(envio) => atualizarEnvio(encomenda.id, envio)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
