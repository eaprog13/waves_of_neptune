<?php
// GET: sessão atual e token CSRF
// POST acao=login | verificar_codigo | reenviar_codigo | registo | logout
require __DIR__ . '/../../servidor/ligacao.php';

const VALIDADE_LOGIN_PENDENTE = 600; // 10 minutos para introduzir o código

// códigos errados por conta numa hora, somando todos os códigos: entrar outra vez com a password
// gera um código novo, mas não dá mais tentativas (senão, 5 por código davam para ir adivinhando)
const MAXIMO_FALHAS_2FA = 10;

function bloquear_se_falhas_2fa($limites, $userId)
{
    if ($limites->contar('2fa-falha', $userId, 3600) >= MAXIMO_FALHAS_2FA) {
        unset($_SESSION['login_pendente']);
        responder(429, ['erro' => tr('Demasiadas tentativas. Tenta outra vez daqui a {minutos} minutos.', ['minutos' => 60]), 'reiniciar' => true]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, ['utilizador' => dados_publicos(utilizador_atual()), 'csrf' => $_SESSION['csrf']]);
}

$dados = dados_pedido();
$acao = is_string($dados['acao'] ?? null) ? $dados['acao'] : '';
$utilizadores = new Utilizador($pdo);
$doisFatores = new DoisFatores($pdo);
$notificacoes = new Notificacoes($pdo);

function abrir_sessao($utilizador)
{
    global $utilizadores;
    // a língua em que entrou passa a ser a dos emails que recebe
    if (idioma_enviado()) {
        $utilizadores->definirIdioma($utilizador['id'], idioma_enviado());
    }
    unset($_SESSION['login_pendente']);
    renovar_sessao();
    guardar_sessao($utilizador['id']);
    responder(200, ['utilizador' => dados_publicos($utilizador), 'csrf' => $_SESSION['csrf']]);
}

function enviar_codigo($notificacoes, $doisFatores, $utilizador)
{
    $codigo = $doisFatores->gerar($utilizador['id']);
    // o email vai na língua em que a pessoa está a entrar
    $html = Notificacoes::modelo(tr('Código de acesso'), [
        tr('Olá {nome},', ['nome' => $utilizador['nome']]),
        tr("O teu código para entrar na loja Waves of Neptune é:\n\n{codigo}", ['codigo' => $codigo]),
        tr('O código é válido durante 10 minutos. Se não foste tu a tentar entrar, ignora este email e muda a tua password.'),
    ]);
    if (!$notificacoes->email($utilizador['email'], tr('O teu código de acesso: {codigo}', ['codigo' => $codigo]), $html, 'codigo_2fa', $utilizador['id'])) {
        responder(503, ['erro' => 'Não foi possível enviar o código. Tenta outra vez daqui a pouco.']);
    }
}

function login_pendente($utilizadores)
{
    $pendente = $_SESSION['login_pendente'] ?? null;
    if (!$pendente || time() - $pendente['desde'] > VALIDADE_LOGIN_PENDENTE) {
        unset($_SESSION['login_pendente']);
        // reiniciar: o front-end volta ao início do login (sem depender do texto da mensagem)
        responder(401, ['erro' => 'O código expirou. Entra outra vez com o email e a password.', 'reiniciar' => true]);
    }
    return $utilizadores->obterSessao($pendente['id']);
}

if ($acao === 'login') {
    $v = new Validador($dados);
    $email = $v->email('email');
    $password = is_string($dados['password'] ?? null) ? substr($dados['password'], 0, 128) : '';
    if ($v->temErros() || $password === '') {
        responder(401, ['erro' => 'Email ou password incorretos.']);
    }

    // força bruta: 5 falhas por conta e 30 por IP, em 15 minutos
    if ($limites->contar('login-email', $email, 900) >= 5 || $limites->contar('login-ip', ip_cliente(), 900) >= 30) {
        responder(429, ['erro' => 'Demasiadas tentativas falhadas. Tenta outra vez daqui a 15 minutos.']);
    }

    $utilizador = $utilizadores->login($email, $password);
    if (!$utilizador) {
        $limites->registar('login-email', $email);
        $limites->registar('login-ip', ip_cliente());
        responder(401, ['erro' => 'Email ou password incorretos.']);
    }
    $limites->limpar('login-email', $email);

    if (!$utilizadores->precisaDoisFatores($utilizador['id'])) {
        abrir_sessao($utilizador);
    }

    // password certa, mas ainda falta o código: a sessão fica "a meio" (sem acesso a nada)
    bloquear_se_falhas_2fa($limites, $utilizador['id']);
    session_regenerate_id(true);
    $_SESSION['login_pendente'] = ['id' => (int) $utilizador['id'], 'desde' => time()];
    enviar_codigo($notificacoes, $doisFatores, $utilizador);
    responder(200, ['dois_fatores' => true, 'destino' => DoisFatores::mascarar($utilizador['email'])]);
}

if ($acao === 'verificar_codigo') {
    $utilizador = login_pendente($utilizadores);
    $v = new Validador($dados);
    $codigo = $v->padrao('codigo', 'O código tem 6 algarismos.', '/^\d{6}$/');
    $v->verificar();
    bloquear_se_falhas_2fa($limites, $utilizador['id']);

    $resultado = $doisFatores->verificar($utilizador['id'], $codigo);
    if ($resultado === 'certo') {
        $limites->limpar('2fa-falha', $utilizador['id']);
        abrir_sessao($utilizador);
    }
    $limites->registar('2fa-falha', $utilizador['id']);
    if ($resultado === 'bloqueado') {
        unset($_SESSION['login_pendente']);
        responder(429, ['erro' => 'Código expirado ou demasiadas tentativas. Entra outra vez com o email e a password.', 'reiniciar' => true]);
    }
    responder(401, ['erro' => 'Código errado.']);
}

if ($acao === 'reenviar_codigo') {
    $utilizador = login_pendente($utilizadores);
    bloquear_se_falhas_2fa($limites, $utilizador['id']);
    $limites->verificar('reenviar-2fa', $utilizador['id'], 3, 600);
    enviar_codigo($notificacoes, $doisFatores, $utilizador);
    responder(200, ['ok' => true]);
}

if ($acao === 'registo') {
    $limites->verificar('registo-ip', ip_cliente(), 5, 3600);

    $v = new Validador($dados);
    $nome = $v->texto('nome', 'O nome', 2, 100);
    $email = $v->email('email');
    $password = $v->password('password');
    if (!$v->temErros() && $utilizadores->emailExiste($email)) {
        $v->erro('Já existe uma conta com este email.');
    }
    $v->verificar();

    $id = $utilizadores->registar($nome, $email, $password);
    $utilizadores->definirIdioma($id, idioma());
    renovar_sessao();
    guardar_sessao($id);
    responder(201, ['utilizador' => dados_publicos($utilizadores->obterSessao($id)), 'csrf' => $_SESSION['csrf']]);
}

if ($acao === 'logout') {
    terminar_sessao();
    responder(200, ['ok' => true]);
}

responder(400, ['erro' => 'Ação desconhecida.']);
