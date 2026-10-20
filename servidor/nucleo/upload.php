<?php
// imagens enviadas pelo admin (produtos e concertos)

const TIPOS_IMAGEM = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const TAMANHO_MAXIMO_IMAGEM = 2097152; // 2 MB

// valida e guarda; devolve o nome do ficheiro (aleatório, nunca o nome original)
function guardar_imagem($ficheiro, $pasta)
{
    if (!is_array($ficheiro) || ($ficheiro['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        responder(422, ['erro' => 'Não foi possível enviar a imagem.']);
    }
    if ($ficheiro['size'] > TAMANHO_MAXIMO_IMAGEM) {
        responder(422, ['erro' => 'A imagem não pode ter mais de 2 MB.']);
    }

    // o tipo é lido do conteúdo do ficheiro, não do nome nem do que o browser diz
    $tipo = (new finfo(FILEINFO_MIME_TYPE))->file($ficheiro['tmp_name']);
    if (!isset(TIPOS_IMAGEM[$tipo]) || !getimagesize($ficheiro['tmp_name'])) {
        responder(422, ['erro' => 'A imagem tem de ser JPG, PNG ou WEBP.']);
    }

    $nome = bin2hex(random_bytes(12)) . '.' . TIPOS_IMAGEM[$tipo];
    if (!move_uploaded_file($ficheiro['tmp_name'], $pasta . $nome)) {
        responder(500, ['erro' => 'Não foi possível guardar a imagem.']);
    }
    return $nome;
}

function apagar_imagem($nome, $pasta)
{
    // basename impede caminhos como "../../api/ligacao.php"
    if ($nome && is_file($pasta . basename($nome))) {
        unlink($pasta . basename($nome));
    }
}

function veio_imagem($campo)
{
    return isset($_FILES[$campo]) && $_FILES[$campo]['error'] !== UPLOAD_ERR_NO_FILE;
}
