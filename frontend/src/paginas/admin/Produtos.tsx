import { useEffect, useState, type FormEvent } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import { euros, imagemProduto } from '../../formato';
import type { Categoria, Produto } from '../../tipos';
import { esquemaProduto, primeiroErro, validar } from '../../validacao';
import Imagem from '../../componentes/Imagem';
import { t } from '../../i18n';

const VAZIO = { id: 0, nome: '', nome_en: '', descricao: '', descricao_en: '', preco: '', stock: '', categoria_id: '', destaque: false, imagem: null as string | null };

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formulario, setFormulario] = useState<typeof VAZIO | null>(null);
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [previsao, setPrevisao] = useState<string | null>(null);

  function carregar() {
    get<Produto[]>('admin/produtos.php').then(setProdutos).catch((e) => setMensagem({ tipo: 'danger', texto: mensagemErro(e) }));
  }

  useEffect(() => {
    carregar();
    get<Categoria[]>('categorias.php').then(setCategorias).catch(() => {});
  }, []);

  // pré-visualização da imagem escolhida (o URL temporário é libertado quando muda)
  useEffect(() => {
    if (!ficheiro) {
      setPrevisao(null);
      return;
    }
    const url = URL.createObjectURL(ficheiro);
    setPrevisao(url);
    return () => URL.revokeObjectURL(url);
  }, [ficheiro]);

  function editar(produto: Produto) {
    setFormulario({
      id: produto.id,
      nome: produto.nome,
      nome_en: produto.nome_en ?? '',
      descricao: produto.descricao ?? '',
      descricao_en: produto.descricao_en ?? '',
      preco: String(produto.preco),
      stock: String(produto.stock),
      categoria_id: String(produto.categoria_id),
      destaque: produto.destaque,
      imagem: produto.imagem,
    });
    setFicheiro(null);
    setMensagem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    const verificacao = validar(esquemaProduto, formulario);
    if (!verificacao.dados) {
      return setMensagem({ tipo: 'danger', texto: primeiroErro(verificacao.erros) });
    }

    const dados = new FormData();
    dados.append('acao', 'guardar');
    dados.append('id', formulario.id ? String(formulario.id) : '');
    dados.append('nome', formulario.nome);
    dados.append('nome_en', formulario.nome_en);
    dados.append('descricao', formulario.descricao);
    dados.append('descricao_en', formulario.descricao_en);
    dados.append('preco', formulario.preco);
    dados.append('stock', formulario.stock);
    dados.append('categoria_id', formulario.categoria_id);
    dados.append('destaque', formulario.destaque ? '1' : '0');
    if (ficheiro) {
      dados.append('imagem', ficheiro);
    }

    setAGuardar(true);
    try {
      await post('admin/produtos.php', dados);
      setMensagem({ tipo: 'success', texto: formulario.id ? t('aprodutos.atualizado') : t('aprodutos.criado') });
      setFormulario(null);
      carregar();
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
    setAGuardar(false);
  }

  async function apagar(produto: Produto) {
    if (!confirm(t('aprodutos.confirmarApagar', { nome: produto.nome }))) return;

    const dados = new FormData();
    dados.append('acao', 'apagar');
    dados.append('id', String(produto.id));
    try {
      await post('admin/produtos.php', dados);
      setMensagem({ tipo: 'success', texto: t('aprodutos.apagado') });
      carregar();
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
  }

  const imagemMostrada = previsao ?? (formulario?.imagem ? imagemProduto(formulario.imagem) : null);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold mb-0">{t('admin.produtos')}</h1>
        {!formulario && (
          <button className="btn btn-outline-light" onClick={() => { setFormulario({ ...VAZIO }); setFicheiro(null); setMensagem(null); }}>
            <i className="bi bi-plus-lg me-1"></i>{t('aprodutos.novo')}
          </button>
        )}
      </div>

      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}

      {formulario && (
        <form className="painel p-4 mb-4" onSubmit={guardar}>
          <h2 className="h5 fw-bold mb-3">{formulario.id ? t('aprodutos.editar') : t('aprodutos.novo')}</h2>
          <div className="row g-3">
            <div className="col-md-8">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="nome" className="form-label">{t('geral.nome')}</label>
                  <input id="nome" className="form-control" value={formulario.nome} onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })} required maxLength={150} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="nome_en" className="form-label">{t('geral.emIngles', { campo: t('geral.nome') })}</label>
                  <input id="nome_en" className="form-control" lang="en" value={formulario.nome_en} onChange={(e) => setFormulario({ ...formulario, nome_en: e.target.value })} maxLength={150} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="descricao" className="form-label">{t('geral.descricao')}</label>
                  <textarea id="descricao" className="form-control" rows={3} value={formulario.descricao} onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}></textarea>
                </div>
                <div className="col-md-6">
                  <label htmlFor="descricao_en" className="form-label">{t('geral.emIngles', { campo: t('geral.descricao') })}</label>
                  <textarea id="descricao_en" className="form-control" lang="en" rows={3} value={formulario.descricao_en} onChange={(e) => setFormulario({ ...formulario, descricao_en: e.target.value })}></textarea>
                </div>
                <div className="col-12 form-text mt-1">{t('geral.emInglesAjuda')}</div>
                <div className="col-sm-4">
                  <label htmlFor="preco" className="form-label">{t('aprodutos.precoEuros')}</label>
                  <input id="preco" type="number" step="0.01" min="0.01" className="form-control" value={formulario.preco} onChange={(e) => setFormulario({ ...formulario, preco: e.target.value })} required />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="stock" className="form-label">{t('aprodutos.stock')}</label>
                  <input id="stock" type="number" step="1" min="0" className="form-control" value={formulario.stock} onChange={(e) => setFormulario({ ...formulario, stock: e.target.value })} required />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="categoria" className="form-label">{t('aprodutos.categoria')}</label>
                  <select id="categoria" className="form-select" value={formulario.categoria_id} onChange={(e) => setFormulario({ ...formulario, categoria_id: e.target.value })} required>
                    <option value="">{t('aprodutos.escolher')}</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input id="destaque" type="checkbox" className="form-check-input" checked={formulario.destaque} onChange={(e) => setFormulario({ ...formulario, destaque: e.target.checked })} />
                    <label htmlFor="destaque" className="form-check-label">{t('aprodutos.destaqueAjuda')}</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="imagem" className="form-label">{t('geral.imagem')}</label>
              <input id="imagem" type="file" accept="image/jpeg,image/png,image/webp" className="form-control mb-3" onChange={(e) => setFicheiro(e.target.files?.[0] ?? null)} />
              {imagemMostrada && <Imagem src={imagemMostrada} alt={t('aprodutos.previsao')} className="img-quadrada rounded-3" />}
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-outline-light" disabled={aGuardar}>{aGuardar ? t('geral.aGuardar') : t('geral.guardar')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setFormulario(null)}>{t('geral.cancelar')}</button>
          </div>
        </form>
      )}

      {produtos === null ? (
        <Carregando />
      ) : (
        <div className="painel table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th></th><th>{t('geral.nome')}</th><th>{t('aprodutos.categoria')}</th><th className="text-end">{t('geral.preco')}</th><th className="text-end">{t('aprodutos.stock')}</th><th className="text-center">{t('aprodutos.destaque')}</th><th></th></tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td><Imagem src={imagemProduto(produto.imagem)} alt="" className="miniatura" width="64" height="64" /></td>
                  <td className="fw-semibold">{produto.nome}</td>
                  <td>{produto.categoria}</td>
                  <td className="text-end">{euros(produto.preco)}</td>
                  <td className={'text-end' + (produto.stock < 5 ? ' text-warning' : '')}>{produto.stock}</td>
                  <td className="text-center">{produto.destaque && <i className="bi bi-star-fill"></i>}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-light me-1" onClick={() => editar(produto)} aria-label={t('geral.editarX', { nome: produto.nome })}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => apagar(produto)} aria-label={t('geral.apagarX', { nome: produto.nome })}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
