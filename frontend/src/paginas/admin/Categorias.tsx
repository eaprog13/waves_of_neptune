import { useEffect, useState, type FormEvent } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import type { Categoria } from '../../tipos';
import { esquemaCategoria, primeiroErro, validar } from '../../validacao';
import { t } from '../../i18n';

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [nome, setNome] = useState('');
  const [nomeEn, setNomeEn] = useState('');
  const [aEditar, setAEditar] = useState<Categoria | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  useEffect(() => {
    get<Categoria[]>('admin/categorias.php').then(setCategorias).catch(() => setCategorias([]));
  }, []);

  async function enviar(dados: object, sucesso: string) {
    try {
      setCategorias(await post<Categoria[]>('admin/categorias.php', dados));
      setMensagem({ tipo: 'success', texto: sucesso });
      return true;
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
      return false;
    }
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const { dados, erros } = validar(esquemaCategoria, { nome, nome_en: nomeEn });
    if (!dados) {
      return setMensagem({ tipo: 'danger', texto: primeiroErro(erros) });
    }
    const ok = await enviar({ acao: 'guardar', id: aEditar?.id ?? 0, nome: dados.nome, nome_en: dados.nome_en }, aEditar ? t('acategorias.atualizada') : t('acategorias.criada'));
    if (ok) {
      setNome('');
      setNomeEn('');
      setAEditar(null);
    }
  }

  function editar(categoria: Categoria) {
    setAEditar(categoria);
    setNome(categoria.nome);
    setNomeEn(categoria.nome_en ?? '');
    setMensagem(null);
  }

  function apagar(categoria: Categoria) {
    if (confirm(t('acategorias.confirmarApagar', { nome: categoria.nome }))) {
      enviar({ acao: 'apagar', id: categoria.id }, t('acategorias.apagada'));
    }
  }

  return (
    <>
      <h1 className="h3 fw-bold mb-4">{t('admin.categorias')}</h1>
      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <form className="painel p-4" onSubmit={guardar}>
            <h2 className="h6 fw-bold mb-3">{aEditar ? t('acategorias.mudarNome') : t('acategorias.nova')}</h2>
            <input className="form-control mb-2" placeholder={t('acategorias.nome')} value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={100} aria-label={t('acategorias.nome')} />
            <input className="form-control mb-1" lang="en" placeholder={t('geral.emIngles', { campo: t('acategorias.nome') })} value={nomeEn} onChange={(e) => setNomeEn(e.target.value)} maxLength={100} aria-label={t('geral.emIngles', { campo: t('acategorias.nome') })} />
            <div className="form-text mb-3">{t('geral.emInglesAjuda')}</div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-outline-light">{aEditar ? t('geral.guardar') : t('geral.adicionar')}</button>
              {aEditar && <button type="button" className="btn btn-outline-secondary" onClick={() => { setAEditar(null); setNome(''); setNomeEn(''); }}>{t('geral.cancelar')}</button>}
            </div>
          </form>
        </div>

        <div className="col-lg-8">
          {categorias === null ? (
            <Carregando />
          ) : (
            <div className="painel table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>{t('geral.nome')}</th><th className="text-end">{t('admin.produtos')}</th><th></th></tr></thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.id}>
                      <td className="fw-semibold">{categoria.nome}{categoria.nome_en && <div className="text-secondary small" lang="en">{categoria.nome_en}</div>}</td>
                      <td className="text-end">{categoria.total_produtos}</td>
                      <td className="text-end text-nowrap">
                        <button className="btn btn-sm btn-outline-light me-1" onClick={() => editar(categoria)} aria-label={t('geral.editarX', { nome: categoria.nome })}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => apagar(categoria)} disabled={categoria.total_produtos > 0} title={categoria.total_produtos > 0 ? t('acategorias.temProdutos') : ''} aria-label={t('geral.apagarX', { nome: categoria.nome })}><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
