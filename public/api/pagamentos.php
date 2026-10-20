<?php
// POST acao=iniciar { tipo: encomenda|bilhete, id } -> { pagamento_id, url, valor }
// GET ?id=5 -> o pagamento (só do próprio)
// POST acao=simular { id, resultado: pago|falhado } (só existe com o fornecedor simulado)
require __DIR__ . '/../../servidor/ligacao.php';

$utilizador = exigir_login();
$pagamentos = new Pagamento($pdo);
$simulado = pagamento_simulado();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $v = new Validador($_GET);
    $id = $v->inteiro('id', 'O pagamento', 1, PHP_INT_MAX);
    $pagamento = $v->temErros() ? null : $pagamentos->obter($id, $utilizador['id']);
    if (!$pagamento) {
        responder(404, ['erro' => 'Pagamento não encontrado.']);
    }
    responder(200, $pagamento + ['simulado' => $simulado]);
}

$dados = dados_pedido();
$acao = is_string($dados['acao'] ?? null) ? $dados['acao'] : '';
$v = new Validador($dados);

if ($acao === 'iniciar') {
    $limites->verificar('pagamento', $utilizador['id'], 20, 3600);
    $tipo = $v->opcao('tipo', 'O tipo de pagamento', array_keys(Pagamento::TABELAS));
    $id = $v->inteiro('id', 'A referência', 1, PHP_INT_MAX);
    $v->verificar();

    try {
        responder(201, $pagamentos->iniciar($tipo, $id, $utilizador['id'], fornecedor_pagamentos()));
    } catch (DomainException $e) {
        responder(409, ['erro' => $e->getMessage()]);
    }
}

if ($acao === 'simular' && $simulado) {
    $id = $v->inteiro('id', 'O pagamento', 1, PHP_INT_MAX);
    $resultado = $v->opcao('resultado', 'O resultado', ['pago', 'falhado']);
    $v->verificar();

    if (!$pagamentos->obter($id, $utilizador['id'])) {
        responder(404, ['erro' => 'Pagamento não encontrado.']);
    }
    $concluido = $pagamentos->concluir($id, $resultado);
    if (!$concluido) {
        responder(409, ['erro' => 'Este pagamento já não está pendente.']);
    }
    avisar_pagamento($pdo, $concluido);
    responder(200, $pagamentos->obter($id, $utilizador['id']));
}

responder(400, ['erro' => 'Ação desconhecida.']);
