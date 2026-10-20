import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { get, mensagemErro } from '../api';
import { useCarrinho } from '../contextos/CarrinhoContext';
import CartaoProduto from '../componentes/CartaoProduto';
import Carregando from '../componentes/Carregando';
import { euros, imagemProduto } from '../formato';
import type { Produto as TipoProduto } from '../tipos';
import Imagem from '../componentes/Imagem';
import { t } from '../i18n';

export default function Produto() {
  const { id } = useParams();
  const { adicionar, itens } = useCarrinho();
  const [produto, setProduto] = useState<TipoProduto | null>(null);
  const [relacionados, setRelacionados] = useState<TipoProduto[]>([]);
  const [erro, setErro] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  useEffect(() => {
    setProduto(null);
    setErro('');
    setQuantidade(1);
    setAdicionado(false);

    get<TipoProduto>('produtos.php?id=' + id)
      .then((dados) => {
        setProduto(dados);
        return get<TipoProduto[]>('produtos.php?categoria=' + dados.categoria_id);
      })
      .then((lista) => setRelacionados(lista.filter((p) => String(p.id) !== id).slice(0, 4)))
      .catch((e) => setErro(mensagemErro(e)));
  }, [id]);

  if (erro) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h3">{erro}</h1>
        <Link to="/loja" className="btn btn-outline-light mt-3">{t('produto.voltar')}</Link>
      </div>
    );
  }
  if (!produto) {
    return <Carregando />;
  }

  // não deixa pôr no carrinho mais do que o stock (contando o que já lá está)
  const noCarrinho = itens.find((item) => item.id === produto.id)?.quantidade ?? 0;
  const maximo = produto.stock - noCarrinho;

  function adicionarAoCarrinho() {
    adicionar(produto!, quantidade);
    setAdicionado(true);
    setQuantidade(1);
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/loja">{t('menu.loja')}</Link></li>
          <li className="breadcrumb-item"><Link to={'/loja?categoria=' + produto.categoria_id}>{produto.categoria}</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{produto.nome}</li>
        </ol>
      </nav>

      <div className="row g-5">
        <div className="col-md-6">
          <Imagem src={imagemProduto(produto.imagem)} alt={produto.nome} loading="eager" className="img-quadrada rounded-4" width="800" height="800" />
        </div>
        <div className="col-md-6">
          <span className="badge text-bg-secondary mb-2">{produto.categoria}</span>
          <h1 className="fw-bold">{produto.nome}</h1>
          <p className="fs-3 preco">{euros(produto.preco)}</p>

          {produto.stock === 0 && <p className="text-danger"><i className="bi bi-x-circle me-1"></i>{t('geral.esgotado')}</p>}
          {produto.stock > 0 && produto.stock < 5 && <p className="text-warning"><i className="bi bi-exclamation-circle me-1"></i>{t('produto.ultimas', { n: produto.stock })}</p>}
          {produto.stock >= 5 && <p className="text-success"><i className="bi bi-check-circle me-1"></i>{t('produto.emStock')}</p>}

          <p className="text-secondary mt-3" style={{ whiteSpace: 'pre-line' }}>{produto.descricao}</p>

          {maximo > 0 && (
            <div className="d-flex flex-wrap gap-3 align-items-center mt-4">
              <div className="input-group seletor-quantidade">
                <button className="btn btn-outline-secondary" onClick={() => setQuantidade(Math.max(1, quantidade - 1))} aria-label={t('geral.menos')}>−</button>
                <input type="number" className="form-control" min={1} max={maximo} value={quantidade} onChange={(e) => setQuantidade(Math.max(1, Math.min(maximo, Number(e.target.value) || 1)))} aria-label={t('geral.quantidade')} />
                <button className="btn btn-outline-secondary" onClick={() => setQuantidade(Math.min(maximo, quantidade + 1))} aria-label={t('geral.mais')}>+</button>
              </div>
              <button className="btn btn-outline-light btn-lg flex-grow-1" onClick={adicionarAoCarrinho}>
                <i className="bi bi-bag-plus me-2"></i>{t('cartao.adicionar')}
              </button>
            </div>
          )}
          {produto.stock > 0 && maximo <= 0 && (
            <p className="text-secondary mt-4">{t('produto.tudoNoCarrinho')}</p>
          )}

          {adicionado && (
            <div className="alert alert-success d-flex justify-content-between align-items-center mt-3">
              <span><i className="bi bi-check2-circle me-2"></i>{t('produto.adicionado')}</span>
              <Link to="/carrinho" className="btn btn-sm btn-success">{t('produto.verCarrinho')}</Link>
            </div>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-5 pt-4">
          <h2 className="h4 fw-bold mb-4">{t('produto.relacionados')}</h2>
          <div className="row g-4">
            {relacionados.map((p) => (
              <div key={p.id} className="col-6 col-md-3">
                <CartaoProduto produto={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
