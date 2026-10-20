# Guia do site

Como usar o site da Waves of Neptune, de visitante a administrador.

## Português e inglês

O site existe nas duas línguas. O botão com o globo, no fim do menu, mostra a língua atual (PT ou EN) e troca para a outra. Na primeira visita o site segue a língua do browser; depois fica a que escolheres. Mudam os menus, os textos, as mensagens de erro, os produtos, as categorias e os concertos.

## Visitante (sem conta)

- **Home**: o álbum em destaque, os produtos em destaque, as categorias e a newsletter. A seta no topo leva aos destaques.
- **Loja**:
  - filtra por categoria na coluna da esquerda;
  - pesquisa por texto (procura no nome e na descrição);
  - ordena por mais recentes, preço ou nome;
  - aparecem 9 produtos por página, com os botões de página no fim da lista;
  - os filtros ficam no endereço, por isso podes copiar o link e partilhar.
- **Produto**: foto, descrição, preço e stock (aparece "Últimas unidades" quando há menos de 5). Escolhe a quantidade e carrega em "Adicionar ao carrinho". Em baixo aparecem produtos da mesma categoria.
- **Carrinho** (ícone ou link no menu):
  - muda as quantidades com os botões − e +, ou remove produtos;
  - o subtotal de cada linha e o total atualizam na hora;
  - o carrinho fica guardado no browser, mesmo que feches a página.
- **Concertos**: as próximas datas, com o preço e os lugares livres, e os concertos que já aconteceram.
- **A Banda**: quem somos, os membros, a música e a galeria.
- **Newsletter**: põe o email, aceita a caixa de consentimento e carrega em "Subscrever".

## Cliente (com conta)

1. **Criar conta**: Entrar > Criar conta. Precisas de nome, email e uma password com pelo menos 10 caracteres.
2. **Comprar**:
   1. no carrinho, carrega em "Finalizar compra" (se não tiveres sessão, o site pede login e volta ao checkout);
   2. preenche os dados de envio, que vêm do teu perfil se já os tiveres guardado;
   3. carrega em "Confirmar encomenda" e segues para o **pagamento**. Em desenvolvimento o pagamento é simulado (escolhes se é aceite ou recusado); quando ficar pago, recebes um email.

   Os portes são grátis. Se a encomenda ficar por pagar, aparece "Pagar agora" na tua conta.
3. **Reservar bilhetes**: em Concertos, escolhe quantos bilhetes queres (até 6) e carrega em "Reservar bilhetes"; a seguir pagas como numa encomenda. Recebes um código `WON-XXXX-XXXX` para mostrar à entrada.
4. **A minha conta** (link "Conta" no menu):
   - **Encomendas**: carrega numa encomenda para ver os produtos, os dados de envio, o estado (pendente, em preparação, enviada, entregue ou cancelada), o pagamento e o **rastreamento** (transportadora, código e cada passo da entrega);
   - **Bilhetes**: as tuas reservas; podes cancelar enquanto o concerto não acontecer e não estiverem pagas (uma reserva paga cancela-se com um pedido de ajuda);
   - **Pedidos de ajuda**: abre um pedido (atraso, produto danificado, devolução, pagamento...), ligado a uma encomenda se quiseres, e segue a conversa com a equipa;
   - **Perfil**: muda os teus dados e a morada; mudar a password, o email ou a autenticação de dois fatores pede a password atual.

**Autenticação de dois fatores**: se a ligares no perfil (nos administradores está sempre ligada), depois da password o site pede um código de 6 algarismos enviado por email, válido 10 minutos.

A sessão termina sozinha depois de 30 minutos sem mexer no site, ou ao fim de 12 horas.

## Administração

Entra com uma conta de admin ou de suporte e carrega em **Admin** no menu. Cada pessoa só vê as secções a que tem acesso.

| Secção | Admin | Suporte | O que se faz |
|---|---|---|---|
| Painel | sim | | Vendas, n.º de encomendas e clientes, encomendas por estado, mais vendidos e produtos com pouco stock. |
| Produtos | sim | | "Novo produto" para criar; lápis para editar; caixote para apagar. A imagem pode ser JPG, PNG ou WEBP até 2 MB. "Mostrar nos destaques" põe o produto na Home. |
| Categorias | sim | | Criar, renomear e apagar. Só dá para apagar uma categoria sem produtos. |
| Encomendas | sim | sim | Filtra por estado, carrega em "Detalhes" para ver os produtos e a morada, e muda o estado na própria linha. Cancelar devolve o stock e uma encomenda cancelada já não muda. Em "Envio" indica-se a transportadora e o código de rastreio e acrescentam-se os passos da entrega (o cliente recebe email nos passos importantes). |
| Suporte | sim | sim | Os pedidos de ajuda dos clientes: filtrar por estado e prioridade, responder (ou deixar uma nota interna, que o cliente não vê), mudar o estado e a prioridade e atribuir a alguém da equipa. |
| Concertos | sim | só ver | Criar e editar datas, ver as reservas de cada concerto. Um concerto com reservas não se apaga: muda-se o estado para cancelado. |
| Newsletter | sim | | Lista de subscritores, exportar os emails ativos em CSV (abre no Excel) e enviar uma newsletter (no máximo uma a cada 10 minutos; cada email leva o link para cancelar). |
| Utilizadores | sim | | Lista de contas com o n.º de encomendas e o total gasto. Muda o papel de cada conta (cliente, suporte, admin). Ninguém muda o próprio papel e há sempre pelo menos um admin. |

Os produtos, as categorias e os concertos têm campos "em inglês" (nome, descrição, título). Se ficarem vazios, o site em inglês mostra o texto em português.

O que cada papel pode fazer é decidido pelo servidor. Esconder um botão no site é só para arrumar o ecrã.
