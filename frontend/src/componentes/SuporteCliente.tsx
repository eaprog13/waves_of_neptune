import { useEffect, useState, type FormEvent } from 'react';
import { get, mensagemErro, post } from '../api';
import { CATEGORIAS_TICKET, ESTADOS_TICKET, dataHora } from '../formato';
import type { CategoriaTicket, DetalheTicket, Encomenda, Ticket } from '../tipos';
import { esquemaResposta, esquemaTicket, primeiroErro, validar } from '../validacao';
import Carregando from './Carregando';
import { t } from '../i18n';

// pedidos de ajuda do cliente: lista, pedido novo e conversa com a equipa
export default function SuporteCliente() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [aberto, setAberto] = useState<number | 'novo' | null>(null);

  function carregar() {
    get<Ticket[]>('suporte.php').then(setTickets).catch(() => setTickets([]));
  }

  useEffect(carregar, []);

  if (aberto === 'novo') {
    return <NovoTicket voltar={(id) => { carregar(); setAberto(id); }} cancelar={() => setAberto(null)} />;
  }
  if (aberto) {
    return <ConversaTicket id={aberto} voltar={() => { carregar(); setAberto(null); }} />;
  }
  if (!tickets) {
    return <Carregando />;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-secondary mb-0">{t('suporte.intro')}</p>
        <button className="btn btn-outline-light" onClick={() => setAberto('novo')}><i className="bi bi-plus-lg me-1"></i>{t('suporte.novo')}</button>
      </div>
      {tickets.length === 0 ? (
        <div className="painel p-5 text-center text-secondary">{t('suporte.vazio')}</div>
      ) : (
        <div className="painel">
          {tickets.map((ticket) => (
            <button key={ticket.id} className="linha-ticket" onClick={() => setAberto(ticket.id)}>
              <span className="fw-semibold">#{ticket.id} · {ticket.assunto}</span>
              <span className="text-secondary small">{CATEGORIAS_TICKET[ticket.categoria]}{ticket.order_id ? ' · ' + t('suporte.encomendaN', { id: ticket.order_id }) : ''} · {dataHora(ticket.atualizado_em)}</span>
              <span className={'badge text-bg-' + ESTADOS_TICKET[ticket.estado].cor}>{ESTADOS_TICKET[ticket.estado].texto}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function NovoTicket({ voltar, cancelar }: { voltar: (id: number) => void; cancelar: () => void }) {
  const [campos, setCampos] = useState({ assunto: '', categoria: '' as CategoriaTicket | '', mensagem: '', encomenda_id: '' });
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    get<Encomenda[]>('encomendas.php').then(setEncomendas).catch(() => {});
  }, []);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaTicket, campos);
    if (!dados) {
      return setErro(primeiroErro(erros));
    }
    setAEnviar(true);
    try {
      const resposta = await post<{ id: number }>('suporte.php', { acao: 'criar', ...dados, encomenda_id: dados.encomenda_id ? Number(dados.encomenda_id) : null });
      voltar(resposta.id);
    } catch (e) {
      setErro(mensagemErro(e));
      setAEnviar(false);
    }
  }

  return (
    <form className="painel p-4" onSubmit={enviar} noValidate>
      <h2 className="h5 fw-bold mb-3">{t('suporte.novoTitulo')}</h2>
      {erro && <div className="alert alert-danger">{erro}</div>}
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="categoria" className="form-label">{t('suporte.tipo')}</label>
          <select id="categoria" className="form-select" value={campos.categoria} onChange={(e) => setCampos({ ...campos, categoria: e.target.value as CategoriaTicket })}>
            <option value="">{t('aprodutos.escolher')}</option>
            {(Object.keys(CATEGORIAS_TICKET) as CategoriaTicket[]).map((c) => <option key={c} value={c}>{CATEGORIAS_TICKET[c]}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label htmlFor="encomenda" className="form-label">{t('suporte.encomendaOpcional')}</label>
          <select id="encomenda" className="form-select" value={campos.encomenda_id} onChange={(e) => setCampos({ ...campos, encomenda_id: e.target.value })}>
            <option value="">{t('suporte.nenhuma')}</option>
            {encomendas.map((e) => <option key={e.id} value={e.id}>#{e.id}</option>)}
          </select>
        </div>
        <div className="col-12">
          <label htmlFor="assunto" className="form-label">{t('suporte.assunto')}</label>
          <input id="assunto" className="form-control" maxLength={150} value={campos.assunto} onChange={(e) => setCampos({ ...campos, assunto: e.target.value })} />
        </div>
        <div className="col-12">
          <label htmlFor="mensagem" className="form-label">{t('suporte.descreve')}</label>
          <textarea id="mensagem" className="form-control" rows={5} maxLength={3000} value={campos.mensagem} onChange={(e) => setCampos({ ...campos, mensagem: e.target.value })}></textarea>
        </div>
      </div>
      <div className="d-flex gap-2 mt-4">
        <button type="submit" className="btn btn-outline-light" disabled={aEnviar}>{aEnviar ? t('geral.aEnviar') : t('suporte.enviarPedido')}</button>
        <button type="button" className="btn btn-outline-secondary" onClick={cancelar}>{t('geral.cancelar')}</button>
      </div>
    </form>
  );
}

function ConversaTicket({ id, voltar }: { id: number; voltar: () => void }) {
  const [detalhe, setDetalhe] = useState<DetalheTicket | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    get<DetalheTicket>('suporte.php?id=' + id).then(setDetalhe).catch((e) => setErro(mensagemErro(e)));
  }, [id]);

  async function responder(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaResposta, { mensagem });
    if (!dados) {
      return setErro(primeiroErro(erros));
    }
    try {
      setDetalhe(await post<DetalheTicket>('suporte.php', { acao: 'responder', id, mensagem: dados.mensagem }));
      setMensagem('');
      setErro('');
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  async function fechar() {
    if (!confirm(t('suporte.confirmarFechar'))) return;
    try {
      setDetalhe(await post<DetalheTicket>('suporte.php', { acao: 'fechar', id }));
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  if (!detalhe) {
    return erro ? <div className="alert alert-danger">{erro}</div> : <Carregando />;
  }
  const { ticket, mensagens } = detalhe;

  return (
    <div className="painel p-4">
      <button className="btn btn-link px-0 mb-2" onClick={voltar}><i className="bi bi-arrow-left me-1"></i>{t('suporte.meus')}</button>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 className="h5 fw-bold mb-1">#{ticket.id} · {ticket.assunto}</h2>
          <div className="text-secondary small">{CATEGORIAS_TICKET[ticket.categoria]}{ticket.order_id ? ' · ' + t('suporte.encomendaN', { id: ticket.order_id }) : ''}</div>
        </div>
        <span className={'badge text-bg-' + ESTADOS_TICKET[ticket.estado].cor}>{ESTADOS_TICKET[ticket.estado].texto}</span>
      </div>

      <div className="conversa">
        {mensagens.map((m) => (
          <div key={m.id} className={'mensagem ' + (m.equipa ? 'da-equipa' : 'do-cliente')}>
            <div className="small text-secondary mb-1">{m.equipa ? t('suporte.equipa') : t('suporte.tu')} · {dataHora(m.criado_em)}</div>
            <div style={{ whiteSpace: 'pre-line' }}>{m.mensagem}</div>
          </div>
        ))}
      </div>

      {erro && <div className="alert alert-danger mt-3">{erro}</div>}

      {ticket.estado !== 'fechado' ? (
        <form className="mt-3" onSubmit={responder} noValidate>
          <label htmlFor="resposta" className="form-label">{t('suporte.responder')}</label>
          <textarea id="resposta" className="form-control" rows={3} maxLength={3000} value={mensagem} onChange={(e) => setMensagem(e.target.value)}></textarea>
          {ticket.estado === 'resolvido' && <div className="form-text">{t('suporte.reabre')}</div>}
          <div className="d-flex gap-2 mt-2">
            <button type="submit" className="btn btn-outline-light">{t('suporte.enviar')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={fechar}>{t('suporte.fechar')}</button>
          </div>
        </form>
      ) : (
        <p className="text-secondary mt-3 mb-0">{t('suporte.fechado')}</p>
      )}
    </div>
  );
}
