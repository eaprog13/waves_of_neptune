import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { get, mensagemErro, post } from '../api';
import { useCarrinho } from '../contextos/CarrinhoContext';
import { subtotal } from '../carrinho';
import { euros } from '../formato';
import type { DadosEnvio, Perfil } from '../tipos';
import { esquemaEnvio, validar } from '../validacao';
import { iniciarPagamento, irParaPagamento } from '../pagamentos';
import { t } from '../i18n';

export default function Checkout() {
  const { itens, total, limpar } = useCarrinho();
  const navigate = useNavigate();
  const [envio, setEnvio] = useState<DadosEnvio>({ nome: '', telefone: '', morada: '', codigo_postal: '', cidade: '' });
  const [guardarMorada, setGuardarMorada] = useState(true);
  const [erros, setErros] = useState<Partial<Record<keyof DadosEnvio, string>>>({});
  const [erroServidor, setErroServidor] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  // preenche com os dados guardados no perfil
  useEffect(() => {
    get<Perfil>('perfil.php')
      .then((perfil) => setEnvio({
        nome: perfil.nome,
        telefone: perfil.telefone ?? '',
        morada: perfil.morada ?? '',
        codigo_postal: perfil.codigo_postal ?? '',
        cidade: perfil.cidade ?? '',
      }))
      .catch(() => {});
  }, []);

  if (itens.length === 0) {
    return <Navigate to="/carrinho" replace />;
  }

  function mudar(campo: keyof DadosEnvio, valor: string) {
    setEnvio({ ...envio, [campo]: valor });
    setErros({ ...erros, [campo]: undefined });
  }

  async function confirmar(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros: encontrados } = validar(esquemaEnvio, envio);
    setErros(encontrados);
    if (!dados) {
      return;
    }

    setAEnviar(true);
    setErroServidor('');
    try {
      const resposta = await post<{ id: number }>('encomendas.php', {
        itens: itens.map((item) => ({ id: item.id, quantidade: item.quantidade })),
        envio: dados,
        guardar_morada: guardarMorada,
      });
      // a encomenda fica registada; segue logo para o pagamento (se falhar, paga-se depois na conta)
      try {
        irParaPagamento(await iniciarPagamento('encomenda', resposta.id), navigate);
      } catch {
        navigate('/conta', { state: { novaEncomenda: resposta.id } });
      }
      limpar();
    } catch (e) {
      setErroServidor(mensagemErro(e));
      setAEnviar(false);
    }
  }

  const campo = (nome: keyof DadosEnvio, rotulo: string, props: object = {}) => (
    <div>
      <label htmlFor={nome} className="form-label">{rotulo}</label>
      <input id={nome} className={'form-control' + (erros[nome] ? ' is-invalid' : '')} value={envio[nome]} onChange={(e) => mudar(nome, e.target.value)} {...props} />
      <div className="invalid-feedback">{erros[nome]}</div>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="text-center mb-5">
        <h1>{t('carrinho.finalizar')}</h1>
        <p className="text-secondary">{t('checkout.subtitulo')}</p>
      </div>
      <form className="row g-4" onSubmit={confirmar} noValidate>
        <div className="col-lg-7">
          <div className="painel p-4">
            <h2 className="h5 fw-bold mb-3">{t('checkout.dadosEnvio')}</h2>
            {erroServidor && <div className="alert alert-danger">{erroServidor}</div>}
            <div className="row g-3">
              <div className="col-md-7">{campo('nome', t('geral.nome'), { autoComplete: 'name' })}</div>
              <div className="col-md-5">{campo('telefone', t('geral.telefone'), { type: 'tel', autoComplete: 'tel' })}</div>
              <div className="col-12">{campo('morada', t('geral.morada'), { autoComplete: 'street-address' })}</div>
              <div className="col-md-5">{campo('codigo_postal', t('geral.codigoPostal'), { placeholder: '0000-000', autoComplete: 'postal-code' })}</div>
              <div className="col-md-7">{campo('cidade', t('geral.cidade'), { autoComplete: 'address-level2' })}</div>
              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="guardar" checked={guardarMorada} onChange={(e) => setGuardarMorada(e.target.checked)} />
                  <label className="form-check-label" htmlFor="guardar">{t('checkout.guardarMorada')}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="painel p-4">
            <h2 className="h5 fw-bold mb-3">{t('checkout.aTuaEncomenda')}</h2>
            {itens.map((item) => (
              <div key={item.id} className="d-flex justify-content-between small mb-2">
                <span>{item.quantidade} × {item.nome}</span>
                <span>{euros(subtotal(item))}</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between small mb-2">
              <span className="text-secondary">{t('geral.portes')}</span><span className="text-success">{t('geral.gratis')}</span>
            </div>
            <div className="d-flex justify-content-between fs-5 fw-bold mb-4">
              <span>{t('geral.total')}</span><span className="preco">{euros(total)}</span>
            </div>
            <button type="submit" className="btn btn-outline-light btn-lg w-100" disabled={aEnviar}>
              {aEnviar ? t('geral.aEnviar') : t('checkout.confirmar')}
            </button>
            <p className="text-secondary small mt-3 mb-0">
              {t('checkout.comPagamento')} <Link to="/carrinho">{t('checkout.voltarCarrinho')}</Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
