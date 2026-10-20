<?php
// GET: histórico do utilizador
// POST: checkout { itens: [{id, quantidade}], envio: {nome, telefone, morada, codigo_postal, cidade}, guardar_morada }
require __DIR__ . '/../../servidor/ligacao.php';

$utilizador = exigir_login();
$encomendas = new Encomenda($pdo);

// cada encomenda vem com o envio e os passos do rastreamento
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $lista = $encomendas->listarDoUtilizador($utilizador['id']);
    $envios = (new Envio($pdo))->porEncomendas(array_column($lista, 'id'));
    foreach ($lista as &$encomenda) {
        $encomenda['envio'] = $envios[$encomenda['id']] ?? null;
    }
    responder(200, $lista);
}

$limites->verificar('checkout', $utilizador['id'], 10, 3600);

$dados = dados_pedido();
$v = new Validador(is_array($dados['envio'] ?? null) ? $dados['envio'] : []);
$envio = [
    'nome' => $v->texto('nome', 'O nome', 2, 100),
    'telefone' => $v->padrao('telefone', 'O telefone não é válido.', '/^\+?[0-9 ]{9,15}$/'),
    'morada' => $v->texto('morada', 'A morada', 5, 200),
    'codigo_postal' => $v->padrao('codigo_postal', 'O código postal tem de ter o formato 0000-000.', '/^\d{4}-\d{3}$/'),
    'cidade' => $v->texto('cidade', 'A cidade', 2, 100),
];

// junta as quantidades do mesmo produto e limita o tamanho do carrinho
$itens = [];
$recebidos = is_array($dados['itens'] ?? null) ? $dados['itens'] : [];
if (count($recebidos) > 30) {
    $v->erro('O carrinho tem demasiados produtos.');
}
foreach (array_slice($recebidos, 0, 30) as $item) {
    $linha = new Validador(is_array($item) ? $item : []);
    $id = $linha->inteiro('id', 'O produto', 1, PHP_INT_MAX);
    $quantidade = $linha->inteiro('quantidade', 'A quantidade', 1, 20);
    if ($linha->temErros()) {
        $v->erro('O carrinho tem um produto inválido.');
        break;
    }
    $itens[$id] = min(20, ($itens[$id] ?? 0) + $quantidade);
}
if (!$itens) {
    $v->erro('O carrinho está vazio.');
}
$v->verificar();

$lista = [];
foreach ($itens as $id => $quantidade) {
    $lista[] = ['id' => $id, 'quantidade' => $quantidade];
}

try {
    $id = $encomendas->criar($utilizador['id'], $lista, $envio);
} catch (DomainException $e) {
    responder(409, ['erro' => $e->getMessage()]);
}

// guarda a morada no perfil para a próxima compra
if (!empty($dados['guardar_morada'])) {
    $utilizadores = new Utilizador($pdo);
    $perfil = $utilizadores->obter($utilizador['id']);
    $utilizadores->atualizar($utilizador['id'], [
        'nome' => $perfil['nome'],
        'email' => $perfil['email'],
        'telefone' => $envio['telefone'],
        'morada' => $envio['morada'],
        'codigo_postal' => $envio['codigo_postal'],
        'cidade' => $envio['cidade'],
    ]);
}

responder(201, ['id' => $id]);
