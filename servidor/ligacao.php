<?php
// incluído em todos os ficheiros da API: prepara a segurança, a base de dados e a sessão

require __DIR__ . '/nucleo/configuracao.php';
require __DIR__ . '/nucleo/idioma.php';
require __DIR__ . '/nucleo/resposta.php';
require __DIR__ . '/nucleo/seguranca.php';
require __DIR__ . '/nucleo/validador.php';
require __DIR__ . '/nucleo/autorizacao.php';
require __DIR__ . '/nucleo/limite_taxa.php';
require __DIR__ . '/nucleo/upload.php';
require __DIR__ . '/nucleo/notificacoes.php';
require __DIR__ . '/nucleo/pagamentos.php';

tratar_erros();
aplicar_cabecalhos();
verificar_origem();

// qualquer base de dados suportada pelo PDO (o DSN vem da configuração)
try {
    $pdo = new PDO(config('WON_BD_DSN'), config('WON_BD_UTILIZADOR'), config('WON_BD_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false, // consultas preparadas a sério, na base de dados
    ]);
} catch (PDOException $e) {
    error_log('[WON] ' . $e->getMessage());
    responder(500, ['erro' => 'Não foi possível ligar à base de dados.']);
}

require __DIR__ . '/classes/Utilizador.php';
require __DIR__ . '/classes/Categoria.php';
require __DIR__ . '/classes/Produto.php';
require __DIR__ . '/classes/Encomenda.php';
require __DIR__ . '/classes/Concerto.php';
require __DIR__ . '/classes/Newsletter.php';
require __DIR__ . '/classes/DoisFatores.php';
require __DIR__ . '/classes/Pagamento.php';
require __DIR__ . '/classes/Envio.php';
require __DIR__ . '/classes/Suporte.php';

// o aviso do fornecedor de pagamentos (webhook) não tem sessão nem token: é verificado pela assinatura
if (!defined('API_SEM_SESSAO')) {
    iniciar_sessao();
    verificar_csrf();
}

$limites = new LimiteTaxa($pdo);
