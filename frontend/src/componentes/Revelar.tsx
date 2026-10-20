import { useEffect, useRef, useState, type ReactNode } from 'react';

// "crescendo": o conteúdo entra desfocado e vai ganhando foco quando aparece no ecrã
export default function Revelar({ children, atraso = 0, className = '' }: { children: ReactNode; atraso?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={ref} className={'revelar ' + (visivel ? 'visivel ' : '') + className} style={{ transitionDelay: atraso + 'ms' }}>
      {children}
    </div>
  );
}
