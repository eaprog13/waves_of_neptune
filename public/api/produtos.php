<?php
// GET ?id=5 -> um produto
// GET ?categoria=1&pesquisa=vinil&ordem=preco_asc&destaque=1&limite=4 -> lista
// GET ?pagina=2 (com os mesmos filtros) -> { produtos, total, pagina, paginas, por_pagina }
require __DIR__ . '/../../servidor/ligacao.php';

$produtos = new Produto($pdo);
$v = new Validador($_GET);

if (isset($_GET['id'])) {
    $id = $v->inteiro('id', 'O produto', 1, PHP_INT_MAX);
    $produto = $v->temErros() ? null : $produtos->obter($id);
    if (!$produto) {
        responder(404, ['erro' => 'Produto não encontrado.']);
    }
    responder(200, $produto);
}

$filtros = [
    'categoria' => isset($_GET['categoria']) ? $v->inteiro('categoria', 'A categoria', 1, PHP_INT_MAX) : 0,
    'pesquisa' => $v->texto('pesquisa', 'A pesquisa', 0, 100, false),
    'destaque' => $v->booleano('destaque'),
    'ordem' => is_string($_GET['ordem'] ?? null) ? $_GET['ordem'] : '',
    'limite' => isset($_GET['limite']) ? $v->inteiro('limite', 'O limite', 1, 50) : 0,
];
$pagina = isset($_GET['pagina']) ? $v->inteiro('pagina', 'A página', 1, 100000) : 0;
$v->verificar();

responder(200, $pagina ? $produtos->pagina($filtros, $pagina) : $produtos->listar($filtros));
