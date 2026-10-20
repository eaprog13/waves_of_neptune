<?php
// notificações: email (Resend) e, mais tarde, WhatsApp/SMS
// cada envio fica registado em notifications_log (sem o conteúdo, que pode ter códigos)

class Notificacoes
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // devolve true se o email foi enviado
    public function email($para, $assunto, $html, $evento, $userId = null)
    {
        try {
            $fornecedor = config('WON_EMAIL_FORNECEDOR', '');
            if ($fornecedor === 'resend') {
                $this->viaResend($para, $assunto, $html);
            } elseif ($fornecedor === 'registo' && em_desenvolvimento()) {
                $this->paraRegisto($para, $assunto, $html);
            } else {
                // em produção nunca se escrevem emails (com códigos) num ficheiro
                throw new Exception('O envio de email não está configurado.');
            }
            $this->registar($userId, 'email', $evento, 'enviado', null);
            return true;
        } catch (Exception $e) {
            error_log('[WON] email: ' . $e->getMessage());
            $this->registar($userId, 'email', $evento, 'falhou', $e->getMessage());
            return false;
        }
    }

    // WhatsApp / SMS em standby: o fornecedor (ex.: Twilio) entra aqui quando for ligado
    public function whatsapp($numero, $mensagem, $evento, $userId = null)
    {
        $this->registar($userId, 'whatsapp', $evento, 'ignorado', 'WhatsApp ainda não está ligado.');
        return false;
    }

    private function viaResend($para, $assunto, $html)
    {
        $chave = config('WON_RESEND_CHAVE', '');
        if ($chave === '') {
            throw new Exception('Falta a chave do Resend (WON_RESEND_CHAVE).');
        }

        $pedido = curl_init('https://api.resend.com/emails');
        curl_setopt_array($pedido, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $chave, 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode([
                'from' => config('WON_EMAIL_REMETENTE'),
                'to' => [$para],
                'subject' => $assunto,
                'html' => $html,
                'text' => trim(html_entity_decode(strip_tags(str_replace(['<br>', '</p>'], "\n", $html)))),
            ]),
        ]);
        $resposta = curl_exec($pedido);
        $codigo = curl_getinfo($pedido, CURLINFO_HTTP_CODE);
        $erro = curl_error($pedido);
        curl_close($pedido);

        if ($resposta === false || $codigo >= 300) {
            throw new Exception("O Resend respondeu $codigo $erro");
        }
    }

    // só em desenvolvimento: o email fica num ficheiro que o browser não consegue abrir
    private function paraRegisto($para, $assunto, $html)
    {
        $pasta = __DIR__ . '/../registos';
        if (!is_dir($pasta)) {
            mkdir($pasta, 0700, true);
        }
        $texto = trim(html_entity_decode(strip_tags(str_replace(['<br>', '</p>'], "\n", $html))));
        $linha = '=== ' . date('Y-m-d H:i:s') . " | para: $para | assunto: $assunto ===\n$texto\n\n";
        file_put_contents($pasta . '/emails.log', $linha, FILE_APPEND | LOCK_EX);
    }

    private function registar($userId, $canal, $evento, $estado, $erro)
    {
        $this->pdo->prepare('INSERT INTO notifications_log (user_id, canal, evento, estado, erro, criado_em) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$userId, $canal, $evento, $estado, $erro === null ? null : mb_substr($erro, 0, 255), date('Y-m-d H:i:s')]);
    }

    // modelo dos emails com o estilo da banda; os textos são escapados aqui
    // $cancelar: link para deixar de receber (newsletter); $lingua: a de quem recebe
    public static function modelo($titulo, $paragrafos, $botao = null, $cancelar = null, $lingua = null)
    {
        $corpo = '';
        foreach ($paragrafos as $paragrafo) {
            $corpo .= '<p style="margin:0 0 14px;line-height:1.5">' . nl2br(htmlspecialchars($paragrafo, ENT_QUOTES, 'UTF-8')) . '</p>';
        }
        if ($botao) {
            $corpo .= '<p style="margin:24px 0"><a href="' . htmlspecialchars($botao[1], ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;padding:12px 22px;border:1px solid #e6e6e6;border-radius:6px;color:#e6e6e6;text-decoration:none;letter-spacing:2px;text-transform:uppercase;font-size:12px">'
                . htmlspecialchars($botao[0], ENT_QUOTES, 'UTF-8') . '</a></p>';
        }
        return '<div style="background:#010101;padding:32px 16px;font-family:Georgia,serif;color:#e6e6e6">'
            . '<div style="max-width:560px;margin:0 auto;background:#0b0f14;border:1px solid #1d2329;border-radius:12px;padding:28px">'
            . '<p style="margin:0 0 20px;letter-spacing:6px;font-size:12px;color:#9aa3ab">WAVES OF NEPTUNE</p>'
            . '<h1 style="margin:0 0 18px;font-size:22px;letter-spacing:2px;text-transform:uppercase">' . htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8') . '</h1>'
            . $corpo
            . '<p style="margin:28px 0 0;font-size:12px;color:#6c757d">4th Floor Studio | Waves of Neptune</p>'
            . ($cancelar ? '<p style="margin:8px 0 0;font-size:12px"><a href="' . htmlspecialchars($cancelar, ENT_QUOTES, 'UTF-8') . '" style="color:#9aa3ab">' . htmlspecialchars(tr('Cancelar a subscrição da newsletter', [], $lingua), ENT_QUOTES, 'UTF-8') . '</a></p>' : '')
            . '</div></div>';
    }
}

function url_site($caminho = '')
{
    return rtrim((string) config('WON_URL_SITE', ''), '/') . '/' . ltrim($caminho, '/');
}
