const GENEROS = ['Post-Rock', 'Progressive Metal', 'Funk', 'Fusion', 'Ambient', 'Echoes of Neptune'];

// faixa a correr sem fim: a lista está repetida para a volta não se notar; pára com o rato por cima
export default function FaixaGeneros() {
  const metade = [...GENEROS, ...GENEROS];
  const itens = [...metade, ...metade];

  return (
    <div className="faixa-generos" role="img" aria-label={GENEROS.join(', ')}>
      <div className="faixa-conteudo" aria-hidden="true">
        {itens.map((genero, i) => (
          <span key={i}>{genero}<b>✦</b></span>
        ))}
      </div>
    </div>
  );
}
