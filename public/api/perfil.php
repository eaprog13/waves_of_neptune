<?php
// GET: dados do perfil
// POST: atualizar dados (e a password, se vier password_nova; e a 2FA, se vier dois_fatores)
require __DIR__ . '/../../servidor/ligacao.php';

$sessao = exigir_login();
$utilizadores = new Utilizador($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, $utilizadores->obter($sessao['id']));
}

$dados = dados_pedido();
$v = new Validador($dados);
$perfil = [
    'nome' => $v->texto('nome', 'O nome', 2, 100),
    'email' => $v->email('email'),
    'telefone' => $v->padrao('telefone', 'O telefone não é válido.', '/^\+?[0-9 ]{9,15}$/', false),
    'morada' => $v->texto('morada', 'A morada', 5, 200, false),
    'codigo_postal' => $v->padrao('codigo_postal', 'O código postal tem de ter o formato 0000-000.', '/^\d{4}-\d{3}$/', false),
    'cidade' => $v->texto('cidade', 'A cidade', 2, 100, false),
];
if (!$v->temErros() && $utilizadores->emailExiste($perfil['email'], $sessao['id'])) {
    $v->erro('Esse email já está a ser usado por outra conta.');
}

// mudar a password, o email ou a 2FA obriga a confirmar a password atual (com limite de tentativas):
// quem apanhar uma sessão aberta não consegue trocar o email, desligar a 2FA e ficar com a conta
// (os administradores têm sempre 2FA)
$atualPerfil = $utilizadores->obter($sessao['id']);
$mudarPassword = is_string($dados['password_nova'] ?? null) && $dados['password_nova'] !== '';
$mudarEmail = $perfil['email'] !== $atualPerfil['email'];
$mudar2fa = array_key_exists('dois_fatores', $dados) && $sessao['tipo'] !== 'admin' && $v->booleano('dois_fatores') !== $atualPerfil['dois_fatores'];
if ($mudarPassword) {
    $nova = $v->password('password_nova', 'A nova password');
}
if ($mudarPassword || $mudarEmail || $mudar2fa) {
    $limites->verificar('perfil-password', $sessao['id'], 5, 900);
    $atual = is_string($dados['password_atual'] ?? null) ? $dados['password_atual'] : '';
    if (!$utilizadores->passwordCerta($sessao['id'], $atual)) {
        $v->erro($mudarPassword ? 'A password atual está errada.'
            : ($mudarEmail ? 'Para mudar o email, confirma a tua password atual.'
            : 'Para mudar a autenticação de dois fatores, confirma a tua password atual.'));
    }
}
$v->verificar();

$utilizadores->atualizar($sessao['id'], $perfil);
if ($mudar2fa) {
    $utilizadores->definirDoisFatores($sessao['id'], $v->booleano('dois_fatores'));
}
if ($mudarPassword || $mudarEmail || $mudar2fa) {
    $limites->limpar('perfil-password', $sessao['id']);
}
if ($mudarPassword) {
    // as outras sessões abertas terminam (a marca da password mudou); esta continua, com ID e marca novos
    $utilizadores->alterarPassword($sessao['id'], $nova);
    renovar_sessao();
    guardar_sessao($sessao['id']);
}

responder(200, [
    'utilizador' => dados_publicos($utilizadores->obterSessao($sessao['id'])),
    'perfil' => $utilizadores->obter($sessao['id']),
    'csrf' => $_SESSION['csrf'],
]);
