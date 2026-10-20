<?php
// pagamentos de encomendas e de bilhetes
// o valor vem sempre da base de dados (nunca do browser) e cada cliente só paga o que é seu

class Pagamento
{
    const TABELAS = ['encomenda' => 'orders', 'bilhete' => 'concert_tickets'];

    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // cria o pagamento e pede ao fornecedor para onde mandar o cliente
    public function iniciar($tipo, $referenciaId, $userId, FornecedorPagamento $fornecedor)
    {
        $tabela = self::TABELAS[$tipo];
        $estadoValido = $tipo === 'encomenda' ? "estado <> 'cancelada'" : "estado = 'reservado'";
        $stmt = $this->pdo->prepare("SELECT total, pagamento FROM $tabela WHERE id = ? AND user_id = ? AND $estadoValido");
        $stmt->execute([$referenciaId, $userId]);
        $referencia = $stmt->fetch();

        if (!$referencia) {
            throw new DomainException($tipo === 'encomenda' ? 'Encomenda não encontrada.' : 'Reserva não encontrada.');
        }
        if ($referencia['pagamento'] !== 'por_pagar') {
            throw new DomainException('Já está pago.');
        }

        // um pagamento que tenha ficado a meio é cancelado: só fica um pendente
        $agora = date('Y-m-d H:i:s');
        $this->pdo->prepare("UPDATE payments SET estado = 'cancelado', atualizado_em = ? WHERE tipo = ? AND referencia_id = ? AND estado = 'pendente'")
            ->execute([$agora, $tipo, $referenciaId]);

        $this->pdo->prepare('INSERT INTO payments (tipo, referencia_id, user_id, valor, fornecedor, estado, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$tipo, $referenciaId, $userId, $referencia['total'], $fornecedor->nome(), 'pendente', $agora, $agora]);
        $id = (int) $this->pdo->lastInsertId();

        $externo = $fornecedor->criar(['id' => $id, 'valor' => (float) $referencia['total'], 'tipo' => $tipo, 'referencia_id' => $referenciaId]);
        $this->pdo->prepare('UPDATE payments SET id_externo = ? WHERE id = ?')->execute([$externo['id_externo'], $id]);

        return ['pagamento_id' => $id, 'url' => $externo['url'], 'valor' => (float) $referencia['total']];
    }

    public function obter($id, $userId)
    {
        $stmt = $this->pdo->prepare('SELECT id, tipo, referencia_id, valor, moeda, fornecedor, estado, criado_em, pago_em FROM payments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $pagamento = $stmt->fetch();
        if ($pagamento) {
            $pagamento['id'] = (int) $pagamento['id'];
            $pagamento['referencia_id'] = (int) $pagamento['referencia_id'];
            $pagamento['valor'] = (float) $pagamento['valor'];
        }
        return $pagamento;
    }

    public function porIdExterno($fornecedor, $idExterno)
    {
        $stmt = $this->pdo->prepare('SELECT id FROM payments WHERE fornecedor = ? AND id_externo = ?');
        $stmt->execute([$fornecedor, $idExterno]);
        return $stmt->fetchColumn();
    }

    // muda o estado de um pagamento pendente (pago ou falhado); repetir o mesmo aviso não faz nada
    // devolve a linha do pagamento se mudou, ou null se já não estava pendente
    public function concluir($id, $estado)
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM payments WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $pagamento = $stmt->fetch();

            if (!$pagamento || $pagamento['estado'] !== 'pendente') {
                $this->pdo->commit();
                return null;
            }

            $agora = date('Y-m-d H:i:s');
            $this->pdo->prepare('UPDATE payments SET estado = ?, atualizado_em = ?, pago_em = ? WHERE id = ?')
                ->execute([$estado, $agora, $estado === 'pago' ? $agora : null, $id]);

            if ($estado === 'pago') {
                $tabela = self::TABELAS[$pagamento['tipo']];
                $this->pdo->prepare("UPDATE $tabela SET pagamento = 'pago' WHERE id = ?")->execute([$pagamento['referencia_id']]);
            }
            $this->pdo->commit();
            $pagamento['estado'] = $estado;
            return $pagamento;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
