import { useEffect, useState, type FormEvent } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import Imagem from '../../componentes/Imagem';
import { useSessao } from '../../contextos/SessaoContext';
import { dataHora, euros, imagemConcerto } from '../../formato';
import { pode } from '../../permissoes';
import type { Bilhete, Concerto } from '../../tipos';
import { esquemaConcerto, primeiroErro, validar } from '../../validacao';
import { t } from '../../i18n';

const VAZIO = { id: 0, titulo: '', titulo_en: '', local: '', cidade: '', data: '', descricao: '', descricao_en: '', preco: '', lotacao: '', estado: 'agendado' as 'agendado' | 'cancelado', imagem: null as string | null, vendidos: 0 };

export default function Concertos() {
  const { utilizador } = useSessao();
  const podeGerir = pode(utilizador, 'concertos.gerir');

  const [concertos, setConcertos] = useState<Concerto[] | null>(null);
  const [formulario, setFormulario] = useState<typeof VAZIO | null>(null);
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [reservas, setReservas] = useState<{ concerto: Concerto; lista: Bilhete[] } | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  function carregar() {
    get<Concerto[]>('admin/concertos.php').then(setConcertos).catch((e) => setMensagem({ tipo: 'danger', texto: mensagemErro(e) }));
  }

  useEffect(carregar, []);

  function editar(concerto: Concerto) {
    setFormulario({
      id: concerto.id,
      titulo: concerto.titulo,
      titulo_en: concerto.titulo_en ?? '',
      local: concerto.local,
      cidade: concerto.cidade,
      data: concerto.data.slice(0, 16).replace(' ', 'T'),
      descricao: concerto.descricao ?? '',
      descricao_en: concerto.descricao_en ?? '',
      preco: String(concerto.preco),
      lotacao: String(concerto.lotacao),
      estado: concerto.estado,
      imagem: concerto.imagem,
      vendidos: concerto.vendidos,
    });
    setFicheiro(null);
    setMensagem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function verReservas(concerto: Concerto) {
    try {
      setReservas({ concerto, lista: await get<Bilhete[]>('admin/concertos.php?reservas=' + concerto.id) });
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    const { dados, erros } = validar(esquemaConcerto, formulario);
    if (!dados) {
      return setMensagem({ tipo: 'danger', texto: primeiroErro(erros) });
    }

    const envio = new FormData();
    envio.append('acao', 'guardar');
    envio.append('id', formulario.id ? String(formulario.id) : '');
    Object.entries(dados).forEach(([campo, valor]) => envio.append(campo, String(valor)));
    if (ficheiro) {
      envio.append('imagem', ficheiro);
    }

    setAGuardar(true);
    try {
      await post('admin/concertos.php', envio);
      setMensagem({ tipo: 'success', texto: formulario.id ? t('aconcertos.atualizado') : t('aconcertos.criado') });
      setFormulario(null);
      carregar();
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
    setAGuardar(false);
  }

  async function apagar(concerto: Concerto) {
    if (!confirm(t('aconcertos.confirmarApagar', { titulo: concerto.titulo }))) return;
    const envio = new FormData();
    envio.append('acao', 'apagar');
    envio.append('id', String(concerto.id));
    try {
      await post('admin/concertos.php', envio);
      setMensagem({ tipo: 'success', texto: t('aconcertos.apagado') });
      carregar();
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
  }

  const campo = (nome: keyof typeof VAZIO, rotulo: string, props: object = {}) => (
    <div>
      <label htmlFor={nome} className="form-label">{rotulo}</label>
      <input id={nome} className="form-control" value={String(formulario![nome] ?? '')} onChange={(e) => setFormulario({ ...formulario!, [nome]: e.target.value })} {...props} />
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold mb-0">{t('admin.concertos')}</h1>
        {podeGerir && !formulario && (
          <button className="btn btn-outline-light" onClick={() => { setFormulario({ ...VAZIO }); setFicheiro(null); setMensagem(null); }}>
            <i className="bi bi-plus-lg me-1"></i>{t('aconcertos.novo')}
          </button>
        )}
      </div>

      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}

      {formulario && (
        <form className="painel p-4 mb-4" onSubmit={guardar} noValidate>
          <h2 className="h5 fw-bold mb-3">{formulario.id ? t('aconcertos.editar') : t('aconcertos.novo')}</h2>
          <div className="row g-3">
            <div className="col-md-6">{campo('titulo', t('aconcertos.tituloCampo'), { maxLength: 150 })}</div>
            <div className="col-md-6">{campo('titulo_en', t('geral.emIngles', { campo: t('aconcertos.tituloCampo') }), { maxLength: 150, lang: 'en' })}</div>
            <div className="col-md-6">{campo('local', t('aconcertos.local'), { maxLength: 150 })}</div>
            <div className="col-md-6">{campo('cidade', t('geral.cidade'), { maxLength: 100 })}</div>
            <div className="col-md-4">{campo('data', t('aconcertos.dataHora'), { type: 'datetime-local' })}</div>
            <div className="col-md-2">{campo('preco', t('aconcertos.precoEuros'), { type: 'number', step: '0.01', min: '0' })}</div>
            <div className="col-md-2">{campo('lotacao', t('aconcertos.lotacao'), { type: 'number', step: '1', min: String(Math.max(1, formulario.vendidos)) })}</div>
            <div className="col-md-4">
              <label htmlFor="estado" className="form-label">{t('geral.estado')}</label>
              <select id="estado" className="form-select" value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as 'agendado' | 'cancelado' })}>
                <option value="agendado">{t('aconcertos.agendado')}</option>
                <option value="cancelado">{t('aconcertos.cancelado')}</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="descricao" className="form-label">{t('geral.descricao')}</label>
              <textarea id="descricao" className="form-control" rows={3} maxLength={2000} value={formulario.descricao} onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}></textarea>
            </div>
            <div className="col-md-6">
              <label htmlFor="descricao_en" className="form-label">{t('geral.emIngles', { campo: t('geral.descricao') })}</label>
              <textarea id="descricao_en" className="form-control" lang="en" rows={3} maxLength={2000} value={formulario.descricao_en} onChange={(e) => setFormulario({ ...formulario, descricao_en: e.target.value })}></textarea>
            </div>
            <div className="col-12 form-text mt-1">{t('geral.emInglesAjuda')}</div>
            <div className="col-md-6">
              <label htmlFor="imagem" className="form-label">{t('geral.imagem')}</label>
              <input id="imagem" type="file" accept="image/jpeg,image/png,image/webp" className="form-control" onChange={(e) => setFicheiro(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          {formulario.vendidos > 0 && <p className="text-secondary small mt-3 mb-0">{t('aconcertos.jaReservados', { n: formulario.vendidos })}</p>}
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-outline-light" disabled={aGuardar}>{aGuardar ? t('geral.aGuardar') : t('geral.guardar')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setFormulario(null)}>{t('geral.cancelar')}</button>
          </div>
        </form>
      )}

      {concertos === null ? (
        <Carregando />
      ) : (
        <div className="painel table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th></th><th>{t('aconcertos.concerto')}</th><th>{t('geral.data')}</th><th className="text-end">{t('geral.preco')}</th><th className="text-end">{t('aconcertos.reservados')}</th><th>{t('geral.estado')}</th><th></th></tr>
            </thead>
            <tbody>
              {concertos.map((concerto) => (
                <tr key={concerto.id}>
                  <td><Imagem src={imagemConcerto(concerto.imagem)} alt="" className="miniatura" width="64" height="64" /></td>
                  <td className="fw-semibold">{concerto.titulo}<div className="text-secondary small">{concerto.local}, {concerto.cidade}</div></td>
                  <td className="text-nowrap">{dataHora(concerto.data)}</td>
                  <td className="text-end">{euros(concerto.preco)}</td>
                  <td className="text-end">{concerto.vendidos} / {concerto.lotacao}</td>
                  <td>
                    {concerto.estado === 'cancelado' ? <span className="badge text-bg-danger">{t('aconcertos.cancelado')}</span>
                      : concerto.passado ? <span className="badge text-bg-secondary">{t('aconcertos.realizado')}</span>
                      : <span className="badge text-bg-success">{t('aconcertos.agendado')}</span>}
                  </td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-light me-1" onClick={() => verReservas(concerto)} aria-label={t('aconcertos.reservasDe', { titulo: concerto.titulo })}><i className="bi bi-people"></i></button>
                    {podeGerir && <button className="btn btn-sm btn-outline-light me-1" onClick={() => editar(concerto)} aria-label={t('geral.editarX', { nome: concerto.titulo })}><i className="bi bi-pencil"></i></button>}
                    {podeGerir && <button className="btn btn-sm btn-outline-danger" onClick={() => apagar(concerto)} aria-label={t('geral.apagarX', { nome: concerto.titulo })}><i className="bi bi-trash"></i></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reservas && (
        <div className="painel p-4 mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-bold mb-0">{t('aconcertos.reservasTitulo', { titulo: reservas.concerto.titulo })}</h2>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setReservas(null)}>{t('geral.fechar')}</button>
          </div>
          {reservas.lista.length === 0 ? (
            <p className="text-secondary mb-0">{t('aconcertos.semReservas')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>{t('aconcertos.codigo')}</th><th>{t('geral.cliente')}</th><th className="text-end">{t('aconcertos.bilhetes')}</th><th className="text-end">{t('geral.total')}</th><th>{t('geral.estado')}</th><th>{t('aconcertos.reservadoEm')}</th></tr></thead>
                <tbody>
                  {reservas.lista.map((b) => (
                    <tr key={b.id}>
                      <td className="preco">{b.codigo}</td>
                      <td>{b.nome}<div className="text-secondary small">{b.email}</div></td>
                      <td className="text-end">{b.quantidade}</td>
                      <td className="text-end">{euros(b.total)}</td>
                      <td>{b.estado === 'reservado' ? <span className="badge text-bg-success">{t('aconcertos.reservado')}</span> : <span className="badge text-bg-secondary">{t('aconcertos.cancelado')}</span>}</td>
                      <td className="text-nowrap">{dataHora(b.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
