<?php
// fornecedores de pagamento: cada um implementa a mesma interface, e a loja não sabe qual está a usar.
// para ligar o Stripe ou o Easypay basta criar uma classe nova e escolhê-la em WON_PAGAMENTOS_FORNECEDOR.

interface FornecedorPagamento
{
    public function nome();

    // cria o pagamento no fornecedor; devolve ['id_externo' => ..., 'url' => para onde mandar o cliente]
    public function criar($pagamento);
}

// simula um fornecedor: o cliente escolhe na página de pagamento se o pagamento é aceite ou recusado
class PagamentoSimulado implements FornecedorPagamento
{
    public function nome()
    {
        return 'simulado';
    }

    public function criar($pagamento)
    {
        return ['id_externo' => 'sim_' . bin2hex(random_bytes(10)), 'url' => '#/pagamento/' . $pagamento['id']];
    }
}

// o simulado deixa o próprio cliente marcar o pagamento como pago: só existe em desenvolvimento
function pagamento_simulado()
{
    return config('WON_PAGAMENTOS_FORNECEDOR', '') === 'simulado' && em_desenvolvimento();
}

// erro de configuração (não do cliente): vai para o registo e o browser recebe o erro genérico
function fornecedor_pagamentos()
{
    if (pagamento_simulado()) {
        return new PagamentoSimulado();
    }
    throw new RuntimeException('O fornecedor de pagamentos não está configurado (o simulado só funciona em desenvolvimento).');
}

// email ao cliente quando o pagamento fica concluído
function avisar_pagamento($pdo, $pagamento)
{
    if ($pagamento['estado'] !== 'pago') {
        return;
    }
    $stmt = $pdo->prepare('SELECT nome, email, idioma FROM users WHERE id = ?');
    $stmt->execute([$pagamento['user_id']]);
    $cliente = $stmt->fetch();
    if (!$cliente) {
        return;
    }
    // o email vai na língua do cliente, com o valor no formato dessa língua (12,00 € / €12.00)
    $lingua = $cliente['idioma'];
    $valor = $lingua === 'en'
        ? '€' . number_format((float) $pagamento['valor'], 2, '.', ',')
        : number_format((float) $pagamento['valor'], 2, ',', ' ') . ' €';
    $oQue = $pagamento['tipo'] === 'encomenda'
        ? tr('a encomenda #{id}', ['id' => $pagamento['referencia_id']], $lingua)
        : tr('a reserva de bilhetes', [], $lingua);
    $html = Notificacoes::modelo(tr('Pagamento recebido', [], $lingua), [
        tr('Olá {nome},', ['nome' => $cliente['nome']], $lingua),
        tr('Recebemos o pagamento de {valor} para {oque}. Obrigado!', ['valor' => $valor, 'oque' => $oQue], $lingua),
        tr($pagamento['tipo'] === 'encomenda' ? 'Vamos preparar a encomenda e avisamos quando for enviada.' : 'Mostra o código da reserva à entrada do concerto.', [], $lingua),
    ], [tr('Ver a minha conta', [], $lingua), url_site('#/conta')], null, $lingua);
    (new Notificacoes($pdo))->email($cliente['email'], tr('Pagamento recebido', [], $lingua), $html, 'pagamento', (int) $pagamento['user_id']);
}

// o segredo que vem no config.exemplo.php: é público, por isso nunca vale
const SEGREDO_EXEMPLO = 'trocar-por-um-segredo-aleatorio-com-64-caracteres';

// os avisos (webhooks) do fornecedor vêm assinados com HMAC-SHA256 do corpo, com o segredo partilhado
function assinatura_valida($corpo, $assinatura)
{
    $segredo = (string) config('WON_PAGAMENTOS_SEGREDO', '');
    if (strlen($segredo) < 32 || $segredo === SEGREDO_EXEMPLO || !is_string($assinatura)) {
        return false;
    }
    return hash_equals(hash_hmac('sha256', $corpo, $segredo), $assinatura);
}
