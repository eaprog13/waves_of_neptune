import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mensagemErro, post } from '../api';
import Carregando from '../componentes/Carregando';
import { useSessao } from '../contextos/SessaoContext';
import { t } from '../i18n';

// aberta pelo link de cancelamento de cada email: #/newsletter/cancelar?token=...
export default function NewsletterCancelar() {
  const [parametros] = useSearchParams();
  const { carregado } = useSessao();
  const [resultado, setResultado] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const pedido = useRef(false);

  // espera pela sessão (é ela que traz o token CSRF) e só pede uma vez
  useEffect(() => {
    if (!carregado || pedido.current) return;
    pedido.current = true;

    post<{ mensagem: string }>('newsletter.php', { acao: 'cancelar', token: parametros.get('token') ?? '' })
      .then((r) => setResultado({ tipo: 'success', texto: r.mensagem }))
      .catch((e) => setResultado({ tipo: 'danger', texto: mensagemErro(e) }));
  }, [carregado, parametros]);

  return (
    <div className="container py-5" style={{ maxWidth: 560 }}>
      <div className="painel p-5 text-center">
        <h1 className="h3">{t('newsletter.titulo')}</h1>
        {resultado ? <div className={'alert alert-' + resultado.tipo + ' mt-4'}>{resultado.texto}</div> : <Carregando />}
        <Link to="/" className="btn btn-outline-light mt-3">{t('geral.voltarInicio')}</Link>
      </div>
    </div>
  );
}
