import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// o estilo.css vem depois do bootstrap para o poder substituir
import 'bootstrap/dist/css/bootstrap.min.css';
import './icones.css';
import '@fontsource-variable/cinzel';
import '@fontsource-variable/inter';
import './estilo.css';
import App from './App';
import { IdiomaProvider } from './contextos/IdiomaContext';
import { SessaoProvider } from './contextos/SessaoContext';
import { CarrinhoProvider } from './contextos/CarrinhoContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IdiomaProvider>
      <SessaoProvider>
        <CarrinhoProvider>
          <App />
        </CarrinhoProvider>
      </SessaoProvider>
    </IdiomaProvider>
  </StrictMode>,
);
