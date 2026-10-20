import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { definirToken, get, mensagemErro, post } from '../api';
import { useSessao } from '../contextos/SessaoContext';
import Carregando from '../componentes/Carregando';
import Rastreamento from '../componentes/Rastreamento';
import SuporteCliente from '../componentes/SuporteCliente';
import { ESTADOS, PAGAMENTO, data, dataHora, euros, jaPassou } from '../formato';
import { iniciarPagamento, irParaPagamento } from '../pagamentos';
import type { Bilhete, Encomenda, Perfil, Utilizador } from '../tipos';
import { esquemaNovaPassword, esquemaPerfil, primeiroErro, validar } from '../validacao';
import { t } from '../i18n';

type Separador = 'encomendas' | 'bilhetes' | 'suporte' | 'perfil';

// botão "Pagar agora" para o que ficou por pagar
function BotaoPagar({ tipo, id }: { tipo: 'encomenda' | 'bilhete'; id: number }) {
  const navigate = useNavigate();
  const [erro, setErro] = useState('');

  async function pagar() {
    try {
      irParaPagamento(await iniciarPagamento(tipo, id), navigate);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  return (
    <>
      <button className="btn btn-sm btn-outline-light" onClick={pagar}><i className="bi bi-credit-card me-1"></i>{t('conta.pagarAgora')}</button>
      {erro && <span className="text-danger small ms-2">{erro}</span>}
    </>
  );
}

export default function Conta() {
  const location = useLocation();
  const novaEncomenda: number | undefined = location.state?.novaEncomenda;
  const novoBilhete: string | undefined = location.state?.novoBilhete;
  const [separador, setSeparador] = useState<Separador>(novoBilhete ? 'bilhetes' : 'encomendas');

  const botao = (valor: Separador, icone: string, texto: string) => (
    <li className="nav-item">
      <button className={'nav-link' + (separador === valor ? ' active' : '')} onClick={() => setSeparador(valor)}>
        <i className={'bi me-1 ' + icone}></i>{texto}
      </button>
    </li>
  );

  return (
    <div className="container py-4">
      <div className="text-center mb-5">
        <h1>{t('conta.titulo')}</h1>
        <p className="text-secondary">{t('conta.subtitulo')}</p>
      </div>

      {novaEncomenda && (
        <div className="alert alert-success">
          <i className="bi bi-check2-circle me-2"></i>
          {t('conta.obrigadoAntes')} <strong>#{novaEncomenda}</strong> {t('conta.obrigadoDepois')}
        </div>
      )}
      {novoBilhete && (
        <div className="alert alert-success">
          <i className="bi bi-check2-circle me-2"></i>
          {t('conta.reservaAntes')} <strong>{novoBilhete}</strong>{t('conta.reservaDepois')}
        </div>
      )}

      <ul className="nav nav-pills mb-4">
        {botao('encomendas', 'bi-box-seam', t('conta.encomendas'))}
        {botao('bilhetes', 'bi-ticket-perforated', t('conta.bilhetes'))}
        {botao('suporte', 'bi-life-preserver', t('conta.suporte'))}
        {botao('perfil', 'bi-person', t('conta.perfil'))}
      </ul>

      {separador === 'encomendas' && <Historico />}
      {separador === 'bilhetes' && <Bilhetes />}
      {separador === 'suporte' && <SuporteCliente />}
      {separador === 'perfil' && <EditarPerfil />}
    </div>
  );
}

function Historico() {
  const [encomendas, setEncomendas] = useState<Encomenda[] | null>(null);

  useEffect(() => {
    get<Encomenda[]>('encomendas.php').then(setEncomendas).catch(() => setEncomendas([]));
  }, []);

  if (!encomendas) {
    return <Carregando />;
  }
  if (encomendas.length === 0) {
    return <div className="painel p-5 text-center text-secondary">{t('conta.semEncomendas')}</div>;
  }

  return (
    <div className="d-grid gap-3">
      {encomendas.map((encomenda) => (
        <details key={encomenda.id} className="painel p-3">
          <summary className="d-flex flex-wrap align-items-center gap-3" style={{ cursor: 'pointer' }}>
            <strong>#{encomenda.id}</strong>
            <span className="text-secondary">{data(encomenda.data)}</span>
            <span className={'badge text-bg-' + ESTADOS[encomenda.estado].cor}>{ESTADOS[encomenda.estado].texto}</span>
            <span className={'badge text-bg-' + PAGAMENTO[encomenda.pagamento].cor}>{PAGAMENTO[encomenda.pagamento].texto}</span>
            <span className="ms-auto fw-bold">{euros(encomenda.total)}</span>
          </summary>
          {encomenda.pagamento === 'por_pagar' && encomenda.estado !== 'cancelada' && (
            <div className="mt-3"><BotaoPagar tipo="encomenda" id={encomenda.id} /></div>
          )}
          <div className="row mt-3 g-3 small">
            <div className="col-md-7">
              {encomenda.itens.map((item, i) => (
                <div key={i} className="d-flex justify-content-between border-bottom border-secondary-subtle py-1">
                  <span>{item.quantidade} × {item.nome_produto}</span>
                  <span>{euros(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="col-md-5 text-secondary">
              <div className="fw-semibold text-light">{t('conta.envio')}</div>
              {encomenda.nome_envio}<br />
              {encomenda.morada}<br />
              {encomenda.codigo_postal} {encomenda.cidade}<br />
              {encomenda.telefone}
            </div>
          </div>
          {encomenda.envio && (
            <div className="mt-3 pt-3 border-top border-secondary-subtle">
              <div className="fw-semibold mb-2">{t('conta.rastreamento')}</div>
              <Rastreamento envio={encomenda.envio} />
            </div>
          )}
        </details>
      ))}
    </div>
  );
}

function Bilhetes() {
  const [bilhetes, setBilhetes] = useState<Bilhete[] | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  function carregar() {
    get<Bilhete[]>('bilhetes.php').then(setBilhetes).catch(() => setBilhetes([]));
  }

  useEffect(carregar, []);

  async function cancelar(bilhete: Bilhete) {
    if (!confirm(t('conta.cancelarReserva', { codigo: bilhete.codigo }))) return;
    try {
      await post('bilhetes.php', { id: bilhete.id });
      setMensagem({ tipo: 'success', texto: t('conta.reservaCancelada') });
      carregar();
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
  }

  if (!bilhetes) {
    return <Carregando />;
  }
  if (bilhetes.length === 0) {
    return <div className="painel p-5 text-center text-secondary">{t('conta.semBilhetes')}</div>;
  }

  return (
    <>
      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}
      <div className="d-grid gap-3">
        {bilhetes.map((bilhete) => {
          const passado = !!bilhete.data && jaPassou(bilhete.data);
          const ativo = bilhete.estado === 'reservado' && bilhete.estado_concerto !== 'cancelado';
          return (
            <div key={bilhete.id} className="painel p-3 d-flex flex-wrap align-items-center gap-3">
              <div className="flex-grow-1">
                <div className="fw-semibold">{bilhete.titulo}</div>
                <div className="text-secondary small">{bilhete.data && dataHora(bilhete.data)} · {bilhete.local}, {bilhete.cidade}</div>
              </div>
              <div className="text-center">
                <div className="preco fs-5">{bilhete.codigo}</div>
                <div className="text-secondary small">{bilhete.quantidade} {bilhete.quantidade === 1 ? t('conta.bilhete') : t('conta.bilhetesN')} · {euros(bilhete.total)}</div>
              </div>
              {bilhete.estado === 'reservado' && <span className={'badge text-bg-' + PAGAMENTO[bilhete.pagamento].cor}>{PAGAMENTO[bilhete.pagamento].texto}</span>}
              {ativo && !passado && bilhete.pagamento === 'por_pagar' && <BotaoPagar tipo="bilhete" id={bilhete.id} />}
              {bilhete.estado === 'cancelado' && <span className="badge text-bg-secondary">{t('conta.cancelada')}</span>}
              {bilhete.estado_concerto === 'cancelado' && bilhete.estado !== 'cancelado' && <span className="badge text-bg-danger">{t('conta.concertoCancelado')}</span>}
              {ativo && !passado && bilhete.pagamento !== 'pago' && (
                <button className="btn btn-sm btn-outline-danger" onClick={() => cancelar(bilhete)}>{t('conta.botaoCancelar')}</button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function EditarPerfil() {
  const { atualizar } = useSessao();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [passwords, setPasswords] = useState({ atual: '', nova: '', confirmar: '' });
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [passwordDoisFatores, setPasswordDoisFatores] = useState('');

  useEffect(() => {
    get<Perfil>('perfil.php').then(setPerfil).catch(() => {});
  }, []);

  if (!perfil) {
    return <Carregando />;
  }

  function mudar(campo: keyof Perfil, valor: string) {
    setPerfil({ ...perfil!, [campo]: valor });
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const campos = {
      nome: perfil!.nome,
      email: perfil!.email,
      telefone: perfil!.telefone ?? '',
      morada: perfil!.morada ?? '',
      codigo_postal: perfil!.codigo_postal ?? '',
      cidade: perfil!.cidade ?? '',
    };
    const dadosPerfil = validar(esquemaPerfil, campos);
    if (!dadosPerfil.dados) {
      return setMensagem({ tipo: 'danger', texto: primeiroErro(dadosPerfil.erros) });
    }
    // a password atual sozinha não muda a password: serve para confirmar a mudança de email
    const mudarPassword = passwords.nova !== '' || passwords.confirmar !== '';
    if (mudarPassword) {
      const dadosPassword = validar(esquemaNovaPassword, passwords);
      if (!dadosPassword.dados) {
        return setMensagem({ tipo: 'danger', texto: primeiroErro(dadosPassword.erros) });
      }
    }

    setAGuardar(true);
    setMensagem(null);
    try {
      const resposta = await post<{ utilizador: Utilizador; perfil: Perfil; csrf: string }>('perfil.php', {
        ...dadosPerfil.dados,
        password_atual: passwords.atual,
        password_nova: mudarPassword ? passwords.nova : '',
      });
      // mudar a password renova a sessão (e o token CSRF)
      definirToken(resposta.csrf);
      setPerfil(resposta.perfil);
      atualizar(resposta.utilizador);
      setPasswords({ atual: '', nova: '', confirmar: '' });
      setMensagem({ tipo: 'success', texto: t('conta.dadosGuardados') });
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
    setAGuardar(false);
  }

  // ligar ou desligar a 2FA pede a password atual (nos administradores está sempre ligada)
  async function mudarDoisFatores(ativo: boolean) {
    const dadosPerfil = validar(esquemaPerfil, {
      nome: perfil!.nome,
      email: perfil!.email,
      telefone: perfil!.telefone ?? '',
      morada: perfil!.morada ?? '',
      codigo_postal: perfil!.codigo_postal ?? '',
      cidade: perfil!.cidade ?? '',
    });
    if (!dadosPerfil.dados) {
      return setMensagem({ tipo: 'danger', texto: primeiroErro(dadosPerfil.erros) });
    }
    if (!passwordDoisFatores) {
      return setMensagem({ tipo: 'danger', texto: t('conta.escrevePassword') });
    }
    try {
      const resposta = await post<{ utilizador: Utilizador; perfil: Perfil; csrf: string }>('perfil.php', {
        ...dadosPerfil.dados,
        dois_fatores: ativo,
        password_atual: passwordDoisFatores,
      });
      definirToken(resposta.csrf);
      setPerfil(resposta.perfil);
      setPasswordDoisFatores('');
      setMensagem({ tipo: 'success', texto: ativo ? t('conta.2faLigada') : t('conta.2faDesligada') });
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
  }

  const campo = (nome: keyof Perfil, rotulo: string, tipo = 'text', maximo = 100) => (
    <div>
      <label htmlFor={nome} className="form-label">{rotulo}</label>
      <input id={nome} type={tipo} className="form-control" maxLength={maximo} value={(perfil[nome] as string | null) ?? ''} onChange={(e) => mudar(nome, e.target.value)} />
    </div>
  );

  return (
    <form className="painel p-4" onSubmit={guardar} noValidate>
      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}

      <h2 className="h5 fw-bold mb-3">{t('conta.dadosPessoais')}</h2>
      <div className="row g-3 mb-4">
        <div className="col-md-6">{campo('nome', t('geral.nome'))}</div>
        <div className="col-md-6">{campo('email', t('geral.email'), 'email', 150)}</div>
        <div className="col-md-4">{campo('telefone', t('geral.telefone'), 'tel', 15)}</div>
        <div className="col-md-8">{campo('morada', t('geral.morada'), 'text', 200)}</div>
        <div className="col-md-4">{campo('codigo_postal', t('geral.codigoPostal'), 'text', 8)}</div>
        <div className="col-md-8">{campo('cidade', t('geral.cidade'))}</div>
      </div>

      <h2 className="h5 fw-bold mb-1">{t('conta.alterarPassword')}</h2>
      <p className="text-secondary small">{t('conta.passwordAjuda')}</p>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label htmlFor="atual" className="form-label">{t('conta.passwordAtual')}</label>
          <input id="atual" type="password" className="form-control" maxLength={128} value={passwords.atual} onChange={(e) => setPasswords({ ...passwords, atual: e.target.value })} autoComplete="current-password" />
        </div>
        <div className="col-md-4">
          <label htmlFor="nova" className="form-label">{t('conta.passwordNova')}</label>
          <input id="nova" type="password" className="form-control" maxLength={128} value={passwords.nova} onChange={(e) => setPasswords({ ...passwords, nova: e.target.value })} autoComplete="new-password" />
        </div>
        <div className="col-md-4">
          <label htmlFor="confirmar" className="form-label">{t('conta.passwordConfirmar')}</label>
          <input id="confirmar" type="password" className="form-control" maxLength={128} value={passwords.confirmar} onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })} autoComplete="new-password" />
        </div>
      </div>

      <button type="submit" className="btn btn-outline-light" disabled={aGuardar}>
        {aGuardar ? t('geral.aGuardar') : t('conta.guardarAlteracoes')}
      </button>

      <hr className="my-4" />
      <h2 className="h5 fw-bold mb-1">{t('conta.2faTitulo')}</h2>
      <p className="text-secondary small">{t('conta.2faTexto')}</p>
      {perfil.tipo_utilizador === 'admin' ? (
        <p className="mb-0"><span className="badge text-bg-success me-2">{t('conta.ligada')}</span>{t('conta.2faAdmin')}</p>
      ) : (
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <span className={'badge me-2 text-bg-' + (perfil.dois_fatores ? 'success' : 'secondary')}>{perfil.dois_fatores ? t('conta.ligada') : t('conta.desligada')}</span>
          </div>
          <div className="col-md-4">
            <label htmlFor="password2fa" className="form-label">{t('conta.passwordAtual')}</label>
            <input id="password2fa" type="password" className="form-control" maxLength={128} value={passwordDoisFatores} onChange={(e) => setPasswordDoisFatores(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="col-md-4">
            <button type="button" className="btn btn-outline-light w-100" onClick={() => mudarDoisFatores(!perfil.dois_fatores)}>
              {perfil.dois_fatores ? t('conta.2faDesligar') : t('conta.2faLigar')}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
