<?php
// GET: todos os produtos
// POST (multipart) acao=guardar: id (vazio = novo), nome, nome_en, descricao, descricao_en, preco, stock, categoria_id, destaque, imagem (ficheiro)
// POST (multipart) acao=apagar: id
require __DIR__ . '/../../../servidor/ligacao.php';
exigir_permissao('produtos.gerir');

$produtos = new Produto($pdo, false);
$pasta = __DIR__ . '/../../uploads/produtos/';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, $produtos->listar(['ordem' => 'nome']));
}

$v = new Validador($_POST);
$acao = $v->opcao('acao', 'A ação', ['guardar', 'apagar']);
$id = isset($_POST['id']) && $_POST['id'] !== '' ? $v->inteiro('id', 'O produto', 1, PHP_INT_MAX) : 0;
$v->verificar();

$atual = $id ? $produtos->obter($id) : null;
if ($id && !$atual) {
    responder(404, ['erro' => 'Produto não encontrado.']);
}

if ($acao === 'apagar') {
    if (!$atual) {
        responder(404, ['erro' => 'Produto não encontrado.']);
    }
    $produtos->apagar($id);
    apagar_imagem($atual['imagem'], $pasta);
    responder(200, ['ok' => true]);
}

$dados = [
    'nome' => $v->texto('nome', 'O nome', 2, 150),
    'nome_en' => $v->texto('nome_en', 'O nome em inglês', 2, 150, false) ?: null,
    'descricao' => $v->texto('descricao', 'A descrição', 0, 2000, false),
    'descricao_en' => $v->texto('descricao_en', 'A descrição em inglês', 0, 2000, false) ?: null,
    'preco' => $v->decimal('preco', 'O preço', 0.01, 10000),
    'stock' => $v->inteiro('stock', 'O stock', 0, 100000),
    'categoria_id' => $v->inteiro('categoria_id', 'A categoria', 1, PHP_INT_MAX),
    'destaque' => $v->booleano('destaque') ? 1 : 0,
    'imagem' => $atual['imagem'] ?? null,
];
if (!$v->temErros() && !(new Categoria($pdo))->existe($dados['categoria_id'])) {
    $v->erro('Escolhe uma categoria.');
}
$v->verificar();

if (veio_imagem('imagem')) {
    $dados['imagem'] = guardar_imagem($_FILES['imagem'], $pasta);
    if ($atual) {
        apagar_imagem($atual['imagem'], $pasta);
    }
}

$id = $produtos->guardar($id, $dados);
responder(200, $produtos->obter($id));
