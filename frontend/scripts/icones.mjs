// gera src/icones.css só com os ícones do Bootstrap Icons que o site usa (procura "bi-..." no código).
// em vez da fonte com os 2000 ícones (131 KB), cada ícone é o SVG oficial embutido no CSS,
// desenhado com o mesmo tamanho (1em), cor (a do texto) e alinhamento que a fonte usava.
// corre sozinho antes do npm run dev e do npm run build; à mão: npm run icones
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const src = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pastaIcones = join(src, '../node_modules/bootstrap-icons/icons');

function ficheiros(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? ficheiros(join(pasta, f.name)) : /\.(tsx?|html)$/.test(f.name) ? [join(pasta, f.name)] : [],
  );
}

const usados = new Set();
for (const ficheiro of [...ficheiros(src), join(src, '../index.html')]) {
  for (const [, nome] of readFileSync(ficheiro, 'utf8').matchAll(/\bbi-([a-z0-9-]+)/g)) {
    if (existsSync(join(pastaIcones, nome + '.svg'))) usados.add(nome);
  }
}

// o SVG vai num data URL: sem tamanho nem classes, e com os caracteres especiais codificados
function dataUrl(nome) {
  const svg = readFileSync(join(pastaIcones, nome + '.svg'), 'utf8')
    .replace(/\s(width|height|fill|class)="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim();
  return 'data:image/svg+xml,' + svg.replace(/"/g, "'").replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E');
}

const regras = [...usados].sort().map((nome) => `.bi-${nome} { --bi: url("${dataUrl(nome)}"); }`);

writeFileSync(
  join(src, 'icones.css'),
  `/* gerado por scripts/icones.mjs (não editar à mão): ${usados.size} ícones do Bootstrap Icons em SVG */
.bi::before {
  content: "";
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  background-color: currentColor;
  -webkit-mask: var(--bi) center / contain no-repeat;
  mask: var(--bi) center / contain no-repeat;
}

${regras.join('\n')}
`,
);
console.log(`icones.css: ${usados.size} ícones`);
