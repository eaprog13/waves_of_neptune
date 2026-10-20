<?php
// GET: concertos | GET ?reservas=5 -> reservas do concerto 5
// POST (multipart) acao=guardar: id, titulo, titulo_en, local, cidade, data, descricao, descricao_en, preco, lotacao, estado, imagem
// POST (multipart) acao=apagar: id (só sem reservas; com reservas, cancela-se)
require __DIR__ . '/../../../servidor/ligacao.php';

$concertos = new Concerto($pdo, false);
$pasta = __DIR__ . '/../../uploads/concertos/';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['reservas'])) {
        exigir_permissao('bilhetes.ver');
        $v = new Validador($_GET);
        $id = $v->inteiro('reservas', 'O concerto', 1, PHP_INT_MAX);
        $v->verificar();
        responder(200, $concertos->reservasDoConcerto($id));
    }
    exigir_permissao('bilhetes.ver');
    responder(200, $concertos->listar());
}

exigir_permissao('concertos.gerir');

$v = new Validador($_POST);
$acao = $v->opcao('acao', 'A ação', ['guardar', 'apagar']);
$id = isset($_POST['id']) && $_POST['id'] !== '' ? $v->inteiro('id', 'O concerto', 1, PHP_INT_MAX) : 0;
$v->verificar();

$atual = $id ? $concertos->obter($id) : null;
if ($id && !$atual) {
    responder(404, ['erro' => 'Concerto não encontrado.']);
}

if ($acao === 'apagar') {
    if (!$atual) {
        responder(404, ['erro' => 'Concerto não encontrado.']);
    }
    if ($concertos->temReservas($id)) {
        responder(409, ['erro' => 'Este concerto tem reservas. Em vez de o apagar, muda o estado para cancelado.']);
    }
    $concertos->apagar($id);
    apagar_imagem($atual['imagem'], $pasta);
    responder(200, ['ok' => true]);
}

$dados = [
    'titulo' => $v->texto('titulo', 'O título', 2, 150),
    'titulo_en' => $v->texto('titulo_en', 'O título em inglês', 2, 150, false) ?: null,
    'local' => $v->texto('local', 'O local', 2, 150),
    'cidade' => $v->texto('cidade', 'A cidade', 2, 100),
    'data' => $v->dataHora('data', 'A data'),
    'descricao' => $v->texto('descricao', 'A descrição', 0, 2000, false),
    'descricao_en' => $v->texto('descricao_en', 'A descrição em inglês', 0, 2000, false) ?: null,
    'preco' => $v->decimal('preco', 'O preço', 0, 1000),
    'lotacao' => $v->inteiro('lotacao', 'A lotação', 1, 100000),
    'estado' => $v->opcao('estado', 'O estado', Concerto::ESTADOS),
    'imagem' => $atual['imagem'] ?? null,
];
// a lotação nunca pode ficar abaixo dos bilhetes já reservados
if ($atual && !$v->temErros() && $dados['lotacao'] < $atual['vendidos']) {
    $v->erro('A lotação não pode ser menor que os {n} bilhetes já reservados.', ['n' => $atual['vendidos']]);
}
$v->verificar();

if (veio_imagem('imagem')) {
    $dados['imagem'] = guardar_imagem($_FILES['imagem'], $pasta);
    if ($atual) {
        apagar_imagem($atual['imagem'], $pasta);
    }
}

$id = $concertos->guardar($id, $dados);
responder(200, $concertos->obter($id));
