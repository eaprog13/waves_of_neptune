import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { mensagemErro } from '../api';
import { useSessao } from '../contextos/SessaoContext';
import { esquemaRegisto, primeiroErro, validar } from '../validacao';
import { t } from '../i18n';

export default function Registo() {
  const { utilizador, registar } = useSessao();
  const location = useLocation();
  const voltar: string | undefined = location.state?.voltar;

  const [campos, setCampos] = useState({ nome: '', email: '', password: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  if (utilizador) {
    return <Navigate to={voltar ?? '/'} replace />;
  }

  function mudar(campo: keyof typeof campos, valor: string) {
    setCampos({ ...campos, [campo]: valor });
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaRegisto, campos);
    if (!dados) {
      return setErro(primeiroErro(erros));
    }

    setErro('');
    setAEnviar(true);
    try {
      await registar(dados.nome, dados.email, dados.password);
    } catch (e) {
      setErro(mensagemErro(e));
      setAEnviar(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <div className="card shadow border-0 rounded-4 p-4 p-md-5 card-escrita fundo-escuro">
        <h1 className="h3 fw-bold mb-1">{t('registo.titulo')}</h1>
        <p className="text-secondary mb-4">{t('registo.texto')}</p>

        {erro && <div className="alert alert-danger">{erro}</div>}

        <form onSubmit={submeter} noValidate>
          <div className="mb-3">
            <label htmlFor="nome" className="form-label">{t('geral.nome')}</label>
            <input id="nome" className="form-control" value={campos.nome} onChange={(e) => mudar('nome', e.target.value)} required maxLength={100} autoComplete="name" />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">{t('geral.email')}</label>
            <input id="email" type="email" className="form-control" value={campos.email} onChange={(e) => mudar('email', e.target.value)} required maxLength={150} autoComplete="email" />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">{t('geral.password')}</label>
            <input id="password" type="password" className="form-control" value={campos.password} onChange={(e) => mudar('password', e.target.value)} required minLength={10} maxLength={128} autoComplete="new-password" />
            <div className="form-text">{t('registo.minimo')}</div>
          </div>
          <div className="mb-4">
            <label htmlFor="confirmar" className="form-label">{t('registo.confirmar')}</label>
            <input id="confirmar" type="password" className="form-control" value={campos.confirmar} onChange={(e) => mudar('confirmar', e.target.value)} required maxLength={128} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-outline-light w-100" disabled={aEnviar}>
            {aEnviar ? t('registo.aCriar') : t('registo.titulo')}
          </button>
        </form>

        <p className="text-center text-secondary mt-4 mb-0">
          {t('registo.temConta')} <Link to="/login" state={{ voltar }}>{t('login.titulo')}</Link>
        </p>
      </div>
    </div>
  );
}
