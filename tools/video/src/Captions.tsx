import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Rich } from './components';
import { C, FONT, LAYOUT } from './theme';
import { LEAD, Scene, cue, plain, speechEnd } from './timeline';

const MAX = 58;

/** Quebra a fala em blocos de até 2 linhas: frase → vírgula → meio. */
const chunk = (caption: string): string[] => {
  const out: string[] = [];
  for (const sentence of caption.split(/(?<=[.!?:])\s+/)) {
    if (plain(sentence).length <= MAX) {
      out.push(sentence);
      continue;
    }
    for (const part of sentence.split(/(?<=,)\s+/)) {
      if (plain(part).length <= MAX) {
        out.push(part);
        continue;
      }
      // espaço mais perto do meio que não caia dentro de um *destaque*
      let mid = -1;
      for (let i = 0; i < part.length; i++) {
        if (part[i] !== ' ') continue;
        const inside = (part.slice(0, i).match(/\*/g) ?? []).length % 2 === 1;
        if (!inside && (mid < 0 || Math.abs(i - part.length / 2) < Math.abs(mid - part.length / 2))) mid = i;
      }
      out.push(part.slice(0, mid), part.slice(mid + 1));
    }
  }
  // junta pedaços muito curtos ao vizinho seguinte
  const merged: string[] = [];
  for (const c of out) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && plain(prev).length < 16 && plain(prev + ' ' + c).length <= MAX) {
      merged[merged.length - 1] = `${prev} ${c}`;
    } else {
      merged.push(c);
    }
  }
  return merged;
};

/** Legenda queimada (playbook: 100% dos vídeos), sempre acima da UI do Reels. */
export const Captions: React.FC<{ scenes: Scene[]; skip?: string[] }> = ({ scenes, skip = [] }) => {
  const frame = useCurrentFrame();
  // a cena "dona" do frame é a última que já começou a falar
  const scene = [...scenes].reverse().find((s) => frame >= s.start + LEAD - 2);
  if (!scene || skip.includes(scene.id)) return null;

  const local = frame - scene.start;
  const chunks = chunk(scene.caption);
  // cada bloco começa quando a fala chega às primeiras palavras dele
  const starts = chunks.map((c, i) =>
    i === 0 ? LEAD : cue(scene, plain(c).split(' ').slice(0, 2).join(' ')),
  );
  let current = 0;
  for (let i = 0; i < chunks.length; i++) if (local >= starts[i] - 2) current = i;
  const startedAt = starts[current] - 2;
  if (local > speechEnd(scene) + 14) return null;

  const t = interpolate(local - startedAt, [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.captionTop,
        left: 70,
        right: 70,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.22,
          color: C.hi,
          textAlign: 'center',
          textShadow: '0 2px 18px rgba(5,7,26,0.95), 0 0 2px rgba(5,7,26,1)',
          opacity: t,
          transform: `translateY(${(1 - t) * 8}px)`,
        }}
      >
        <Rich text={chunks[current]} accent={C.gold2} />
      </div>
    </div>
  );
};
