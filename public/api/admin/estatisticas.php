<?php
require __DIR__ . '/../../../servidor/ligacao.php';
exigir_permissao('estatisticas.ver');

$encomendas = new Encomenda($pdo);
responder(200, $encomendas->estatisticas());
