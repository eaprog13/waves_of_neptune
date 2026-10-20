<?php
// tickets do cliente
// GET -> os meus tickets | GET ?id=5 -> o ticket e a conversa (sem as notas internas da equipa)
// POST acao=criar { assunto, categoria, mensagem, encomenda_id? }
// POST acao=responder { id, mensagem } | acao=fechar { id }
require __DIR__ . '/../../servidor/ligacao.php';

$utilizador = exigir_login();
$suporte = new Suporte($pdo);

// o ticket tem de ser do próprio (nunca se vê o de outro cliente)
function ticket_do_cliente($suporte, $id, $utilizador)
{
    $ticket = $suporte->obter($id);
    if (!$ticket || $ticket['user_id'] !== (int) $utilizador['id']) {
        responder(404, ['erro' => 'Ticket não encontrado.']);
    }
    return $ticket;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $v = new Validador($_GET);
        $id = $v->inteiro('id', 'O ticket', 1, PHP_INT_MAX);
        $v->verificar();
        $ticket = ticket_do_cliente($suporte, $id, $utilizador);
        responder(200, ['ticket' => $ticket, 'mensagens' => $suporte->mensagens($id, false)]);
    }
    responder(200, $suporte->listarDoCliente($utilizador['id']));
}

$dados = dados_pedido();
$acao = is_string($dados['acao'] ?? null) ? $dados['acao'] : '';
$v = new Validador($dados);

if ($acao === 'criar') {
    $limites->verificar('ticket', $utilizador['id'], 5, 3600);
    $assunto = $v->texto('assunto', 'O assunto', 5, 150);
    $categoria = $v->opcao('categoria', 'A categoria', Suporte::CATEGORIAS);
    $mensagem = $v->texto('mensagem', 'A mensagem', 10, 3000);
    $encomendaId = isset($dados['encomenda_id']) && $dados['encomenda_id'] !== '' && $dados['encomenda_id'] !== null
        ? $v->inteiro('encomenda_id', 'A encomenda', 1, PHP_INT_MAX) : null;
    if ($encomendaId && !$v->temErros() && !(new Encomenda($pdo))->pertence($encomendaId, $utilizador['id'])) {
        $v->erro('Essa encomenda não é tua.');
    }
    $v->verificar();

    $id = $suporte->criar($utilizador['id'], $encomendaId, $assunto, $categoria, $mensagem);

    $paraSuporte = config('WON_EMAIL_SUPORTE', '');
    if ($paraSuporte) {
        $html = Notificacoes::modelo("Ticket novo #$id", [$utilizador['nome'] . ' abriu um ticket: ' . $assunto], ['Ver o ticket', url_site('#/admin/suporte')]);
        (new Notificacoes($pdo))->email($paraSuporte, "Ticket novo #$id: $assunto", $html, 'ticket_criado');
    }
    responder(201, ['id' => $id]);
}

if ($acao === 'responder') {
    $limites->verificar('ticket-mensagem', $utilizador['id'], 30, 3600);
    $id = $v->inteiro('id', 'O ticket', 1, PHP_INT_MAX);
    $mensagem = $v->texto('mensagem', 'A mensagem', 1, 3000);
    $v->verificar();

    $ticket = ticket_do_cliente($suporte, $id, $utilizador);
    if ($ticket['estado'] === 'fechado') {
        responder(409, ['erro' => 'Este ticket está fechado. Abre um novo se precisares de ajuda.']);
    }
    $suporte->responder($id, $utilizador['id'], $mensagem, false);
    // responder a um ticket resolvido volta a abri-lo (e conta como reabertura)
    if ($ticket['estado'] === 'resolvido') {
        $suporte->reabrir($id);
    } elseif ($ticket['estado'] === 'a_aguardar_cliente') {
        $suporte->mudarEstado($id, 'aberto');
    }
    responder(200, ['ticket' => $suporte->obter($id), 'mensagens' => $suporte->mensagens($id, false)]);
}

if ($acao === 'fechar') {
    $id = $v->inteiro('id', 'O ticket', 1, PHP_INT_MAX);
    $v->verificar();
    ticket_do_cliente($suporte, $id, $utilizador);
    $suporte->mudarEstado($id, 'fechado');
    responder(200, ['ticket' => $suporte->obter($id), 'mensagens' => $suporte->mensagens($id, false)]);
}

responder(400, ['erro' => 'Ação desconhecida.']);
