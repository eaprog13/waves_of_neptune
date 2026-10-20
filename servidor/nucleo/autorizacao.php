<?php
// papéis e permissões: cada papel só tem o que precisa (privilégio mínimo)
//  cliente  - só os próprios dados (encomendas, perfil, bilhetes)
//  suporte  - trata das encomendas, dos envios e dos tickets e vê as reservas; não mexe em produtos, preços nem utilizadores
//  admin    - tudo

const PERMISSOES = [
    'cliente' => [],
    'suporte' => ['encomendas.ver', 'encomendas.gerir', 'bilhetes.ver', 'tickets.gerir'],
    'admin' => [
        'estatisticas.ver',
        'produtos.gerir',
        'categorias.gerir',
        'encomendas.ver',
        'encomendas.gerir',
        'concertos.gerir',
        'bilhetes.ver',
        'utilizadores.ver',
        'utilizadores.gerir',
        'newsletter.ver',
        'newsletter.enviar',
        'tickets.gerir',
    ],
];

function permissoes_de($tipo)
{
    return PERMISSOES[$tipo] ?? [];
}

// o utilizador da sessão é lido da base de dados em cada pedido:
// se for apagado ou mudar de papel, a alteração conta logo (não fica preso ao que estava na sessão)
function utilizador_atual()
{
    global $pdo;
    static $utilizador = false;

    if ($utilizador === false) {
        $utilizador = null;
        if (!empty($_SESSION['utilizador_id'])) {
            $utilizadores = new Utilizador($pdo);
            $utilizador = $utilizadores->obterSessao($_SESSION['utilizador_id']) ?: null;
            // a password mudou depois de esta sessão entrar (noutro browser, ou pelo próprio): a sessão acabou
            if ($utilizador && !hash_equals($utilizadores->marcaSessao($utilizador['id']), (string) ($_SESSION['marca'] ?? ''))) {
                $utilizador = null;
            }
            if (!$utilizador) {
                unset($_SESSION['utilizador_id'], $_SESSION['marca']);
            } elseif (idioma_enviado() && idioma_enviado() !== $utilizador['idioma']) {
                // mudou de língua no site: os próximos emails já vão nessa língua
                (new Utilizador($pdo))->definirIdioma($utilizador['id'], idioma_enviado());
                $utilizador['idioma'] = idioma_enviado();
            }
        }
    }
    return $utilizador;
}

// quem entrou nesta sessão, com a marca da password atual (ver Utilizador::marcaSessao)
function guardar_sessao($id)
{
    global $pdo;
    $_SESSION['utilizador_id'] = (int) $id;
    $_SESSION['marca'] = (new Utilizador($pdo))->marcaSessao($id);
}

function exigir_login()
{
    $utilizador = utilizador_atual();
    if (!$utilizador) {
        responder(401, ['erro' => 'Tens de iniciar sessão.']);
    }
    return $utilizador;
}

function exigir_permissao($permissao)
{
    $utilizador = exigir_login();
    if (!in_array($permissao, permissoes_de($utilizador['tipo']), true)) {
        responder(403, ['erro' => 'Não tens permissão para esta ação.']);
    }
    return $utilizador;
}

// o que o front-end pode saber sobre o utilizador (nunca a password)
function dados_publicos($utilizador)
{
    if (!$utilizador) {
        return null;
    }
    return [
        'id' => (int) $utilizador['id'],
        'nome' => $utilizador['nome'],
        'email' => $utilizador['email'],
        'tipo' => $utilizador['tipo'],
        'permissoes' => permissoes_de($utilizador['tipo']),
    ];
}
