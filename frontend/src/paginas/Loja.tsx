import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get } from '../api';
import CartaoProduto from '../componentes/CartaoProduto';
import Carregando from '../componentes/Carregando';
import Equalizador from '../componentes/Equalizador';
import Paginacao from '../componentes/Paginacao';
import type { Categoria, PaginaProdutos } from '../tipos';
import { t } from '../i18n';

// os filtros e a página ficam no endereço (ex.: #/loja?categoria=3&ordem=preco_asc&pagina=2), por isso dá para partilhar o link
export default function Loja() {
  const [parametros, setParametros] = useSearchParams();
  const [resultado, setResultado] = useState<PaginaProdutos | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pesquisa, setPesquisa] = useState(parametros.get('pesquisa') ?? '');

  const categoria = parametros.get('categoria') ?? '';
  const ordem = parametros.get('ordem') ?? 'recentes';
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1);
  const topoLista = useRef<HTMLElement>(null);
  const produtos = resultado?.produtos ?? null;

  useEffect(() => {
    get<Categoria[]>('categorias.php').then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    setResultado(null);
    const pedido = new URLSearchParams(parametros);
    pedido.set('pagina', String(pagina));
    get<PaginaProdutos>('produtos.php?' + pedido.toString())
      .then(setResultado)
      .catch(() => setResultado({ produtos: [], total: 0, pagina: 1, paginas: 1, por_pagina: 9 }));
  }, [parametros]);

  // só pesquisa quando se pára de escrever, para não fazer um pedido por cada tecla
  useEffect(() => {
    const espera = setTimeout(() => mudarFiltro('pesquisa', pesquisa.trim()), 350);
    return () => clearTimeout(espera);
  }, [pesquisa]);

  function mudarFiltro(nome: string, valor: string) {
    if ((parametros.get(nome) ?? '') === valor) {
      return;
    }
    const novos = new URLSearchParams(parametros);
    if (valor) {
      novos.set(nome, valor);
    } else {
      novos.delete(nome);
    }
    novos.delete('pagina'); // filtro novo começa na primeira página
    setParametros(novos, { replace: true });
  }

  // mudar de página fica no histórico (o botão "voltar" regressa à página anterior)
  function mudarPagina(nova: number) {
    const novos = new URLSearchParams(parametros);
    if (nova > 1) {
      novos.set('pagina', String(nova));
    } else {
      novos.delete('pagina');
    }
    setParametros(novos);
    topoLista.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const nomeCategoria = categorias.find((c) => String(c.id) === categoria)?.nome;

  return (
    <div className="container py-4">
      <header className="cabecalho-loja">
        <p className="etiqueta mb-3"><Equalizador /> {t('loja.etiqueta')}</p>
        <h1>{nomeCategoria ?? t('loja.titulo')}</h1>
        <p className="text-light opacity-75 mb-0">{t('loja.subtitulo')}</p>
        <div className="divisor-onda divisor-onda-fundo" aria-hidden="true"></div>
      </header>

      <div className="area-loja row g-4 mx-0 mt-4">
        <aside className="col-lg-3">
          <div className="painel p-3 mb-3">
            <label htmlFor="pesquisa" className="form-label small text-secondary">{t('loja.pesquisar')}</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input id="pesquisa" type="search" className="form-control" placeholder={t('loja.pesquisarExemplo')} value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
            </div>
          </div>

          <div className="painel p-3">
            <h2 className="h6 text-secondary mb-3">{t('loja.categorias')}</h2>
            <div className="list-group lista-categorias">
              <button className={'list-group-item list-group-item-action' + (categoria === '' ? ' active' : '')} onClick={() => mudarFiltro('categoria', '')}>
                {t('loja.todas')}
              </button>
              {categorias.map((c) => (
                <button key={c.id} className={'list-group-item list-group-item-action d-flex justify-content-between' + (categoria === String(c.id) ? ' active' : '')} onClick={() => mudarFiltro('categoria', String(c.id))}>
                  {c.nome}
                  <span className="badge text-bg-secondary rounded-pill">{c.total_produtos}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="col-lg-9 lista-produtos" ref={topoLista}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <span className="text-secondary small">
              {resultado && resultado.total > 0 && (
                <>
                  {resultado.total} {resultado.total === 1 ? t('loja.produto') : t('loja.produtos')}
                  {resultado.paginas > 1 && ' · ' + t('loja.pagina', { pagina: resultado.pagina, paginas: resultado.paginas })}
                </>
              )}
            </span>
            <select className="form-select form-select-sm w-auto" value={ordem} onChange={(e) => mudarFiltro('ordem', e.target.value === 'recentes' ? '' : e.target.value)} aria-label={t('loja.ordenar')}>
              <option value="recentes">{t('loja.recentes')}</option>
              <option value="preco_asc">{t('loja.precoAsc')}</option>
              <option value="preco_desc">{t('loja.precoDesc')}</option>
              <option value="nome">{t('loja.nome')}</option>
            </select>
          </div>

          {produtos === null && <Carregando />}

          {produtos?.length === 0 && (
            <div className="painel p-5 text-center">
              <i className="bi bi-search fs-1 text-secondary"></i>
              <p className="mt-3 mb-0">{t('loja.semResultados')}</p>
            </div>
          )}

          {produtos && produtos.length > 0 && (
            <div className="row g-4">
              {produtos.map((produto) => (
                <div key={produto.id} className="col-6 col-md-4">
                  <CartaoProduto produto={produto} />
                </div>
              ))}
            </div>
          )}

          {resultado && <Paginacao pagina={resultado.pagina} paginas={resultado.paginas} mudar={mudarPagina} />}
        </section>
      </div>
    </div>
  );
}
