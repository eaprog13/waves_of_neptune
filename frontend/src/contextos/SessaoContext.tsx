import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { definirToken, get, post } from '../api';
import type { Utilizador } from '../tipos';

// com 2FA, a password certa ainda não abre a sessão: falta o código enviado por email
export type ResultadoLogin = { utilizador: Utilizador } | { precisaCodigo: true; destino: string };

interface Sessao {
  utilizador: Utilizador | null;
  carregado: boolean;
  entrar: (email: string, password: string) => Promise<ResultadoLogin>;
  verificarCodigo: (codigo: string) => Promise<Utilizador>;
  reenviarCodigo: () => Promise<void>;
  registar: (nome: string, email: string, password: string) => Promise<Utilizador>;
  sair: () => Promise<void>;
  atualizar: (utilizador: Utilizador) => void;
}

const SessaoContext = createContext<Sessao | null>(null);

async function carregarSessao() {
  const dados = await get<{ utilizador: Utilizador | null; csrf: string }>('auth.php');
  definirToken(dados.csrf);
  return dados.utilizador;
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    carregarSessao()
      .then(setUtilizador)
      .catch(() => setUtilizador(null))
      .finally(() => setCarregado(true));
  }, []);

  // ao entrar o servidor cria uma sessão nova com outro token CSRF
  async function entrar(email: string, password: string): Promise<ResultadoLogin> {
    const dados = await post<{ utilizador?: Utilizador; csrf?: string; dois_fatores?: boolean; destino?: string }>('auth.php', { acao: 'login', email, password });
    if (dados.dois_fatores) {
      return { precisaCodigo: true, destino: dados.destino ?? '' };
    }
    definirToken(dados.csrf!);
    setUtilizador(dados.utilizador!);
    return { utilizador: dados.utilizador! };
  }

  async function verificarCodigo(codigo: string) {
    const dados = await post<{ utilizador: Utilizador; csrf: string }>('auth.php', { acao: 'verificar_codigo', codigo });
    definirToken(dados.csrf);
    setUtilizador(dados.utilizador);
    return dados.utilizador;
  }

  async function reenviarCodigo() {
    await post('auth.php', { acao: 'reenviar_codigo' });
  }

  async function registar(nome: string, email: string, password: string) {
    const dados = await post<{ utilizador: Utilizador; csrf: string }>('auth.php', { acao: 'registo', nome, email, password });
    definirToken(dados.csrf);
    setUtilizador(dados.utilizador);
    return dados.utilizador;
  }

  async function sair() {
    await post('auth.php', { acao: 'logout' });
    setUtilizador(null);
    // a sessão nova tem outro token
    await carregarSessao();
  }

  return (
    <SessaoContext.Provider value={{ utilizador, carregado, entrar, verificarCodigo, reenviarCodigo, registar, sair, atualizar: setUtilizador }}>
      {children}
    </SessaoContext.Provider>
  );
}

export function useSessao() {
  const sessao = useContext(SessaoContext);
  if (!sessao) {
    throw new Error('useSessao tem de estar dentro do SessaoProvider');
  }
  return sessao;
}
