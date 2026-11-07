// Som do molde (v4, 2026-11-07): efeitos sintetizados (scripts/sfx.mjs → public/sfx) tocados
// por baixo da voz, só quando o vídeo pede (`sfx` no Molde / `molde.mjs render --sfx`).
// Sem `sfx`, nada toca e o vídeo sai igual ao de antes.
import React, { createContext, useContext } from 'react';
import { Audio, Sequence, staticFile } from 'remotion';

export const SfxContext = createContext(false);

export type SfxName = 'whoosh' | 'punch' | 'pop' | 'chime' | 'riser';
// volume de cada um contra a voz (1): ~−18 a −24 dB, a pesquisa manda o efeito nunca brigar com a fala
const VOL: Record<SfxName, number> = { whoosh: 0.2, punch: 0.28, pop: 0.16, chime: 0.13, riser: 0.1 };

/** Um efeito no quadro `at` (relativo à Sequence em volta). `at` absurdo (deixa ausente = 1e9) não toca. */
export const Sfx: React.FC<{ at: number; name: SfxName; gain?: number }> = ({ at, name, gain = 1 }) => {
  const on = useContext(SfxContext);
  if (!on || !Number.isFinite(at) || at > 1e8) return null;
  return (
    <Sequence from={Math.round(at)} durationInFrames={45} layout="none" name={`sfx:${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={VOL[name] * gain} />
    </Sequence>
  );
};
