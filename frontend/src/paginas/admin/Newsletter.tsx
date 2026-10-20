import { useEffect, useState, type FormEvent } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import { useSessao } from '../../contextos/SessaoContext';
import { data } from '../../formato';
import { pode } from '../../permissoes';
import type { Subscritor } from '../../tipos';
import { esquemaEnvioNewsletter, primeiroErro, validar } from '../../validacao';
import { t } from '../../i18n';

// envio pelo Resend (ou para o registo, em desenvolvimento), com o link de cancelamento em cada email
function EnviarNewsletter({ ativos }: { ativos: number }) {
  const [campos, setCampos] = useState({ assunto: '', mensagem: '' });
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaEnvioNewsletter, campos);
    if (!dados) return setMensagem({ tipo: 'danger', texto: primeiroErro(erros) });
    if (!confirm(t('anewsletter.confirmarEnvio', { assunto: dados.assunto, n: ativos }))) return;

    setAEnviar(true);
    try {
      const r = await post<{ enviados: number; falhados: number }>('admin/newsletter.php', dados);
      setMensagem({ tipo: r.falhados ? 'danger' : 'success', texto: r.falhados ? t('anewsletter.enviadaFalhas', { n: r.enviados, falhados: r.falhados }) : t('anewsletter.enviada', { n: r.enviados }) });
      setCampos({ assunto: '', mensagem: '' });
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
    setAEnviar(false);
  }

  return (
    <form className="painel p-4 mb-4" onSubmit={enviar} noValidate>
      <h2 className="h5 fw-bold mb-3">{t('anewsletter.enviarTitulo')}</h2>
      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}
      <label htmlFor="assunto" className="form-label">{t('anewsletter.assunto')}</label>
      <input id="assunto" className="form-control mb-3" maxLength={150} value={campos.assunto} onChange={(e) => setCampos({ ...campos, assunto: e.target.value })} />
      <label htmlFor="mensagem" className="form-label">{t('anewsletter.mensagem')}</label>
      <textarea id="mensagem" className="form-control" rows={6} maxLength={10000} value={campos.mensagem} onChange={(e) => setCampos({ ...campos, mensagem: e.target.value })}></textarea>
      <button type="submit" className="btn btn-outline-light mt-3" disabled={aEnviar || ativos === 0}>{aEnviar ? t('geral.aEnviar') : t('anewsletter.enviarA', { n: ativos })}</button>
    </form>
  );
}

export default function Newsletter() {
  const { utilizador } = useSessao();
  const [subscritores, setSubscritores] = useState<Subscritor[] | null>(null);

  useEffect(() => {
    get<Subscritor[]>('admin/newsletter.php').then(setSubscritores).catch(() => setSubscritores([]));
  }, []);

  if (!subscritores) {
    return <Carregando />;
  }

  const ativos = subscritores.filter((s) => s.ativo).length;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 fw-bold mb-0">{t('admin.newsletter')} <span className="text-secondary fs-6">{t('anewsletter.ativos', { n: ativos })}</span></h1>
        <a className="btn btn-outline-light" href="api/admin/newsletter.php?exportar=csv">
          <i className="bi bi-download me-1"></i>{t('anewsletter.exportar')}
        </a>
      </div>
      {pode(utilizador, 'newsletter.enviar') && <EnviarNewsletter ativos={ativos} />}

      {subscritores.length === 0 ? (
        <div className="painel p-5 text-center text-secondary">{t('anewsletter.vazia')}</div>
      ) : (
        <div className="painel table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th>{t('geral.email')}</th><th>{t('geral.estado')}</th><th>{t('anewsletter.consentimento')}</th><th>{t('anewsletter.canceladoEm')}</th></tr></thead>
            <tbody>
              {subscritores.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.ativo ? <span className="badge text-bg-success">{t('anewsletter.ativo')}</span> : <span className="badge text-bg-secondary">{t('anewsletter.cancelado')}</span>}</td>
                  <td className="text-nowrap">{data(s.consentimento_em)}</td>
                  <td className="text-nowrap">{s.cancelado_em ? data(s.cancelado_em) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
