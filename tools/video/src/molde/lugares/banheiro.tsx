// Banheiro (fase 3) — STUB da fundação: parede lisa e piso, meio e primeiro plano vazios.
// Dono: agente D. O lugar de verdade (a câmera é o espelho: reflexo do cômodo atrás; pia como
// `Balcao`; azulejo, toalha, luz quente; janelinha fosca como `janela`) entra aqui, seguindo as
// regras de ambiente do MOLDE.md. Gente: só nenhuma.
//
// Contrato: `Lugar` em ../ambientes (helpers de lá). Nunca importado pelo ambientes.tsx.
import React from 'react';
import { Piso, SkyDefs } from '../../elenco/cenario';
import { ArtSvg, type EnvP, type Lugar } from '../ambientes';

const Back: React.FC<EnvP> = ({ hora }) => (
  <ArtSvg>
    <SkyDefs id={`ban-${hora}`} hora={hora} />
    <rect x={-400} y={-600} width={1880} height={1600} fill={`url(#ban-${hora}-wall)`} />
    <Piso id={`ban-${hora}`} y={1000} />
  </ArtSvg>
);
const Nada: React.FC<EnvP> = () => null;

export const banheiro: Lugar = {
  back: Back,
  mid: Nada,
  front: Nada,
  depth: 100,
  gente: 'nenhuma',
  hora: 'manha',
  frontZones: { left: [-125, 1090, 225, 1530], right: [880, 1250, 1140, 1510] },
};
