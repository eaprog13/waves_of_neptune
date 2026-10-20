<?php

const TAMANHO_MAXIMO_JSON = 65536; // 64 KB chega para qualquer formulário da loja

function responder($codigo, $dados)
{
    // as mensagens para o utilizador saem na língua do pedido (ver nucleo/idioma.php)
    foreach (['erro', 'mensagem'] as $campo) {
        if (isset($dados[$campo]) && is_string($dados[$campo]) && function_exists('tr')) {
            $dados[$campo] = tr($dados[$campo]);
        }
    }
    http_response_code($codigo);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

// corpo do pedido em JSON (pedidos maiores que o limite são recusados)
function dados_pedido()
{
    $corpo = file_get_contents('php://input', false, null, 0, TAMANHO_MAXIMO_JSON + 1);
    if (strlen((string) $corpo) > TAMANHO_MAXIMO_JSON) {
        responder(413, ['erro' => 'Pedido demasiado grande.']);
    }
    $dados = json_decode((string) $corpo, true);
    return is_array($dados) ? $dados : [];
}

// IP do cliente (não se confia em X-Forwarded-For, que qualquer um pode inventar)
function ip_cliente()
{
    return $_SERVER['REMOTE_ADDR'] ?? 'desconhecido';
}
