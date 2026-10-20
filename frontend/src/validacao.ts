import { z } from 'zod';
import { t, type Chave } from './i18n';

// as mesmas regras e mensagens que o servidor verifica (api/nucleo/validador.php):
// o erro aparece logo no formulário, mas quem decide é sempre o servidor.
// as mensagens são funções: são lidas na altura do erro, já na língua escolhida

// mensagem traduzida na altura do erro; o rótulo também é uma chave (ex.: 'rot.nome' -> "O nome" / "The name")
function erro(chave: Chave, valores: { rotulo?: Chave; minimo?: number; maximo?: number } = {}) {
  return { error: () => t(chave, { ...valores, rotulo: valores.rotulo ? t(valores.rotulo) : '' }) };
}

const texto = (rotulo: Chave, minimo: number, maximo: number) => {
  const mensagem = erro('val.texto', { rotulo, minimo, maximo });
  return z.string().trim().min(minimo, mensagem).max(maximo, mensagem);
};

// campo que pode ficar vazio, mas se tiver alguma coisa tem de ser válido
const opcional = (esquema: z.ZodType<string>) => z.union([z.literal(''), esquema]);

const email = z.string().trim().toLowerCase().max(150, erro('val.email')).email(erro('val.email'));
const password = z.string().min(10, erro('val.password')).max(128, erro('val.password'));
const telefone = z.string().trim().regex(/^\+?[0-9 ]{9,15}$/, erro('val.telefone'));
const codigoPostal = z.string().trim().regex(/^\d{4}-\d{3}$/, erro('val.codigoPostal'));

const numero = (rotulo: Chave, minimo: number, maximo: number, inteiro = false) => {
  const mensagem = erro(inteiro ? 'val.inteiro' : 'val.valor', { rotulo, minimo, maximo });
  // coerce: os inputs devolvem texto, o zod converte para número antes de validar
  const base = z.coerce.number(mensagem).min(minimo, mensagem).max(maximo, mensagem);
  return inteiro ? base.int(mensagem) : base;
};

export const esquemaLogin = z.object({
  email,
  password: z.string().min(1, erro('val.indicaPassword')),
});

export const esquemaRegisto = z
  .object({ nome: texto('rot.nome', 2, 100), email, password, confirmar: z.string() })
  .refine((d) => d.password === d.confirmar, { ...erro('val.passwordsDiferentes'), path: ['confirmar'] });

export const esquemaEnvio = z.object({
  nome: texto('rot.nome', 2, 100),
  telefone,
  morada: texto('rot.morada', 5, 200),
  codigo_postal: codigoPostal,
  cidade: texto('rot.cidade', 2, 100),
});

export const esquemaPerfil = z.object({
  nome: texto('rot.nome', 2, 100),
  email,
  telefone: opcional(telefone),
  morada: opcional(texto('rot.morada', 5, 200)),
  codigo_postal: opcional(codigoPostal),
  cidade: opcional(texto('rot.cidade', 2, 100)),
});

export const esquemaNovaPassword = z
  .object({ atual: z.string().min(1, erro('val.indicaPasswordAtual')), nova: password, confirmar: z.string() })
  .refine((d) => d.nova === d.confirmar, { ...erro('val.novasDiferentes'), path: ['confirmar'] });

export const esquemaProduto = z.object({
  nome: texto('rot.nome', 2, 150),
  nome_en: opcional(texto('rot.nomeEn', 2, 150)),
  descricao: z.string().max(2000, erro('val.texto', { rotulo: 'rot.descricao', minimo: 0, maximo: 2000 })),
  descricao_en: z.string().max(2000, erro('val.texto', { rotulo: 'rot.descricaoEn', minimo: 0, maximo: 2000 })),
  preco: numero('rot.preco', 0.01, 10000),
  stock: numero('rot.stock', 0, 100000, true),
  categoria_id: z.string().min(1, erro('val.categoria')),
});

export const esquemaCategoria = z.object({
  nome: texto('rot.nome', 2, 100),
  nome_en: opcional(texto('rot.nomeEn', 2, 100)),
});

export const esquemaConcerto = z.object({
  titulo: texto('rot.titulo', 2, 150),
  titulo_en: opcional(texto('rot.tituloEn', 2, 150)),
  local: texto('rot.local', 2, 150),
  cidade: texto('rot.cidade', 2, 100),
  data: z.string().min(1, erro('val.data')),
  descricao: z.string().max(2000, erro('val.texto', { rotulo: 'rot.descricao', minimo: 0, maximo: 2000 })),
  descricao_en: z.string().max(2000, erro('val.texto', { rotulo: 'rot.descricaoEn', minimo: 0, maximo: 2000 })),
  preco: numero('rot.preco', 0, 1000),
  lotacao: numero('rot.lotacao', 1, 100000, true),
  estado: z.enum(['agendado', 'cancelado']),
});

export const esquemaNewsletter = z.object({
  email,
  consentimento: z.literal(true, erro('val.consentimento')),
});

export const esquemaReserva = z.object({
  quantidade: numero('rot.quantidade', 1, 6, true),
});

export const esquemaCodigo = z.object({
  codigo: z.string().trim().regex(/^\d{6}$/, erro('val.codigo')),
});

export const esquemaTicket = z.object({
  assunto: texto('rot.assunto', 5, 150),
  categoria: z.enum(['atraso', 'danificado', 'produto_errado', 'em_falta', 'devolucao', 'pagamento', 'outro'], erro('val.tipoProblema')),
  mensagem: texto('rot.mensagem', 10, 3000),
  encomenda_id: z.string(),
});

export const esquemaResposta = z.object({ mensagem: texto('rot.mensagem', 1, 3000) });

export const esquemaEnvioEncomenda = z.object({
  transportadora: z.enum(['CTT', 'DPD', 'GLS', 'UPS', 'SEUR', 'Outra'], erro('val.transportadora')),
  codigo: z.string().trim().regex(/^[A-Za-z0-9-]{4,60}$/, erro('val.codigoRastreio')),
  url: z.union([z.literal(''), z.string().trim().max(255).url(erro('val.linkRastreio')).startsWith('https://', erro('val.linkRastreio'))]),
});

export const esquemaEventoEnvio = z.object({
  estado: z.enum(['em_preparacao', 'enviada', 'em_transito', 'em_distribuicao', 'entregue', 'devolvida', 'incidente']),
  descricao: texto('rot.descricao', 3, 255),
  local: z.string().trim().max(100, erro('val.texto', { rotulo: 'rot.local', minimo: 0, maximo: 100 })),
});

export const esquemaEnvioNewsletter = z.object({
  assunto: texto('rot.assunto', 3, 150),
  mensagem: texto('rot.mensagem', 10, 10000),
});

// devolve os dados limpos ou um erro por campo (o primeiro de cada um)
export function validar<T>(esquema: z.ZodType<T>, dados: unknown): { dados: T | null; erros: Record<string, string> } {
  const resultado = esquema.safeParse(dados);
  if (resultado.success) {
    return { dados: resultado.data, erros: {} };
  }
  const erros: Record<string, string> = {};
  for (const problema of resultado.error.issues) {
    const campo = String(problema.path[0] ?? 'geral');
    erros[campo] ??= problema.message;
  }
  return { dados: null, erros };
}

export function primeiroErro(erros: Record<string, string>) {
  return Object.values(erros)[0] ?? '';
}
