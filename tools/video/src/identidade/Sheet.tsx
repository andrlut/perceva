// Folha de comparação de uma opção de identidade: a mesma grade pra todas,
// pra que o painel compare maçã com maçã. Renderize com
//   node scripts/identidade.mjs <id>     → out/identidade/<id>.png
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Caderno } from '../elenco/cast';
import { C, FONT, dimColor } from '../theme';
import { OPTIONS } from './index';
import { SKINS } from './types';

const DIMC = ['health', 'body', 'mind', 'wealth', 'bonds', 'craft'].map((d) => dimColor(d as never));

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 22, letterSpacing: 5, color: C.dim, margin: '34px 0 10px' }}>{children}</div>
);

const Row: React.FC<{ children: React.ReactNode; h: number }> = ({ children, h }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 18, height: h }}>{children}</div>
);

export const IdentidadeSheet: React.FC<{ option: string }> = ({ option }) => {
  const t = useCurrentFrame();
  const opt = OPTIONS.find((o) => o.id === option) ?? OPTIONS[0];
  const P = opt.Pessoa;
  const B = opt.Backdrop;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${C.surface} 0%, ${C.deep} 70%)`, alignItems: 'center', paddingTop: 70 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 60, color: C.hi }}>{opt.name}</div>
      <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: C.mid, marginTop: 10, width: 900, textAlign: 'center', lineHeight: 1.35 }}>
        {opt.pitch}
      </div>

      <Label>PROTAGONISTAS · 300 PX</Label>
      <div style={{ position: 'relative', width: 1040, height: 420 }}>
        {B && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <B t={t} width={1040} height={420} accent={C.violet} />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Row h={420}>
            <P t={t} size={300} seed={0} skin={SKINS[0]} accent={C.violet} mood="ok" arms="down" />
            <P t={t} size={300} seed={1} skin={SKINS[2]} accent={dimColor('bonds')} mood="feliz" arms="up" />
            <P t={t} size={300} seed={2} skin={SKINS[1]} accent={dimColor('craft')} mood="cansado" arms="none" />
          </Row>
        </div>
      </div>

      <Label>ELENCO · SEEDS 0–5 · 160 PX</Label>
      <Row h={230}>
        {SKINS.map((s, i) => (
          <P key={i} t={t} size={160} seed={i} skin={s} accent={DIMC[i]} mood={i % 3 === 1 ? 'feliz' : 'ok'} arms="none" />
        ))}
      </Row>

      <Label>HUMOR · OK · FELIZ · CANSADO · 200 PX</Label>
      <Row h={280}>
        {(['ok', 'feliz', 'cansado'] as const).map((m) => (
          <P key={m} t={t} size={200} seed={3} skin={SKINS[3]} accent={C.violet} mood={m} arms={m === 'feliz' ? 'up' : 'none'} />
        ))}
        <div style={{ position: 'relative', width: 300, height: 280 }}>
          {/* peça na mão: mesma conta das cenas (mão direita ≈ 200,170 do viewBox) */}
          <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
            <P t={t} size={200} seed={4} skin={SKINS[4]} accent={dimColor('wealth')} mood="ok" arms="out" />
          </div>
          <div style={{ position: 'absolute', left: 150, top: 125, transform: 'rotate(8deg)' }}>
            <Caderno size={110} />
          </div>
        </div>
      </Row>

      <Label>MULTIDÃO · 90 PX (TEM QUE LER O HUMOR)</Label>
      <Row h={130}>
        {Array.from({ length: 10 }, (_, i) => (
          <P key={i} t={t} size={90} seed={i} skin={SKINS[i % 6]} accent={i % 4 === 0 ? C.gold : C.surface3} mood={i % 4 === 0 ? 'feliz' : 'ok'} still />
        ))}
      </Row>
    </AbsoluteFill>
  );
};
