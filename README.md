# Waves of Neptune - Ecommerce de banda.

Website de e-commerce da banda Waves of Neptune. Os clientes podem ver o catálogo, pôr produtos no carrinho, fazer encomendas e pagá-las, reservar e pagar bilhetes para os concertos, acompanhar a entrega, pedir ajuda à equipa e subscrever a newsletter. A equipa gere produtos, categorias, encomendas e envios, concertos, tickets de suporte, utilizadores e a newsletter, e consulta as estatísticas de vendas.

Inclui autenticação de dois fatores, emails pelo Resend, pagamentos (com fornecedor simulado), logística com rastreamento e tickets de suporte.

Front-end em React + TypeScript com Bootstrap. Back-end em PHP com MySQL.

## O que é preciso

- XAMPP (PHP 8 ou mais recente + MySQL/MariaDB + phpMyAdmin)
- Um browser atual

O Node.js só é preciso para alterar o front-end (ver "Desenvolvimento"). A versão compilada já vem incluída.

## Instalação

O Apache só pode servir a pasta **`public/`**. O resto (`servidor/` com a configuração, o PHP interno e os emails de desenvolvimento, `sql/` com a base de dados e as passwords das contas de teste, `frontend/` com o código-fonte) fica fora da raiz servida e nunca chega ao browser.

1. No XAMPP, ligar o Apache e o MySQL.
2. No phpMyAdmin, ir a Importar e escolher `sql/waves_of_neptune.sql`. Cria a base de dados `waves_of_neptune` com produtos, categorias, concertos, contas de teste, duas encomendas pagas com rastreamento e um ticket de exemplo. Atenção: se a base de dados já existir, é apagada e criada de novo.
3. Copiar `servidor/config.exemplo.php` para `servidor/config.php` e preencher: dados da base de dados, `WON_URL_SITE`, o email (ver "Email com o Resend") e um `WON_PAGAMENTOS_SEGREDO` aleatório (`php -r "echo bin2hex(random_bytes(32));"`; o valor do exemplo é recusado).
4. Copiar a pasta `waves_of_neptune` para um sítio **fora** do `htdocs` (ex.: `D:/projetos/waves_of_neptune`) e, no fim do `D:\xampp\apache\conf\extra\httpd-xampp.conf` (ou do `httpd.conf`), acrescentar (com o teu caminho):

   ```apache
   Alias /waves_of_neptune "D:/projetos/waves_of_neptune/public"
   <Directory "D:/projetos/waves_of_neptune/public">
       AllowOverride All
       Require all granted
   </Directory>
   ```

   Reiniciar o Apache e abrir http://localhost/waves_of_neptune/ (e pôr esse endereço em `WON_URL_SITE`). Num alojamento, o `DocumentRoot` do domínio aponta para a `public/`.

   Não copiar o projeto inteiro para o `htdocs`: aí a proteção das pastas internas depende só dos `.htaccess`, e com `AllowOverride None` ficam abertas.

Sem Apache também funciona: abrir um terminal na pasta, correr `php -S localhost:8080 -t public router.php` e abrir http://localhost:8080/ (o `router.php` aplica as mesmas regras de segurança do `.htaccess`).

## Contas de teste

| Papel | Email | Password | O que pode fazer |
|---|---|---|---|
| Administrador | admin@won.pt | Admin1234 | tudo (com 2FA obrigatória) |
| Suporte | suporte@won.pt | Suporte1234 | encomendas, envios, tickets de suporte e reservas |
| Cliente | cliente@won.pt | Cliente1234 | comprar, reservar e gerir os próprios dados |

As contas novas criadas em "Criar conta" ficam como cliente. O administrador muda o papel de qualquer conta em Admin > Utilizadores.

Estas três contas vêm já criadas no `sql/waves_of_neptune.sql`, com passwords curtas só para testar (as contas novas exigem pelo menos 10 caracteres). Antes de pôr o site online, mudar as passwords delas no perfil ou apagá-las.

O administrador tem sempre autenticação de dois fatores: depois da password, é pedido um código de 6 algarismos enviado por email. Em desenvolvimento (`WON_EMAIL_FORNECEDOR = 'registo'`) os emails não são enviados: ficam em `servidor/registos/emails.log` (fora da `public/`, o browser não lhe chega), e é lá que se vê o código. Os clientes podem ligar a 2FA no perfil.

## Funcionalidades

Área pública:
- Página inicial com o álbum em destaque, produtos em destaque, categorias e newsletter.
- Loja com filtro por categoria, pesquisa, ordenação e paginação (9 produtos por página). Os filtros e a página ficam no endereço, por isso dá para partilhar o link.
- Página de cada produto com stock, quantidade, adicionar ao carrinho e produtos relacionados.
- Carrinho com adicionar, remover e mudar quantidades, subtotal e total calculados na hora.
- Checkout com os dados de envio, preenchidos a partir do perfil.
- Concertos: próximas datas com reserva de bilhetes (até 6 por reserva, cada uma com um código WON-XXXX-XXXX) e concertos anteriores.
- Newsletter com consentimento explícito e link de cancelamento.
- Registo e login com sessão.
- A minha conta: encomendas, bilhetes (com a opção de cancelar antes do concerto) e perfil.
- Página "A Banda" com os membros, a música e a galeria.

Área de administração (cada papel só vê o que pode fazer):
- Painel com vendas, encomendas, clientes, encomendas por estado, mais vendidos e stock baixo.
- Produtos e categorias.
- Encomendas: filtrar por estado e mudar o estado (ao cancelar, o stock volta para os produtos).
- Concertos: criar, editar, cancelar e ver as reservas de cada um.
- Newsletter: lista de subscritores e exportação em CSV.
- Utilizadores: lista, encomendas, total gasto e papel de cada um.

## Português e inglês

O site existe nas duas línguas: o botão com o globo, no fim do menu, troca entre PT e EN (na primeira visita segue a língua do browser). Os produtos, categorias e concertos têm campos em inglês no admin (vazios = português). Os emails (código 2FA, envios, tickets, pagamentos e o link da newsletter) chegam na língua que cada pessoa usa no site.

## Pagamentos, 2FA, envios e suporte

### Email com o Resend

1. Criar conta em https://resend.com, verificar o domínio da loja e criar uma API key.
2. No `servidor/config.php`: `WON_EMAIL_FORNECEDOR => 'resend'`, `WON_RESEND_CHAVE => 're_...'` e `WON_EMAIL_REMETENTE => 'Waves of Neptune <loja@o-teu-dominio.pt>'`.
3. Opcional: `WON_EMAIL_SUPORTE` recebe um aviso de cada ticket novo.

A chave fica só no servidor. Emails enviados: código 2FA, pagamento recebido, encomenda enviada/entregue, respostas e resolução de tickets, e a newsletter (com link de cancelamento). Cada envio fica registado em `notifications_log` (sem o conteúdo). Em produção, sem Resend configurado, os emails falham em vez de serem escritos num ficheiro.

### Pagamentos

A camada de pagamentos (`servidor/nucleo/pagamentos.php`) não depende de nenhum fornecedor. Hoje está ligado o fornecedor **simulado**: depois do checkout (ou da reserva de bilhetes) o cliente vai para uma página onde escolhe se o pagamento é aceite ou recusado, para testar o fluxo inteiro sem cobranças reais. O simulado só funciona com `WON_AMBIENTE = 'desenvolvimento'`: em produção o cliente nunca pode marcar o próprio pagamento como pago.

Para ligar um fornecedor real (Stripe, Easypay, ifthenpay...):
1. Criar uma classe que implemente `FornecedorPagamento` (`nome()` e `criar()`, que devolve o id do pagamento no fornecedor e o endereço https para onde mandar o cliente) e acrescentá-la a `fornecedor_pagamentos()`.
2. Pôr o nome em `WON_PAGAMENTOS_FORNECEDOR`.
3. Configurar no fornecedor o aviso de pagamento (webhook) para `api/pagamentos_webhook.php` (em `public/`), assinado com HMAC-SHA256 do corpo no header `X-Assinatura` (o segredo é o `WON_PAGAMENTOS_SEGREDO`). Se o fornecedor usar outro formato de assinatura, adapta-se a função `assinatura_valida()`.

O valor vem sempre da base de dados, cada cliente só paga o que é seu, e repetir o mesmo aviso não muda nada.

### Logística e rastreamento

Em Admin > Encomendas, nos detalhes de cada encomenda: transportadora, código de rastreio e link (só https), e os passos da entrega (em trânsito, em distribuição, entregue, incidente...). A encomenda passa a "enviada"/"entregue" automaticamente e o cliente recebe email nos passos importantes. Na conta, o cliente vê a cronologia da entrega.

### Tickets de suporte

Na conta, separador "Suporte": o cliente abre um pedido (com o tipo de problema e, opcionalmente, a encomenda), conversa com a equipa e fecha-o. Em Admin > Suporte, a equipa vê os tickets (urgentes primeiro), filtra por estado, prioridade ou "atribuídos a mim", responde ao cliente ou deixa notas internas (o cliente nunca as vê), muda o estado e a prioridade e atribui a alguém. Se o cliente responder a um ticket resolvido, ele volta a abrir e conta como reabertura (como no ITSM).

### WhatsApp / SMS

Em standby. O lugar está preparado em `servidor/nucleo/notificacoes.php` (`whatsapp()`) e em `WON_WHATSAPP_FORNECEDOR` no `config.php`; quando for ligado (ex.: Twilio), a 2FA e os avisos podem ir também por WhatsApp.

## Tecnologias

| Tecnologia | Onde |
|---|---|
| HTML5 e CSS3 | `frontend/index.html`, `frontend/src/estilo.css` |
| Bootstrap 5 e Bootstrap Icons | layout responsivo, grelhas, formulários e tabelas |
| React 19 | toda a interface (`frontend/src`), com React Router |
| TypeScript | todo o front-end. A lógica do carrinho está em `frontend/src/carrinho.ts` |
| Zod | validação dos formulários (`frontend/src/validacao.ts`), com as mesmas regras do servidor |
| PHP 8 | endpoints em `public/api/`; núcleo e classes em `servidor/` |
| MySQL | `sql/waves_of_neptune.sql` |

## Estrutura

```
waves_of_neptune/
├── .htaccess                rede de segurança: bloqueia tudo se o projeto inteiro for parar ao htdocs
├── router.php               servidor de desenvolvimento (php -S -t public) com as regras do .htaccess
├── public/                  a ÚNICA pasta que o Apache serve (DocumentRoot ou Alias)
│   ├── .htaccess            cabeçalhos de segurança, cache, uploads sem PHP
│   ├── index.html, assets/  versão compilada do front-end (gerada pelo build)
│   ├── api/                 endpoints em PHP (respondem em JSON)
│   │   ├── auth.php, perfil.php, produtos.php, categorias.php, encomendas.php
│   │   ├── concertos.php, bilhetes.php, newsletter.php
│   │   ├── pagamentos.php, pagamentos_webhook.php, suporte.php
│   │   └── admin/           estatisticas, produtos, categorias, encomendas, envios, concertos, newsletter,
│   │                        suporte, utilizadores
│   ├── media/img/           imagens da banda
│   └── uploads/             imagens dos produtos e dos concertos
├── servidor/                PHP interno, fora da raiz servida
│   ├── config.exemplo.php   modelo da configuração (o config.php real não vai para o git)
│   ├── ligacao.php          prepara a segurança, a base de dados e a sessão
│   ├── nucleo/              segurança, validação, permissões, limites, uploads
│   ├── classes/             repositórios: Utilizador, Categoria, Produto, Encomenda, Concerto, Newsletter,
│   │                        DoisFatores, Pagamento, Envio, Suporte
│   └── registos/            emails em desenvolvimento (fora do git)
├── frontend/src/            código-fonte React + TypeScript
│   ├── api.ts               pedidos à API (com o token CSRF)
│   ├── validacao.ts         esquemas zod
│   ├── permissoes.ts        o que cada utilizador pode ver
│   ├── carrinho.ts, tipos.ts, formato.ts
│   ├── contextos/, componentes/, paginas/ (+ admin/)
├── docs/
│   ├── GUIA.md              como usar o site (cliente e administração)
│   ├── API.md               contrato da API (pedidos, respostas, permissões)
│   └── ARQUITETURA.md       camadas, segurança e passos para produção
└── sql/                     export da base de dados (estrutura + dados de exemplo)
```

## Segurança

Resumo (os detalhes estão em `docs/ARQUITETURA.md`):

- Passwords com `password_hash`, mínimo de 10 caracteres, e limite de tentativas contra força bruta.
- Sessão em cookie HttpOnly e SameSite=Strict, que expira por inatividade; novo ID no login.
- Token CSRF em todos os POST, sem CORS e com verificação da origem.
- Cabeçalhos de segurança (CSP, X-Frame-Options, nosniff, HSTS em HTTPS).
- Consultas preparadas em todo o SQL e validação de todos os campos no servidor (e com zod no browser).
- Papéis com permissões mínimas (cliente, suporte, admin), confirmados na base de dados em cada pedido.
- Preços, stock e lotação sempre calculados e verificados no servidor, em transação.
- Nenhuma password, chave ou dado de acesso no front-end; configuração fora do código.

## Desenvolvimento

Para alterar o front-end é preciso o Node.js:

```
cd frontend
npm install
```

Para trabalhar com recarregamento automático, ligar o MySQL no XAMPP e correr na pasta frontend:

```
npm run dev                        (abre em http://localhost:5173)
```

O `npm run dev` arranca sozinho o servidor do PHP na porta 8080 (a API e as imagens) e desliga-o quando o fechas; se o MySQL estiver desligado, avisa no terminal.

No fim, `npm run build` (na pasta frontend) gera o `index.html` e a pasta `assets/` em `public/`, a pasta que o Apache serve.

## Problemas comuns

- "Não foi possível ligar à base de dados": o MySQL não está ligado, falta importar o `sql/waves_of_neptune.sql` ou os dados do `servidor/config.php` estão errados.
- "Não foi possível enviar o código": o email não está configurado (ver "Email com o Resend") ou, em desenvolvimento, falta `WON_AMBIENTE => 'desenvolvimento'`.
- A página fica em branco: confirmar que se está a abrir o site pelo Apache (http://localhost/...) ou pelo `php -S ... -t public router.php`, e não com duplo clique no `index.html`.
- "Demasiadas tentativas": o limite contra força bruta foi atingido; esperar 15 minutos.
- As imagens novas não aparecem: confirmar que as pastas `public/uploads/produtos/` e `public/uploads/concertos/` têm permissões de escrita.
