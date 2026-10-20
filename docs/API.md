# Contrato da API

O front-end só fala com o back-end através destes pedidos HTTP, em JSON. Qualquer back-end (PHP, Node, Python...) que responda igual serve o mesmo front-end, e vice-versa.

## Regras gerais

- Base: `api/` no mesmo domínio do site. Não há CORS: só o próprio site (e as origens de `WON_ORIGENS`) pode fazer pedidos.
- Só `GET` (ler) e `POST` (alterar). Outros métodos respondem `405`.
- Sessão por cookie `won_sessao` (HttpOnly, SameSite=Strict, Secure em HTTPS).
- Todos os `POST` levam o header `X-CSRF-Token` com o token devolvido por `GET auth.php`. O token muda no login, no registo e ao mudar a password (vem na resposta).
- Corpo em JSON (máximo 64 KB), exceto uploads de imagens, que são `multipart/form-data`.
- Erros: `{ "erro": "mensagem para o utilizador" }`. Erros de validação trazem também `"erros": ["...", "..."]`.

| Código | Significado |
|---|---|
| 200 / 201 | ok / criado |
| 401 | sem sessão |
| 403 | sem permissão, token CSRF errado ou origem não autorizada |
| 404 | não existe |
| 405 | método não permitido |
| 409 | conflito (sem stock, concerto esgotado, encomenda cancelada...) |
| 413 | pedido demasiado grande |
| 422 | dados inválidos |
| 429 | demasiadas tentativas |
| 500 | erro no servidor (o detalhe só fica no registo do servidor) |

## Papéis e permissões

| Papel | Permissões |
|---|---|
| cliente | nenhuma de admin (só os próprios dados) |
| suporte | `encomendas.ver`, `encomendas.gerir`, `bilhetes.ver`, `tickets.gerir` |
| admin | todas: `estatisticas.ver`, `produtos.gerir`, `categorias.gerir`, `encomendas.ver`, `encomendas.gerir`, `concertos.gerir`, `bilhetes.ver`, `utilizadores.ver`, `utilizadores.gerir`, `newsletter.ver`, `newsletter.enviar`, `tickets.gerir` |

O papel é lido da base de dados em cada pedido: se mudar, a sessão aberta perde (ou ganha) as permissões logo.

## Público

| Pedido | Corpo | Resposta |
|---|---|---|
| `GET auth.php` | — | `{ utilizador: Utilizador \| null, csrf }` |
| `POST auth.php` | `{ acao: "login", email, password }` | `{ utilizador, csrf }` · com 2FA: `{ dois_fatores: true, destino: "a***@won.pt" }` (código enviado por email) · 401 · 429 (5 falhas por conta / 30 por IP em 15 min) |
| `POST auth.php` | `{ acao: "verificar_codigo", codigo }` | `{ utilizador, csrf }` · 401 código errado · 429 bloqueado (5 tentativas; o código vale 10 min) |
| `POST auth.php` | `{ acao: "reenviar_codigo" }` | `{ ok }` · 429 (3 em 10 min) |
| `POST auth.php` | `{ acao: "registo", nome, email, password }` | 201 `{ utilizador, csrf }` · 422 · 429 (5 por IP por hora) |
| `POST auth.php` | `{ acao: "logout" }` | `{ ok: true }` |
| `GET produtos.php` | `?categoria=&pesquisa=&ordem=recentes\|preco_asc\|preco_desc\|nome&destaque=1&limite=1..50` | `Produto[]` |
| `GET produtos.php?pagina=2` | os mesmos filtros | `{ produtos, total, pagina, paginas, por_pagina: 9 }` (página acima da última devolve a última) |
| `GET produtos.php?id=5` | — | `Produto` · 404 |
| `GET categorias.php` | — | `Categoria[]` |
| `GET concertos.php` | — | `Concerto[]` |
| `POST newsletter.php` | `{ acao: "subscrever", email, consentimento: true }` | `{ mensagem }` (igual se o email já existir) · 429 |
| `POST newsletter.php` | `{ acao: "cancelar", token }` | `{ mensagem }` |

## Cliente (com sessão)

| Pedido | Corpo | Resposta |
|---|---|---|
| `GET encomendas.php` | — | `Encomenda[]` (só as do próprio) |
| `POST encomendas.php` | `{ itens: [{ id, quantidade 1..20 }] (máx. 30), envio: { nome, telefone, morada, codigo_postal, cidade }, guardar_morada }` | 201 `{ id }` · 409 sem stock · 429 (10 por hora). O preço vem sempre da base de dados. |
| `GET perfil.php` | — | `Perfil` |
| `POST perfil.php` | `{ nome, email, telefone, morada, codigo_postal, cidade, password_atual?, password_nova?, dois_fatores? }` | `{ utilizador, perfil, csrf }` (mudar a 2FA pede `password_atual`; o admin tem sempre) |
| `POST concertos.php` | `{ concerto_id, quantidade 1..6 }` | 201 `{ id, codigo }` · 409 esgotado/passado |
| `GET bilhetes.php` | — | `Bilhete[]` (só os do próprio) |
| `POST bilhetes.php` | `{ id }` | `{ ok }` · 409 (só o dono, só antes do concerto, só se não estiver pago) |
| `POST pagamentos.php` | `{ acao: "iniciar", tipo: "encomenda" ou "bilhete", id }` | 201 `{ pagamento_id, url, valor }` · 409 (não é do cliente ou já está pago) |
| `GET pagamentos.php?id=5` | — | `Pagamento` (só do próprio) |
| `POST pagamentos.php` | `{ acao: "simular", id, resultado: "pago" ou "falhado" }` | `Pagamento` · só com o fornecedor simulado |
| `GET suporte.php` | — | `Ticket[]` (só os do próprio) |
| `GET suporte.php?id=5` | — | `{ ticket, mensagens }` (sem as notas internas) |
| `POST suporte.php` | `{ acao: "criar", assunto, categoria, mensagem, encomenda_id? }` | 201 `{ id }` · 429 (5 por hora) |
| `POST suporte.php` | `{ acao: "responder", id, mensagem }` · `{ acao: "fechar", id }` | `{ ticket, mensagens }` (responder a um resolvido reabre) |

## Fornecedor de pagamentos

| Pedido | Corpo | Resposta |
|---|---|---|
| `POST pagamentos_webhook.php` | `{ id_externo, estado: "pago" ou "falhado" }` com header `X-Assinatura` = HMAC-SHA256 do corpo com `WON_PAGAMENTOS_SEGREDO` | `{ ok }` · 401 assinatura inválida · repetir o aviso não muda nada |

## Área de administração

| Pedido | Permissão | Corpo / resposta |
|---|---|---|
| `GET admin/estatisticas.php` | estatisticas.ver | `Estatisticas` |
| `GET admin/produtos.php` | produtos.gerir | `Produto[]` |
| `POST admin/produtos.php` (multipart) | produtos.gerir | `acao=guardar` (id, nome, descricao, preco, stock, categoria_id, destaque, imagem) → `Produto` · `acao=apagar` (id) |
| `GET / POST admin/categorias.php` | categorias.gerir | `Categoria[]` · `{ acao: guardar\|apagar, id, nome }` |
| `GET admin/encomendas.php?estado=` | encomendas.ver | `Encomenda[]` com cliente, email, pagamento e envio |
| `POST admin/envios.php` | encomendas.gerir | `{ acao: "guardar", encomenda_id, transportadora, codigo, url? (https) }` · `{ acao: "evento", encomenda_id, estado, descricao, local? }` → `{ envio }` |
| `GET admin/suporte.php?estado=&prioridade=&atribuido=eu` | tickets.gerir | `Ticket[]` (urgentes primeiro) |
| `GET admin/suporte.php?id=5` | tickets.gerir | `{ ticket, mensagens (com notas internas), equipa }` |
| `POST admin/suporte.php` | tickets.gerir | `{ acao: responder, id, mensagem, interna }` · `{ acao: estado, id, estado }` · `{ acao: prioridade, id, prioridade }` · `{ acao: atribuir, id, utilizador_id }` |
| `POST admin/encomendas.php` | encomendas.gerir | `{ id, estado }` (cancelar devolve o stock) |
| `GET admin/concertos.php` | bilhetes.ver | `Concerto[]` |
| `GET admin/concertos.php?reservas=5` | bilhetes.ver | `Bilhete[]` com nome e email |
| `POST admin/concertos.php` (multipart) | concertos.gerir | `acao=guardar` (id, titulo, local, cidade, data, descricao, preco, lotacao, estado, imagem) · `acao=apagar` (só sem reservas) |
| `GET admin/newsletter.php` | newsletter.ver | `Subscritor[]` · `?exportar=csv` → ficheiro CSV |
| `POST admin/newsletter.php` | newsletter.enviar | `{ assunto, mensagem }` → `{ enviados, falhados }` · 429 (um envio a cada 10 min) |
| `GET admin/utilizadores.php` | utilizadores.ver | `UtilizadorAdmin[]` |
| `POST admin/utilizadores.php` | utilizadores.gerir | `{ id, tipo: cliente\|suporte\|admin }` (ninguém muda o próprio papel; fica sempre pelo menos um admin) |

Os formatos (`Produto`, `Encomenda`, `Concerto`...) estão em `frontend/src/tipos.ts`.
