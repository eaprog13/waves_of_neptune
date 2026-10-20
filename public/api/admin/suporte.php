<?php
// tickets para a equipa (suporte e admin)
// GET ?estado=&prioridade=&atribuido=eu -> lista | GET ?id=5 -> ticket, conversa completa (com notas internas) e equipa
// POST acao=responder { id, mensagem, interna } | acao=estado { id, estado } | acao=prioridade { id, prioridade } | acao=atribuir { id, utilizador_id }
require __DIR__ . '/../../../servidor/ligacao.php';

$eu = exigir_permissao('tickets.gerir');
$suporte = new Suporte($pdo);
$notificacoes = new Notificacoes($pdo);

function detalhe($suporte, $id)
{
    $ticket = $suporte->obter($id);
    if (!$ticket) {
        responder(404, ['erro' => 'Ticket não encontrado.']);
    }
    return ['ticket' => $ticket, 'mensagens' => $suporte->mensagens($id, true), 'equipa' => $suporte->equipa()];
}

// o email vai na língua do cliente; $valores preenche o texto (ex.: a resposta da equipa)
function avisar_cliente($notificacoes, $ticket, $titulo, $texto, $valores = [])
{
    $lingua = $ticket['idioma_cliente'];
    $html = Notificacoes::modelo(
        tr($titulo, [], $lingua),
        [tr('Olá {nome},', ['nome' => $ticket['cliente']], $lingua), tr($texto, $valores, $lingua)],
        [tr('Ver o ticket', [], $lingua), url_site('#/conta')],
        null,
        $lingua
    );
    $notificacoes->email($ticket['email'], "Ticket #{$ticket['id']}: {$ticket['assunto']}", $html, 'ticket_atualizado', $ticket['user_id']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $v = new Validador($_GET);
    if (isset($_GET['id'])) {
        $id = $v->inteiro('id', 'O ticket', 1, PHP_INT_MAX);
        $v->verificar();
        responder(200, detalhe($suporte, $id));
    }
    $filtros = [
        'estado' => isset($_GET['estado']) && $_GET['estado'] !== '' ? $v->opcao('estado', 'O estado', Suporte::ESTADOS) : '',
        'prioridade' => isset($_GET['prioridade']) && $_GET['prioridade'] !== '' ? $v->opcao('prioridade', 'A prioridade', Suporte::PRIORIDADES) : '',
        'atribuido' => ($_GET['atribuido'] ?? '') === 'eu' ? (int) $eu['id'] : 0,
    ];
    $v->verificar();
    responder(200, $suporte->listarTodos($filtros));
}

$dados = dados_pedido();
$v = new Validador($dados);
$acao = $v->opcao('acao', 'A ação', ['responder', 'estado', 'prioridade', 'atribuir']);
$id = $v->inteiro('id', 'O ticket', 1, PHP_INT_MAX);
$v->verificar();
$ticket = detalhe($suporte, $id)['ticket'];

if ($acao === 'responder') {
    $mensagem = $v->texto('mensagem', 'A mensagem', 1, 3000);
    $interna = $v->booleano('interna');
    $v->verificar();

    $suporte->responder($id, $eu['id'], $mensagem, $interna);
    // uma resposta ao cliente passa a bola para ele; uma nota interna não muda nada para o cliente
    if (!$interna) {
        if (in_array($ticket['estado'], ['aberto', 'em_analise'], true)) {
            $suporte->mudarEstado($id, 'a_aguardar_cliente');
        }
        avisar_cliente($notificacoes, $ticket, 'Nova resposta ao teu ticket', "A equipa respondeu:\n\n{mensagem}", ['mensagem' => $mensagem]);
    }
}

if ($acao === 'estado') {
    $estado = $v->opcao('estado', 'O estado', Suporte::ESTADOS);
    $v->verificar();
    $suporte->mudarEstado($id, $estado);
    if ($estado === 'resolvido' && $ticket['estado'] !== 'resolvido') {
        avisar_cliente($notificacoes, $ticket, 'Ticket resolvido', 'O teu ticket foi marcado como resolvido. Se ainda precisares de ajuda, responde no ticket e ele volta a abrir.');
    }
}

if ($acao === 'prioridade') {
    $prioridade = $v->opcao('prioridade', 'A prioridade', Suporte::PRIORIDADES);
    $v->verificar();
    $suporte->mudarPrioridade($id, $prioridade);
}

if ($acao === 'atribuir') {
    $responsavel = $v->inteiro('utilizador_id', 'O responsável', 0, PHP_INT_MAX);
    $v->verificar();
    // só alguém da equipa pode ficar com o ticket
    if ($responsavel && !in_array($responsavel, array_column($suporte->equipa(), 'id'), true)) {
        responder(422, ['erro' => 'Essa pessoa não faz parte da equipa de suporte.']);
    }
    $suporte->atribuir($id, $responsavel);
}

responder(200, detalhe($suporte, $id));
