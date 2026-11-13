// Estilo de conferência: só os ossos e as juntas. Serve pra validar pose e FK antes de desenhar.
import React from 'react';
import type { Estilo } from '../estilo';
import type { Proporcao } from '../esqueleto';

const PROP: Proporcao = { cabeca: 60, cabecaLarg: 50, pescoco: 14, tronco: 96, ombros: 30, quadris: 16, braco: 60, antebraco: 54, mao: 20, coxa: 80, canela: 76, tornozelo: 8, pe: 30 };

export const esqueletoDebug: Estilo = {
  id: 'debug',
  nome: 'Esqueleto (conferência)',
  descricao: 'Os ossos e as juntas que todo estilo desenha por cima.',
  prop: PROP,
  propDe: () => PROP,
  Desenho: ({ j, pessoa, roupa }) => {
    const L = (a: [number, number], b: [number, number], c: string, w = 7) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />;
    const lado = (i: 0 | 1, op: number) => (
      <g opacity={op}>
        {L(j.quadril[i], j.joelho[i], roupa.baixo.cor, 9)}
        {L(j.joelho[i], j.tornozelo[i], roupa.baixo.cor, 8)}
        {L(j.calcanhar[i], j.ponta[i], roupa.calcado.cor, 7)}
        {L(j.ombro[i], j.cotovelo[i], "#FFE08A", 8)}
        {L(j.cotovelo[i], j.punho[i], pessoa.pele, 7)}
        {L(j.punho[i], j.dedos[i], pessoa.pele, 5)}
      </g>
    );
    return (
      <g>
        {lado(0, 0.55)}
        {L(j.pelvis, j.peito, roupa.cima.cor, 14)}
        {L(j.quadril[0], j.quadril[1], roupa.baixo.cor, 10)}
        {L(j.ombro[0], j.ombro[1], roupa.cima.cor, 10)}
        {L(j.peito, j.queixo, pessoa.pele, 7)}
        <circle cx={j.cabeca[0]} cy={j.cabeca[1]} r={PROP.cabeca / 2} fill={pessoa.pele} />
        <circle cx={j.cabeca[0] + 10} cy={j.cabeca[1] - 4} r={3} fill="#111" />
        {lado(1, 1)}
      </g>
    );
  },
};
