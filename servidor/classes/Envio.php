<?php
// logística: um envio por encomenda, com transportadora, código de rastreio e os eventos da entrega

class Envio
{
    const ESTADOS = ['em_preparacao', 'enviada', 'em_transito', 'em_distribuicao', 'entregue', 'devolvida', 'incidente'];
    const TRANSPORTADORAS = ['CTT', 'DPD', 'GLS', 'UPS', 'SEUR', 'Outra'];

    // estado do envio -> estado da encomenda (o resto não muda a encomenda)
    const ESTADO_ENCOMENDA = [
        'enviada' => 'enviada',
        'em_transito' => 'enviada',
        'em_distribuicao' => 'enviada',
        'entregue' => 'entregue',
    ];

    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // envios (com os eventos) de várias encomendas em duas consultas; devolve [order_id => envio]
    public function porEncomendas($ids)
    {
        if (!$ids) {
            return [];
        }
        $marcas = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("SELECT id, order_id, transportadora, codigo_rastreio, url_rastreio, estado, atualizado_em FROM shipments WHERE order_id IN ($marcas)");
        $stmt->execute(array_values($ids));
        $envios = [];
        $porId = [];
        foreach ($stmt->fetchAll() as $envio) {
            $envio['id'] = (int) $envio['id'];
            $envio['order_id'] = (int) $envio['order_id'];
            $envio['eventos'] = [];
            $envios[$envio['order_id']] = $envio;
            $porId[$envio['id']] = $envio['order_id'];
        }
        if ($porId) {
            $marcas = implode(',', array_fill(0, count($porId), '?'));
            $stmt = $this->pdo->prepare("SELECT shipment_id, estado, descricao, local, criado_em FROM shipment_events WHERE shipment_id IN ($marcas) ORDER BY criado_em, id");
            $stmt->execute(array_keys($porId));
            foreach ($stmt->fetchAll() as $evento) {
                $encomenda = $porId[$evento['shipment_id']];
                unset($evento['shipment_id']);
                $envios[$encomenda]['eventos'][] = $evento;
            }
        }
        return $envios;
    }

    // cria ou atualiza o envio; ao criar, regista logo que foi entregue à transportadora
    public function guardar($orderId, $transportadora, $codigo, $url)
    {
        $agora = date('Y-m-d H:i:s');
        $stmt = $this->pdo->prepare('SELECT id FROM shipments WHERE order_id = ?');
        $stmt->execute([$orderId]);
        $id = $stmt->fetchColumn();

        if ($id) {
            $this->pdo->prepare('UPDATE shipments SET transportadora = ?, codigo_rastreio = ?, url_rastreio = ?, atualizado_em = ? WHERE id = ?')
                ->execute([$transportadora, $codigo, $url ?: null, $agora, $id]);
            return false;
        }

        $this->pdo->prepare('INSERT INTO shipments (order_id, transportadora, codigo_rastreio, url_rastreio, estado, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute([$orderId, $transportadora, $codigo, $url ?: null, 'em_preparacao', $agora, $agora]);
        $this->adicionarEvento($orderId, 'enviada', 'Encomenda entregue à transportadora.', '');
        return true;
    }

    // novo passo da entrega: atualiza o envio e, se for o caso, o estado da encomenda
    public function adicionarEvento($orderId, $estado, $descricao, $local)
    {
        $stmt = $this->pdo->prepare('SELECT id FROM shipments WHERE order_id = ?');
        $stmt->execute([$orderId]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            throw new DomainException('Esta encomenda ainda não tem envio. Indica primeiro a transportadora e o código.');
        }

        $agora = date('Y-m-d H:i:s');
        $this->pdo->beginTransaction();
        $this->pdo->prepare('INSERT INTO shipment_events (shipment_id, estado, descricao, local, criado_em) VALUES (?, ?, ?, ?, ?)')
            ->execute([$id, $estado, $descricao, $local ?: null, $agora]);
        $this->pdo->prepare('UPDATE shipments SET estado = ?, atualizado_em = ? WHERE id = ?')->execute([$estado, $agora, $id]);
        if (isset(self::ESTADO_ENCOMENDA[$estado])) {
            $this->pdo->prepare("UPDATE orders SET estado = ? WHERE id = ? AND estado <> 'cancelada'")
                ->execute([self::ESTADO_ENCOMENDA[$estado], $orderId]);
        }
        $this->pdo->commit();
    }
}
