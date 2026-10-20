import type { ImgHTMLAttributes } from 'react';

const RECURSO = 'media/img/logo/won_vert1.jpg';

// se a imagem falhar (ficheiro apagado, nome errado) mostra o logo em vez do ícone de imagem partida
export default function Imagem(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      loading="lazy"
      decoding="async"
      {...props}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(RECURSO)) {
          img.src = RECURSO;
        }
      }}
    />
  );
}
