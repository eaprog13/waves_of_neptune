<?php

class Produto
{
    // o id no fim desempata, para a mesma ordem dar sempre as mesmas páginas
    const ORDENS = [
        'recentes' => 'p.criado_em DESC, p.id DESC',
        'preco_asc' => 'p.preco ASC, p.id ASC',
        'preco_desc' => 'p.preco DESC, p.id DESC',
        'nome' => 'nome',
    ];

    const POR_PAGINA = 9;

    private $pdo;
    private $traduzir;

    // $traduzir = false é para o admin: recebe o nome e a descrição nas duas línguas, para os editar
    public function __construct($pdo, $traduzir = true)
    {
        $this->pdo = $pdo;
        $this->traduzir = $traduzir;
    }

    // na loja, o nome e a descrição já vêm na língua do pedido
    private function campos()
    {
        $texto = $this->traduzir
            ? coluna_lingua('p.nome') . ' AS nome, ' . coluna_lingua('p.descricao') . ' AS descricao'
            : 'p.nome, p.nome_en, p.descricao, p.descricao_en';
        return "p.id, $texto, p.preco, p.imagem, p.stock, p.categoria_id, p.destaque, " . coluna_lingua('c.nome') . ' AS categoria';
    }

    // condições comuns à lista e à contagem
    private function condicoes($filtros)
    {
        $sql = '';
        $valores = [];

        if (!empty($filtros['categoria'])) {
            $sql .= ' AND p.categoria_id = ?';
            $valores[] = (int) $filtros['categoria'];
        }
        if (!empty($filtros['pesquisa'])) {
            // % e _ escritos pelo utilizador são procurados à letra (ESCAPE funciona em qualquer base de dados SQL);
            // procura nas duas línguas, para "vinyl" e "vinil" encontrarem o mesmo disco
            $termo = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $filtros['pesquisa']) . '%';
            $sql .= " AND (p.nome LIKE ? ESCAPE '!' OR p.descricao LIKE ? ESCAPE '!' OR p.nome_en LIKE ? ESCAPE '!' OR p.descricao_en LIKE ? ESCAPE '!')";
            array_push($valores, $termo, $termo, $termo, $termo);
        }
        if (!empty($filtros['destaque'])) {
            $sql .= ' AND p.destaque = 1';
        }
        return [$sql, $valores];
    }

    // filtros: categoria, pesquisa, destaque, ordem, limite
    public function listar($filtros = [], $deslocamento = 0)
    {
        [$condicoes, $valores] = $this->condicoes($filtros);
        $sql = 'SELECT ' . $this->campos() . '
                FROM products p
                JOIN categories c ON c.id = p.categoria_id
                WHERE 1 = 1' . $condicoes;

        // a ordem vem de uma lista fixa, nunca do utilizador diretamente;
        // por nome, ordena pelo nome que aparece (na língua do pedido)
        $ordem = self::ORDENS[$filtros['ordem'] ?? ''] ?? self::ORDENS['recentes'];
        if ($ordem === 'nome') {
            $ordem = ($this->traduzir ? coluna_lingua('p.nome') : 'p.nome') . ' ASC, p.id ASC';
        }
        $sql .= ' ORDER BY ' . $ordem;

        // LIMIT ... OFFSET funciona em MySQL, PostgreSQL e SQLite; os números são sempre inteiros
        if (!empty($filtros['limite'])) {
            $sql .= ' LIMIT ' . min(50, max(1, (int) $filtros['limite']));
            if ($deslocamento > 0) {
                $sql .= ' OFFSET ' . (int) $deslocamento;
            }
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($valores);
        return array_map([$this, 'formatar'], $stmt->fetchAll());
    }

    public function contar($filtros = [])
    {
        [$condicoes, $valores] = $this->condicoes($filtros);
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM products p WHERE 1 = 1' . $condicoes);
        $stmt->execute($valores);
        return (int) $stmt->fetchColumn();
    }

    // uma página da loja; se a página pedida já não existir (ex.: depois de filtrar), devolve a última
    public function pagina($filtros, $pagina)
    {
        $total = $this->contar($filtros);
        $paginas = max(1, (int) ceil($total / self::POR_PAGINA));
        $pagina = min(max(1, (int) $pagina), $paginas);
        $filtros['limite'] = self::POR_PAGINA;

        return [
            'produtos' => $this->listar($filtros, ($pagina - 1) * self::POR_PAGINA),
            'total' => $total,
            'pagina' => $pagina,
            'paginas' => $paginas,
            'por_pagina' => self::POR_PAGINA,
        ];
    }

    public function obter($id)
    {
        $stmt = $this->pdo->prepare('SELECT ' . $this->campos() . '
                                     FROM products p
                                     JOIN categories c ON c.id = p.categoria_id
                                     WHERE p.id = ?');
        $stmt->execute([$id]);
        $produto = $stmt->fetch();
        return $produto ? $this->formatar($produto) : null;
    }

    public function guardar($id, $dados)
    {
        $valores = [$dados['nome'], $dados['nome_en'], $dados['descricao'], $dados['descricao_en'], $dados['preco'], $dados['stock'], $dados['categoria_id'], $dados['destaque'], $dados['imagem']];

        if ($id) {
            $sql = 'UPDATE products SET nome = ?, nome_en = ?, descricao = ?, descricao_en = ?, preco = ?, stock = ?, categoria_id = ?, destaque = ?, imagem = ? WHERE id = ?';
            $valores[] = $id;
        } else {
            $sql = 'INSERT INTO products (nome, nome_en, descricao, descricao_en, preco, stock, categoria_id, destaque, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($valores);
        return $id ?: (int) $this->pdo->lastInsertId();
    }

    public function apagar($id)
    {
        $stmt = $this->pdo->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
    }

    // o PDO devolve os números como texto
    private function formatar($produto)
    {
        $produto['id'] = (int) $produto['id'];
        $produto['preco'] = (float) $produto['preco'];
        $produto['stock'] = (int) $produto['stock'];
        $produto['categoria_id'] = (int) $produto['categoria_id'];
        $produto['destaque'] = (bool) $produto['destaque'];
        return $produto;
    }
}
