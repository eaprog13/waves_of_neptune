import { useState, type FormEvent } from 'react';
import { mensagemErro, post } from '../../api';
import Rastreamento from '../../componentes/Rastreamento';
import { ESTADOS_ENVIO } from '../../formato';
import type { Encomenda, Envio, EstadoEnvio } from '../../tipos';
import { esquemaEnvioEncomenda, esquemaEventoEnvio, primeiroErro, validar } from '../../validacao';
import { t } from '../../i18n';

// o valor enviado é sempre 'Outra' (é o que o servidor aceita); só o texto mostrado muda com a língua
const TRANSPORTADORAS = ['CTT', 'DPD', 'GLS', 'UPS', 'SEUR', 'Outra'];

// logística de uma encomenda: transportadora e código, e os passos da entrega
export default function GestaoEnvio({ encomenda, atualizado }: { encomenda: Encomenda; atualizado: (envio: Envio | null) => void }) {
  const envio = encomenda.envio ?? null;
  const [dados, setDados] = useState({ transportadora: envio?.transportadora ?? 'CTT', codigo: envio?.codigo_rastreio ?? '', url: envio?.url_rastreio ?? '' });
  const [evento, setEvento] = useState({ estado: 'em_transito' as EstadoEnvio, descricao: '', local: '' });
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  async function enviar(pedido: object, sucesso: string) {
    try {
      const resposta = await post<{ envio: Envio | null }>('admin/envios.php', { encomenda_id: encomenda.id, ...pedido });
      atualizado(resposta.envio);
      setMensagem({ tipo: 'success', texto: sucesso });
      return true;
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
      return false;
    }
  }

  async function guardarEnvio(e: FormEvent) {
    e.preventDefault();
    const { dados: limpos, erros } = validar(esquemaEnvioEncomenda, dados);
    if (!limpos) return setMensagem({ tipo: 'danger', texto: primeiroErro(erros) });
    await enviar({ acao: 'guardar', ...limpos }, envio ? t('aenvio.atualizados') : t('aenvio.criado'));
  }

  async function adicionarEvento(e: FormEvent) {
    e.preventDefault();
    const { dados: limpos, erros } = validar(esquemaEventoEnvio, evento);
    if (!limpos) return setMensagem({ tipo: 'danger', texto: primeiroErro(erros) });
    if (await enviar({ acao: 'evento', ...limpos }, t('aenvio.passo'))) {
      setEvento({ ...evento, descricao: '', local: '' });
    }
  }

  if (encomenda.estado === 'cancelada') {
    return <p className="text-secondary mb-0">{t('aenvio.cancelada')}</p>;
  }

  return (
    <div className="mt-3 pt-3 border-top border-secondary-subtle">
      <div className="fw-semibold mb-2">{t('aenvio.logistica')}</div>
      {mensagem && <div className={'alert alert-' + mensagem.tipo + ' py-2'}>{mensagem.texto}</div>}

      <form className="row g-2 align-items-end mb-3" onSubmit={guardarEnvio} noValidate>
        <div className="col-md-2">
          <label className="form-label small" htmlFor={'transp' + encomenda.id}>{t('aenvio.transportadora')}</label>
          <select id={'transp' + encomenda.id} className="form-select form-select-sm" value={dados.transportadora} onChange={(e) => setDados({ ...dados, transportadora: e.target.value })}>
            {TRANSPORTADORAS.map((nome) => <option key={nome} value={nome}>{nome === 'Outra' ? t('aenvio.outra') : nome}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small" htmlFor={'codigo' + encomenda.id}>{t('aenvio.codigo')}</label>
          <input id={'codigo' + encomenda.id} className="form-control form-control-sm" maxLength={60} value={dados.codigo} onChange={(e) => setDados({ ...dados, codigo: e.target.value })} />
        </div>
        <div className="col-md-5">
          <label className="form-label small" htmlFor={'url' + encomenda.id}>{t('aenvio.link')}</label>
          <input id={'url' + encomenda.id} className="form-control form-control-sm" maxLength={255} placeholder="https://" value={dados.url} onChange={(e) => setDados({ ...dados, url: e.target.value })} />
        </div>
        <div className="col-md-2">
          <button type="submit" className="btn btn-sm btn-outline-light w-100">{envio ? t('aenvio.atualizar') : t('aenvio.criar')}</button>
        </div>
      </form>

      {envio && (
        <>
          <form className="row g-2 align-items-end mb-3" onSubmit={adicionarEvento} noValidate>
            <div className="col-md-3">
              <label className="form-label small" htmlFor={'estado' + encomenda.id}>{t('aenvio.novoPasso')}</label>
              <select id={'estado' + encomenda.id} className="form-select form-select-sm" value={evento.estado} onChange={(e) => setEvento({ ...evento, estado: e.target.value as EstadoEnvio })}>
                {(Object.keys(ESTADOS_ENVIO) as EstadoEnvio[]).map((s) => <option key={s} value={s}>{ESTADOS_ENVIO[s]}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small" htmlFor={'desc' + encomenda.id}>{t('geral.descricao')}</label>
              <input id={'desc' + encomenda.id} className="form-control form-control-sm" maxLength={255} value={evento.descricao} onChange={(e) => setEvento({ ...evento, descricao: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label small" htmlFor={'local' + encomenda.id}>{t('aenvio.local')}</label>
              <input id={'local' + encomenda.id} className="form-control form-control-sm" maxLength={100} value={evento.local} onChange={(e) => setEvento({ ...evento, local: e.target.value })} />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-sm btn-outline-light w-100">{t('aenvio.registar')}</button>
            </div>
          </form>
          <Rastreamento envio={envio} />
        </>
      )}
    </div>
  );
}
