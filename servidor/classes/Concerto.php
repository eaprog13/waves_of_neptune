<?php
// concertos e reservas de bilhetes

class Concerto
{
    const ESTADOS = ['agendado', 'cancelado'];
    const MAXIMO_POR_RESERVA = 6;

    private $pdo;
    private $traduzir;

    // $traduzir = false é para o admin: recebe o título e a descrição nas duas línguas, para os editar
    public function __construct($pdo, $traduzir = true)
    {
        $this->pdo = $pdo;
        $this->traduzir = $traduzir;
    }

    // no site, o título e a descrição já vêm na língua do pedido
    private function campos()
    {
        $texto = $this->traduzir
            ? coluna_lingua('titulo') . ' AS titulo, ' . coluna_lingua('descricao') . ' AS descricao'
            : 'titulo, titulo_en, descricao, descricao_en';
        return "id, $texto, local, cidade, data, imagem, preco, lotacao, vendidos, estado, criado_em";
    }

    public function listar()
    {
        $stmt = $this->pdo->query('SELECT ' . $this->campos() . ' FROM concerts ORDER BY data');
        return array_map([$this, 'formatar'], $stmt->fetchAll());
    }

    public function obter($id)
    {
        $stmt = $this->pdo->prepare('SELECT ' . $this->campos() . ' FROM concerts WHERE id = ?');
        $stmt->execute([$id]);
        $concerto = $stmt->fetch();
        return $concerto ? $this->formatar($concerto) : null;
    }

    public function guardar($id, $dados)
    {
        $valores = [$dados['titulo'], $dados['titulo_en'], $dados['local'], $dados['cidade'], $dados['data'], $dados['descricao'], $dados['descricao_en'], $dados['preco'], $dados['lotacao'], $dados['estado'], $dados['imagem']];
        if ($id) {
            $sql = 'UPDATE concerts SET titulo = ?, titulo_en = ?, local = ?, cidade = ?, data = ?, descricao = ?, descricao_en = ?, preco = ?, lotacao = ?, estado = ?, imagem = ? WHERE id = ?';
            $valores[] = $id;
        } else {
            $sql = 'INSERT INTO concerts (titulo, titulo_en, local, cidade, data, descricao, descricao_en, preco, lotacao, estado, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        }
        $this->pdo->prepare($sql)->execute($valores);
        return $id ?: (int) $this->pdo->lastInsertId();
    }

    public function temReservas($id)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM concert_tickets WHERE concert_id = ?');
        $stmt->execute([$id]);
        return $stmt->fetchColumn() > 0;
    }

    public function apagar($id)
    {
        $this->pdo->prepare('DELETE FROM concerts WHERE id = ?')->execute([$id]);
    }

    // reserva numa transação: o concerto fica trancado até acabar, por isso duas reservas
    // ao mesmo tempo nunca passam da lotação
    public function reservar($userId, $concertoId, $quantidade)
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('SELECT id, preco, lotacao, vendidos, estado, data FROM concerts WHERE id = ? FOR UPDATE');
            $stmt->execute([$concertoId]);
            $concerto = $stmt->fetch();

            if (!$concerto || $concerto['estado'] !== 'agendado' || $concerto['data'] <= date('Y-m-d H:i:s')) {
                throw new DomainException('Este concerto já não tem bilhetes à venda.');
            }
            $disponiveis = $concerto['lotacao'] - $concerto['vendidos'];
            if ($quantidade > $disponiveis) {
                throw new DomainException($disponiveis > 0 ? tr('Só restam {n} bilhetes.', ['n' => $disponiveis]) : 'Os bilhetes estão esgotados.');
            }

            $codigo = $this->novoCodigo();
            $total = round($concerto['preco'] * $quantidade, 2);
            $this->pdo->prepare('INSERT INTO concert_tickets (concert_id, user_id, quantidade, total, codigo, estado, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$concertoId, $userId, $quantidade, $total, $codigo, 'reservado', date('Y-m-d H:i:s')]);
            $id = (int) $this->pdo->lastInsertId();
            $this->pdo->prepare('UPDATE concerts SET vendidos = vendidos + ? WHERE id = ?')->execute([$quantidade, $concertoId]);
            $this->pdo->commit();
            return ['id' => $id, 'codigo' => $codigo];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    // o cliente só pode cancelar as próprias reservas, e só antes do concerto
    public function cancelarReserva($userId, $bilheteId)
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('SELECT t.id, t.concert_id, t.quantidade, t.pagamento, c.data
                                         FROM concert_tickets t JOIN concerts c ON c.id = t.concert_id
                                         WHERE t.id = ? AND t.user_id = ? AND t.estado = ? FOR UPDATE');
            $stmt->execute([$bilheteId, $userId, 'reservado']);
            $bilhete = $stmt->fetch();

            if (!$bilhete) {
                throw new DomainException('Reserva não encontrada.');
            }
            if ($bilhete['data'] <= date('Y-m-d H:i:s')) {
                throw new DomainException('Já não é possível cancelar: o concerto já aconteceu.');
            }
            // uma reserva paga implica reembolso: é tratada pela equipa através de um pedido de ajuda
            if ($bilhete['pagamento'] === 'pago') {
                throw new DomainException('Esta reserva já está paga. Para a cancelar, abre um pedido de ajuda na tua conta.');
            }

            $this->pdo->prepare('UPDATE concert_tickets SET estado = ? WHERE id = ?')->execute(['cancelado', $bilheteId]);
            $this->pdo->prepare('UPDATE concerts SET vendidos = vendidos - ? WHERE id = ?')->execute([$bilhete['quantidade'], $bilhete['concert_id']]);
            $this->pdo->commit();
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function bilhetesDoUtilizador($userId)
    {
        $stmt = $this->pdo->prepare('SELECT t.id, t.quantidade, t.total, t.codigo, t.estado, t.pagamento, t.criado_em,
                                            c.id AS concerto_id, ' . coluna_lingua('c.titulo') . ' AS titulo, c.local, c.cidade, c.data, c.estado AS estado_concerto
                                     FROM concert_tickets t JOIN concerts c ON c.id = t.concert_id
                                     WHERE t.user_id = ?
                                     ORDER BY c.data DESC');
        $stmt->execute([$userId]);
        return array_map([$this, 'formatarBilhete'], $stmt->fetchAll());
    }

    public function reservasDoConcerto($concertoId)
    {
        $stmt = $this->pdo->prepare('SELECT t.id, t.quantidade, t.total, t.codigo, t.estado, t.pagamento, t.criado_em, u.nome, u.email
                                     FROM concert_tickets t JOIN users u ON u.id = t.user_id
                                     WHERE t.concert_id = ?
                                     ORDER BY t.criado_em DESC');
        $stmt->execute([$concertoId]);
        return array_map([$this, 'formatarBilhete'], $stmt->fetchAll());
    }

    // código do bilhete: WON-XXXX-XXXX, sem letras que se confundem (0/O, 1/I)
    private function novoCodigo()
    {
        $letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $codigo = 'WON-';
            for ($i = 0; $i < 8; $i++) {
                $codigo .= $letras[random_int(0, strlen($letras) - 1)] . ($i === 3 ? '-' : '');
            }
            $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM concert_tickets WHERE codigo = ?');
            $stmt->execute([$codigo]);
        } while ($stmt->fetchColumn() > 0);
        return $codigo;
    }

    private function formatar($concerto)
    {
        $concerto['id'] = (int) $concerto['id'];
        $concerto['preco'] = (float) $concerto['preco'];
        $concerto['lotacao'] = (int) $concerto['lotacao'];
        $concerto['vendidos'] = (int) $concerto['vendidos'];
        $concerto['disponiveis'] = max(0, $concerto['lotacao'] - $concerto['vendidos']);
        $concerto['passado'] = $concerto['data'] <= date('Y-m-d H:i:s');
        return $concerto;
    }

    private function formatarBilhete($bilhete)
    {
        $bilhete['id'] = (int) $bilhete['id'];
        $bilhete['quantidade'] = (int) $bilhete['quantidade'];
        $bilhete['total'] = (float) $bilhete['total'];
        if (isset($bilhete['concerto_id'])) {
            $bilhete['concerto_id'] = (int) $bilhete['concerto_id'];
        }
        return $bilhete;
    }
}
