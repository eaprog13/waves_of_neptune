# Arquitetura e segurança

## Camadas

```
browser ── React + TypeScript (frontend/src)
              │  só fala JSON com a API (frontend/src/api.ts), contrato em docs/API.md
              ▼
public/api/*.php ── endpoints: recebem o pedido, validam, verificam permissões e respondem
              │
servidor/nucleo ── segurança, validação, permissões, limites de tentativas, uploads (sem SQL)
              │
servidor/classes ─ repositórios: o único sítio com SQL (Utilizador, Produto, Encomenda, Concerto...)
              │  PDO, consultas preparadas, SQL standard
              ▼
base de dados (MySQL hoje; o DSN vem da configuração)
```

Não ficar preso a uma linguagem ou base de dados:

- O front-end não sabe que o back-end é PHP: só conhece o contrato da API. Trocar o back-end por outro (Node, Python, .NET) é implementar os mesmos pedidos.
- O back-end não sabe que o front-end é React: responde JSON a quem cumprir as regras (sessão + token CSRF).
- O SQL está todo nas classes de `servidor/classes`, em SQL standard (sem `UPDATE ... JOIN`, `FIELD()` ou outras funções só do MySQL; o `LIKE` usa `ESCAPE`). Mudar de base de dados é mudar o `WON_BD_DSN` e adaptar o `sql/` ao tipo de colunas da nova base (os `ENUM` e o `AUTO_INCREMENT` são do MySQL).
- A configuração vem de variáveis de ambiente ou do `servidor/config.php` (fora do git e fora da raiz servida), nunca do código.
- As regras de validação existem nos dois lados com as mesmas mensagens: `frontend/src/validacao.ts` (zod) e `servidor/nucleo/validador.php`. O servidor é sempre quem decide.

## Segurança (o que foi verificado e como está resolvido)

| Risco | Proteção |
|---|---|
| Passwords | `password_hash` (bcrypt) e `password_verify`; o hash é atualizado no login se o algoritmo mudar; mínimo 10 caracteres |
| Descobrir emails pelo login | mesma mensagem e mesmo tempo de resposta (verificação contra um hash fictício quando o email não existe) |
| Força bruta | 5 falhas por conta e 30 por IP em 15 min (`rate_limits`, chaves em hash); limites também no registo, checkout, reservas, newsletter, mudança de password e de email; no máximo 10 códigos 2FA errados por conta numa hora (somando todos os códigos) |
| Sessão | cookie `won_sessao` HttpOnly, SameSite=Strict, Secure em HTTPS, `use_strict_mode`; novo ID e novo token no login e ao mudar a password; mudar a password termina as outras sessões abertas; expira após 30 min sem atividade e 12 h no máximo; logout apaga sessão e cookie |
| CSRF | token por sessão no header `X-CSRF-Token` em todos os POST + SameSite=Strict + verificação da origem (um POST sem `Origin` é recusado; só o webhook, assinado, fica de fora) |
| Roubo de conta | mudar o email, a password ou a 2FA pede a password atual |
| CORS | não há: pedidos de outras origens são recusados (403) e o preflight `OPTIONS` dá 405 |
| Cabeçalhos (helmet) | API: `nosniff`, `X-Frame-Options: DENY`, CSP `default-src 'none'`, `no-store`, `Referrer-Policy`, `Permissions-Policy`, HSTS em HTTPS, sem `X-Powered-By`. Site: CSP só com `'self'` (sem scripts inline), `frame-ancestors 'none'`, HSTS em HTTPS |
| SQL injection | só consultas preparadas (`ATTR_EMULATE_PREPARES` desligado); ordenação de uma lista fixa; `LIMIT` convertido em inteiro |
| XSS | o React escapa todo o texto (não há `dangerouslySetInnerHTML`); CSP sem scripts inline; a API responde sempre `application/json` com `nosniff` |
| Validação | tipos, tamanhos e intervalos de todos os campos no servidor; corpo JSON máximo 64 KB |
| Autorização | permissões por papel (privilégio mínimo); o papel é lido da base de dados em cada pedido; cada cliente só vê e altera os seus dados (encomendas, bilhetes, perfil) |
| Preços | o total do checkout e dos bilhetes é sempre calculado no servidor; o stock e a lotação são verificados em transação com `SELECT ... FOR UPDATE` |
| Uploads | tipo lido do conteúdo (`finfo` + `getimagesize`), só JPG/PNG/WEBP até 2 MB, nome aleatório; a pasta `uploads/` não executa PHP |
| Fugas de informação | erros só no registo do servidor (`display_errors` desligado na API); só as mensagens de negócio (`DomainException`) chegam ao browser, os erros da base de dados nunca; configuração, núcleo, classes, registos, `sql/` e código-fonte fora da `public/`, a única pasta servida (não dependem de `.htaccess`) |
| Segredos no front-end | o build não tem passwords, chaves nem dados de acesso (verificado); só o servidor lê o `servidor/config.php` |
| CSV injection | valores começados por `= + - @` são neutralizados na exportação da newsletter |
| Dependências | `npm audit` sem vulnerabilidades |

## Pagamentos, 2FA, envios e suporte

| Tema | Como está feito |
|---|---|
| 2FA | código de 6 algarismos (`random_int`) por email, guardado em hash, válido 10 min, 5 tentativas, um uso; os códigos anteriores deixam de valer; obrigatória para admin, opcional para clientes (mudar pede a password); com a password certa a sessão fica "a meio" e não dá acesso a nada até ao código |
| Serviços externos | atrás de uma camada própria (`nucleo/notificacoes.php`, `nucleo/pagamentos.php`): trocar o Resend ou o fornecedor de pagamentos não mexe no resto do código; as chaves só existem no `config.php` do servidor |
| Pagamentos | valor sempre da base de dados; só o dono inicia o pagamento; um pagamento pendente de cada vez; conclusão em transação (`FOR UPDATE`) e idempotente; webhooks só com assinatura HMAC-SHA256 válida (`hash_equals`), e nunca com o segredo do exemplo; o fornecedor simulado só existe em desenvolvimento |
| Emails | em desenvolvimento ficam em `servidor/registos/emails.log` (fora da `public/` e do git); em produção, sem fornecedor, falham em vez de ser escritos num ficheiro; os textos são escapados no modelo do email |
| Logística | só `encomendas.gerir`; o link de rastreio só aceita `https://` (sem `javascript:`) e o front-end volta a confirmar antes de o mostrar |
| Tickets | cada cliente só vê os seus (404 para os outros); as notas internas nunca saem para o cliente; só se atribui a alguém da equipa; limites de criação e de mensagens |
| Newsletter | envio só com `newsletter.enviar` (admin), um a cada 10 minutos, cada email com o link de cancelamento do próprio subscritor |

## Para produção

- Servir em HTTPS (o cookie passa a `Secure` e o HSTS liga-se sozinho).
- `WON_AMBIENTE=producao`, um utilizador da base de dados só com as permissões necessárias (SELECT, INSERT, UPDATE, DELETE nesta base), e password forte.
- Mudar as passwords das contas de teste.
- Configurar o Resend (domínio verificado) e um `WON_PAGAMENTOS_SEGREDO` aleatório; ligar um fornecedor de pagamentos real antes de aceitar encomendas.
- Apontar o `DocumentRoot` do domínio para a `public/` (nunca para a pasta do projeto): `servidor/`, `frontend/` e `sql/` ficam fora do alcance do browser.
- Tirar `http://localhost:5173` do `WON_ORIGENS` (só serve para o Vite em desenvolvimento).
