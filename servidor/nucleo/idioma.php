<?php
// a língua de cada pedido e a tradução das mensagens.
// o front-end envia o header X-Idioma (pt ou en). As mensagens estão escritas em português no código
// e o textos_en.php tem a versão inglesa de cada uma; {nome} marca o sítio de um valor:
//   tr('Só restam {n} bilhetes.', ['n' => 3])  ->  "Only 3 tickets left."

function idioma()
{
    static $idioma = null;
    if ($idioma === null) {
        $pedido = strtolower((string) ($_SERVER['HTTP_X_IDIOMA'] ?? ''));
        $idioma = in_array($pedido, ['pt', 'en'], true) ? $pedido : 'pt';
    }
    return $idioma;
}

// a língua só se guarda quando o browser a manda (o link do CSV, por exemplo, não manda)
function idioma_enviado()
{
    $pedido = strtolower((string) ($_SERVER['HTTP_X_IDIOMA'] ?? ''));
    return in_array($pedido, ['pt', 'en'], true) ? $pedido : null;
}

// $lingua serve para escrever na língua de outra pessoa (ex.: um email para um cliente que usa o site em inglês)
function tr($texto, $valores = [], $lingua = null)
{
    static $ingles = null;
    if (($lingua ?? idioma()) === 'en') {
        $ingles ??= require __DIR__ . '/textos_en.php';
        $texto = $ingles[$texto] ?? $texto;
    }
    foreach ($valores as $nome => $valor) {
        $texto = str_replace('{' . $nome . '}', (string) $valor, $texto);
    }
    return $texto;
}

// coluna de texto na língua do pedido: em inglês usa a coluna _en (ex.: p.nome_en)
// e, se estiver vazia, o texto em português
function coluna_lingua($coluna)
{
    return idioma() === 'en' ? "COALESCE(NULLIF({$coluna}_en, ''), {$coluna})" : $coluna;
}
