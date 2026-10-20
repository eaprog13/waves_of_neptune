<?php
// aviso do fornecedor de pagamentos (webhook): POST { id_externo, estado: pago|falhado }
// sem sessão nem token CSRF; só é aceite com a assinatura certa no header X-Assinatura
// (HMAC-SHA256 do corpo com WON_PAGAMENTOS_SEGREDO). Repetir o mesmo aviso não muda nada.
define('API_SEM_SESSAO', true);
require __DIR__ . '/../../servidor/ligacao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, ['erro' => 'Método não permitido.']);
}

$corpo = (string) file_get_contents('php://input', false, null, 0, TAMANHO_MAXIMO_JSON + 1);
if (strlen($corpo) > TAMANHO_MAXIMO_JSON) {
    responder(413, ['erro' => 'Pedido demasiado grande.']);
}
if (!assinatura_valida($corpo, $_SERVER['HTTP_X_ASSINATURA'] ?? '')) {
    responder(401, ['erro' => 'Assinatura inválida.']);
}

$v = new Validador(json_decode($corpo, true));
$idExterno = $v->texto('id_externo', 'O id externo', 3, 100);
$estado = $v->opcao('estado', 'O estado', ['pago', 'falhado']);
$v->verificar();

$pagamentos = new Pagamento($pdo);
$id = $pagamentos->porIdExterno(fornecedor_pagamentos()->nome(), $idExterno);
if (!$id) {
    responder(404, ['erro' => 'Pagamento não encontrado.']);
}

$concluido = $pagamentos->concluir($id, $estado);
if ($concluido) {
    avisar_pagamento($pdo, $concluido);
}
responder(200, ['ok' => true]);
