import { Link } from 'react-router-dom';
import Imagem from '../componentes/Imagem';
import { t, type Chave } from '../i18n';

// os textos de cada membro estão nos dicionários (textos/pt.ts e textos/en.ts)
const MEMBROS: { nome: string; alcunha: string; foto: string; texto: Chave }[] = [
  {
    nome: 'Telmo Marques',
    alcunha: 'Lars Telmo Jordison',
    foto: 'telmo.jpg',
    texto: 'banda.telmo',
  },
  {
    nome: 'Luis Carreira',
    alcunha: 'Luigi Seabass',
    foto: 'luis.jpg',
    texto: 'banda.luis',
  },
  {
    nome: 'João Rodrigues',
    alcunha: 'Johnny Satrianni',
    foto: 'johnny.jpg',
    texto: 'banda.johnny',
  },
  {
    nome: 'Emanuel Aleluia',
    alcunha: 'Manel Cid',
    foto: 'manel.jpg',
    texto: 'banda.manel',
  },
];

// junta as antigas páginas Sobre, Música e Galeria, com o mesmo estilo
export default function Banda() {
  return (
    <div className="text-center">
      <section className="container container-cards-bg py-5 rounded-3">
        <h1>Waves of Neptune</h1>
        <p className="mt-3 p-1">{t('banda.p1')}</p>
        <p className="mt-3 p-1">{t('banda.p2')}</p>
        <p className="mt-3 p-1">{t('banda.p3')}</p>
        <div className="divisor-onda" aria-hidden="true"></div>
      </section>

      <section className="container container-cards-bg py-5 mt-5 rounded-3">
        <h2>{t('banda.membros')}</h2>
        <div className="row g-4 mt-2 px-2">
          {MEMBROS.map((membro) => (
            <div key={membro.nome} className="col-md-6 col-lg-4 mx-auto">
              <div className="card card-membro h-100 rounded-4 overflow-hidden">
                <Imagem src={'media/img/about/' + membro.foto} className="card-img-top" alt={t('banda.fotoDe', { nome: membro.nome })} />
                <div className="card-body text-center">
                  <h3 className="card-title fw-bold h2">{membro.nome}</h3>
                  <p className="alcunha"><strong><i>"{membro.alcunha}"</i></strong></p>
                  <p className="card-text fst-italic">{t(membro.texto)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-5 mt-5">
        <h2>{t('banda.musica')}</h2>
        <p className="text-secondary mt-3">{t('banda.estilo')}</p>
        <div className="row g-4 mt-4">
          <div className="col-12 col-md-6 text-center fundo-escuro rounded-3">
            <div className="card h-100 card-escrita">
              <Imagem src="media/img/music/album.webp" className="card-img-top" alt={t('inicio.capa')} width="720" height="720" />
              <div className="card-body">
                <h3 className="h2">Echoes of Neptune</h3>
                <p className="text-secondary">2026 · Debut Album</p>
                <p>{t('banda.albumTexto')}</p>
                <Link to="/loja?pesquisa=Echoes" className="btn btn-outline-light w-100">{t('banda.comprarAlbum')}</Link>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 text-center fundo-escuro rounded-3">
            <div className="card h-100 card-escrita">
              <div className="ratio ratio-16x9 h-100">
                <iframe src="https://www.youtube-nocookie.com/embed/9O9ZOZ_3lE0" title="WON - live@SILOS_CdR" allow="encrypted-media; picture-in-picture" allowFullScreen></iframe>
              </div>
              <div className="card-body">
                <h3 className="h2">Live Concert</h3>
                <p className="text-secondary">2024 · Live Session</p>
                <p>{t('banda.aoVivo')}</p>
                <a href="https://www.youtube.com/watch?v=9O9ZOZ_3lE0" target="_blank" rel="noreferrer" className="btn btn-outline-light w-100">{t('banda.assistir')}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container container-cards-bg py-5 mt-5 rounded-3">
        <h2>{t('banda.galeria')}</h2>
        <p className="text-secondary">{t('banda.galeriaTexto')}</p>
        <h3 className="h4 mt-4">{t('banda.galeriaConcerto')}</h3>
        <div className="row g-3 mt-2 px-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="col-md-6">
              <div className="card card-foto fundo-escuro">
                <Imagem src={`media/img/tour/foto-${n}.jpg`} className="img-fluid rounded" alt={t('banda.fotoBanda', { n })} width="1600" height="1067" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
