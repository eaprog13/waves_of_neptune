<?php
// autenticação de dois fatores: um código de 6 dígitos enviado por email
// o código é guardado em hash, vale 10 minutos e só aceita 5 tentativas

class DoisFatores
{
    const VALIDADE = 600;
    const MAXIMO_TENTATIVAS = 5;

    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // gera um código novo (os anteriores deixam de valer) e devolve-o para ser enviado
    public function gerar($userId)
    {
        $this->pdo->prepare('UPDATE two_factor_codes SET usado = 1 WHERE user_id = ? AND usado = 0')->execute([$userId]);

        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->pdo->prepare('INSERT INTO two_factor_codes (user_id, codigo_hash, expira_em, criado_em) VALUES (?, ?, ?, ?)')
            ->execute([$userId, password_hash($codigo, PASSWORD_DEFAULT), date('Y-m-d H:i:s', time() + self::VALIDADE), date('Y-m-d H:i:s')]);
        return $codigo;
    }

    // devolve 'certo', 'errado' ou 'bloqueado' (código expirado ou demasiadas tentativas)
    public function verificar($userId, $codigo)
    {
        $stmt = $this->pdo->prepare('SELECT id, codigo_hash, expira_em, tentativas FROM two_factor_codes
                                     WHERE user_id = ? AND usado = 0 ORDER BY id DESC LIMIT 1');
        $stmt->execute([$userId]);
        $registo = $stmt->fetch();

        if (!$registo || $registo['expira_em'] < date('Y-m-d H:i:s') || $registo['tentativas'] >= self::MAXIMO_TENTATIVAS) {
            return 'bloqueado';
        }
        if (password_verify($codigo, $registo['codigo_hash'])) {
            $this->pdo->prepare('UPDATE two_factor_codes SET usado = 1 WHERE id = ?')->execute([$registo['id']]);
            return 'certo';
        }
        $this->pdo->prepare('UPDATE two_factor_codes SET tentativas = tentativas + 1 WHERE id = ?')->execute([$registo['id']]);
        return $registo['tentativas'] + 1 >= self::MAXIMO_TENTATIVAS ? 'bloqueado' : 'errado';
    }

    // a***@won.pt
    public static function mascarar($email)
    {
        [$nome, $dominio] = explode('@', $email, 2) + ['', ''];
        return mb_substr($nome, 0, 1) . str_repeat('*', max(2, mb_strlen($nome) - 1)) . '@' . $dominio;
    }
}
