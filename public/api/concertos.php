<?php
// GET: concertos (próximos e passados)
// POST: reservar { concerto_id, quantidade } (só com sessão)
require __DIR__ . '/../../servidor/ligacao.php';

$concertos = new Concerto($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, $concertos->listar());
}

$utilizador = exigir_login();
$limites->verificar('reserva', $utilizador['id'], 10, 3600);

$v = new Validador(dados_pedido());
$concertoId = $v->inteiro('concerto_id', 'O concerto', 1, PHP_INT_MAX);
$quantidade = $v->inteiro('quantidade', 'A quantidade', 1, Concerto::MAXIMO_POR_RESERVA);
$v->verificar();

try {
    $reserva = $concertos->reservar($utilizador['id'], $concertoId, $quantidade);
} catch (DomainException $e) {
    responder(409, ['erro' => $e->getMessage()]);
}

// devolve o id para o cliente seguir logo para o pagamento
responder(201, $reserva);
