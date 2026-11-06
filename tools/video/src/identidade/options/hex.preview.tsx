// Prévia de bancada da opção "hex" (não entra no Root): boné, suor, peça na
// mão em tamanho de cena, braço pra baixo, penteados em outras peles, os três
// humores a 90 px, e multidão sobre piso claro e sobre fundo de cor.
// Renderizada por um script de rascunho que usa este arquivo como entryPoint.
import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import '../../fonts';
import { Caderno, Moeda } from '../../elenco/cast';
import { C, dimColor } from '../../theme';
import { SKINS } from '../types';
import { option } from './hex';

const P = option.Pessoa;

const Bench: React.FC = () => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <div style={{ position: 'absolute', left: 20, top: 40 }}>
        <P t={t} size={320} seed={4} skin={SKINS[2]} accent={dimColor('bonds')} cap={C.gold} arms="out" />
      </div>
      <div style={{ position: 'absolute', left: 20 + 320 * 0.75, top: 40 + 320 * 0.48, transform: 'rotate(8deg)' }}>
        <Caderno size={170} />
      </div>
      <div style={{ position: 'absolute', left: 560, top: 40 }}>
        <P t={t} size={320} seed={7} skin={SKINS[4]} accent={C.violet} mood="cansado" arms="down" sweat />
      </div>
      <div style={{ position: 'absolute', left: 20, top: 520 }}>
        <P t={t} size={320} seed={0} skin={SKINS[1]} accent={dimColor('craft')} cap={dimColor('health')} mood="feliz" arms="none" />
      </div>
      <div style={{ position: 'absolute', left: 560, top: 520 }}>
        <P t={t} size={320} seed={6} skin={SKINS[5]} accent={dimColor('wealth')} arms="out" mood="feliz" />
      </div>
      <div style={{ position: 'absolute', left: 560 + 320 * 0.85, top: 520 + 320 * 0.5 }}>
        <Moeda t={t} size={90} />
      </div>
      <div style={{ position: 'absolute', left: 30, top: 990, display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <P key={i} t={t} size={96} seed={i} skin={SKINS[(i + 2) % 6]} accent={C.surface3} mood={(['ok', 'feliz', 'cansado'] as const)[i % 3]} still />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 1130, width: 1080, height: 150, background: C.text, display: 'flex', gap: 6, paddingLeft: 30 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <P key={i} t={t} size={96} seed={i + 10} skin={SKINS[(i + 4) % 6]} accent={dimColor(DIM6[i % 6])} mood={(['feliz', 'cansado', 'ok'] as const)[i % 3]} still />
        ))}
      </div>
    </AbsoluteFill>
  );
};
const DIM6 = ['health', 'body', 'mind', 'wealth', 'bonds', 'craft'] as const;

const Root: React.FC = () => <Composition id="HexBench" component={Bench} width={1080} height={1300} fps={30} durationInFrames={90} />;

registerRoot(Root);
