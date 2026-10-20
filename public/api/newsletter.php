<?php
// POST acao=subscrever: { email, consentimento: true }
// POST acao=cancelar:   { token }
require __DIR__ . '/../../servidor/ligacao.php';

$dados = dados_pedido();
$acao = is_string($dados['acao'] ?? null) ? $dados['acao'] : '';
$newsletter = new Newsletter($pdo);

if ($acao === 'subscrever') {
    $limites->verificar('newsletter-ip', ip_cliente(), 10, 3600);

    $v = new Validador($dados);
    $email = $v->email('email');
    if (!$v->booleano('consentimento')) {
        $v->erro('Tens de aceitar receber a newsletter.');
    }
    $v->verificar();

    $newsletter->subscrever($email);
    // a mesma resposta quer o email já estivesse inscrito ou não
    responder(200, ['mensagem' => 'Obrigado! Vais receber as novidades da banda neste email.']);
}

if ($acao === 'cancelar') {
    $v = new Validador($dados);
    $token = $v->padrao('token', 'O link de cancelamento não é válido.', '/^[a-f0-9]{64}$/');
    $v->verificar();

    $newsletter->cancelar($token);
    responder(200, ['mensagem' => 'A tua subscrição foi cancelada. Já não vais receber a newsletter.']);
}

responder(400, ['erro' => 'Ação desconhecida.']);
