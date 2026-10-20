<?php
// subscrições da newsletter (o envio é feito em public/api/admin/newsletter.php)

class Newsletter
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // se o email já existir, volta a ficar ativo (a resposta é sempre igual, para não revelar quem está inscrito)
    public function subscrever($email)
    {
        $stmt = $this->pdo->prepare('SELECT id, ativo FROM newsletter_subscribers WHERE email = ?');
        $stmt->execute([$email]);
        $existente = $stmt->fetch();
        $agora = date('Y-m-d H:i:s');

        if ($existente) {
            if (!$existente['ativo']) {
                $this->pdo->prepare('UPDATE newsletter_subscribers SET ativo = 1, idioma = ?, consentimento_em = ?, cancelado_em = NULL WHERE id = ?')
                    ->execute([idioma(), $agora, $existente['id']]);
            }
            return;
        }

        $this->pdo->prepare('INSERT INTO newsletter_subscribers (email, token, idioma, ativo, consentimento_em, criado_em) VALUES (?, ?, ?, 1, ?, ?)')
            ->execute([$email, bin2hex(random_bytes(32)), idioma(), $agora, $agora]);
    }

    // o token vai no link de cancelamento de cada email
    public function cancelar($token)
    {
        $stmt = $this->pdo->prepare('UPDATE newsletter_subscribers SET ativo = 0, cancelado_em = ? WHERE token = ? AND ativo = 1');
        $stmt->execute([date('Y-m-d H:i:s'), $token]);
        return $stmt->rowCount() > 0;
    }

    // para o envio: só quem está ativo, com o token do link de cancelamento
    public function ativos()
    {
        return $this->pdo->query('SELECT email, token, idioma FROM newsletter_subscribers WHERE ativo = 1')->fetchAll();
    }

    public function listar()
    {
        $lista = $this->pdo->query('SELECT id, email, ativo, consentimento_em, criado_em, cancelado_em FROM newsletter_subscribers ORDER BY criado_em DESC')->fetchAll();
        foreach ($lista as &$s) {
            $s['id'] = (int) $s['id'];
            $s['ativo'] = (bool) $s['ativo'];
        }
        return $lista;
    }
}
