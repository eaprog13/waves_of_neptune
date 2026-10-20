<?php
require __DIR__ . '/../../servidor/ligacao.php';

$categorias = new Categoria($pdo);
responder(200, $categorias->listar());
