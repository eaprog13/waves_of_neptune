<?php

class Encomenda
{
    const ESTADOS = ['pendente', 'em_preparacao', 'enviada', 'entregue', 'cancelada'];

    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // $itens = [[id, quantidade], ...]. O preço vem sempre da BD, nunca do browser.
    // Devolve o id da encomenda ou lança uma DomainException com a mensagem para o utilizador
    // (os erros da base de dados são PDOException: vão para o registo e nunca chegam ao browser).
    public function criar($userId, $itens, $envio)
    {
        $this->pdo->beginTransaction();
        try {
            $total = 0;
            $linhas = [];
            $procurar = $this->pdo->prepare('SELECT id, nome, nome_en, preco, stock FROM products WHERE id = ? FOR UPDATE');

            foreach ($itens as $item) {
                $procurar->execute([$item['id']]);
                $produto = $procurar->fetch();

                if (!$produto) {
                    throw new DomainException('Um dos produtos do carrinho já não existe.');
                }
                if ($produto['stock'] < $item['quantidade']) {
                    $nome = idioma() === 'en' && $produto['nome_en'] ? $produto['nome_en'] : $produto['nome'];
                    throw new DomainException(tr('Não há stock suficiente de "{produto}" (disponível: {n}).', ['produto' => $nome, 'n' => $produto['stock']]));
                }

                $subtotal = $produto['preco'] * $item['quantidade'];
                $total += $subtotal;
                $linhas[] = [$produto['id'], $produto['nome'], $item['quantidade'], $subtotal];
            }

            $stmt = $this->pdo->prepare('INSERT INTO orders (user_id, total, nome_envio, telefone, morada, codigo_postal, cidade) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$userId, $total, $envio['nome'], $envio['telefone'], $envio['morada'], $envio['codigo_postal'], $envio['cidade']]);
            $encomendaId = (int) $this->pdo->lastInsertId();

            $inserirItem = $this->pdo->prepare('INSERT INTO order_items (order_id, product_id, nome_produto, quantidade, subtotal) VALUES (?, ?, ?, ?, ?)');
            $tirarStock = $this->pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
            foreach ($linhas as [$produtoId, $nome, $quantidade, $subtotal]) {
                $inserirItem->execute([$encomendaId, $produtoId, $nome, $quantidade, $subtotal]);
                $tirarStock->execute([$quantidade, $produtoId]);
            }

            $this->pdo->commit();
            return $encomendaId;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function pertence($id, $userId)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM orders WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        return $stmt->fetchColumn() > 0;
    }

    // a quem avisar quando a encomenda muda (envio, pagamento)
    public function cliente($id)
    {
        $stmt = $this->pdo->prepare('SELECT o.id, o.estado, o.total, u.id AS user_id, u.nome, u.email, u.idioma FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function listarDoUtilizador($userId)
    {
        $stmt = $this->pdo->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY data DESC');
        $stmt->execute([$userId]);
        return $this->juntarItens($stmt->fetchAll());
    }

    // para o admin, com o nome e o email do cliente
    public function listarTodas($estado = '')
    {
        $sql = 'SELECT o.*, u.nome AS cliente, u.email FROM orders o JOIN users u ON u.id = o.user_id';
        $valores = [];
        if (in_array($estado, self::ESTADOS, true)) {
            $sql .= ' WHERE o.estado = ?';
            $valores[] = $estado;
        }
        $stmt = $this->pdo->prepare($sql . ' ORDER BY o.data DESC');
        $stmt->execute($valores);
        return $this->juntarItens($stmt->fetchAll());
    }

    // ao cancelar, o stock volta para os produtos
    public function mudarEstado($id, $novoEstado)
    {
        $this->pdo->beginTransaction();
        try {
            // o estado é lido já dentro da transação e a encomenda fica trancada (FOR UPDATE):
            // se dois admins cancelarem ao mesmo tempo, o segundo espera, vê "cancelada" e o stock só volta uma vez
            $stmt = $this->pdo->prepare('SELECT estado FROM orders WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $atual = $stmt->fetchColumn();

            if ($atual === false) {
                throw new DomainException('Encomenda não encontrada.');
            }
            if ($atual === 'cancelada') {
                throw new DomainException('Uma encomenda cancelada já não pode mudar de estado.');
            }

            $stmt = $this->pdo->prepare('UPDATE orders SET estado = ? WHERE id = ?');
            $stmt->execute([$novoEstado, $id]);

            if ($novoEstado === 'cancelada') {
                // SQL standard (sem UPDATE ... JOIN, que só existe no MySQL)
                $stmt = $this->pdo->prepare('UPDATE products SET stock = stock +
                                                 (SELECT COALESCE(SUM(i.quantidade), 0) FROM order_items i WHERE i.order_id = ? AND i.product_id = products.id)
                                             WHERE id IN (SELECT product_id FROM order_items WHERE order_id = ?)');
                $stmt->execute([$id, $id]);
            }
            $this->pdo->commit();
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function estatisticas()
    {
        $resumo = $this->pdo->query("SELECT
                (SELECT COALESCE(SUM(total), 0) FROM orders WHERE estado <> 'cancelada') AS total_vendas,
                (SELECT COUNT(*) FROM orders) AS total_encomendas,
                (SELECT COUNT(*) FROM orders WHERE estado = 'pendente') AS pendentes,
                (SELECT COUNT(*) FROM users WHERE tipo_utilizador = 'cliente') AS total_clientes,
                (SELECT COUNT(*) FROM products) AS total_produtos")->fetch();

        $porEstado = $this->pdo->query('SELECT estado, COUNT(*) AS total FROM orders GROUP BY estado')->fetchAll(PDO::FETCH_KEY_PAIR);

        $maisVendidos = $this->pdo->query("SELECT i.nome_produto, SUM(i.quantidade) AS quantidade, SUM(i.subtotal) AS total
                                           FROM order_items i
                                           JOIN orders o ON o.id = i.order_id
                                           WHERE o.estado <> 'cancelada'
                                           GROUP BY i.nome_produto
                                           ORDER BY quantidade DESC
                                           LIMIT 5")->fetchAll();

        $stockBaixo = $this->pdo->query('SELECT id, ' . coluna_lingua('nome') . ' AS nome, stock FROM products WHERE stock < 5 ORDER BY stock')->fetchAll();

        foreach ($maisVendidos as &$m) {
            $m['quantidade'] = (int) $m['quantidade'];
            $m['total'] = (float) $m['total'];
        }
        foreach ($stockBaixo as &$s) {
            $s['id'] = (int) $s['id'];
            $s['stock'] = (int) $s['stock'];
        }

        return [
            'total_vendas' => (float) $resumo['total_vendas'],
            'total_encomendas' => (int) $resumo['total_encomendas'],
            'pendentes' => (int) $resumo['pendentes'],
            'total_clientes' => (int) $resumo['total_clientes'],
            'total_produtos' => (int) $resumo['total_produtos'],
            'por_estado' => array_map('intval', $porEstado),
            'mais_vendidos' => $maisVendidos,
            'stock_baixo' => $stockBaixo,
        ];
    }


    // vai buscar os itens de todas as encomendas numa só consulta
    private function juntarItens($encomendas)
    {
        if (count($encomendas) === 0) {
            return [];
        }

        $ids = array_column($encomendas, 'id');
        $marcas = implode(',', array_fill(0, count($ids), '?'));
        // o nome fica como estava na altura da compra; em inglês mostra o nome inglês do produto, se existir
        $nome = idioma() === 'en' ? "COALESCE(NULLIF(p.nome_en, ''), i.nome_produto)" : 'i.nome_produto';
        $stmt = $this->pdo->prepare("SELECT i.order_id, i.product_id, $nome AS nome_produto, i.quantidade, i.subtotal
                                     FROM order_items i LEFT JOIN products p ON p.id = i.product_id
                                     WHERE i.order_id IN ($marcas)");
        $stmt->execute($ids);

        $itens = [];
        foreach ($stmt->fetchAll() as $item) {
            $itens[$item['order_id']][] = [
                'product_id' => $item['product_id'] === null ? null : (int) $item['product_id'],
                'nome_produto' => $item['nome_produto'],
                'quantidade' => (int) $item['quantidade'],
                'subtotal' => (float) $item['subtotal'],
            ];
        }

        foreach ($encomendas as &$encomenda) {
            $encomenda['id'] = (int) $encomenda['id'];
            $encomenda['user_id'] = (int) $encomenda['user_id'];
            $encomenda['total'] = (float) $encomenda['total'];
            $encomenda['itens'] = $itens[$encomenda['id']] ?? [];
        }
        return $encomendas;
    }
}
