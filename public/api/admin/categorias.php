<?php
// GET: categorias
// POST acao=guardar: id (vazio = nova), nome, nome_en (opcional)
// POST acao=apagar: id
require __DIR__ . '/../../../servidor/ligacao.php';
exigir_permissao('categorias.gerir');

$categorias = new Categoria($pdo, false);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, $categorias->listar());
}

$dados = dados_pedido();
$v = new Validador($dados);
$acao = $v->opcao('acao', 'A ação', ['guardar', 'apagar']);
$id = isset($dados['id']) && $dados['id'] !== '' && $dados['id'] !== 0 ? $v->inteiro('id', 'A categoria', 1, PHP_INT_MAX) : 0;
$v->verificar();

if ($id && !$categorias->existe($id)) {
    responder(404, ['erro' => 'Categoria não encontrada.']);
}

if ($acao === 'guardar') {
    $nome = $v->texto('nome', 'O nome', 2, 100);
    $nomeEn = $v->texto('nome_en', 'O nome em inglês', 2, 100, false);
    if (!$v->temErros() && $categorias->nomeExiste($nome, $id)) {
        $v->erro('Já existe uma categoria com esse nome.');
    }
    $v->verificar();
    $categorias->guardar($id, $nome, $nomeEn ?: null);
    responder(200, $categorias->listar());
}

if (!$id) {
    responder(404, ['erro' => 'Categoria não encontrada.']);
}
if ($categorias->temProdutos($id)) {
    responder(409, ['erro' => 'Esta categoria tem produtos. Muda-os de categoria antes de a apagar.']);
}
$categorias->apagar($id);
responder(200, $categorias->listar());
