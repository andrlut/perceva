// Estilo "Volume suave" (boneco v5) — contrato em ../estilo.ts.
//
// Gente adulta de ~5,5 cabeças (ombro, cintura, quadril, pernas longas, cotovelo e joelho),
// construída em formas arredondadas SEM CONTORNO: cada peça tem luz (em cima à esquerda) e
// sombra em gradiente, sombra de contato onde as partes se encontram (embaixo do queixo, o
// tronco sobre o braço de trás, a barra da camisa sobre a calça, o braço da frente sobre o
// peito) e uma lasca nítida de luz de recorte na cor do lugar. Roupa de verdade (decote, gola,
// manga no comprimento certo, costura, botão, viés), mão com polegar e dedos, cabelo com
// volume e brilho. A evolução natural do mundo Perceva (redondo, colorido, sobre navy).
//
// Peças: volume/geo (vetores, tubos), volume/cor (luz e sombra mantendo a saturação),
// volume/kit (defs e a luz de recorte), volume/corpo (medidas e o tronco), volume/membros
// (braço, mão, perna, calçado, o que a mão segura), volume/roupa (tronco, roupa de cima,
// quadril/saia, avental, crachá), volume/cabeca (rosto, humor, o dedo na pele) e
// volume/cabelo (os 12 cortes, projetados pela vista).
import React from 'react';
import type { DesenhoProps, Estilo } from '../estilo';
import type { Proporcao } from '../esqueleto';
import { clamp } from './volume/geo';
import { Kit } from './volume/kit';
import { material, mistura } from './volume/cor';
import { medidas, propDaPessoa, tronco } from './volume/corpo';
import { braco, perna } from './volume/membros';
import { quadrilEls, troncoEls } from './volume/roupa';
import { cabeca, daCabeca } from './volume/cabeca';

const PROP: Proporcao = { cabeca: 40, cabecaLarg: 32, pescoco: 10, tronco: 58, ombros: 21, quadris: 11, braco: 38, antebraco: 32, mao: 14, coxa: 51, canela: 49, tornozelo: 9, pe: 28 };

/** a luz de recorte padrão: o dourado quente da marca */
const LUZ = '#FFD98A';

const Desenho: React.FC<DesenhoProps> = ({ j, pessoa, roupa, humor, t, uid, luz, segura, toque }) => {
  const prop = propDaPessoa(PROP, pessoa);
  const med = medidas(pessoa, prop);
  const k = new Kit(uid, luz ?? LUZ, j.espelho);
  const tr = tronco(j, med);
  // corrida: o cabelo vai pra trás com o corpo inclinado
  const arrasto = j.vista !== 'frente' ? clamp((j.ang.tronco - 5) / 8) : 0;
  const mc = { k, j, prop, med, pessoa, roupa, segura, t, toque };
  const cab = cabeca({ k, j, prop, med, pessoa, roupa, humor, t, uid, toque, arrasto });
  const W = prop.cabecaLarg;
  const H = prop.cabeca;
  const nx = j.vista === 'frente' ? 0 : j.vista === 'tres-quartos' ? -0.1 : -0.16;
  const pescocoTopo = daCabeca(j, [nx * W, 0.3 * H]);
  const rc = { k, j, prop, med, pessoa, roupa, tr, t, pescocoTopo };
  const tro = troncoEls(rc);
  const quad = quadrilEls(rc);
  const p0 = perna(mc, 0);
  const p1 = perna(mc, 1);
  // o braço de trás que CRUZA o peito (pensar: a mão segura o outro cotovelo) passa na frente do
  // tronco — a pose não diz isso (índice 0 = sempre atrás), então o estilo deduz: o braço da
  // frente está no rosto e o punho de trás passou pro lado da frente do corpo
  const cruza = j.vista !== 'frente' && j.bracoNaFrente[1] && !j.bracoNaFrente[0] && j.punho[0][0] > j.peito[0] + prop.ombros * 0.2;
  const b0 = braco(mc, 0, cruza);
  const b1 = braco(mc, 1);

  // sombras de contato (recortadas onde caem)
  const desf = k.desfoque(1.6);
  const recLonge = k.recorte([...p0.ds, ...(j.bracoNaFrente[0] || cruza ? [] : b0.ds)]);
  const recTronco = k.recorte(tro.ds);
  const recCalca = k.recorte([...quad.ds, ...p0.calca, ...p1.calca]);
  const sombraTroncoNoLonge = (
    <g clipPath={recLonge} opacity={0.5}>
      <path d={tro.dRoupa} fill="#0B0624" filter={desf} />
    </g>
  );
  const sombraBarra = roupa.baixo.tipo !== 'saia' && (
    <g clipPath={recCalca} opacity={0.45}>
      <path d={tro.dRoupa} fill="#0B0624" filter={desf} transform="translate(0.6 1.8)" />
    </g>
  );
  const dx = k.espelho ? -1.4 : 1.4;
  const sombraBraco = !j.bracoNaFrente[1] && (
    <g clipPath={recTronco} opacity={0.38}>
      {b1.ds.map((d, i) => (
        <path key={i} d={d} fill="#0B0624" filter={desf} transform={`translate(${dx} 1.4)`} />
      ))}
    </g>
  );
  // a cabeça faz sombra no pescoço e no colo
  const q = daCabeca(j, [0.02 * W, 0.42 * H]);
  const corSombraPele = mistura(material(pessoa.pele, 'pele').fundo, '#2A1E48', 0.35);
  const sombraCabeca = (
    <g clipPath={recTronco} opacity={0.55}>
      <ellipse cx={q[0] + (k.espelho ? -0.8 : 0.8)} cy={q[1] + 2.4} rx={0.34 * W} ry={0.11 * H} fill={corSombraPele} filter={desf} />
    </g>
  );

  return (
    <g>
      {cab.tras}
      {p0.el}
      {!j.bracoNaFrente[0] && !cruza && b0.el}
      {sombraTroncoNoLonge}
      {p1.el}
      {quad.el}
      {sombraBarra}
      {tro.antes}
      {tro.el}
      {sombraCabeca}
      {sombraBraco}
      {cruza && b0.el}
      {!j.bracoNaFrente[1] && b1.el}
      {cab.frente}
      {j.bracoNaFrente[0] && b0.el}
      {j.bracoNaFrente[1] && b1.el}
      <defs>{k.defs}</defs>
    </g>
  );
};

export const volume: Estilo = {
  id: 'volume',
  nome: 'Volume suave',
  descricao: 'Formas redondas com luz, sombra e recorte dourado, sem contorno: corpo adulto de 5,5 cabeças, roupa de verdade, mão que segura.',
  prop: PROP,
  propDe: (p) => propDaPessoa(PROP, p),
  Desenho,
};
