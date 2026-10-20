<?php
// só para desenvolvimento, na pasta do projeto: php -S localhost:8080 -t public router.php
// só a public/ é servida (o código interno fica fora dela); o servidor do PHP ignora os .htaccess,
// por isso as mesmas regras ficam aqui

$publico = __DIR__ . '/public';
$caminho = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// ficheiros que nunca podem ser abertos pelo browser
$bloqueados = '#/\.|\.(md|sql|log)$|^/uploads/.*\.(php\d?|pht|phtml|phar)$#i';
if (preg_match($bloqueados, $caminho)) {
    http_response_code(404);
    exit;
}

// a API (ficheiros .php) trata dos seus próprios cabeçalhos: return false = o PHP executa o ficheiro
// normalmente, a partir da pasta do -t (public/)
if (substr($caminho, -4) === '.php') {
    return false;
}

// realpath resolve os ../ do caminho: se o ficheiro ficar fora da public/, dá 404
$ficheiro = $publico . ($caminho === '/' ? '/index.html' : $caminho);
$real = realpath($ficheiro);
if (!$real || !is_file($real) || strpos($real, realpath($publico) . DIRECTORY_SEPARATOR) !== 0) {
    http_response_code(404);
    exit;
}

$tipos = [
    'html' => 'text/html; charset=utf-8', 'js' => 'text/javascript; charset=utf-8', 'css' => 'text/css; charset=utf-8',
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'svg' => 'image/svg+xml',
    'ico' => 'image/x-icon', 'woff' => 'font/woff', 'woff2' => 'font/woff2', 'json' => 'application/json',
];
$extensao = strtolower(pathinfo($real, PATHINFO_EXTENSION));
if (!isset($tipos[$extensao])) {
    http_response_code(404);
    exit;
}

// os mesmos cabeçalhos de segurança do .htaccess
header_remove('X-Powered-By');
header('Content-Type: ' . $tipos[$extensao]);
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
header('Cross-Origin-Opener-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");

// os ficheiros do build têm um hash no nome: podem ficar em cache; o index.html nunca
header(strpos($caminho, '/assets/') === 0 ? 'Cache-Control: public, max-age=31536000, immutable' : 'Cache-Control: no-cache');

// o texto vai comprimido (gzip) se o browser aceitar; imagens e fontes já vêm comprimidas
$conteudo = file_get_contents($real);
$comprimir = in_array($extensao, ['html', 'js', 'css', 'svg', 'json'], true) && function_exists('gzencode');
if ($comprimir && strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false) {
    $conteudo = gzencode($conteudo, 6);
    header('Content-Encoding: gzip');
}
if ($comprimir) {
    header('Vary: Accept-Encoding');
}
header('Content-Length: ' . strlen($conteudo));
echo $conteudo;
