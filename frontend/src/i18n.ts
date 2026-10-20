// as duas línguas do site. t('chave') devolve o texto na língua atual;
// a escolha fica guardada no browser e, na primeira visita, segue a língua do browser
import pt, { type Chave } from './textos/pt';
import en from './textos/en';

export type Idioma = 'pt' | 'en';
export type { Chave };

const TEXTOS: Record<Idioma, Record<Chave, string>> = { pt, en };
const GUARDADO = 'won_idioma';

function inicial(): Idioma {
  try {
    const guardado = localStorage.getItem(GUARDADO);
    if (guardado === 'pt' || guardado === 'en') return guardado;
  } catch {
    // sem acesso ao localStorage (ex.: modo privado restrito): segue o browser
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

let atual: Idioma = inicial();

export function idioma() {
  return atual;
}

export function definirIdioma(novo: Idioma) {
  atual = novo;
  try {
    localStorage.setItem(GUARDADO, novo);
  } catch {
    // não guarda, mas a troca funciona na mesma
  }
}

// formato dos números, preços e datas de cada língua
export function regiao() {
  return atual === 'pt' ? 'pt-PT' : 'en-GB';
}

export function t(chave: Chave, valores?: Record<string, string | number | undefined>) {
  let texto = TEXTOS[atual][chave];
  for (const [nome, valor] of Object.entries(valores ?? {})) {
    if (valor !== undefined) {
      texto = texto.replaceAll('{' + nome + '}', String(valor));
    }
  }
  return texto;
}
