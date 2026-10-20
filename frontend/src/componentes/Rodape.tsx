import { useEffect, useRef, useState } from 'react';

// mesma fonte e animação do menu: as linhas entram uma a uma quando o footer aparece no ecrã
export default function Rodape() {
  const ref = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;

    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        setVisivel(true);
        observador.disconnect();
      }
    });
    observador.observe(footer);
    return () => observador.disconnect();
  }, []);

  return (
    <footer ref={ref} className={'rodape mt-5' + (visivel ? ' visivel' : '')}>
      <p>4th Floor Studio | Waves of Neptune</p>
      <p>| Business Email: <a href="mailto:won.music@gmail.com">won.music@gmail.com</a> |</p>
      <p className="mb-0">&copy; {new Date().getFullYear()} | All rights reserved.</p>
    </footer>
  );
}
