import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, mensagemErro, post } from '../api';
import Carregando from '../componentes/Carregando';
import { euros } from '../formato';
import { iniciarPagamento, irParaPagamento } from '../pagamentos';
import type { Pagamento as TipoPagamento } from '../tipos';
import { t } from '../i18n';

// página do pagamento. Com o fornecedor simulado, o cliente escolhe se o pagamento é aceite ou recusado;
// com um fornecedor real, o cliente é mandado para a página dele e esta página só mostra o resultado
export default function Pagamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pagamento, setPagamento] = useState<TipoPagamento | null>(null);
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    get<TipoPagamento>('pagamentos.php?id=' + id).then(setPagamento).catch((e) => setErro(mensagemErro(e)));
  }, [id]);

  async function simular(resultado: 'pago' | 'falhado') {
    setAEnviar(true);
    setErro('');
    try {
      setPagamento({ ...(await post<TipoPagamento>('pagamentos.php', { acao: 'simular', id: Number(id), resultado })), simulado: true });
    } catch (e) {
      setErro(mensagemErro(e));
    }
    setAEnviar(false);
  }

  async function tentarOutraVez() {
    if (!pagamento) return;
    try {
      irParaPagamento(await iniciarPagamento(pagamento.tipo, pagamento.referencia_id), navigate);
    } catch (e) {
      setErro(mensagemErro(e));
    }
  }

  if (!pagamento) {
    return erro ? (
      <div className="container py-5 text-center">
        <p className="alert alert-danger d-inline-block">{erro}</p>
        <div><Link to="/conta" className="btn btn-outline-light">{t('pag.irConta')}</Link></div>
      </div>
    ) : <Carregando />;
  }

  const oQue = pagamento.tipo === 'encomenda' ? t('pag.encomendaN', { id: pagamento.referencia_id }) : t('pag.reserva');

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="card shadow border-0 rounded-4 p-4 p-md-5 card-escrita text-center">
        <p className="etiqueta-pequena mb-2">{oQue}</p>
        <h1 className="h3">{t('pag.titulo')}</h1>
        <p className="preco display-6 my-3">{euros(pagamento.valor)}</p>

        {erro && <div className="alert alert-danger">{erro}</div>}

        {pagamento.estado === 'pendente' && pagamento.simulado && (
          <>
            <div className="alert alert-secondary small text-start">
              {t('pag.teste')}
            </div>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-light" onClick={() => simular('pago')} disabled={aEnviar}>{t('pag.pagar')}</button>
              <button className="btn btn-outline-danger" onClick={() => simular('falhado')} disabled={aEnviar}>{t('pag.recusar')}</button>
            </div>
          </>
        )}

        {pagamento.estado === 'pendente' && !pagamento.simulado && (
          <p className="text-secondary">{t('pag.aguardar')}</p>
        )}

        {pagamento.estado === 'pago' && (
          <>
            <div className="alert alert-success"><i className="bi bi-check2-circle me-2"></i>{t('pag.recebido')}</div>
            <Link to="/conta" className="btn btn-outline-light">{t('pag.verConta')}</Link>
          </>
        )}

        {(pagamento.estado === 'falhado' || pagamento.estado === 'cancelado') && (
          <>
            <div className="alert alert-danger">{t('pag.falhou')}</div>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-light" onClick={tentarOutraVez}>{t('pag.outraVez')}</button>
              <Link to="/conta" className="btn btn-link">{t('pag.depois')}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
