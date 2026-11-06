// Prévia de bancada da opção "gente" (não entra no Root): boné, suor, peça na
// mão em tamanho de cena, braço pra cima, tranças em pele escura, multidão
// sobre fundo de cor. Renderizada por um script de rascunho que usa este
// arquivo como entryPoint.
import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import '../../fonts';
import { Caderno, Moeda } from '../../elenco/cast';
import { C, dimColor } from '../../theme';
import { SKINS } from '../types';
import { option } from './gente';

const P = option.Pessoa;

const Bench: React.FC = () => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <div style={{ position: 'absolute', left: 20, top: 40 }}>
        <P t={t} size={320} seed={4} skin="#8D5A3B" accent={dimColor('bonds')} cap={C.gold} arms="out" />
      </div>
      <div style={{ position: 'absolute', left: 20 + 320 * 0.75, top: 40 + 320 * 0.48, transform: 'rotate(8deg)' }}>
        <Caderno size={170} />
      </div>
      <div style={{ position: 'absolute', left: 560, top: 40 }}>
        <P t={t} size={320} seed={2} skin="#5C3A24" accent={C.violet} mood="cansado" arms="down" sweat />
      </div>
      <div style={{ position: 'absolute', left: 20, top: 520 }}>
        <P t={t} size={320} seed={2} skin={SKINS[1]} accent={C.violet} cap={dimColor('craft')} mood="feliz" arms="none" />
      </div>
      <div style={{ position: 'absolute', left: 560, top: 520 }}>
        <P t={t} size={320} seed={5} skin={SKINS[5]} accent={dimColor('wealth')} arms="out" mood="feliz" />
      </div>
      <div style={{ position: 'absolute', left: 560 + 320 * 0.85, top: 520 + 320 * 0.5 }}>
        <Moeda t={t} size={90} />
      </div>
      <div style={{ position: 'absolute', left: 40, top: 1000, display: 'flex', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <P key={i} t={t} size={90} seed={i} skin={SKINS[(i + 2) % 6]} accent={C.surface3} mood={(['ok', 'feliz', 'cansado'] as const)[i % 3]} still />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 1140, width: 1080, height: 160, background: dimColor('craft'), display: 'flex', gap: 8, paddingLeft: 40 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <P key={i} t={t} size={110} seed={i} skin={SKINS[(i + 4) % 6]} accent={dimColor('wealth')} mood={(['feliz', 'cansado', 'ok'] as const)[i % 3]} still />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="GenteBench" component={Bench} width={1080} height={1300} fps={30} durationInFrames={90} />;

registerRoot(Root);
