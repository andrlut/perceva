// Traço editorial — a forma com volume, sem contorno e sem gradiente.
//
// Técnica (cel por formas): dentro do recorte da forma,
//   1. a forma inteira na cor da SOMBRA;
//   2. a mesma forma, empurrada `s` na direção da luz, na cor BASE → sobra uma lua de sombra
//      no lado contrário à luz, que acompanha qualquer contorno (cabeça, braço dobrado, cabelo);
//   3. (opcional) a luz de RECORTE: a forma inteira na cor da luz e, por cima, tudo o que está
//      dentro da forma empurrada `r` pra longe da luz → sobra um fio de luz na borda iluminada.
// Várias formas (`ds`) viram UMA só pro sombreado (coxa + canela não ganham emenda no joelho).
import React from 'react';
import type { P } from './geo';
import { f1 } from './geo';

export type VolProps = {
  /** prefixo único (uid do boneco + nome da peça) */
  id: string;
  ds: string[];
  cor: string;
  sombra: string;
  /** quanto a lua de sombra entra (unidades) */
  s: number;
  /** direção da luz (unitário, no espaço onde a forma está desenhada) */
  luzDir: P;
  /** luz de recorte: cor e espessura */
  rim?: { cor: string; r: number } | null;
  opacity?: number;
};

export const Vol: React.FC<VolProps> = ({ id, ds, cor, sombra, s, luzDir, rim, opacity }) => {
  const sh = `translate(${f1(luzDir[0] * s)} ${f1(luzDir[1] * s)})`;
  const cid = `${id}-c`;
  const rid = `${id}-r`;
  const base = ds.map((d, i) => <path key={`b${i}`} d={d} fill={cor} transform={sh} />);
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={cid}>
          {ds.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
        {rim ? (
          <clipPath id={rid}>
            {ds.map((d, i) => (
              <path key={i} d={d} transform={`translate(${f1(-luzDir[0] * rim.r)} ${f1(-luzDir[1] * rim.r)})`} />
            ))}
          </clipPath>
        ) : null}
      </defs>
      {ds.map((d, i) => (
        <path key={`f${i}`} d={d} fill={rim ? rim.cor : sombra} />
      ))}
      <g clipPath={`url(#${cid})`}>
        {rim ? (
          <g clipPath={`url(#${rid})`}>
            {ds.map((d, i) => (
              <path key={`s${i}`} d={d} fill={sombra} />
            ))}
            {base}
          </g>
        ) : (
          base
        )}
      </g>
    </g>
  );
};

/** Forma chapada simples (detalhe pequeno: costura, botão, sombra projetada). */
export const Chapa: React.FC<{ d: string; cor: string; opacity?: number }> = ({ d, cor, opacity }) => <path d={d} fill={cor} opacity={opacity} />;
