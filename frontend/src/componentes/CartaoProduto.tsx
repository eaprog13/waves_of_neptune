import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrinho } from '../contextos/CarrinhoContext';
import { euros, imagemProduto } from '../formato';
import { t } from '../i18n';
import type { Produto } from '../tipos';
import Imagem from './Imagem';

// mesmo estilo dos cards da página "Música" do site original
export default function CartaoProduto({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho();
  const [adicionado, setAdicionado] = useState(false);
  const esgotado = produto.stock === 0;

  function adicionarAoCarrinho() {
    adicionar(produto);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1500);
  }

  return (
    <div className="fundo-escuro rounded-3 h-100 text-center">
      <div className="card h-100 card-escrita">
        <Link to={'/produto/' + produto.id} className="position-relative">
          <Imagem src={imagemProduto(produto.imagem)} className="card-img-top img-quadrada" alt={produto.nome} width="400" height="400" />
          {esgotado && <span className="badge text-bg-danger position-absolute top-0 end-0 m-2">{t('geral.esgotado')}</span>}
        </Link>
        <div className="card-body d-flex flex-column">
          <h2 className="h5">
            <Link to={'/produto/' + produto.id} className="link-limpo">{produto.nome}</Link>
          </h2>
          <p className="text-secondary mb-1">{produto.categoria}</p>
          <p className="fs-5 preco">{euros(produto.preco)}</p>
          <button className="btn btn-outline-light w-100 mt-auto" onClick={adicionarAoCarrinho} disabled={esgotado || adicionado}>
            {adicionado ? t('cartao.adicionado') : esgotado ? t('geral.esgotado') : t('cartao.adicionar')}
          </button>
        </div>
      </div>
    </div>
  );
}
