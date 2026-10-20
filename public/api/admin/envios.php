<?php
// logística das encomendas (suporte e admin)
// POST acao=guardar { encomenda_id, transportadora, codigo, url? }  (cria o envio ou corrige os dados)
// POST acao=evento  { encomenda_id, estado, descricao, local? }      (novo passo do rastreamento)
require __DIR__ . '/../../../servidor/ligacao.php';
exigir_permissao('encomendas.gerir');

$envios = new Envio($pdo);
$encomendas = new Encomenda($pdo);
$notificacoes = new Notificacoes($pdo);

$dados = dados_pedido();
$v = new Validador($dados);
$acao = $v->opcao('acao', 'A ação', ['guardar', 'evento']);
$encomendaId = $v->inteiro('encomenda_id', 'A encomenda', 1, PHP_INT_MAX);
$v->verificar();

$cliente = $encomendas->cliente($encomendaId);
if (!$cliente) {
    responder(404, ['erro' => 'Encomenda não encontrada.']);
}
if ($cliente['estado'] === 'cancelada') {
    responder(409, ['erro' => 'Esta encomenda foi cancelada.']);
}

// o email vai na língua do cliente (a que ele usa no site), não na de quem regista o envio.
// $texto pode ser uma frase fixa (traduzida) ou a descrição escrita pela equipa (fica como está)
function avisar($notificacoes, $cliente, $titulo, $texto, $envio)
{
    $lingua = $cliente['idioma'];
    $titulo = tr($titulo, [], $lingua);
    $linhas = [tr('Olá {nome},', ['nome' => $cliente['nome']], $lingua), tr($texto, [], $lingua)];
    if ($envio) {
        $linhas[] = tr("Transportadora: {transportadora}\nCódigo de rastreio: {codigo}", ['transportadora' => $envio['transportadora'], 'codigo' => $envio['codigo_rastreio']], $lingua);
    }
    $html = Notificacoes::modelo($titulo, $linhas, [tr('Acompanhar a encomenda', [], $lingua), url_site('#/conta')], null, $lingua);
    $notificacoes->email($cliente['email'], tr('Encomenda #{id}: {titulo}', ['id' => $cliente['id'], 'titulo' => $titulo], $lingua), $html, 'envio', (int) $cliente['user_id']);
}

if ($acao === 'guardar') {
    $transportadora = $v->opcao('transportadora', 'A transportadora', Envio::TRANSPORTADORAS);
    $codigo = strtoupper($v->padrao('codigo', 'O código de rastreio só pode ter letras, números e hífenes (4 a 60).', '/^[A-Za-z0-9\-]{4,60}$/'));
    // o link aparece ao cliente: só https, nunca javascript: ou outros esquemas
    $url = $v->texto('url', 'O link de rastreio', 0, 255, false);
    if ($url !== '' && (!filter_var($url, FILTER_VALIDATE_URL) || stripos($url, 'https://') !== 0)) {
        $v->erro('O link de rastreio tem de começar por https://');
    }
    $v->verificar();

    $novo = $envios->guardar($encomendaId, $transportadora, $codigo, $url);
    if ($novo) {
        avisar($notificacoes, $cliente, 'A tua encomenda foi enviada', 'A encomenda já está com a transportadora.', ['transportadora' => $transportadora, 'codigo_rastreio' => $codigo]);
    }
}

if ($acao === 'evento') {
    $estado = $v->opcao('estado', 'O estado', Envio::ESTADOS);
    $descricao = $v->texto('descricao', 'A descrição', 3, 255);
    $local = $v->texto('local', 'O local', 0, 100, false);
    $v->verificar();

    try {
        $envios->adicionarEvento($encomendaId, $estado, $descricao, $local);
    } catch (DomainException $e) {
        responder(409, ['erro' => $e->getMessage()]);
    }
    // só os passos que interessam ao cliente geram email
    $titulos = ['em_distribuicao' => 'A encomenda sai hoje para entrega', 'entregue' => 'A encomenda foi entregue', 'incidente' => 'Há um problema com a entrega', 'devolvida' => 'A encomenda foi devolvida'];
    if (isset($titulos[$estado])) {
        avisar($notificacoes, $cliente, $titulos[$estado], $descricao, $envios->porEncomendas([$encomendaId])[$encomendaId] ?? null);
    }
}

responder(200, ['envio' => $envios->porEncomendas([$encomendaId])[$encomendaId] ?? null]);
