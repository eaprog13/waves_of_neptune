<?php
// tickets de suporte (problemas com encomendas), no estilo do ITSM:
// estados, prioridades, atribuição a alguém da equipa, conversa com o cliente e notas internas

class Suporte
{
    const CATEGORIAS = ['atraso', 'danificado', 'produto_errado', 'em_falta', 'devolucao', 'pagamento', 'outro'];
    const PRIORIDADES = ['baixa', 'normal', 'alta', 'urgente'];
    const ESTADOS = ['aberto', 'em_analise', 'a_aguardar_cliente', 'resolvido', 'fechado'];

    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function criar($userId, $orderId, $assunto, $categoria, $mensagem)
    {
        $agora = date('Y-m-d H:i:s');
        $this->pdo->beginTransaction();
        $this->pdo->prepare('INSERT INTO support_tickets (user_id, order_id, assunto, categoria, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$userId, $orderId ?: null, $assunto, $categoria, $agora, $agora]);
        $id = (int) $this->pdo->lastInsertId();
        $this->pdo->prepare('INSERT INTO support_messages (ticket_id, autor_id, mensagem, interna, criado_em) VALUES (?, ?, ?, 0, ?)')
            ->execute([$id, $userId, $mensagem, $agora]);
        $this->pdo->commit();
        return $id;
    }

    private function selecionar()
    {
        return 'SELECT t.id, t.user_id, t.order_id, t.atribuido_a, t.assunto, t.categoria, t.prioridade, t.estado, t.reaberturas,
                       t.criado_em, t.atualizado_em, t.resolvido_em, u.nome AS cliente, u.email, u.idioma AS idioma_cliente, a.nome AS atribuido_nome
                FROM support_tickets t
                JOIN users u ON u.id = t.user_id
                LEFT JOIN users a ON a.id = t.atribuido_a';
    }

    public function listarDoCliente($userId)
    {
        $stmt = $this->pdo->prepare($this->selecionar() . ' WHERE t.user_id = ? ORDER BY t.atualizado_em DESC');
        $stmt->execute([$userId]);
        return array_map([$this, 'formatar'], $stmt->fetchAll());
    }

    // filtros: estado, prioridade, atribuido (id de alguém da equipa)
    public function listarTodos($filtros)
    {
        $sql = $this->selecionar() . ' WHERE 1 = 1';
        $valores = [];
        if (!empty($filtros['estado'])) {
            $sql .= ' AND t.estado = ?';
            $valores[] = $filtros['estado'];
        }
        if (!empty($filtros['prioridade'])) {
            $sql .= ' AND t.prioridade = ?';
            $valores[] = $filtros['prioridade'];
        }
        if (!empty($filtros['atribuido'])) {
            $sql .= ' AND t.atribuido_a = ?';
            $valores[] = $filtros['atribuido'];
        }
        // urgentes primeiro, depois os mais antigos à espera
        $sql .= " ORDER BY CASE t.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, t.atualizado_em";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($valores);
        return array_map([$this, 'formatar'], $stmt->fetchAll());
    }

    public function obter($id)
    {
        $stmt = $this->pdo->prepare($this->selecionar() . ' WHERE t.id = ?');
        $stmt->execute([$id]);
        $ticket = $stmt->fetch();
        return $ticket ? $this->formatar($ticket) : null;
    }

    // o cliente nunca recebe as notas internas da equipa
    public function mensagens($ticketId, $incluirInternas)
    {
        $sql = 'SELECT m.id, m.mensagem, m.interna, m.criado_em, u.nome AS autor, u.tipo_utilizador AS tipo_autor
                FROM support_messages m JOIN users u ON u.id = m.autor_id
                WHERE m.ticket_id = ?' . ($incluirInternas ? '' : ' AND m.interna = 0') . ' ORDER BY m.criado_em, m.id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$ticketId]);
        $lista = $stmt->fetchAll();
        foreach ($lista as &$m) {
            $m['id'] = (int) $m['id'];
            $m['interna'] = (bool) $m['interna'];
            $m['equipa'] = $m['tipo_autor'] !== 'cliente';
            unset($m['tipo_autor']);
        }
        return $lista;
    }

    public function responder($ticketId, $autorId, $mensagem, $interna)
    {
        $agora = date('Y-m-d H:i:s');
        $this->pdo->prepare('INSERT INTO support_messages (ticket_id, autor_id, mensagem, interna, criado_em) VALUES (?, ?, ?, ?, ?)')
            ->execute([$ticketId, $autorId, $mensagem, $interna ? 1 : 0, $agora]);
        $this->pdo->prepare('UPDATE support_tickets SET atualizado_em = ? WHERE id = ?')->execute([$agora, $ticketId]);
    }

    public function mudarEstado($ticketId, $estado)
    {
        $this->pdo->prepare('UPDATE support_tickets SET estado = ?, resolvido_em = ?, atualizado_em = ? WHERE id = ?')
            ->execute([$estado, in_array($estado, ['resolvido', 'fechado'], true) ? date('Y-m-d H:i:s') : null, date('Y-m-d H:i:s'), $ticketId]);
    }

    // o cliente respondeu a um ticket resolvido: volta a abrir e conta mais uma reabertura
    public function reabrir($ticketId)
    {
        $this->pdo->prepare("UPDATE support_tickets SET estado = 'aberto', resolvido_em = NULL, reaberturas = reaberturas + 1, atualizado_em = ? WHERE id = ?")
            ->execute([date('Y-m-d H:i:s'), $ticketId]);
    }

    public function mudarPrioridade($ticketId, $prioridade)
    {
        $this->pdo->prepare('UPDATE support_tickets SET prioridade = ?, atualizado_em = ? WHERE id = ?')->execute([$prioridade, date('Y-m-d H:i:s'), $ticketId]);
    }

    public function atribuir($ticketId, $utilizadorId)
    {
        $this->pdo->prepare('UPDATE support_tickets SET atribuido_a = ?, atualizado_em = ? WHERE id = ?')->execute([$utilizadorId ?: null, date('Y-m-d H:i:s'), $ticketId]);
    }

    // quem pode receber tickets (suporte e admin)
    public function equipa()
    {
        $lista = $this->pdo->query("SELECT id, nome FROM users WHERE tipo_utilizador IN ('suporte', 'admin') ORDER BY nome")->fetchAll();
        foreach ($lista as &$u) {
            $u['id'] = (int) $u['id'];
        }
        return $lista;
    }

    private function formatar($ticket)
    {
        foreach (['id', 'user_id', 'reaberturas'] as $campo) {
            $ticket[$campo] = (int) $ticket[$campo];
        }
        $ticket['order_id'] = $ticket['order_id'] === null ? null : (int) $ticket['order_id'];
        $ticket['atribuido_a'] = $ticket['atribuido_a'] === null ? null : (int) $ticket['atribuido_a'];
        return $ticket;
    }
}
