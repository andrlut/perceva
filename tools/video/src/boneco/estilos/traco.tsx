// Estilo "Traço editorial" (boneco v5) — ilustração vetorial de revista, adaptada ao mundo azul-
// marinho do Perceva. Contrato em ../estilo.ts; as peças moram em ./traco/.
//
//  - Proporção adulta (~6,3 cabeças), membros longos, ombro, cintura e quadril de verdade.
//  - Formas chapadas SEM contorno: cada forma tem a cor base + UMA forma de sombra do lado oposto
//    à luz (cel por formas, nunca gradiente) + um fio de luz de recorte (`luz`, dourado quente por
//    padrão) na borda iluminada da cabeça, do cabelo, dos ombros e dos braços — é o que destaca a
//    pessoa do fundo escuro.
//  - O membro de TRÁS é um passo mais escuro (é o que separa as duas pernas de 3/4).
//  - Rosto simplificado mas específico: olho amendoado com brilho, sobrancelha, nariz por sombra,
//    lábios, orelha, bochecha; humor ok / feliz / cansado / focado / surpresa; pisca com t.
//  - Roupa de verdade (decote, manga que acaba onde deve, gola, botões, bolso, barra, sola,
//    cadarço) e o toque: o dedo afunda a bochecha (contorno cede, covinha de sombra, olho aperta).
//
// Ordem de pintura: braço de trás → perna de trás → cabelo de trás → pele do tronco (top/regata) →
// quadril + perna da frente → blusa → pescoço → gola → braço da frente → cabeça → braço da frente
// se `bracoNaFrente` (copo na boca, dedo no rosto).
import React from 'react';
import type { Estilo } from '../estilo';
import { C } from '../../theme';
import { PROP, corpoDe, propDe } from './traco/medidas';
import { troncoDe } from './traco/tronco';
import type { Ctx } from './traco/ctx';
import { pernas } from './traco/pernas';
import { Braco } from './traco/bracos';
import { Cima, Pescoco } from './traco/torso';
import { Cabeca, CabecaAtras, contornoLocal, mundo, sombraQueixo } from './traco/cabeca';
import { sombraPele } from './traco/cor';
import { type P, add, dirDe, dist, linhaFechada, membro, mul, suave } from './traco/geo';

/**
 * A sombra que a mão da frente joga no rosto quando passa na frente dele (dedo na bochecha, copo
 * na boca): o antebraço e a mão, deslocados pra longe da luz e recortados pela cabeça. É o que
 * separa o dedo da pele da mesma cor e faz o toque parecer toque.
 */
const SombraNoRosto: React.FC<{ c: Ctx }> = ({ c }) => {
  const { j, prop, corpo } = c;
  if (dist(j.punho[1], j.cabeca) > prop.cabecaLarg * 1.6) return null;
  const w = mundo(c);
  const cont = contornoLocal(c).map(w);
  const d = dirDe(j.ang.mao[1]);
  const ponta = add(j.punho[1], mul(d, (j.mao[1] === 'aponta' ? 1 : 0.6) * prop.mao));
  const off: P = [-c.L[0] * 1.0, -c.L[1] * 1.0];
  const sh = (p: P) => add(p, off);
  const k = corpo.braco[0][1] / 3.7;
  const ante = suave(membro(sh(j.cotovelo[1]), sh(j.punho[1]), corpo.antebraco));
  const mao = suave(
    membro(sh(j.punho[1]), sh(ponta), j.mao[1] === 'aponta' ? [[0, 1.7 * k, 1.7 * k], [0.5, 2.1 * k, 2.1 * k], [0.62, 0.8 * k, 0.8 * k], [1, 0.62 * k, 0.62 * k]] : [[0, 1.7 * k, 1.7 * k], [0.6, 2.2 * k, 2.2 * k], [1, 1.6 * k, 1.6 * k]]),
  );
  const id = `${c.uid}-snr`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={linhaFechada(cont)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} opacity={0.36}>
        <path d={ante} fill={c.peleS} />
        <path d={mao} fill={c.peleS} />
      </g>
    </g>
  );
};

export const traco: Estilo = {
  id: 'traco',
  nome: 'Traço editorial',
  descricao: 'Ilustração vetorial de revista: proporção adulta, formas chapadas com uma sombra e luz de recorte, roupa de verdade.',
  prop: PROP,
  propDe,
  Desenho: ({ j, pessoa, roupa, humor, t, uid, luz, segura, toque }) => {
    const prop = propDe(pessoa);
    const corpo = corpoDe(pessoa, prop);
    const tr = troncoDe(j, prop, corpo);
    // a luz vem do alto, do lado pra onde a pessoa olha (+x)
    const L: [number, number] = [0.55, -0.835];
    const c: Ctx = {
      j,
      prop,
      corpo,
      pessoa,
      roupa,
      uid: `tr${uid}`,
      L,
      luz: luz ?? C.goldLight,
      tr,
      t,
      pele: pessoa.pele,
      peleS: sombraPele(pessoa.pele),
    };
    const pn = pernas(c);
    const frenteCabeca = j.bracoNaFrente[1];
    return (
      <g>
        <Braco c={c} i={0} />
        {pn.tras}
        <CabecaAtras c={c} humor={humor} />
        <Cima c={c} parte="pele" />
        {pn.frente}
        <Cima c={c} parte="roupa" />
        <Pescoco c={c} sombraQueixo={sombraQueixo(c)} />
        <Cima c={c} parte="gola" />
        {!frenteCabeca ? <Braco c={c} i={1} segura={segura} /> : null}
        <Cabeca c={c} humor={humor} toque={toque} />
        {frenteCabeca ? <SombraNoRosto c={c} /> : null}
        {frenteCabeca ? <Braco c={c} i={1} segura={segura} /> : null}
      </g>
    );
  },
};
