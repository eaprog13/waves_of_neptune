-- importar no phpMyAdmin (cria a base de dados waves_of_neptune)

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS waves_of_neptune;
CREATE DATABASE waves_of_neptune CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE waves_of_neptune;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    tipo_utilizador ENUM('cliente', 'suporte', 'admin') NOT NULL DEFAULT 'cliente',
    telefone VARCHAR(20),
    morada VARCHAR(200),
    codigo_postal VARCHAR(10),
    cidade VARCHAR(100),
    dois_fatores TINYINT(1) NOT NULL DEFAULT 0,
    idioma CHAR(2) NOT NULL DEFAULT 'pt', -- língua dos emails (a que a pessoa usa no site)
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    nome_en VARCHAR(100) NULL
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    nome_en VARCHAR(150) NULL,
    descricao TEXT,
    descricao_en TEXT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    imagem VARCHAR(255),
    stock INT NOT NULL DEFAULT 0,
    categoria_id INT NOT NULL,
    destaque TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categories(id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_destaque (destaque)
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendente', 'em_preparacao', 'enviada', 'entregue', 'cancelada') NOT NULL DEFAULT 'pendente',
    pagamento ENUM('por_pagar', 'pago', 'reembolsado') NOT NULL DEFAULT 'por_pagar',
    total DECIMAL(10, 2) NOT NULL,
    nome_envio VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    morada VARCHAR(200) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_estado (estado)
);

-- nome_produto fica guardado para o histórico não se perder se o produto for apagado
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- admin: admin@won.pt / Admin1234
-- cliente: cliente@won.pt / Cliente1234
-- suporte: suporte@won.pt / Suporte1234 (criado mais abaixo)
INSERT INTO users (nome, email, password, tipo_utilizador, telefone, morada, codigo_postal, cidade) VALUES
('Administrador', 'admin@won.pt', '$2y$10$A2xWiYF9o3I0rg1nq9ub6uOsxlB6Jg6IiRmdrsTBCsrauyUmnUUd2', 'admin', NULL, NULL, NULL, NULL),
('Cliente Teste', 'cliente@won.pt', '$2y$10$eAkEvwkUN6ebTLUPkPIkk.bWz8Tuva2A2lA3Ap/Fa7VBZ1dqUTe26', 'cliente', '912345678', 'Rua do Mar, 12', '3000-123', 'Coimbra');

INSERT INTO categories (nome) VALUES ('Música'), ('Vestuário'), ('Posters'), ('Acessórios');

INSERT INTO products (nome, descricao, preco, imagem, stock, categoria_id, destaque) VALUES
('Vinil "Echoes of Neptune"', 'O álbum de estreia em vinil de 180g. Uma viagem atmosférica entre peso e silêncio, com capa gatefold e letras incluídas.', 25.00, 'vinil-echoes.jpg', 30, 1, 1),
('CD "Echoes of Neptune"', 'O álbum de estreia em CD digipak, com livreto de 12 páginas.', 12.00, 'cd-echoes.jpg', 50, 1, 1),
('T-shirt Logo WON', 'T-shirt preta 100% algodão com o logo da banda estampado à frente.', 20.00, 'tshirt-logo.jpg', 40, 2, 1),
('Poster Logo', 'Poster A3 com o logo vertical da banda, impresso em papel mate.', 8.00, 'poster-logo.jpg', 25, 3, 0),
('Poster Silos 2024', 'Poster A3 do concerto no Silos Contentor Criativo, em 2024.', 10.00, 'poster-silos.jpg', 15, 3, 1),
('Poster Ao Vivo', 'Poster A3 com uma foto ao vivo da banda em palco.', 10.00, 'poster-ao-vivo.jpg', 15, 3, 0),
('Poster Ao Vivo (azul)', 'Poster A3 com uma foto ao vivo do baixo e da bateria, em tons de azul.', 10.00, 'poster-azul.jpg', 4, 3, 0),
('Pack de Autocolantes', 'Pack de 5 autocolantes em vinil com o logo da banda.', 4.00, 'autocolantes.jpg', 100, 4, 0);

-- merch com os dois logos: "Logo WON" (o logo principal) e "Neptuno" (o círculo com a onda e o planeta)
-- categorias: 1 Música, 2 Vestuário, 3 Posters, 4 Acessórios
INSERT INTO products (nome, descricao, preco, imagem, stock, categoria_id, destaque) VALUES
('T-shirt Neptuno (preta)', 'T-shirt preta com o logo Neptuno (a onda e o planeta) estampado à frente.', 22.00, 'tshirt-neptuno-preta.jpg', 35, 2, 0),
('T-shirt Logo WON (branca)', 'T-shirt branca com o logo WON a preto, estampado à frente.', 20.00, 'tshirt-won-branca.jpg', 30, 2, 0),
('T-shirt Neptuno (branca)', 'T-shirt branca com o logo Neptuno a preto, estampado à frente.', 22.00, 'tshirt-neptuno-branca.jpg', 25, 2, 0),
('Camisola com capuz Logo WON', 'Camisola preta com capuz, bolso canguru e o logo WON estampado à frente.', 45.00, 'hoodie-won-preto.jpg', 20, 2, 1),
('Camisola com capuz Neptuno', 'Camisola preta com capuz, bolso canguru e o logo Neptuno estampado à frente.', 45.00, 'hoodie-neptuno-preto.jpg', 18, 2, 0),
('Sweatshirt Logo WON (cinzenta)', 'Sweatshirt cinzenta de gola redonda com o logo WON a preto.', 38.00, 'sweat-won-cinza.jpg', 15, 2, 0),
('Sweatshirt Neptuno (preta)', 'Sweatshirt preta de gola redonda com o logo Neptuno.', 38.00, 'sweat-neptuno-preta.jpg', 15, 2, 0),
('Calças jogger Logo WON (pretas)', 'Calças jogger pretas com elástico na cintura e o logo WON na perna esquerda.', 35.00, 'jogger-won-pretas.jpg', 12, 2, 0),
('Calças jogger Neptuno (cinzentas)', 'Calças jogger cinzentas com elástico na cintura e o símbolo Neptuno na perna esquerda.', 35.00, 'jogger-neptuno-cinza.jpg', 12, 2, 0),
('Boné Logo WON (preto)', 'Boné preto com pala curva e o logo WON bordado à frente.', 18.00, 'bone-won-preto.jpg', 25, 2, 1),
('Boné Neptuno (preto)', 'Boné preto com pala curva e o símbolo Neptuno bordado à frente.', 18.00, 'bone-neptuno-preto.jpg', 20, 2, 0),
('Boné Logo WON (branco)', 'Boné branco com pala curva e o logo WON bordado a preto.', 18.00, 'bone-won-branco.jpg', 20, 2, 0),
('Gorro Logo WON', 'Gorro preto canelado com o logo WON na dobra.', 15.00, 'gorro-won-preto.jpg', 22, 2, 0),
('Caneca Logo WON (preta)', 'Caneca preta de cerâmica (330 ml) com o logo WON.', 12.00, 'caneca-won-preta.jpg', 40, 4, 1),
('Caneca Neptuno (preta)', 'Caneca preta de cerâmica (330 ml) com o logo Neptuno.', 12.00, 'caneca-neptuno-preta.jpg', 40, 4, 0),
('Caneca Neptuno (branca)', 'Caneca branca de cerâmica (330 ml) com o logo Neptuno a preto.', 12.00, 'caneca-neptuno-branca.jpg', 35, 4, 0),
('Caneta Logo WON (preta)', 'Caneta esferográfica preta com o logo WON gravado.', 3.50, 'caneta-won-preta.jpg', 150, 4, 0),
('Caneta Logo WON (branca)', 'Caneta esferográfica branca com o logo WON a preto.', 3.50, 'caneta-won-branca.jpg', 150, 4, 0),
('Pin Logo WON', 'Pin metálico redondo (3,5 cm) com o logo WON.', 4.50, 'pin-won.jpg', 80, 4, 0),
('Pin Neptuno', 'Pin metálico redondo (3,5 cm) com o símbolo Neptuno.', 4.50, 'pin-neptuno.jpg', 80, 4, 0),
('Pack de 3 Pins', 'Os três pins da banda: logo WON, símbolo Neptuno e logo Neptuno completo.', 11.00, 'pack-pins.jpg', 40, 4, 0),
('Saco de pano Neptuno', 'Saco de pano cru com asas compridas e o logo Neptuno a preto.', 12.00, 'saco-neptuno.jpg', 30, 4, 0),
('Saco de pano Logo WON', 'Saco de pano preto com asas compridas e o logo WON.', 12.00, 'saco-won.jpg', 30, 4, 0),
('Porta-chaves Logo WON', 'Porta-chaves redondo com argola metálica e o logo WON.', 6.00, 'porta-chaves-won.jpg', 60, 4, 0),
('Porta-chaves Neptuno', 'Porta-chaves redondo com argola metálica e o símbolo Neptuno.', 6.00, 'porta-chaves-neptuno.jpg', 60, 4, 0),
('Vinil "Echoes of Neptune" - Edição Branca', 'Edição limitada do álbum em vinil branco, com o símbolo Neptuno na etiqueta.', 30.00, 'vinil-branco.jpg', 10, 1, 1),
('Vinil "Echoes of Neptune" - Edição Marmoreada', 'Edição limitada do álbum em vinil marmoreado cinzento, com o logo WON na etiqueta.', 30.00, 'vinil-marmoreado.jpg', 10, 1, 0),
('Cassete "Echoes of Neptune"', 'O álbum de estreia em cassete, com o logo WON na etiqueta.', 10.00, 'cassete-echoes.jpg', 25, 1, 0),
('Poster A2 Neptuno', 'Poster A2 com o logo Neptuno completo sobre fundo preto.', 15.00, 'poster-a2-neptuno.jpg', 20, 3, 0),
('Poster A2 Logo WON', 'Poster A2 com o logo WON a preto sobre papel cru.', 15.00, 'poster-a2-won.jpg', 20, 3, 0);

INSERT INTO orders (user_id, data, estado, total, nome_envio, telefone, morada, codigo_postal, cidade, pagamento) VALUES
(2, '2026-09-20 18:30:00', 'entregue', 45.00, 'Cliente Teste', '912345678', 'Rua do Mar, 12', '3000-123', 'Coimbra', 'pago'),
(2, '2026-10-05 10:15:00', 'enviada', 22.00, 'Cliente Teste', '912345678', 'Rua do Mar, 12', '3000-123', 'Coimbra', 'pago');

INSERT INTO order_items (order_id, product_id, nome_produto, quantidade, subtotal) VALUES
(1, 1, 'Vinil "Echoes of Neptune"', 1, 25.00),
(1, 3, 'T-shirt Logo WON', 1, 20.00),
(2, 2, 'CD "Echoes of Neptune"', 1, 12.00),
(2, 6, 'Poster Ao Vivo', 1, 10.00);

-- limites de tentativas, concertos, bilhetes e newsletter
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL,
    criado_em DATETIME NOT NULL,
    INDEX idx_chave_data (chave, criado_em)
);

CREATE TABLE IF NOT EXISTS concerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    titulo_en VARCHAR(150) NULL,
    local VARCHAR(150) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    data DATETIME NOT NULL,
    descricao TEXT,
    descricao_en TEXT NULL,
    imagem VARCHAR(255),
    preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
    lotacao INT NOT NULL,
    vendidos INT NOT NULL DEFAULT 0,
    estado ENUM('agendado', 'cancelado') NOT NULL DEFAULT 'agendado',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_data (data)
);

CREATE TABLE IF NOT EXISTS concert_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concert_id INT NOT NULL,
    user_id INT NOT NULL,
    quantidade INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    estado ENUM('reservado', 'cancelado') NOT NULL DEFAULT 'reservado',
    pagamento ENUM('por_pagar', 'pago', 'reembolsado') NOT NULL DEFAULT 'por_pagar',
    criado_em DATETIME NOT NULL,
    FOREIGN KEY (concert_id) REFERENCES concerts(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_concert (concert_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    token CHAR(64) NOT NULL UNIQUE,
    idioma CHAR(2) NOT NULL DEFAULT 'pt',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    consentimento_em DATETIME NOT NULL,
    criado_em DATETIME NOT NULL,
    cancelado_em DATETIME NULL
);

-- suporte: suporte@won.pt / Suporte1234 (trata das encomendas, não mexe em produtos nem utilizadores)
INSERT INTO users (nome, email, password, tipo_utilizador)
SELECT 'Equipa de Suporte', 'suporte@won.pt', '$2y$10$buiQjGfhNc82uL2srysE0us8q2dXBAxetZX30fgNPmytTyxkzRzTO', 'suporte'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'suporte@won.pt');

INSERT INTO concerts (titulo, local, cidade, data, descricao, imagem, preco, lotacao, vendidos, estado)
SELECT * FROM (
    SELECT 'Echoes of Neptune - Apresentação do álbum' AS titulo, 'Silos Contentor Criativo' AS local, 'Caldas da Rainha' AS cidade,
           '2026-11-21 21:30:00' AS data, 'A noite de apresentação do álbum de estreia, tocado do início ao fim, no palco onde tudo começou.' AS descricao,
           'evento-silos.jpg' AS imagem, 12.00 AS preco, 200 AS lotacao, 0 AS vendidos, 'agendado' AS estado
    UNION ALL SELECT 'Tour Echoes - Lisboa', 'Armazém 16', 'Lisboa', '2026-12-12 22:00:00',
           'Primeira data da tour em Lisboa, com convidados especiais a anunciar.', 'evento-lisboa.jpg', 15.00, 300, 0, 'agendado'
    UNION ALL SELECT 'Tour Echoes - Porto', 'Auditório do Mar', 'Porto', '2027-01-16 21:30:00',
           'A tour chega ao Porto, numa sala intimista à beira-mar.', 'evento-porto.jpg', 15.00, 250, 0, 'agendado'
    UNION ALL SELECT 'Live Session no Silos', 'Silos Contentor Criativo', 'Caldas da Rainha', '2024-05-18 21:30:00',
           'A live session que deu origem às fotos da galeria.', 'concerto-silos-2024.jpg', 10.00, 150, 150, 'agendado'
) novos
WHERE NOT EXISTS (SELECT 1 FROM concerts);

-- ---------- pagamentos, 2FA, envios e suporte ----------

-- códigos da autenticação de dois fatores (guardados em hash, expiram em 10 minutos)
CREATE TABLE two_factor_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    expira_em DATETIME NOT NULL,
    tentativas INT NOT NULL DEFAULT 0,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- pagamentos (de encomendas ou de bilhetes); o fornecedor é escolhido na configuração
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('encomenda', 'bilhete') NOT NULL,
    referencia_id INT NOT NULL,
    user_id INT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    moeda CHAR(3) NOT NULL DEFAULT 'EUR',
    fornecedor VARCHAR(30) NOT NULL,
    id_externo VARCHAR(100),
    estado ENUM('pendente', 'pago', 'falhado', 'cancelado', 'reembolsado') NOT NULL DEFAULT 'pendente',
    criado_em DATETIME NOT NULL,
    atualizado_em DATETIME NOT NULL,
    pago_em DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referencia (tipo, referencia_id),
    INDEX idx_externo (fornecedor, id_externo)
);

-- logística: um envio por encomenda, com os eventos do rastreamento
CREATE TABLE shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    transportadora VARCHAR(50) NOT NULL,
    codigo_rastreio VARCHAR(60) NOT NULL,
    url_rastreio VARCHAR(255),
    estado ENUM('em_preparacao', 'enviada', 'em_transito', 'em_distribuicao', 'entregue', 'devolvida', 'incidente') NOT NULL DEFAULT 'em_preparacao',
    criado_em DATETIME NOT NULL,
    atualizado_em DATETIME NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE shipment_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    estado ENUM('em_preparacao', 'enviada', 'em_transito', 'em_distribuicao', 'entregue', 'devolvida', 'incidente') NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    local VARCHAR(100),
    criado_em DATETIME NOT NULL,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_shipment (shipment_id)
);

-- tickets de suporte (problemas com encomendas), como no ITSM: estados, prioridades,
-- conversa com o cliente e notas internas que o cliente não vê
CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NULL,
    atribuido_a INT NULL,
    assunto VARCHAR(150) NOT NULL,
    categoria ENUM('atraso', 'danificado', 'produto_errado', 'em_falta', 'devolucao', 'pagamento', 'outro') NOT NULL,
    prioridade ENUM('baixa', 'normal', 'alta', 'urgente') NOT NULL DEFAULT 'normal',
    estado ENUM('aberto', 'em_analise', 'a_aguardar_cliente', 'resolvido', 'fechado') NOT NULL DEFAULT 'aberto',
    reaberturas INT NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL,
    atualizado_em DATETIME NOT NULL,
    resolvido_em DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (atribuido_a) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_estado (estado)
);

CREATE TABLE support_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    autor_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    interna TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id)
);

-- registo de cada notificação (email; whatsapp fica em standby)
CREATE TABLE notifications_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    canal ENUM('email', 'whatsapp') NOT NULL,
    evento VARCHAR(50) NOT NULL,
    estado ENUM('enviado', 'falhou', 'ignorado') NOT NULL,
    erro VARCHAR(255),
    criado_em DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id)
);

-- rastreamento das encomendas de exemplo
INSERT INTO shipments (order_id, transportadora, codigo_rastreio, estado, criado_em, atualizado_em) VALUES
(1, 'CTT', 'DA123456789PT', 'entregue', '2026-09-21 10:00:00', '2026-09-23 15:20:00'),
(2, 'CTT', 'DA987654321PT', 'em_transito', '2026-10-06 09:30:00', '2026-10-07 08:10:00');

INSERT INTO shipment_events (shipment_id, estado, descricao, local, criado_em) VALUES
(1, 'enviada', 'Encomenda entregue à transportadora.', 'Caldas da Rainha', '2026-09-21 10:00:00'),
(1, 'em_transito', 'Em trânsito para o centro de distribuição.', 'Lisboa', '2026-09-22 07:45:00'),
(1, 'entregue', 'Entregue ao destinatário.', 'Coimbra', '2026-09-23 15:20:00'),
(2, 'enviada', 'Encomenda entregue à transportadora.', 'Caldas da Rainha', '2026-10-06 09:30:00'),
(2, 'em_transito', 'Em trânsito para o centro de distribuição.', 'Lisboa', '2026-10-07 08:10:00');

-- um ticket de exemplo do cliente sobre a encomenda 2
INSERT INTO support_tickets (user_id, order_id, assunto, categoria, prioridade, estado, criado_em, atualizado_em) VALUES
(2, 2, 'A encomenda ainda não chegou', 'atraso', 'normal', 'aberto', '2026-10-09 18:00:00', '2026-10-09 18:00:00');

INSERT INTO support_messages (ticket_id, autor_id, mensagem, interna, criado_em) VALUES
(1, 2, 'Olá! A encomenda #2 está em trânsito desde dia 7. Sabem quando chega?', 0, '2026-10-09 18:00:00');

-- versão inglesa dos conteúdos (vazio = o site em inglês mostra o português)
UPDATE categories SET nome_en = 'Music' WHERE nome = 'Música';
UPDATE categories SET nome_en = 'Clothing' WHERE nome = 'Vestuário';
UPDATE categories SET nome_en = 'Posters' WHERE nome = 'Posters';
UPDATE categories SET nome_en = 'Accessories' WHERE nome = 'Acessórios';
UPDATE products SET nome_en = 'Vinyl "Echoes of Neptune"', descricao_en = 'The debut album on 180g vinyl. An atmospheric journey between weight and silence, with a gatefold sleeve and lyrics included.' WHERE nome = 'Vinil "Echoes of Neptune"';
UPDATE products SET nome_en = 'CD "Echoes of Neptune"', descricao_en = 'The debut album on digipak CD, with a 12-page booklet.' WHERE nome = 'CD "Echoes of Neptune"';
UPDATE products SET nome_en = 'WON Logo T-shirt', descricao_en = 'Black 100% cotton T-shirt with the band logo printed on the front.' WHERE nome = 'T-shirt Logo WON';
UPDATE products SET nome_en = 'Logo Poster', descricao_en = 'A3 poster with the band''s vertical logo, printed on matte paper.' WHERE nome = 'Poster Logo';
UPDATE products SET nome_en = 'Silos 2024 Poster', descricao_en = 'A3 poster from the gig at Silos Contentor Criativo in 2024.' WHERE nome = 'Poster Silos 2024';
UPDATE products SET nome_en = 'Live Poster', descricao_en = 'A3 poster with a live photo of the band on stage.' WHERE nome = 'Poster Ao Vivo';
UPDATE products SET nome_en = 'Live Poster (blue)', descricao_en = 'A3 poster with a live photo of the bass and drums in shades of blue.' WHERE nome = 'Poster Ao Vivo (azul)';
UPDATE products SET nome_en = 'Sticker Pack', descricao_en = 'Pack of 5 vinyl stickers with the band logo.' WHERE nome = 'Pack de Autocolantes';
UPDATE products SET nome_en = 'Neptune T-shirt (black)', descricao_en = 'Black T-shirt with the Neptune logo (the wave and the planet) printed on the front.' WHERE nome = 'T-shirt Neptuno (preta)';
UPDATE products SET nome_en = 'WON Logo T-shirt (white)', descricao_en = 'White T-shirt with the WON logo in black, printed on the front.' WHERE nome = 'T-shirt Logo WON (branca)';
UPDATE products SET nome_en = 'Neptune T-shirt (white)', descricao_en = 'White T-shirt with the Neptune logo in black, printed on the front.' WHERE nome = 'T-shirt Neptuno (branca)';
UPDATE products SET nome_en = 'WON Logo Hoodie', descricao_en = 'Black hoodie with a kangaroo pocket and the WON logo printed on the front.' WHERE nome = 'Camisola com capuz Logo WON';
UPDATE products SET nome_en = 'Neptune Hoodie', descricao_en = 'Black hoodie with a kangaroo pocket and the Neptune logo printed on the front.' WHERE nome = 'Camisola com capuz Neptuno';
UPDATE products SET nome_en = 'WON Logo Sweatshirt (grey)', descricao_en = 'Grey crew-neck sweatshirt with the WON logo in black.' WHERE nome = 'Sweatshirt Logo WON (cinzenta)';
UPDATE products SET nome_en = 'Neptune Sweatshirt (black)', descricao_en = 'Black crew-neck sweatshirt with the Neptune logo.' WHERE nome = 'Sweatshirt Neptuno (preta)';
UPDATE products SET nome_en = 'WON Logo Joggers (black)', descricao_en = 'Black joggers with an elasticated waist and the WON logo on the left leg.' WHERE nome = 'Calças jogger Logo WON (pretas)';
UPDATE products SET nome_en = 'Neptune Joggers (grey)', descricao_en = 'Grey joggers with an elasticated waist and the Neptune symbol on the left leg.' WHERE nome = 'Calças jogger Neptuno (cinzentas)';
UPDATE products SET nome_en = 'WON Logo Cap (black)', descricao_en = 'Black curved-peak cap with the WON logo embroidered on the front.' WHERE nome = 'Boné Logo WON (preto)';
UPDATE products SET nome_en = 'Neptune Cap (black)', descricao_en = 'Black curved-peak cap with the Neptune symbol embroidered on the front.' WHERE nome = 'Boné Neptuno (preto)';
UPDATE products SET nome_en = 'WON Logo Cap (white)', descricao_en = 'White curved-peak cap with the WON logo embroidered in black.' WHERE nome = 'Boné Logo WON (branco)';
UPDATE products SET nome_en = 'WON Logo Beanie', descricao_en = 'Black ribbed beanie with the WON logo on the cuff.' WHERE nome = 'Gorro Logo WON';
UPDATE products SET nome_en = 'WON Logo Mug (black)', descricao_en = 'Black ceramic mug (330 ml) with the WON logo.' WHERE nome = 'Caneca Logo WON (preta)';
UPDATE products SET nome_en = 'Neptune Mug (black)', descricao_en = 'Black ceramic mug (330 ml) with the Neptune logo.' WHERE nome = 'Caneca Neptuno (preta)';
UPDATE products SET nome_en = 'Neptune Mug (white)', descricao_en = 'White ceramic mug (330 ml) with the Neptune logo in black.' WHERE nome = 'Caneca Neptuno (branca)';
UPDATE products SET nome_en = 'WON Logo Pen (black)', descricao_en = 'Black ballpoint pen with the WON logo engraved.' WHERE nome = 'Caneta Logo WON (preta)';
UPDATE products SET nome_en = 'WON Logo Pen (white)', descricao_en = 'White ballpoint pen with the WON logo in black.' WHERE nome = 'Caneta Logo WON (branca)';
UPDATE products SET nome_en = 'WON Logo Pin', descricao_en = 'Round metal pin (3.5 cm) with the WON logo.' WHERE nome = 'Pin Logo WON';
UPDATE products SET nome_en = 'Neptune Pin', descricao_en = 'Round metal pin (3.5 cm) with the Neptune symbol.' WHERE nome = 'Pin Neptuno';
UPDATE products SET nome_en = '3-Pin Pack', descricao_en = 'The band''s three pins: the WON logo, the Neptune symbol and the full Neptune logo.' WHERE nome = 'Pack de 3 Pins';
UPDATE products SET nome_en = 'Neptune Tote Bag', descricao_en = 'Natural canvas tote bag with long handles and the Neptune logo in black.' WHERE nome = 'Saco de pano Neptuno';
UPDATE products SET nome_en = 'WON Logo Tote Bag', descricao_en = 'Black canvas tote bag with long handles and the WON logo.' WHERE nome = 'Saco de pano Logo WON';
UPDATE products SET nome_en = 'WON Logo Keyring', descricao_en = 'Round keyring with a metal ring and the WON logo.' WHERE nome = 'Porta-chaves Logo WON';
UPDATE products SET nome_en = 'Neptune Keyring', descricao_en = 'Round keyring with a metal ring and the Neptune symbol.' WHERE nome = 'Porta-chaves Neptuno';
UPDATE products SET nome_en = 'Vinyl "Echoes of Neptune" - White Edition', descricao_en = 'Limited edition of the album on white vinyl, with the Neptune symbol on the label.' WHERE nome = 'Vinil "Echoes of Neptune" - Edição Branca';
UPDATE products SET nome_en = 'Vinyl "Echoes of Neptune" - Marbled Edition', descricao_en = 'Limited edition of the album on grey marbled vinyl, with the WON logo on the label.' WHERE nome = 'Vinil "Echoes of Neptune" - Edição Marmoreada';
UPDATE products SET nome_en = 'Cassette "Echoes of Neptune"', descricao_en = 'The debut album on cassette, with the WON logo on the label.' WHERE nome = 'Cassete "Echoes of Neptune"';
UPDATE products SET nome_en = 'Neptune A2 Poster', descricao_en = 'A2 poster with the full Neptune logo on a black background.' WHERE nome = 'Poster A2 Neptuno';
UPDATE products SET nome_en = 'WON Logo A2 Poster', descricao_en = 'A2 poster with the WON logo in black on natural paper.' WHERE nome = 'Poster A2 Logo WON';
UPDATE concerts SET titulo_en = 'Echoes of Neptune - Album Release', descricao_en = 'The release night for the debut album, played from start to finish on the stage where it all began.' WHERE titulo = 'Echoes of Neptune - Apresentação do álbum';
UPDATE concerts SET titulo_en = 'Tour Echoes - Lisbon', descricao_en = 'First date of the tour in Lisbon, with special guests to be announced.' WHERE titulo = 'Tour Echoes - Lisboa';
UPDATE concerts SET titulo_en = 'Tour Echoes - Porto', descricao_en = 'The tour reaches Porto, in an intimate venue by the sea.' WHERE titulo = 'Tour Echoes - Porto';
UPDATE concerts SET titulo_en = 'Live Session at Silos', descricao_en = 'The live session behind the photos in the gallery.' WHERE titulo = 'Live Session no Silos';
