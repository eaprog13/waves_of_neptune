<?php
// GET: os bilhetes do utilizador
// POST: cancelar { id }
require __DIR__ . '/../../servidor/ligacao.php';

$utilizador = exigir_login();
$concertos = new Concerto($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, $concertos->bilhetesDoUtilizador($utilizador['id']));
}

$v = new Validador(dados_pedido());
$id = $v->inteiro('id', 'A reserva', 1, PHP_INT_MAX);
$v->verificar();

try {
    $concertos->cancelarReserva($utilizador['id'], $id);
} catch (DomainException $e) {
    responder(409, ['erro' => $e->getMessage()]);
}

responder(200, ['ok' => true]);
