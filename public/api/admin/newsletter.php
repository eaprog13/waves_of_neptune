<?php
// GET: subscritores | GET ?exportar=csv -> ficheiro CSV com os emails ativos
// POST: enviar { assunto, mensagem } a todos os subscritores ativos (só admin)
require __DIR__ . '/../../../servidor/ligacao.php';

$newsletter = new Newsletter($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $eu = exigir_permissao('newsletter.enviar');

    $v = new Validador(dados_pedido());
    $assunto = $v->texto('assunto', 'O assunto', 3, 150);
    $mensagem = $v->texto('mensagem', 'A mensagem', 10, 10000);
    $v->verificar();

    // no máximo um envio a cada 10 minutos (contado só depois de os dados estarem certos)
    $limites->verificar('newsletter-envio', $eu['id'], 1, 600);

    $notificacoes = new Notificacoes($pdo);
    $paragrafos = array_values(array_filter(array_map('trim', preg_split("/\R{2,}/", $mensagem))));
    $enviados = 0;
    $falhados = 0;
    foreach ($newsletter->ativos() as $subscritor) {
        // cada email leva o link de cancelamento do próprio subscritor
        // o texto é o que o admin escreveu; o link de cancelar vai na língua de quem subscreveu
        $html = Notificacoes::modelo($assunto, $paragrafos, null, url_site('#/newsletter/cancelar?token=' . $subscritor['token']), $subscritor['idioma']);
        $notificacoes->email($subscritor['email'], $assunto, $html, 'newsletter') ? $enviados++ : $falhados++;
    }
    responder(200, ['enviados' => $enviados, 'falhados' => $falhados]);
}

exigir_permissao('newsletter.ver');
$lista = $newsletter->listar();

if (($_GET['exportar'] ?? '') === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="newsletter.csv"');

    $saida = fopen('php://output', 'w');
    fwrite($saida, "\xEF\xBB\xBF"); // para o Excel ler bem os acentos
    fputcsv($saida, ['email', 'subscrito_em']);
    foreach ($lista as $s) {
        if ($s['ativo']) {
            // um valor a começar por = + - @ seria executado como fórmula no Excel (CSV injection)
            $email = preg_match('/^[=+\-@]/', $s['email']) ? "'" . $s['email'] : $s['email'];
            fputcsv($saida, [$email, $s['consentimento_em']]);
        }
    }
    fclose($saida);
    exit;
}

responder(200, $lista);
