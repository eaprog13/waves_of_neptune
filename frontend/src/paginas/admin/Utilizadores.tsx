import { useEffect, useState } from 'react';
import { get, mensagemErro, post } from '../../api';
import Carregando from '../../componentes/Carregando';
import { useSessao } from '../../contextos/SessaoContext';
import { data, euros } from '../../formato';
import { pode } from '../../permissoes';
import type { TipoUtilizador, UtilizadorAdmin } from '../../tipos';
import { t } from '../../i18n';

// o texto é um getter: é lido na altura em que aparece, já na língua escolhida
const PAPEIS: Record<TipoUtilizador, { texto: string; cor: string }> = {
  cliente: { get texto() { return t('autilizadores.cliente'); }, cor: 'secondary' },
  suporte: { get texto() { return t('autilizadores.suporte'); }, cor: 'info' },
  admin: { get texto() { return t('autilizadores.admin'); }, cor: 'warning' },
};

export default function Utilizadores() {
  const { utilizador } = useSessao();
  const podeGerir = pode(utilizador, 'utilizadores.gerir');
  const [utilizadores, setUtilizadores] = useState<UtilizadorAdmin[] | null>(null);
  const [pesquisa, setPesquisa] = useState('');
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  // o papel decide as permissões: cliente (só os seus dados), suporte (encomendas) ou admin (tudo)
  async function mudarPapel(alvo: UtilizadorAdmin, tipo: TipoUtilizador) {
    if (!confirm(t('autilizadores.confirmar', { nome: alvo.nome, papel: PAPEIS[tipo].texto }))) return;
    try {
      setUtilizadores(await post<UtilizadorAdmin[]>('admin/utilizadores.php', { id: alvo.id, tipo }));
      setMensagem({ tipo: 'success', texto: t('autilizadores.mudou', { nome: alvo.nome, papel: PAPEIS[tipo].texto }) });
    } catch (e) {
      setMensagem({ tipo: 'danger', texto: mensagemErro(e) });
    }
  }

  useEffect(() => {
    get<UtilizadorAdmin[]>('admin/utilizadores.php').then(setUtilizadores).catch(() => setUtilizadores([]));
  }, []);

  if (!utilizadores) {
    return <Carregando />;
  }

  const termo = pesquisa.trim().toLowerCase();
  const filtrados = utilizadores.filter((u) => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo));

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 fw-bold mb-0">{t('admin.utilizadores')} <span className="text-secondary fs-6">({utilizadores.length})</span></h1>
        <input type="search" className="form-control w-auto" placeholder={t('autilizadores.procurar')} value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} aria-label={t('autilizadores.procurarAria')} />
      </div>

      {mensagem && <div className={'alert alert-' + mensagem.tipo}>{mensagem.texto}</div>}
      <p className="text-secondary small">{t('autilizadores.papeis')}</p>

      <div className="painel table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr><th>{t('geral.nome')}</th><th>{t('geral.email')}</th><th>{t('autilizadores.tipo')}</th><th>{t('geral.cidade')}</th><th className="text-end">{t('autilizadores.encomendas')}</th><th className="text-end">{t('autilizadores.totalGasto')}</th><th>{t('autilizadores.registo')}</th></tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id}>
                <td className="fw-semibold">{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  {podeGerir && u.id !== utilizador?.id ? (
                    <select className="form-select form-select-sm" style={{ minWidth: 110 }} value={u.tipo_utilizador} onChange={(e) => mudarPapel(u, e.target.value as TipoUtilizador)} aria-label={t('autilizadores.papelDe', { nome: u.nome })}>
                      {(Object.keys(PAPEIS) as TipoUtilizador[]).map((tipo) => <option key={tipo} value={tipo}>{PAPEIS[tipo].texto}</option>)}
                    </select>
                  ) : (
                    <span className={'badge text-bg-' + PAPEIS[u.tipo_utilizador].cor}>{PAPEIS[u.tipo_utilizador].texto}</span>
                  )}
                </td>
                <td>{u.cidade ?? '—'}</td>
                <td className="text-end">{u.encomendas}</td>
                <td className="text-end">{euros(u.total_gasto)}</td>
                <td className="text-nowrap">{data(u.criado_em)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
