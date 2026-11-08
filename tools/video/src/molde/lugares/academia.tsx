// Academia (fase 3) — STUB da fundação: parede lisa e piso, meio e primeiro plano vazios.
// Dono: agente E. O lugar de verdade (rack de halteres, espelho de parede, banco, anilhas, piso de
// borracha, janela alta; gente treinando ao fundo) entra aqui, seguindo as regras de ambiente do
// MOLDE.md. A esteira foi cortada desta leva.
//
// Contrato: `Lugar` em ../ambientes (helpers de lá). Nunca importado pelo ambientes.tsx.
import React from 'react';
import { Piso, SkyDefs } from '../../elenco/cenario';
import { ArtSvg, type EnvP, type Lugar } from '../ambientes';

const Back: React.FC<EnvP> = ({ hora }) => (
  <ArtSvg>
    <SkyDefs id={`aca-${hora}`} hora={hora} />
    <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#aca-${hora}-wall)`} />
    <Piso id={`aca-${hora}`} y={1000} />
  </ArtSvg>
);
const Nada: React.FC<EnvP> = () => null;

export const academia: Lugar = {
  back: Back,
  mid: Nada,
  front: Nada,
  depth: 110,
  gente: 'pouca',
  hora: 'dia',
  frontZones: { left: [-110, 1090, 230, 1520], right: [900, 1150, 1300, 1530] },
};
