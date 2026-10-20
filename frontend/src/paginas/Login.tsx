import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ErroApi, mensagemErro } from '../api';
import { useSessao } from '../contextos/SessaoContext';
import { inicioAdmin, temAreaAdmin } from '../permissoes';
import { esquemaCodigo, esquemaLogin, primeiroErro, validar } from '../validacao';
import { t } from '../i18n';

export default function Login() {
  const { utilizador, entrar, verificarCodigo, reenviarCodigo } = useSessao();
  const location = useLocation();
  const voltar: string | undefined = location.state?.voltar;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  // depois da password certa, numa conta com 2FA, fica à espera do código (com o email mascarado)
  const [destinoCodigo, setDestinoCodigo] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  // depois do login (ou se já tiver sessão) vai para onde estava, ou para o início / área de admin
  if (utilizador) {
    return <Navigate to={voltar ?? (temAreaAdmin(utilizador) ? inicioAdmin(utilizador) : '/')} replace />;
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaLogin, { email, password });
    if (!dados) {
      return setErro(primeiroErro(erros));
    }

    setErro('');
    setAEnviar(true);
    try {
      const resultado = await entrar(dados.email, dados.password);
      if ('precisaCodigo' in resultado) {
        setDestinoCodigo(resultado.destino);
        setPassword('');
      }
    } catch (e) {
      setErro(mensagemErro(e));
    }
    setAEnviar(false);
  }

  async function confirmarCodigo(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaCodigo, { codigo });
    if (!dados) {
      return setErro(primeiroErro(erros));
    }

    setErro('');
    setAEnviar(true);
    try {
      await verificarCodigo(dados.codigo);
    } catch (e) {
      setErro(mensagemErro(e));
      setCodigo('');
      // código expirado ou demasiadas tentativas: a API marca "reiniciar" e o login volta ao início
      if (e instanceof ErroApi && e.detalhes.reiniciar) {
        setDestinoCodigo(null);
      }
      setAEnviar(false);
    }
  }

  async function pedirNovoCodigo() {
    setErro('');
    setAviso('');
    try {
      await reenviarCodigo();
      setAviso(t('login.codigoNovo'));
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <div className="card shadow border-0 rounded-4 p-4 p-md-5 card-escrita fundo-escuro">
        {destinoCodigo === null ? (
          <>
            <h1 className="h3 fw-bold mb-1">{t('login.titulo')}</h1>
            <p className="text-secondary mb-4">{t('login.texto')}</p>

            {voltar === '/checkout' && <div className="alert alert-secondary small">{t('login.paraFinalizar')}</div>}
            {erro && <div className="alert alert-danger">{erro}</div>}

            <form onSubmit={submeter} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">{t('geral.email')}</label>
                <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} autoComplete="email" />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label">{t('geral.password')}</label>
                <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} autoComplete="current-password" />
              </div>
              <button type="submit" className="btn btn-outline-light w-100" disabled={aEnviar}>
                {aEnviar ? t('login.aEntrar') : t('login.titulo')}
              </button>
            </form>

            <p className="text-center text-secondary mt-4 mb-0">
              {t('login.semConta')} <Link to="/registo" state={{ voltar }}>{t('registo.titulo')}</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="h3 fw-bold mb-1">{t('login.codigoTitulo')}</h1>
            <p className="text-secondary mb-4">
              {t('login.codigoAntes')} <strong className="text-light">{destinoCodigo}</strong>{t('login.codigoDepois')}
            </p>

            {erro && <div className="alert alert-danger">{erro}</div>}
            {aviso && <div className="alert alert-success">{aviso}</div>}

            <form onSubmit={confirmarCodigo} noValidate>
              <div className="mb-4">
                <label htmlFor="codigo" className="form-label">{t('login.codigo')}</label>
                <input id="codigo" className="form-control form-control-lg text-center preco" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} autoFocus />
              </div>
              <button type="submit" className="btn btn-outline-light w-100" disabled={aEnviar}>
                {aEnviar ? t('login.aConfirmar') : t('login.confirmar')}
              </button>
            </form>

            <div className="d-flex justify-content-between mt-4 small">
              <button className="btn btn-link p-0" onClick={pedirNovoCodigo}>{t('login.outroCodigo')}</button>
              <button className="btn btn-link p-0" onClick={() => { setDestinoCodigo(null); setErro(''); setAviso(''); }}>{t('login.voltar')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
