import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Footnote, Header, Icon, Phone, Rich, fadeUp, ramp } from '../components';
import { Glyph } from '../Glyph';
import { C, FONT, LAYOUT, dimColor } from '../theme';
import { LEAD, Scene, cue, speechEnd } from '../timeline';

// Vídeo do Recanto. Rótulos de tela copiados de app/lib/i18n/locales/pt.ts
// (auditoria de 2026-10-06); ideias e fontes são do catálogo real.
type P = { s: Scene };

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120, mass: 1, ...config } });
};

const img = (name: string) => staticFile(`img/${name}.webp`);

// Ideias reais do Recanto usadas nas telas.
const FRIENDSHIP = {
  image: 'idea-friendship',
  title: 'Amizade não se faz em três cafés',
  claim: 'Amigo casual leva 50 horas juntos; amigo, 90; próximo, 200.',
  source: 'Hall, 2019 · Journal of Social and Personal Relationships · n=355',
  area: 'Vínculos',
  color: dimColor('bonds'),
};
const EXPLORE = [
  { image: 'idea-friendship', title: 'Amizade não se faz em três cafés', material: 'A amizade cobra em horas', n: '1 DE 3' },
  { image: 'idea-bids', title: 'O “olha isso” do parceiro é um pedido de quê?', material: 'Pedidos de atenção', n: '1 DE 2' },
  { image: 'idea-awe', title: 'Uma caminhada pode treinar a admiração?', material: 'A caminhada da admiração', n: '1 DE 1' },
  { image: 'idea-sleep-clock', title: 'Acordar tarde no sábado atrasa seu relógio', material: 'Compensar o sono no fim de semana', n: '2 DE 2' },
  { image: 'idea-remove', title: 'Melhorar começa por tirar, não por somar.', material: 'Antifrágil', n: '2 DE 3' },
];
const REREAD = {
  image: 'idea-reread',
  material: 'A sensação de aprender mente',
  title: 'Reler parece aprender. Uma semana depois, não.',
  claim: 'Feche o livro e tente puxar da memória o que leu, mesmo errando. É o esforço que grava.',
  color: dimColor('mind'),
};

/** Duas barras comparadas (mesma linguagem visual do Manifesto). */
const Bars: React.FC<{
  at: number;
  cols: { pct: number; label: string; color: string }[];
}> = ({ at, cols }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const MAXH = 620;
  const base = 1180;
  const xs = [300, 780];
  return (
    <>
      {cols.map((c, i) => {
        const start = at + i * 8;
        const t = spr(start, { damping: 18, stiffness: 110 });
        const h = (c.pct / 100) * MAXH * t;
        const shown = Math.round(c.pct * ramp(frame, start, 22));
        return (
          <React.Fragment key={c.label}>
            <div
              style={{
                position: 'absolute',
                left: xs[i] - 140,
                width: 280,
                top: base - h - 150,
                textAlign: 'center',
                fontFamily: FONT.display,
                fontWeight: 600,
                fontSize: 120,
                color: c.color,
                opacity: ramp(frame, start, 8),
              }}
            >
              {shown}%
            </div>
            <div
              style={{
                position: 'absolute',
                left: xs[i] - 110,
                width: 220,
                top: base - h,
                height: Math.max(h, 0),
                borderRadius: '28px 28px 6px 6px',
                background: `linear-gradient(180deg, ${c.color} 0%, ${c.color}55 100%)`,
                boxShadow: `0 0 60px ${c.color}44`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: xs[i] - 180,
                width: 360,
                top: base + 28,
                textAlign: 'center',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 36,
                color: C.text,
                opacity: ramp(frame, start, 10),
              }}
            >
              {c.label}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', top: base, left: 120, right: 120, height: 3, background: C.borderStrong }} />
    </>
  );
};

/** Card de ideia do app: frente = imagem 4:5 + título; verso = a frase. */
const IdeaCardFlip: React.FC<{
  width: number;
  image: string;
  title: string;
  claim: string;
  color: string;
  flip: number; // 0..1
  absorbed?: boolean;
  kicker?: string;
  style?: React.CSSProperties;
}> = ({ width, image, title, claim, color, flip, absorbed = false, kicker, style }) => {
  const height = width * 1.25;
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 34,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    border: `3px solid ${absorbed ? C.gold : 'rgba(255,255,255,0.10)'}`,
    boxShadow: absorbed ? `0 0 60px ${C.gold}55` : '0 30px 90px rgba(0,0,0,0.5)',
  };
  return (
    <div style={{ width, height, perspective: 2200, ...style }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${flip * 180}deg)`,
        }}
      >
        <div style={face}>
          <Img src={img(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0) 42%, rgba(10,14,38,0.94) 100%)' }} />
          <div style={{ position: 'absolute', left: width * 0.07, right: width * 0.07, bottom: width * 0.07 }}>
            {kicker ? (
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: width * 0.04, color: C.mid, marginBottom: 8 }}>{kicker}</div>
            ) : null}
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: width * 0.082, lineHeight: 1.1, color: C.hi }}>{title}</div>
          </div>
        </div>
        <div
          style={{
            ...face,
            transform: 'rotateY(180deg)',
            background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: width * 0.09,
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: color }} />
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: width * 0.085, lineHeight: 1.16, color: C.hi }}>{claim}</div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================== 1
/** Gancho: a pilha de posts salvos cresce… e some da memória. */
export const Hook: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const forgetAt = cue(s, 'E de quantos');
  const forget = ramp(frame, forgetAt, 24);
  const thumbs = ['idea-friendship', 'idea-bids', 'idea-awe', 'idea-sleep-clock', 'idea-remove', 'idea-reread'];
  const tints = ['#3F2B8F', '#12506B', '#5B3CE0', '#1F1655', '#2D3470', '#4B2FCC'];
  const count = Math.round(interpolate(frame, [0, forgetAt], [212, 347], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <AbsoluteFill>
      <Header title="Salvo pra ler *depois*." size={84} from={-20} />
      {Array.from({ length: 12 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const savedAt = 2 + i * 3;
        const saved = ramp(frame, savedAt, 5);
        const x = 130 + col * 210;
        const y = 480 + row * 262;
        const useImg = i % 2 === 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 190,
              height: 238,
              borderRadius: 18,
              overflow: 'hidden',
              background: tints[i % tints.length],
              opacity: (0.35 + 0.65 * ramp(frame, i * 1.5, 6)) * (1 - forget * 0.82),
              filter: `blur(${forget * 6}px)`,
              transform: `scale(${1 - forget * 0.06})`,
            }}
          >
            {useImg ? (
              <Img src={img(thumbs[(i / 2) % thumbs.length])} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
            ) : (
              <div style={{ padding: 16 }}>
                {[0.9, 0.7, 0.8, 0.5].map((w, k) => (
                  <div key={k} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: 'rgba(255,255,255,0.18)', marginTop: 12 }} />
                ))}
              </div>
            )}
            <div style={{ position: 'absolute', top: 10, right: 10, transform: `scale(${1 + Math.sin(saved * Math.PI) * 0.4})` }}>
              <Icon name={saved > 0.5 ? 'bookmark' : 'bookmark-outline'} size={34} color={saved > 0.5 ? C.gold : C.hi} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          top: 1290,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 40,
          color: C.mid,
          opacity: 1 - forget,
        }}
      >
        <Icon name="bookmark" size={36} color={C.gold} style={{ verticalAlign: -6, marginRight: 12 }} />
        {count} salvos
      </div>
      <div
        style={{
          position: 'absolute',
          top: 640,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 420,
          lineHeight: 1,
          color: C.gold2,
          opacity: forget,
          transform: `scale(${0.8 + forget * 0.2})`,
          textShadow: '0 0 80px rgba(255,224,138,0.35)',
        }}
      >
        ?
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 2
/** Salvar não é aprender: print × só olhar (Lurie, Fabrizio & Westerman 2025). */
export const Save: React.FC<P> = ({ s }) => {
  const at = cue(s, 'tirar print');
  return (
    <AbsoluteFill>
      <Header title="Salvar não é *aprender*." size={86} />
      <div
        style={{
          position: 'absolute',
          top: 420,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 6,
          color: C.gold,
          ...fadeUp(useCurrentFrame(), at - 6, 12, 12),
        }}
      >
        QUANTO LEMBRARAM DEPOIS
      </div>
      <Bars
        at={at}
        cols={[
          { pct: 76, label: 'só olhou', color: C.violet2 },
          { pct: 54, label: 'tirou print', color: C.dim },
        ]}
      />
      <Footnote text="Lurie, Fabrizio & Westerman, Memory & Cognition, 2025" from={at} />
    </AbsoluteFill>
  );
};

// ===================================================================== 3
/** Reler engana: sensação de saber × lembrar de fato (Roediger & Karpicke 2006). */
export const Reread: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const feelAt = cue(s, 'dá a sensação');
  const weekAt = cue(s, 'Uma semana');
  const aAt = cue(s, 'quem tentou');
  const bAt = cue(s, 'Quem só releu');
  const phase1 = 1 - ramp(frame, weekAt - 4, 10);
  return (
    <AbsoluteFill>
      <Header title="Reler *engana*." size={96} />
      {/* fase 1: a sensação de saber sobe a cada releitura */}
      <div style={{ position: 'absolute', top: 560, left: 140, right: 140, opacity: phase1 * ramp(frame, feelAt - 6, 10) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          <Icon name="refresh" size={70} color={C.text} style={{ transform: `rotate(${frame * 8}deg)` }} />
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.hi }}>releu, releu, releu</span>
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.mid, marginBottom: 16 }}>sensação de que sabe</div>
        <div style={{ height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${92 * ramp(frame, feelAt, 40)}%`,
              borderRadius: 17,
              background: `linear-gradient(90deg, ${C.violet} 0%, ${C.gold2} 100%)`,
            }}
          />
        </div>
      </div>
      {/* fase 2: uma semana depois */}
      <div
        style={{
          position: 'absolute',
          top: 520,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          ...fadeUp(frame, weekAt, 10, 16),
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 28px',
            borderRadius: 999,
            background: 'rgba(36,42,88,0.8)',
            border: `1.5px solid ${C.borderStrong}`,
            fontFamily: FONT.body,
            fontWeight: 800,
            fontSize: 32,
            color: C.text,
          }}
        >
          <Icon name="calendar" size={34} color={C.gold} /> uma semana depois
        </div>
      </div>
      {[
        { at: aAt, pct: '56%', label: 'tentou lembrar', color: C.gold2, x: 300 },
        { at: bAt, pct: '42%', label: 'só releu', color: C.dim, x: 780 },
      ].map((c) => (
        <div key={c.label} style={{ position: 'absolute', top: 730, left: c.x - 230, width: 460, textAlign: 'center', ...fadeUp(frame, c.at, 12, 30) }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 180, lineHeight: 1, color: c.color, letterSpacing: -4 }}>{c.pct}</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.text, marginTop: 18 }}>{c.label}</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: C.mid, marginTop: 8 }}>do texto</div>
        </div>
      ))}
      <Footnote text="Roediger & Karpicke, Psychological Science, 2006" from={weekAt} />
    </AbsoluteFill>
  );
};

// ===================================================================== 4
/** A aba Aprender abre o Recanto. */
export const Recanto: React.FC<P> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Header kicker="NA ABA APRENDER" title="o *Recanto*" size={88} />
      <Phone width={660} height={880} top={480} style={{ ...fadeUp(frame, 0, 16, 60) }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: -60,
              left: -40,
              width: 360,
              height: 200,
              background: 'radial-gradient(ellipse at 30% 50%, rgba(255,200,61,0.28) 0%, rgba(255,200,61,0) 70%)',
              opacity: ramp(frame, 4, 20),
            }}
          />
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 54, color: C.hi, marginBottom: 22 }}>Recanto</div>
        </div>
        {/* Explorar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: 20,
            borderRadius: 26,
            background: 'rgba(36,42,88,0.7)',
            border: `1.5px solid ${C.border}`,
            ...fadeUp(frame, 6, 12, 20),
          }}
        >
          <div style={{ position: 'relative', width: 130, height: 120 }}>
            {['idea-awe', 'idea-bids', 'idea-friendship'].map((t, i) => (
              <Img
                key={t}
                src={img(t)}
                style={{
                  position: 'absolute',
                  left: 18 + i * 22,
                  top: 6,
                  width: 74,
                  height: 92,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '2px solid rgba(255,255,255,0.18)',
                  transform: `rotate(${(i - 1) * 9}deg)`,
                }}
              />
            ))}
          </div>
          <div>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 34, color: C.hi }}>Explorar</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.mid, marginTop: 4 }}>5 novos pra ver</div>
          </div>
        </div>
        {/* Novidades do mês */}
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: C.hi, margin: '26px 0 14px', ...fadeUp(frame, 18, 12, 20) }}>
          Novidades do mês
        </div>
        <div style={{ display: 'flex', gap: 14, transform: `translateX(${-ramp(frame, 30, 60) * 120}px)` }}>
          {['idea-friendship', 'idea-bids', 'idea-awe', 'idea-sleep-clock'].map((t, i) => (
            <div key={t} style={{ flexShrink: 0, ...fadeUp(frame, 20 + i * 4, 12, 20) }}>
              <Img src={img(t)} style={{ width: 150, height: 225, objectFit: 'cover', borderRadius: 16, border: i === 0 ? `3px solid ${C.gold}` : '2px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}
        </div>
        {/* barra de abas */}
        <div
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: 22,
            height: 84,
            borderRadius: 28,
            background: 'rgba(26,31,68,0.95)',
            border: `1.5px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}
        >
          {(['checkmark-circle', 'library', 'book', 'person'] as const).map((n, i) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Icon name={n} size={34} color={i === 2 ? C.gold : C.dim} />
              {i === 2 ? <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 18, color: C.gold }}>Aprender</span> : null}
            </div>
          ))}
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 5
/** A tela da ideia: imagem → título → a frase → fonte (rolagem real, de cima pra baixo). */
export const Idea: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const imgAt = cue(s, 'uma imagem');
  const claimAt = cue(s, 'a resposta');
  const srcAt = cue(s, 'a fonte');
  const scroll =
    interpolate(frame, [claimAt - 6, claimAt + 14], [0, 330], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }) +
    interpolate(frame, [srcAt - 6, srcAt + 14], [0, 330], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const glow = (at: number, until: number) => ramp(frame, at - 2, 8) * (1 - ramp(frame, until - 4, 8));
  const imgGlow = glow(imgAt, claimAt);
  const claimGlow = glow(claimAt, srcAt);
  const srcGlow = ramp(frame, srcAt, 8);
  return (
    <AbsoluteFill>
      <Header title="Uma ideia *por vez*." size={84} />
      <Phone width={660} height={880} top={480} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        {/* cabeçalho da tela da ideia (fixo; o conteúdo rola por baixo) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130, zIndex: 1, background: `linear-gradient(180deg, ${C.base} 70%, rgba(14,18,48,0) 100%)` }} />
        <div style={{ position: 'absolute', top: 54, left: 30, right: 30, zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: `${FRIENDSHIP.color}26` }}>
            <Icon name="people" size={24} color={FRIENDSHIP.color} />
            <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 22, color: FRIENDSHIP.color }}>{FRIENDSHIP.area} · Ideia 1 de 3</span>
          </div>
          <div style={{ flex: 1 }} />
          <Icon name="close" size={34} color={C.mid} />
        </div>
        <div style={{ position: 'absolute', top: 120, left: 30, right: 30, transform: `translateY(${-scroll}px)` }}>
          <div
            style={{
              borderRadius: 26,
              overflow: 'hidden',
              height: 600,
              outline: `4px solid rgba(255,224,138,${imgGlow})`,
              outlineOffset: 6,
            }}
          >
            <Img src={img(FRIENDSHIP.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.1, color: C.hi, marginTop: 28 }}>{FRIENDSHIP.title}</div>
          <div
            style={{
              display: 'flex',
              gap: 18,
              marginTop: 22,
              padding: '14px 16px',
              borderRadius: 18,
              background: `rgba(255,224,138,${claimGlow * 0.12})`,
              boxShadow: claimGlow > 0.1 ? `0 0 40px rgba(255,224,138,${claimGlow * 0.3})` : 'none',
            }}
          >
            <div style={{ width: 6, borderRadius: 3, background: FRIENDSHIP.color, flexShrink: 0 }} />
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, lineHeight: 1.3, color: C.hi }}>{FRIENDSHIP.claim}</div>
          </div>
          {[0.95, 0.88, 0.92, 0.7, 0.9, 0.6].map((w, k) => (
            <div key={k} style={{ height: 16, width: `${w * 100}%`, borderRadius: 8, background: 'rgba(255,255,255,0.10)', marginTop: k === 0 ? 30 : 16 }} />
          ))}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 30,
              padding: '12px 18px',
              borderRadius: 999,
              background: 'rgba(36,42,88,0.85)',
              border: `2px solid ${srcGlow > 0.5 ? C.gold2 : C.borderStrong}`,
              boxShadow: srcGlow > 0.5 ? `0 0 34px rgba(255,224,138,0.35)` : 'none',
            }}
          >
            <Icon name="library" size={26} color={C.gold2} />
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 21, color: C.text }}>{FRIENDSHIP.source}</span>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 6
/** O Explorar em stories, e a tela "Sequência concluída". */
export const Five: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const endAt = cue(s, 'Continuar');
  const per = Math.max(10, Math.floor((endAt - 4) / 5));
  const idx = Math.min(4, Math.max(0, Math.floor(frame / per)));
  const endCard = ramp(frame, endAt - 6, 10);
  const story = EXPLORE[idx];
  const within = (frame - idx * per) / per;
  return (
    <AbsoluteFill>
      <Header title="Para em *cinco*." size={96} />
      <Phone width={620} height={900} top={470} bleed style={{ ...fadeUp(frame, 0, 12, 50) }}>
        <Img src={img(story.image)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + within * 0.03})` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0.55) 0%, rgba(10,14,38,0) 25%, rgba(10,14,38,0) 45%, rgba(10,14,38,0.95) 100%)' }} />
        {/* barras de progresso dos stories */}
        <div style={{ position: 'absolute', top: 64, left: 26, right: 26, display: 'flex', gap: 8 }}>
          {EXPLORE.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${i < idx ? 100 : i === idx ? Math.min(1, within) * 100 : 0}%`, background: C.hi }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 36, right: 36, bottom: 150 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 20, letterSpacing: 4, color: C.gold2 }}>IDEIA {story.n}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 50, lineHeight: 1.08, color: C.hi, marginTop: 12 }}>{story.title}</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.mid, marginTop: 12 }}>{story.material}</div>
        </div>
        <div style={{ position: 'absolute', left: 36, right: 36, bottom: 50, display: 'flex', gap: 14 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 999, border: `2px solid ${C.borderStrong}`, fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: C.hi }}>
            Ler completo
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 999, background: C.hi, fontFamily: FONT.body, fontWeight: 800, fontSize: 24, color: C.deep }}>
            Abrir ideia
          </div>
        </div>
        {/* fim da série */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(10,14,38,${0.92 * endCard})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            opacity: endCard,
          }}
        >
          <div style={{ width: 120, height: 120, borderRadius: 999, background: 'rgba(255,200,61,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.7 + endCard * 0.3})` }}>
            <Icon name="checkmark" size={70} color={C.gold} />
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 56, color: C.hi }}>Sequência concluída</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: C.mid }}>5 conteúdos vistos</div>
          <div style={{ marginTop: 26, padding: '18px 36px', borderRadius: 999, border: `2px solid ${C.gold}88`, fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.gold2 }}>
            Continuar · mais 5
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 7
/** O gesto de absorver: o card do fim da ideia vira e fica dourado. */
export const Absorb: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const tapAt = cue(s, 'você vira');
  const flip = spr(tapAt + 4, { damping: 16, stiffness: 90 });
  const absorbed = frame > tapAt + 14;
  const W = 560;
  return (
    <AbsoluteFill>
      <Header title="Vire o card. *Guarde a ideia.*" size={72} />
      {/* pontos de progresso do cabeçalho da ideia */}
      <div style={{ position: 'absolute', top: 440, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: i === 0 && absorbed ? C.gold : 'rgba(255,255,255,0.2)',
              boxShadow: i === 0 && absorbed ? `0 0 20px ${C.gold}` : 'none',
            }}
          />
        ))}
      </div>
      <IdeaCardFlip
        width={W}
        image={FRIENDSHIP.image}
        title={FRIENDSHIP.title}
        claim={FRIENDSHIP.claim}
        color={FRIENDSHIP.color}
        flip={flip}
        absorbed={absorbed}
        style={{ position: 'absolute', top: 500, left: (LAYOUT.W - W) / 2, ...fadeUp(frame, 0, 14, 40) }}
      />
      {/* toque */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 70,
          top: 850 - 70,
          width: 140,
          height: 140,
          borderRadius: 999,
          border: `4px solid ${C.hi}`,
          opacity: (1 - ramp(frame, tapAt, 14)) * ramp(frame, tapAt - 3, 3),
          transform: `scale(${0.5 + ramp(frame, tapAt, 14)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1230,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 28px',
            borderRadius: 999,
            background: absorbed ? 'rgba(255,200,61,0.16)' : 'rgba(36,42,88,0.8)',
            border: `2px solid ${absorbed ? C.gold : C.borderStrong}`,
            fontFamily: FONT.body,
            fontWeight: 800,
            fontSize: 30,
            color: absorbed ? C.gold2 : C.text,
          }}
        >
          {absorbed ? (
            <>
              <Icon name="checkmark" size={32} color={C.gold2} /> Absorvida
            </>
          ) : (
            'Toque no card pra virar e absorver'
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 8
/** Revisar ideias: o título na frente, a resposta atrás. Tentar lembrar antes de virar. */
export const Review: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const thinkAt = cue(s, 'Antes de virar');
  const flipAt = Math.min(speechEnd(s) - 6, thinkAt + 40);
  const flip = spr(flipAt, { damping: 16, stiffness: 90 });
  const swipeAt = flipAt + 34;
  const swipe = ramp(frame, swipeAt, 16);
  const W = 440;
  return (
    <AbsoluteFill>
      <Header title="Depois, só o *título*." size={84} />
      <Phone width={660} height={880} top={480} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 38, color: C.hi }}>Revisar ideias</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: C.mid }}>1 de 3</div>
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, color: C.mid, marginTop: 6 }}>
          Arraste pra direita pra guardar como favorita, pra esquerda pra soltar.
        </div>
        {/* o próximo card, atrás */}
        <div style={{ position: 'absolute', top: 210, left: (600 - W) / 2 + 10, width: W - 20, height: (W - 20) * 1.25, borderRadius: 34, background: C.surface, opacity: 0.6, transform: 'scale(0.96) translateY(18px)' }} />
        <div
          style={{
            position: 'absolute',
            top: 200,
            left: (600 - W) / 2,
            transform: `translateX(${swipe * 620}px) rotate(${swipe * 14}deg)`,
          }}
        >
          <IdeaCardFlip
            width={W}
            image={REREAD.image}
            title={REREAD.title}
            claim={REREAD.claim}
            color={REREAD.color}
            flip={flip}
            kicker={REREAD.material}
          />
          {/* selo de favoritar ao arrastar */}
          <div
            style={{
              position: 'absolute',
              top: 30,
              left: 30,
              padding: '10px 20px',
              borderRadius: 14,
              border: `4px solid ${C.gold}`,
              color: C.gold,
              fontFamily: FONT.body,
              fontWeight: 800,
              fontSize: 30,
              transform: 'rotate(-12deg)',
              opacity: ramp(frame, swipeAt - 4, 6),
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="star" size={30} color={C.gold} /> Favoritar
          </div>
        </div>
        {/* tentar lembrar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 790,
            display: 'flex',
            justifyContent: 'center',
            opacity: ramp(frame, thinkAt, 8) * (1 - ramp(frame, flipAt, 8)),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px', borderRadius: 999, background: 'rgba(123,92,255,0.25)', border: `2px solid ${C.violet2}` }}>
            <Icon name="bulb" size={30} color={C.gold2} />
            <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.hi }}>
              tente lembrar{'.'.repeat(1 + (Math.floor(frame / 8) % 3))}
            </span>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 9
/** Anotar: a nota que só você vê. */
export const Note: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const typeAt = cue(s, 'o que você combinou');
  const text = 'Almoço fora da mesa com a Ju, toda quinta.';
  const shown = Math.floor(interpolate(frame, [typeAt, typeAt + 50], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const sheet = ramp(frame, 2, 14);
  return (
    <AbsoluteFill>
      <Header title="Anote o que você *combinou*." size={74} />
      <Phone width={660} height={880} top={480} bleed style={{ ...fadeUp(frame, 0, 12, 50) }}>
        <Img src={img(FRIENDSHIP.image)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,38,0.6)' }} />
        <div style={{ position: 'absolute', top: 110, left: 36, right: 36, fontFamily: FONT.display, fontWeight: 600, fontSize: 46, lineHeight: 1.1, color: C.hi, opacity: 0.8 }}>
          {FRIENDSHIP.title}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '30px 34px 40px',
            borderRadius: '40px 40px 0 0',
            background: C.surface,
            borderTop: `1.5px solid ${C.borderStrong}`,
            transform: `translateY(${(1 - sheet) * 520}px)`,
          }}
        >
          <div style={{ width: 70, height: 7, borderRadius: 4, background: C.faint, margin: '0 auto 24px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="create" size={34} color={C.gold2} />
            <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 34, color: C.hi }}>Sua nota</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: C.mid, marginTop: 10 }}>O que você combinou com você mesmo?</div>
          <div
            style={{
              marginTop: 22,
              minHeight: 170,
              padding: 22,
              borderRadius: 22,
              background: C.base,
              border: `2px solid ${C.violet}88`,
              fontFamily: FONT.body,
              fontWeight: 600,
              fontSize: 32,
              lineHeight: 1.35,
              color: C.hi,
            }}
          >
            {text.slice(0, shown)}
            <span style={{ opacity: Math.floor(frame / 12) % 2 === 0 ? 1 : 0, color: C.violet2 }}>|</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, color: C.dim, marginTop: 16 }}>Só você vê.</div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 10
/** Ler ≠ lembrar ≠ fazer. */
export const Close: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const words = [
    { w: 'ler', icon: 'book' as const, at: cue(s, 'ler'), color: C.text },
    { w: 'lembrar', icon: 'bulb' as const, at: cue(s, 'lembrar'), color: C.violet2 },
    { w: 'fazer', icon: 'checkmark-circle' as const, at: cue(s, 'fazer'), color: C.gold2 },
  ];
  return (
    <AbsoluteFill>
      {words.map((x, i) => (
        <React.Fragment key={x.w}>
          {i > 0 ? (
            <div
              style={{
                position: 'absolute',
                top: 470 + i * 300 - 120,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: FONT.display,
                fontWeight: 600,
                fontSize: 110,
                color: C.gold,
                opacity: ramp(frame, x.at - 4, 8),
              }}
            >
              ≠
            </div>
          ) : null}
          <div
            style={{
              position: 'absolute',
              top: 470 + i * 300,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 34,
              ...fadeUp(frame, x.at, 12, 30),
            }}
          >
            <Icon name={x.icon} size={110} color={x.color} />
            <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 150, color: x.color, letterSpacing: -3 }}>{x.w}</span>
          </div>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// ===================================================================== 11
/** Assinatura do Recanto. */
export const Tagline: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Glyph size={300} cx={540} cy={560} rings={ramp(frame, 0, 26)} path={ramp(frame, 10, 26)} glow={0.9} />
      <div style={{ position: 'absolute', top: 800, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, LEAD, 14, 24) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 140, color: C.hi, letterSpacing: -2 }}>Recanto</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.text, marginTop: 8 }}>ideias com fonte, uma por vez</div>
      </div>
      <div style={{ position: 'absolute', top: 1110, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, cue(s, 'Na aba'), 14, 20) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 36, color: C.mid }}>
          <Rich text="na aba Aprender do *Perceva*" />
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: C.gold, marginTop: 40 }}>link na bio</div>
      </div>
    </AbsoluteFill>
  );
};

export const SCENES = {
  hook: Hook,
  save: Save,
  reread: Reread,
  recanto: Recanto,
  idea: Idea,
  five: Five,
  absorb: Absorb,
  review: Review,
  note: Note,
  close: Close,
  tagline: Tagline,
};
