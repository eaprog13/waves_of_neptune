<?php
// cabeçalhos de segurança, erros, origem dos pedidos, sessão e CSRF

function ligacao_segura()
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? '') == 443;
}

// o equivalente ao helmet: a API só responde JSON e não pode ser metida em iframes nem guardada em cache
function aplicar_cabecalhos()
{
    header_remove('X-Powered-By');
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('Referrer-Policy: no-referrer');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
    header('Cache-Control: no-store');
    if (ligacao_segura()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

// erros nunca aparecem na resposta (caminhos, SQL...): ficam no registo do servidor
function tratar_erros()
{
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
    set_exception_handler(function ($erro) {
        error_log('[WON] ' . $erro);
        responder(500, ['erro' => 'Ocorreu um erro no servidor. Tenta mais tarde.']);
    });
}

// sem CORS: só o próprio site (e as origens da configuração) podem fazer pedidos
function verificar_origem()
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($metodo !== 'GET' && $metodo !== 'POST') {
        responder(405, ['erro' => 'Método não permitido.']);
    }

    // os browsers mandam sempre o Origin num POST, mesmo do próprio site: um POST sem ele não veio do site.
    // num GET do próprio site o Origin não vem; aí basta o cookie SameSite=Strict (e o GET não altera nada).
    // a exceção é o aviso do fornecedor de pagamentos (webhook): vem de um servidor e é verificado pela assinatura
    $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origem === '') {
        if ($metodo === 'POST' && !defined('API_SEM_SESSAO')) {
            responder(403, ['erro' => 'Origem não autorizada.']);
        }
        return;
    }
    $proprio = (ligacao_segura() ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
    $permitidas = array_filter(array_map('trim', explode(',', (string) config('WON_ORIGENS', ''))));
    if ($origem !== $proprio && !in_array($origem, $permitidas, true)) {
        responder(403, ['erro' => 'Origem não autorizada.']);
    }
}

function iniciar_sessao()
{
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    session_name('won_sessao');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => ligacao_segura(),
        'httponly' => true,      // o JavaScript não lê o cookie
        'samesite' => 'Strict',  // o cookie não vai em pedidos vindos de outros sites
    ]);
    session_start();

    // expira por inatividade e por duração máxima
    $agora = time();
    if (!empty($_SESSION['utilizador_id'])) {
        $inativa = $agora - ($_SESSION['ultimo_acesso'] ?? 0) > (int) config('WON_SESSAO_INATIVIDADE_MIN', 30) * 60;
        $antiga = $agora - ($_SESSION['criada_em'] ?? 0) > (int) config('WON_SESSAO_MAXIMA_HORAS', 12) * 3600;
        if ($inativa || $antiga) {
            terminar_sessao();
            session_start();
        }
    }
    $_SESSION['ultimo_acesso'] = $agora;
    $_SESSION['criada_em'] = $_SESSION['criada_em'] ?? $agora;

    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

// novo ID e novo token sempre que muda quem está autenticado (contra fixação de sessão)
function renovar_sessao()
{
    session_regenerate_id(true);
    $_SESSION['criada_em'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function terminar_sessao()
{
    $_SESSION = [];
    $parametros = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $parametros['path'],
        'secure' => $parametros['secure'],
        'httponly' => true,
        'samesite' => $parametros['samesite'],
    ]);
    session_destroy();
}

// todos os POST têm de trazer o token CSRF no header
function verificar_csrf()
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        return;
    }
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['csrf'], $token)) {
        responder(403, ['erro' => 'Pedido inválido. Recarrega a página e tenta outra vez.']);
    }
}
