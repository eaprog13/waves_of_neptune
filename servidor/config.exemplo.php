<?php
// Modelo da configuração. Copiar para config.php e preencher (o config.php não vai para o git).
// Em produção, cada valor pode vir de uma variável de ambiente com o mesmo nome (ex.: WON_BD_DSN).
// Fica fora da public/, por isso o browser nunca lhe chega.

return [
    // desenvolvimento | producao
    'WON_AMBIENTE' => 'desenvolvimento',

    // qualquer base de dados suportada pelo PDO: mysql, pgsql, sqlite...
    'WON_BD_DSN' => 'mysql:host=localhost;dbname=waves_of_neptune;charset=utf8mb4',
    'WON_BD_UTILIZADOR' => 'root',
    'WON_BD_PASSWORD' => '',

    // origens que podem fazer pedidos à API, para além do próprio site (ex.: o Vite em desenvolvimento)
    'WON_ORIGENS' => 'http://localhost:5173',

    // sessão: minutos sem atividade e duração máxima (em horas)
    'WON_SESSAO_INATIVIDADE_MIN' => 30,
    'WON_SESSAO_MAXIMA_HORAS' => 12,

    // endereço público do site (para os links dos emails)
    'WON_URL_SITE' => 'http://localhost:8080',

    // email: registo (só em desenvolvimento: escreve os emails em servidor/registos/emails.log) | resend
    'WON_EMAIL_FORNECEDOR' => 'registo',
    'WON_RESEND_CHAVE' => '',
    'WON_EMAIL_REMETENTE' => 'Waves of Neptune <onboarding@resend.dev>',
    // quem recebe o aviso de cada ticket novo (vazio = ninguém)
    'WON_EMAIL_SUPORTE' => '',

    // pagamentos: simulado (para testar o fluxo; só funciona com WON_AMBIENTE = desenvolvimento) | stripe, easypay... quando forem ligados
    'WON_PAGAMENTOS_FORNECEDOR' => 'simulado',
    // segredo para confirmar que os avisos (webhooks) vêm mesmo do fornecedor de pagamentos.
    // este valor de exemplo é recusado: gerar um com  php -r "echo bin2hex(random_bytes(32));"
    'WON_PAGAMENTOS_SEGREDO' => 'trocar-por-um-segredo-aleatorio-com-64-caracteres',

    // whatsapp / sms: em standby (o lugar está preparado em servidor/nucleo/notificacoes.php)
    'WON_WHATSAPP_FORNECEDOR' => '',
];
