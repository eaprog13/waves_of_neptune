import { useState, type FormEvent } from 'react';
import { mensagemErro, post } from '../api';
import { t } from '../i18n';
import { esquemaNewsletter, primeiroErro, validar } from '../validacao';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  async function subscrever(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaNewsletter, { email, consentimento });
    if (!dados) {
      return setMensagem({ tipo: 'danger', texto: primeiroErro(erros) });
    }

    setAEnviar(true);
    try {
      const resposta = await post<{ mensagem: string }>('newsletter.php', { acao: 'subscrever', ...dados });
      setMensagem({ tipo: 'success', texto: resposta.mensagem });
      setEmail('');
      setConsentimento(false);
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
    setAEnviar(false);
  }

  return (
    <section className="container container-cards-bg py-5 mt-5 rounded-3 text-center">
      <h2>{t('newsletter.titulo')}</h2>
      <p className="text-secondary">{t('newsletter.texto')}</p>

      <form className="mx-auto mt-4 text-start" style={{ maxWidth: 520 }} onSubmit={subscrever} noValidate>
        {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}
        <div className="input-group">
          <input type="email" className="form-control" placeholder={t('newsletter.placeholder')} aria-label={t('geral.email')} maxLength={150} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <button type="submit" className="btn btn-outline-light" disabled={aEnviar}>{aEnviar ? t('geral.aEnviar') : t('newsletter.subscrever')}</button>
        </div>
        <div className="form-check mt-3">
          <input id="consentimento" type="checkbox" className="form-check-input" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} />
          <label htmlFor="consentimento" className="form-check-label small text-secondary">
            {t('newsletter.consentimento')}
          </label>
        </div>
      </form>
    </section>
  );
}
