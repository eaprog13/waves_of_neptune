<?php
// validação dos dados recebidos (o mesmo papel do zod no front-end, com as mesmas regras)
// cada método devolve o valor já limpo e guarda a mensagem de erro se não for válido

class Validador
{
    private $dados;
    private $erros = [];

    public function __construct($dados)
    {
        $this->dados = is_array($dados) ? $dados : [];
    }

    private function valor($campo)
    {
        $valor = $this->dados[$campo] ?? null;
        if (is_string($valor)) {
            return trim($valor);
        }
        if (is_int($valor) || is_float($valor)) {
            return (string) $valor;
        }
        return '';
    }

    public function texto($campo, $rotulo, $minimo, $maximo, $obrigatorio = true)
    {
        $valor = $this->valor($campo);
        if ($valor === '' && !$obrigatorio) {
            return '';
        }
        $tamanho = mb_strlen($valor);
        if ($tamanho < $minimo || $tamanho > $maximo) {
            $this->erros[] = tr('{rotulo} deve ter entre {minimo} e {maximo} caracteres.', ['rotulo' => tr($rotulo), 'minimo' => $minimo, 'maximo' => $maximo]);
        }
        return $valor;
    }

    public function email($campo)
    {
        $valor = mb_strtolower($this->valor($campo));
        if (mb_strlen($valor) > 150 || !filter_var($valor, FILTER_VALIDATE_EMAIL)) {
            $this->erros[] = tr('O email não é válido.');
        }
        return $valor;
    }

    public function password($campo, $rotulo = 'A password')
    {
        $valor = $this->dados[$campo] ?? '';
        $valor = is_string($valor) ? $valor : '';
        if (mb_strlen($valor) < 10 || mb_strlen($valor) > 128) {
            $this->erros[] = tr('{rotulo} tem de ter entre 10 e 128 caracteres.', ['rotulo' => tr($rotulo)]);
        }
        return $valor;
    }

    public function inteiro($campo, $rotulo, $minimo, $maximo)
    {
        $valor = $this->valor($campo);
        if (!preg_match('/^-?\d+$/', $valor) || (int) $valor < $minimo || (int) $valor > $maximo) {
            $this->erros[] = tr('{rotulo} tem de ser um número inteiro entre {minimo} e {maximo}.', ['rotulo' => tr($rotulo), 'minimo' => $minimo, 'maximo' => $maximo]);
            return $minimo;
        }
        return (int) $valor;
    }

    public function decimal($campo, $rotulo, $minimo, $maximo)
    {
        $valor = str_replace(',', '.', $this->valor($campo));
        if (!is_numeric($valor) || (float) $valor < $minimo || (float) $valor > $maximo) {
            $this->erros[] = tr('{rotulo} tem de ser um valor entre {minimo} e {maximo}.', ['rotulo' => tr($rotulo), 'minimo' => $minimo, 'maximo' => $maximo]);
            return $minimo;
        }
        return round((float) $valor, 2);
    }

    public function opcao($campo, $rotulo, $opcoes)
    {
        $valor = $this->valor($campo);
        if (!in_array($valor, $opcoes, true)) {
            $this->erros[] = tr('{rotulo} não é válido.', ['rotulo' => tr($rotulo)]);
        }
        return $valor;
    }

    public function booleano($campo)
    {
        return in_array($this->dados[$campo] ?? false, [true, 1, '1', 'true'], true);
    }

    public function padrao($campo, $mensagem, $expressao, $obrigatorio = true)
    {
        $valor = $this->valor($campo);
        if ($valor === '' && !$obrigatorio) {
            return '';
        }
        if (!preg_match($expressao, $valor)) {
            $this->erros[] = tr($mensagem);
        }
        return $valor;
    }

    // aceita "2026-11-20T21:30" (input datetime-local) ou "2026-11-20 21:30:00"
    public function dataHora($campo, $rotulo)
    {
        $valor = str_replace('T', ' ', $this->valor($campo));
        foreach (['Y-m-d H:i', 'Y-m-d H:i:s'] as $formato) {
            $data = DateTime::createFromFormat($formato, $valor);
            if ($data && $data->format($formato) === $valor) {
                return $data->format('Y-m-d H:i:s');
            }
        }
        $this->erros[] = tr('{rotulo} não é uma data válida.', ['rotulo' => tr($rotulo)]);
        return null;
    }

    public function erro($mensagem, $valores = [])
    {
        $this->erros[] = tr($mensagem, $valores);
    }

    public function temErros()
    {
        return count($this->erros) > 0;
    }

    // responde 422 com todas as mensagens se houver algum erro
    public function verificar()
    {
        if ($this->erros) {
            responder(422, ['erro' => implode(' ', $this->erros), 'erros' => $this->erros]);
        }
    }
}
