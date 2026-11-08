// Cozinha (fase 3) — STUB da fundação: parede lisa e piso, meio e primeiro plano vazios.
// Dono: agente D. O lugar de verdade (bancada/pia, armários, geladeira, janela por hora, chaleira
// com vapor, fruteira, `Balcao` como mesa da cena) entra aqui, seguindo as regras de ambiente do
// MOLDE.md (clear, busy, show, frontZones, gente; cenário mais escuro e menos saturado que ela).
//
// Contrato: `Lugar` em ../ambientes (importe os helpers de lá: EnvP, ArtSvg, Prop, decor, free,
// hits, howMany, faceAt, faceRect). Este arquivo nunca é importado pelo ambientes.tsx — quem
// registra é o scenes.tsx, via ./index.ts (LUGARES).
import React from 'react';
import { Piso, SkyDefs } from '../../elenco/cenario';
import { ArtSvg, type EnvP, type Lugar } from '../ambientes';

const Back: React.FC<EnvP> = ({ hora }) => (
  <ArtSvg>
    <SkyDefs id={`coz-${hora}`} hora={hora} />
    <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#coz-${hora}-wall)`} />
    <Piso id={`coz-${hora}`} y={1000} />
  </ArtSvg>
);
const Nada: React.FC<EnvP> = () => null;

export const cozinha: Lugar = {
  back: Back,
  mid: Nada,
  front: Nada,
  depth: 100,
  gente: 'nenhuma',
  hora: 'manha',
  frontZones: { left: [-125, 1090, 225, 1530], right: [880, 1250, 1140, 1510] },
};
