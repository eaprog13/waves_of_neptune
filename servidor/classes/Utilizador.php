<?php

class Utilizador
{
    const TIPOS = ['cliente', 'suporte', 'admin'];

    // hash de uma password que ninguém sabe: quando o email não existe, a verificação demora o mesmo
    // e o tempo de resposta não denuncia que emails estão registados
    const HASH_FICTICIO = '$2y$10$z.VLsADkaUt2yOpK7Po/6uz.RdCV6iQYSoPLGKp9m2SfVqvfK/wXu';

    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function login($email, $password)
    {
        $stmt = $this->pdo->prepare('SELECT id, password FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $utilizador = $stmt->fetch();

        if (!password_verify($password, $utilizador['password'] ?? self::HASH_FICTICIO) || !$utilizador) {
            return null;
        }

        // se o PHP passar a usar um algoritmo mais forte, o hash é atualizado no login
        if (password_needs_rehash($utilizador['password'], PASSWORD_DEFAULT)) {
            $this->alterarPassword($utilizador['id'], $password);
        }
        return $this->obterSessao($utilizador['id']);
    }

    // o essencial para a sessão (lido em cada pedido)
    public function definirIdioma($id, $lingua)
    {
        $this->pdo->prepare('UPDATE users SET idioma = ? WHERE id = ?')->execute([$lingua, $id]);
    }

    public function obterSessao($id)
    {
        $stmt = $this->pdo->prepare('SELECT id, nome, email, tipo_utilizador AS tipo, idioma FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function emailExiste($email, $excetoId = 0)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ? AND id <> ?');
        $stmt->execute([$email, $excetoId]);
        return $stmt->fetchColumn() > 0;
    }

    public function registar($nome, $email, $password)
    {
        $stmt = $this->pdo->prepare('INSERT INTO users (nome, email, password) VALUES (?, ?, ?)');
        $stmt->execute([$nome, $email, password_hash($password, PASSWORD_DEFAULT)]);
        return (int) $this->pdo->lastInsertId();
    }

    public function obter($id)
    {
        $stmt = $this->pdo->prepare('SELECT id, nome, email, tipo_utilizador, telefone, morada, codigo_postal, cidade, dois_fatores FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $perfil = $stmt->fetch();
        if ($perfil) {
            // os administradores têm sempre 2FA
            $perfil['dois_fatores'] = $perfil['tipo_utilizador'] === 'admin' || (bool) $perfil['dois_fatores'];
        }
        return $perfil;
    }

    // 2FA: obrigatória para administradores, opcional para os outros
    public function precisaDoisFatores($id)
    {
        $stmt = $this->pdo->prepare('SELECT tipo_utilizador, dois_fatores FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $u = $stmt->fetch();
        return $u && ($u['tipo_utilizador'] === 'admin' || $u['dois_fatores']);
    }

    public function definirDoisFatores($id, $ativo)
    {
        $this->pdo->prepare('UPDATE users SET dois_fatores = ? WHERE id = ?')->execute([$ativo ? 1 : 0, $id]);
    }

    // muda sempre que a password muda: as sessões abertas com a password antiga deixam de valer
    public function marcaSessao($id)
    {
        $stmt = $this->pdo->prepare('SELECT password FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $hash = $stmt->fetchColumn();
        return $hash === false ? '' : hash('sha256', $hash);
    }

    public function passwordCerta($id, $password)
    {
        $stmt = $this->pdo->prepare('SELECT password FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return password_verify($password, (string) $stmt->fetchColumn());
    }

    public function atualizar($id, $dados)
    {
        $sql = 'UPDATE users SET nome = ?, email = ?, telefone = ?, morada = ?, codigo_postal = ?, cidade = ? WHERE id = ?';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$dados['nome'], $dados['email'], $dados['telefone'], $dados['morada'], $dados['codigo_postal'], $dados['cidade'], $id]);
    }

    public function alterarPassword($id, $password)
    {
        $stmt = $this->pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
        $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }

    public function mudarTipo($id, $tipo)
    {
        $stmt = $this->pdo->prepare('UPDATE users SET tipo_utilizador = ? WHERE id = ?');
        $stmt->execute([$tipo, $id]);
    }

    public function contarAdmins()
    {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM users WHERE tipo_utilizador = 'admin'")->fetchColumn();
    }

    // para o admin: utilizadores com o nº de encomendas e o total gasto
    public function listar()
    {
        $sql = "SELECT u.id, u.nome, u.email, u.tipo_utilizador, u.cidade, u.criado_em,
                       COUNT(o.id) AS encomendas,
                       COALESCE(SUM(CASE WHEN o.estado <> 'cancelada' THEN o.total END), 0) AS total_gasto
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id
                GROUP BY u.id, u.nome, u.email, u.tipo_utilizador, u.cidade, u.criado_em
                ORDER BY u.criado_em DESC";
        $lista = $this->pdo->query($sql)->fetchAll();
        foreach ($lista as &$u) {
            $u['id'] = (int) $u['id'];
            $u['encomendas'] = (int) $u['encomendas'];
            $u['total_gasto'] = (float) $u['total_gasto'];
        }
        return $lista;
    }
}
