import { Link, useNavigate } from 'react-router-dom';
import { useCarrinho } from '../contextos/CarrinhoContext';
import { subtotal } from '../carrinho';
import { euros, imagemProduto } from '../formato';
import Imagem from '../componentes/Imagem';
import { t } from '../i18n';

export default function Carrinho() {
  const { itens, total, artigos, atualizar, remover } = useCarrinho();
  const navigate = useNavigate();

  if (itens.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag fs-1 text-secondary"></i>
        <h1 className="h3 mt-3">{t('carrinho.vazio')}</h1>
        <p className="text-secondary">{t('carrinho.vazioTexto')}</p>
        <Link to="/loja" className="btn btn-outline-light mt-2">{t('carrinho.irLoja')}</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="text-center mb-5">
        <h1>{t('carrinho.titulo')}</h1>
        <p className="text-secondary">{t('carrinho.subtitulo')}</p>
      </div>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="painel">
            {itens.map((item) => (
              <div key={item.id} className="d-flex flex-wrap align-items-center gap-3 p-3 border-bottom border-secondary-subtle">
                <Imagem src={imagemProduto(item.imagem)} alt={item.nome} className="miniatura" width="64" height="64" />
                <div className="flex-grow-1">
                  <Link to={'/produto/' + item.id} className="link-limpo fw-semibold">{item.nome}</Link>
                  <div className="text-secondary small">{t('carrinho.unidade', { preco: euros(item.preco) })}</div>
                </div>
                <div className="input-group input-group-sm seletor-quantidade">
                  <button className="btn btn-outline-secondary" onClick={() => atualizar(item.id, item.quantidade - 1)} disabled={item.quantidade <= 1} aria-label={t('geral.menos')}>−</button>
                  <input type="number" className="form-control" min={1} max={item.stock} value={item.quantidade} onChange={(e) => atualizar(item.id, Number(e.target.value))} aria-label={t('carrinho.quantidadeDe', { nome: item.nome })} />
                  <button className="btn btn-outline-secondary" onClick={() => atualizar(item.id, item.quantidade + 1)} disabled={item.quantidade >= item.stock} aria-label={t('geral.mais')}>+</button>
                </div>
                <div className="fw-bold text-end" style={{ minWidth: 90 }}>{euros(subtotal(item))}</div>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remover(item.id)} aria-label={t('carrinho.remover', { nome: item.nome })}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="painel p-4">
            <h2 className="h5 fw-bold mb-3">{t('carrinho.resumo')}</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary">{t('carrinho.artigos')}</span><span>{artigos}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary">{t('geral.subtotal')}</span><span>{euros(total)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-secondary">{t('geral.portes')}</span><span className="text-success">{t('geral.gratis')}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fs-5 fw-bold mb-4">
              <span>{t('geral.total')}</span><span className="preco">{euros(total)}</span>
            </div>
            {/* em cima do finalizar e em botão, para não se perder no fundo com o logo */}
            <Link to="/loja" className="btn btn-outline-secondary w-100 mb-2"><i className="bi bi-arrow-left me-1"></i>{t('carrinho.continuar')}</Link>
            <button className="btn btn-outline-light w-100 btn-lg" onClick={() => navigate('/checkout')}>
              {t('carrinho.finalizar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
