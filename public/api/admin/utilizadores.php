<?php
// GET: utilizadores
// POST: mudar o papel { id, tipo } (cliente | suporte | admin)
require __DIR__ . '/../../../servidor/ligacao.php';

$utilizadores = new Utilizador($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    exigir_permissao('utilizadores.ver');
    responder(200, $utilizadores->listar());
}

$eu = exigir_permissao('utilizadores.gerir');

$v = new Validador(dados_pedido());
$id = $v->inteiro('id', 'O utilizador', 1, PHP_INT_MAX);
$tipo = $v->opcao('tipo', 'O papel', Utilizador::TIPOS);
$v->verificar();

$alvo = $utilizadores->obterSessao($id);
if (!$alvo) {
    responder(404, ['erro' => 'Utilizador não encontrado.']);
}
// ninguém tira as próprias permissões, e a loja nunca fica sem administrador
if ($id === (int) $eu['id']) {
    responder(409, ['erro' => 'Não podes mudar o teu próprio papel.']);
}
if ($alvo['tipo'] === 'admin' && $tipo !== 'admin' && $utilizadores->contarAdmins() <= 1) {
    responder(409, ['erro' => 'Tem de existir pelo menos um administrador.']);
}

$utilizadores->mudarTipo($id, $tipo);
responder(200, $utilizadores->listar());
