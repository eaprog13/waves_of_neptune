import { useEffect, useState, type FormEvent } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import { CATEGORIAS_TICKET, ESTADOS_TICKET, PRIORIDADES_TICKET, dataHora } from '../../formato';
import type { DetalheTicket, EstadoTicket, PrioridadeTicket, Ticket } from '../../tipos';
import { esquemaResposta, primeiroErro, validar } from '../../validacao';
import { t } from '../../i18n';

export default function Suporte() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [filtros, setFiltros] = useState({ estado: '', prioridade: '', atribuido: '' });
  const [aberto, setAberto] = useState<number | null>(null);

  function carregar() {
    const parametros = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== ''));
    get<Ticket[]>('admin/suporte.php?' + parametros.toString()).then(setTickets).catch(() => setTickets([]));
  }

  useEffect(carregar, [filtros]);

  if (aberto) {
    return <DetalheAdmin id={aberto} voltar={() => { setAberto(null); carregar(); }} />;
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 fw-bold mb-0">{t('admin.suporte')}</h1>
        <div className="d-flex flex-wrap gap-2">
          <select className="form-select form-select-sm w-auto" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} aria-label={t('geral.estado')}>
            <option value="">{t('aencomendas.todos')}</option>
            {(Object.keys(ESTADOS_TICKET) as EstadoTicket[]).map((e) => <option key={e} value={e}>{ESTADOS_TICKET[e].texto}</option>)}
          </select>
          <select className="form-select form-select-sm w-auto" value={filtros.prioridade} onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })} aria-label={t('asuporte.prioridade')}>
            <option value="">{t('asuporte.todasPrioridades')}</option>
            {(Object.keys(PRIORIDADES_TICKET) as PrioridadeTicket[]).map((p) => <option key={p} value={p}>{PRIORIDADES_TICKET[p].texto}</option>)}
          </select>
          <select className="form-select form-select-sm w-auto" value={filtros.atribuido} onChange={(e) => setFiltros({ ...filtros, atribuido: e.target.value })} aria-label={t('asuporte.atribuicao')}>
            <option value="">{t('asuporte.todos')}</option>
            <option value="eu">{t('asuporte.meus')}</option>
          </select>
        </div>
      </div>

      {tickets === null && <Carregando />}
      {tickets?.length === 0 && <div className="painel p-5 text-center text-secondary">{t('asuporte.vazio')}</div>}
      {tickets && tickets.length > 0 && (
        <div className="painel table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>#</th><th>{t('asuporte.assunto')}</th><th>{t('geral.cliente')}</th><th>{t('asuporte.prioridade')}</th><th>{t('geral.estado')}</th><th>{t('asuporte.responsavel')}</th><th>{t('asuporte.atualizado')}</th></tr></thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} style={{ cursor: 'pointer' }} onClick={() => setAberto(ticket.id)}>
                  <td className="fw-semibold">{ticket.id}</td>
                  <td>{ticket.assunto}<div className="text-secondary small">{CATEGORIAS_TICKET[ticket.categoria]}{ticket.order_id ? ' · ' + t('suporte.encomendaN', { id: ticket.order_id }) : ''}{ticket.reaberturas ? ' · ' + t('asuporte.reabertoX', { n: ticket.reaberturas }) : ''}</div></td>
                  <td>{ticket.cliente}<div className="text-secondary small">{ticket.email}</div></td>
                  <td><span className={'badge text-bg-' + PRIORIDADES_TICKET[ticket.prioridade].cor}>{PRIORIDADES_TICKET[ticket.prioridade].texto}</span></td>
                  <td><span className={'badge text-bg-' + ESTADOS_TICKET[ticket.estado].cor}>{ESTADOS_TICKET[ticket.estado].texto}</span></td>
                  <td>{ticket.atribuido_nome ?? <span className="text-secondary">-</span>}</td>
                  <td className="text-nowrap small">{dataHora(ticket.atualizado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function DetalheAdmin({ id, voltar }: { id: number; voltar: () => void }) {
  const [detalhe, setDetalhe] = useState<DetalheTicket | null>(null);
  const [resposta, setResposta] = useState('');
  const [interna, setInterna] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    get<DetalheTicket>('admin/suporte.php?id=' + id).then(setDetalhe).catch((e) => setErro(mensagemErro(e)));
  }, [id]);

  async function acao(dados: object) {
    try {
      setDetalhe(await post<DetalheTicket>('admin/suporte.php', { id, ...dados }));
      setErro('');
      return true;
    } catch (e) {
      setErro(mensagemErro(e));
      return false;
    }
  }

  async function responder(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaResposta, { mensagem: resposta });
    if (!dados) return setErro(primeiroErro(erros));
    if (await acao({ acao: 'responder', mensagem: dados.mensagem, interna })) {
      setResposta('');
      setInterna(false);
    }
  }

  if (!detalhe) {
    return erro ? <div className="alert alert-danger">{erro}</div> : <Carregando />;
  }
  const { ticket, mensagens, equipa = [] } = detalhe;

  return (
    <>
      <button className="btn btn-link px-0 mb-2" onClick={voltar}><i className="bi bi-arrow-left me-1"></i>{t('asuporte.todosTickets')}</button>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="painel p-4">
            <h1 className="h5 fw-bold mb-1">#{ticket.id} · {ticket.assunto}</h1>
            <p className="text-secondary small">{ticket.cliente} ({ticket.email}) · {CATEGORIAS_TICKET[ticket.categoria]}{ticket.order_id ? ' · ' + t('suporte.encomendaN', { id: ticket.order_id }) : ''} · {t('asuporte.abertoEm', { data: dataHora(ticket.criado_em) })}</p>

            <div className="conversa">
              {mensagens.map((m) => (
                <div key={m.id} className={'mensagem ' + (m.interna ? 'nota-interna' : m.equipa ? 'da-equipa' : 'do-cliente')}>
                  <div className="small text-secondary mb-1">
                    {m.interna && <span className="badge text-bg-warning me-2">{t('asuporte.notaInterna')}</span>}
                    {m.autor} · {dataHora(m.criado_em)}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{m.mensagem}</div>
                </div>
              ))}
            </div>

            {erro && <div className="alert alert-danger mt-3">{erro}</div>}

            <form className="mt-3" onSubmit={responder} noValidate>
              <label htmlFor="resposta" className="form-label">{interna ? t('asuporte.notaLabel') : t('asuporte.respostaLabel')}</label>
              <textarea id="resposta" className={'form-control' + (interna ? ' border-warning' : '')} rows={4} maxLength={3000} value={resposta} onChange={(e) => setResposta(e.target.value)}></textarea>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
                <div className="form-check">
                  <input id="interna" type="checkbox" className="form-check-input" checked={interna} onChange={(e) => setInterna(e.target.checked)} />
                  <label htmlFor="interna" className="form-check-label small">{t('asuporte.notaCheck')}</label>
                </div>
                <button type="submit" className="btn btn-outline-light">{interna ? t('asuporte.guardarNota') : t('asuporte.enviarCliente')}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="painel p-4 d-grid gap-3">
            <div>
              <label htmlFor="estado" className="form-label">{t('geral.estado')}</label>
              <select id="estado" className="form-select" value={ticket.estado} onChange={(e) => acao({ acao: 'estado', estado: e.target.value })}>
                {(Object.keys(ESTADOS_TICKET) as EstadoTicket[]).map((e) => <option key={e} value={e}>{ESTADOS_TICKET[e].texto}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="prioridade" className="form-label">{t('asuporte.prioridade')}</label>
              <select id="prioridade" className="form-select" value={ticket.prioridade} onChange={(e) => acao({ acao: 'prioridade', prioridade: e.target.value })}>
                {(Object.keys(PRIORIDADES_TICKET) as PrioridadeTicket[]).map((p) => <option key={p} value={p}>{PRIORIDADES_TICKET[p].texto}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="responsavel" className="form-label">{t('asuporte.responsavel')}</label>
              <select id="responsavel" className="form-select" value={ticket.atribuido_a ?? 0} onChange={(e) => acao({ acao: 'atribuir', utilizador_id: Number(e.target.value) })}>
                <option value={0}>{t('asuporte.ninguem')}</option>
                {equipa.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div className="small text-secondary">
              {ticket.reaberturas === 1 ? t('asuporte.reabertoUma') : t('asuporte.reabertoN', { n: ticket.reaberturas })}
              {ticket.resolvido_em && <><br />{t('asuporte.resolvidoEm', { data: dataHora(ticket.resolvido_em) })}</>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
