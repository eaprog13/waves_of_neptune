import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, mensagemErro, post } from '../api';
import Carregando from '../componentes/Carregando';
import Equalizador from '../componentes/Equalizador';
import Imagem from '../componentes/Imagem';
import Newsletter from '../componentes/Newsletter';
import Revelar from '../componentes/Revelar';
import { useSessao } from '../contextos/SessaoContext';
import { dataHora, euros, imagemConcerto } from '../formato';
import type { Concerto } from '../tipos';
import { esquemaReserva, primeiroErro, validar } from '../validacao';
import { iniciarPagamento, irParaPagamento } from '../pagamentos';
import { regiao, t } from '../i18n';

function CartaoConcerto({ concerto }: { concerto: Concerto }) {
  const { utilizador } = useSessao();
  const navigate = useNavigate();
  const [quantidade, setQuantidade] = useState(1);
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const data = new Date(concerto.data.replace(' ', 'T'));
  const esgotado = concerto.disponiveis === 0;
  const aVenda = concerto.estado === 'agendado' && !concerto.passado && !esgotado;
  const maximo = Math.min(6, concerto.disponiveis);

  async function reservar() {
    if (!utilizador) {
      return navigate('/login', { state: { voltar: '/concertos' } });
    }
    const { dados, erros } = validar(esquemaReserva, { quantidade });
    if (!dados) {
      return setErro(primeiroErro(erros));
    }
    setAEnviar(true);
    setErro('');
    try {
      const resposta = await post<{ id: number; codigo: string }>('concertos.php', { concerto_id: concerto.id, quantidade: dados.quantidade });
      // os lugares ficam reservados; segue para o pagamento (se falhar, paga-se depois na conta)
      try {
        irParaPagamento(await iniciarPagamento('bilhete', resposta.id), navigate);
      } catch {
        navigate('/conta', { state: { novoBilhete: resposta.codigo } });
      }
    } catch (e) {
      setErro(mensagemErro(e));
      setAEnviar(false);
    }
  }

  return (
    <div className="fundo-escuro rounded-3 h-100">
      <div className="card card-escrita h-100 overflow-hidden">
        <div className="position-relative">
          <Imagem src={imagemConcerto(concerto.imagem)} className="card-img-top img-concerto" alt={concerto.titulo} width="1200" height="800" />
          <div className="data-concerto">
            <span className="dia">{data.getDate()}</span>
            <span className="mes">{data.toLocaleDateString(regiao(), { month: 'short' }).replace('.', '')}</span>
          </div>
          {concerto.estado === 'cancelado' && <span className="badge text-bg-danger position-absolute top-0 end-0 m-2">{t('concertos.cancelado')}</span>}
          {concerto.estado !== 'cancelado' && esgotado && !concerto.passado && <span className="badge text-bg-light position-absolute top-0 end-0 m-2">{t('geral.esgotado')}</span>}
        </div>
        <div className="card-body d-flex flex-column">
          <h3 className="h5">{concerto.titulo}</h3>
          <p className="text-secondary small mb-2">
            <i className="bi bi-geo-alt me-1"></i>{concerto.local}, {concerto.cidade}<br />
            <i className="bi bi-clock me-1"></i>{dataHora(concerto.data)}
          </p>
          {concerto.descricao && <p className="small">{concerto.descricao}</p>}

          {!concerto.passado && concerto.estado === 'agendado' && (
            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="preco fs-5">{concerto.preco > 0 ? euros(concerto.preco) : t('concertos.entradaLivre')}</span>
                <span className="etiqueta-pequena">{esgotado ? t('geral.esgotado') : t('concertos.lugares', { n: concerto.disponiveis })}</span>
              </div>
              {erro && <div className="alert alert-danger small py-2">{erro}</div>}
              {aVenda && (
                <div className="d-flex gap-2">
                  <select className="form-select" style={{ maxWidth: 90 }} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} aria-label={t('concertos.nBilhetes')}>
                    {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="btn btn-outline-light flex-grow-1" onClick={reservar} disabled={aEnviar}>
                    {aEnviar ? t('concertos.aReservar') : t('concertos.reservar')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Concertos() {
  const [concertos, setConcertos] = useState<Concerto[] | null>(null);

  useEffect(() => {
    get<Concerto[]>('concertos.php').then(setConcertos).catch(() => setConcertos([]));
  }, []);

  const proximos = concertos?.filter((c) => !c.passado) ?? [];
  const passados = concertos?.filter((c) => c.passado).reverse() ?? [];

  return (
    <div className="container py-4">
      <header className="cabecalho-loja cabecalho-concertos">
        <p className="etiqueta mb-3"><Equalizador /> Tour Echoes</p>
        <h1>{t('concertos.titulo')}</h1>
        <p className="text-light opacity-75 mb-0">{t('concertos.subtitulo')}</p>
        <div className="divisor-onda divisor-onda-fundo" aria-hidden="true"></div>
      </header>

      {concertos === null && <Carregando />}

      {concertos && (
        <section className="mt-5">
          <h2 className="mb-4">{t('concertos.proximas')}</h2>
          {proximos.length === 0 ? (
            <div className="painel p-5 text-center text-secondary">{t('concertos.semDatas')}</div>
          ) : (
            <div className="row g-4">
              {proximos.map((concerto, i) => (
                <div key={concerto.id} className="col-md-6 col-lg-4">
                  <Revelar atraso={i * 120} className="h-100">
                    <CartaoConcerto concerto={concerto} />
                  </Revelar>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {passados.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-4">{t('concertos.anteriores')}</h2>
          <div className="painel">
            {passados.map((concerto) => (
              <div key={concerto.id} className="d-flex flex-wrap justify-content-between gap-2 p-3 border-bottom border-secondary-subtle">
                <span className="fw-semibold">{concerto.titulo}</span>
                <span className="text-secondary small">{concerto.local}, {concerto.cidade} · {dataHora(concerto.data)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Newsletter />
    </div>
  );
}
