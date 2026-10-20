<?php
// lê a configuração: primeiro as variáveis de ambiente (servidor), depois o api/config.php

function config($chave, $padrao = null)
{
    static $ficheiro = null;
    if ($ficheiro === null) {
        $caminho = __DIR__ . '/../config.php';
        $ficheiro = is_file($caminho) ? require $caminho : [];
    }

    $valor = getenv($chave);
    if ($valor !== false && $valor !== '') {
        return $valor;
    }
    return $ficheiro[$chave] ?? $padrao;
}

// sem configuração, assume produção (o mais seguro)
function em_desenvolvimento()
{
    return config('WON_AMBIENTE', 'producao') === 'desenvolvimento';
}
