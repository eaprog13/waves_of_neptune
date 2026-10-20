/// <reference types="node" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss';
import { spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';
import { resolve } from 'node:path';

const PORTA_PHP = 8080;
const API = `http://127.0.0.1:${PORTA_PHP}`;

// diz se já há alguma coisa a ouvir nesta porta (ex.: um php -S aberto à mão, ou o MySQL)
function portaAberta(porta: number) {
  return new Promise<boolean>((resolver) => {
    const ligacao = connect(porta, '127.0.0.1');
    ligacao.once('connect', () => { ligacao.destroy(); resolver(true); });
    ligacao.once('error', () => resolver(false));
  });
}

// o npm run dev arranca sozinho o servidor do PHP (API e imagens) e desliga-o no fim:
// assim não é preciso um segundo terminal, e as imagens e os dados aparecem sempre.
// o PHP é o que estiver no PATH (no XAMPP: D:/xampp/php); para usar outro, define WON_PHP
// fica guardado no globalThis porque o Vite volta a carregar este ficheiro quando se reinicia:
// assim o PHP arranca uma só vez e só é desligado quando o npm run dev termina
const global = globalThis as typeof globalThis & { servidorPhpWon?: ChildProcess };

function servidorPhp(): Plugin {
  return {
    name: 'servidor-php',
    apply: 'serve',
    async configureServer(servidor) {
      const avisos = servidor.config.logger;
      if (!(await portaAberta(3306))) {
        avisos.warn('  Aviso: o MySQL não está ligado. Liga-o no painel do XAMPP, senão a loja não tem dados.');
      }
      if (global.servidorPhpWon || (await portaAberta(PORTA_PHP))) {
        avisos.info(`  PHP: já está a correr em ${API}`);
        return;
      }
      const php = spawn(process.env.WON_PHP ?? 'php', ['-S', `127.0.0.1:${PORTA_PHP}`, '-t', 'public', 'router.php'], {
        cwd: resolve(servidor.config.root, '..'),
        stdio: 'ignore',
      });
      global.servidorPhpWon = php;
      php.once('error', () => {
        global.servidorPhpWon = undefined;
        avisos.error('  Não foi possível arrancar o PHP. Confirma que o php está no PATH (ou define WON_PHP).');
      });
      process.once('exit', () => php.kill());
      avisos.info(`  PHP: a API e as imagens estão em ${API}`);
    },
  };
}

// no build, tira do CSS (bootstrap e ícones) as classes que o site não usa.
// as classes montadas no código (ex.: 'alert-' + tipo, 'text-bg-' + cor) ficam na lista segura
const limparCss = purgeCSSPlugin({
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: {
    standard: [/^(alert|text-bg|border|bg)-(primary|secondary|success|danger|warning|info|light|dark)$/, 'active'],
  },
});

// o build vai para a public/ (index.html + assets/), a pasta que o Apache serve, junto da API e das imagens
// em desenvolvimento, os pedidos à API e às imagens vão para o servidor PHP (arrancado pelo plugin de cima)
export default defineConfig(({ command }) => ({
  plugins: [react(), servidorPhp()],
  base: './',
  css: {
    postcss: { plugins: command === 'build' ? [limparCss] : [] },
  },
  build: {
    outDir: '../public',
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API,
      '/media': API,
    },
  },
}));
