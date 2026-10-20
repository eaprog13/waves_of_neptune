<?php
// limita quantas vezes uma ação pode ser feita num intervalo (força bruta no login, spam no registo...)
// as chaves guardam um hash (nunca o email ou o IP em claro)

class LimiteTaxa
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        // de vez em quando apaga os registos com mais de um dia
        if (random_int(1, 100) === 1) {
            $stmt = $this->pdo->prepare('DELETE FROM rate_limits WHERE criado_em < ?');
            $stmt->execute([date('Y-m-d H:i:s', time() - 86400)]);
        }
    }

    private function chave($acao, $valor)
    {
        return $acao . ':' . hash('sha256', $valor);
    }

    public function contar($acao, $valor, $segundos)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE chave = ? AND criado_em > ?');
        $stmt->execute([$this->chave($acao, $valor), date('Y-m-d H:i:s', time() - $segundos)]);
        return (int) $stmt->fetchColumn();
    }

    public function registar($acao, $valor)
    {
        $stmt = $this->pdo->prepare('INSERT INTO rate_limits (chave, criado_em) VALUES (?, ?)');
        $stmt->execute([$this->chave($acao, $valor), date('Y-m-d H:i:s')]);
    }

    public function limpar($acao, $valor)
    {
        $stmt = $this->pdo->prepare('DELETE FROM rate_limits WHERE chave = ?');
        $stmt->execute([$this->chave($acao, $valor)]);
    }

    // recusa com 429 se já chegou ao máximo; senão conta mais uma
    public function verificar($acao, $valor, $maximo, $segundos)
    {
        if ($this->contar($acao, $valor, $segundos) >= $maximo) {
            $minutos = (int) ceil($segundos / 60);
            responder(429, ['erro' => tr('Demasiadas tentativas. Tenta outra vez daqui a {minutos} minutos.', ['minutos' => $minutos])]);
        }
        $this->registar($acao, $valor);
    }
}
