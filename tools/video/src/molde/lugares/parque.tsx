// Parque (fase 3) — STUB da fundação: parede lisa e piso, meio e primeiro plano vazios.
// Dono: agente E. O lugar de verdade (pista com raias em perspectiva até o horizonte, gramado,
// árvores, prédios ao longe, céu por hora; gente correndo ao fundo em laço com o Ator de
// src/elenco/acao.tsx) entra aqui, seguindo as regras de ambiente do MOLDE.md.
//
// Contrato: `Lugar` em ../ambientes (helpers de lá). Nunca importado pelo ambientes.tsx.
import React from 'react';
import { Piso, SkyDefs } from '../../elenco/cenario';
import { ArtSvg, type EnvP, type Lugar } from '../ambientes';

const Back: React.FC<EnvP> = ({ hora }) => (
  <ArtSvg>
    <SkyDefs id={`par-${hora}`} hora={hora} />
    <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#par-${hora}-wall)`} />
    <Piso id={`par-${hora}`} y={1000} />
  </ArtSvg>
);
const Nada: React.FC<EnvP> = () => null;

export const parque: Lugar = {
  back: Back,
  mid: Nada,
  front: Nada,
  depth: 240,
  gente: 'pouca',
  hora: 'dia',
  frontZones: { left: [-140, 1210, 290, 1530], right: [880, 1210, 1220, 1530] },
};
