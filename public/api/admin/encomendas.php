<?php
// GET ?estado=pendente -> encomendas (filtro opcional)
// POST: { id, estado }
require __DIR__ . '/../../../servidor/ligacao.php';

$encomendas = new Encomenda($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    exigir_permissao('encomendas.ver');
    $lista = $encomendas->listarTodas(is_string($_GET['estado'] ?? null) ? $_GET['estado'] : '');
    $envios = (new Envio($pdo))->porEncomendas(array_column($lista, 'id'));
    foreach ($lista as &$encomenda) {
        $encomenda['envio'] = $envios[$encomenda['id']] ?? null;
    }
    responder(200, $lista);
}

exigir_permissao('encomendas.gerir');

$v = new Validador(dados_pedido());
$id = $v->inteiro('id', 'A encomenda', 1, PHP_INT_MAX);
$estado = $v->opcao('estado', 'O estado', Encomenda::ESTADOS);
$v->verificar();

try {
    $encomendas->mudarEstado($id, $estado);
} catch (DomainException $e) {
    responder(409, ['erro' => $e->getMessage()]);
}

responder(200, ['ok' => true]);
