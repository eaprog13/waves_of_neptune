<?php

class Categoria
{
    private $pdo;
    private $traduzir;

    // $traduzir = false é para o admin: recebe o nome nas duas línguas, para o editar
    public function __construct($pdo, $traduzir = true)
    {
        $this->pdo = $pdo;
        $this->traduzir = $traduzir;
    }

    // com o nº de produtos de cada uma; na loja, o nome já vem na língua do pedido
    public function listar()
    {
        $nome = $this->traduzir ? coluna_lingua('c.nome') . ' AS nome' : 'c.nome, c.nome_en';
        $sql = "SELECT c.id, $nome, COUNT(p.id) AS total_produtos
                FROM categories c
                LEFT JOIN products p ON p.categoria_id = c.id
                GROUP BY c.id, c.nome, c.nome_en
                ORDER BY nome";
        $lista = $this->pdo->query($sql)->fetchAll();
        foreach ($lista as &$c) {
            $c['id'] = (int) $c['id'];
            $c['total_produtos'] = (int) $c['total_produtos'];
        }
        return $lista;
    }

    public function nomeExiste($nome, $excetoId = 0)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM categories WHERE nome = ? AND id <> ?');
        $stmt->execute([$nome, $excetoId]);
        return $stmt->fetchColumn() > 0;
    }

    public function existe($id)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM categories WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetchColumn() > 0;
    }

    public function guardar($id, $nome, $nomeEn)
    {
        if ($id) {
            $stmt = $this->pdo->prepare('UPDATE categories SET nome = ?, nome_en = ? WHERE id = ?');
            $stmt->execute([$nome, $nomeEn, $id]);
        } else {
            $stmt = $this->pdo->prepare('INSERT INTO categories (nome, nome_en) VALUES (?, ?)');
            $stmt->execute([$nome, $nomeEn]);
        }
    }

    public function temProdutos($id)
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM products WHERE categoria_id = ?');
        $stmt->execute([$id]);
        return $stmt->fetchColumn() > 0;
    }

    public function apagar($id)
    {
        $stmt = $this->pdo->prepare('DELETE FROM categories WHERE id = ?');
        $stmt->execute([$id]);
    }
}
