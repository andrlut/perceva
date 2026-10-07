import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import glyphs from './ionicons.json';
import { C, FONT, LAYOUT } from './theme';

// ---------------------------------------------------------------- animação

/** 0→1 entre dois frames, com ease-out. */
export const ramp = (frame: number, from: number, dur: number) =>
  interpolate(frame, [from, from + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

/** Entrada padrão: sobe 28 px e aparece. */
export const fadeUp = (frame: number, from: number, dur = 14, dist = 28): React.CSSProperties => {
  const t = ramp(frame, from, dur);
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)` };
};

export const useSpring = (from: number, config = { damping: 16, stiffness: 160, mass: 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config });
};

// ---------------------------------------------------------------- texto

/** "*palavra*" vira destaque dourado — o mesmo marcador do script.json. */
export const Rich: React.FC<{ text: string; accent?: string }> = ({ text, accent = C.gold2 }) => (
  <>
    {text.split(/(\*[^*]+\*)/g).map((part, i) =>
      part.startsWith('*') ? (
        <span key={i} style={{ color: accent }}>
          {part.slice(1, -1)}
        </span>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);

export const Icon: React.FC<{ name: keyof typeof glyphs; size: number; color: string; style?: React.CSSProperties }> = ({
  name,
  size,
  color,
  style,
}) => (
  <span
    style={{
      fontFamily: FONT.icon,
      fontSize: size,
      lineHeight: 1,
      color,
      display: 'inline-block',
      width: size,
      height: size,
      textAlign: 'center',
      ...style,
    }}
  >
    {String.fromCodePoint(glyphs[name])}
  </span>
);

/** Eyebrow dourado + título em Fraunces, no terço superior. */
export const Header: React.FC<{ kicker?: string; title: string; from?: number; size?: number; top?: number }> = ({
  kicker,
  title,
  from = 0,
  size = 76,
  top = LAYOUT.titleTop,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        textAlign: 'center',
      }}
    >
      {kicker ? (
        <div
          style={{
            ...fadeUp(frame, from, 12, 16),
            fontFamily: FONT.body,
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: 7,
            color: C.gold,
            marginBottom: 22,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          ...fadeUp(frame, from + 4, 16),
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.08,
          color: C.hi,
          letterSpacing: -1,
        }}
      >
        <Rich text={title} />
      </div>
    </div>
  );
};

export const Footnote: React.FC<{ text: string; from?: number; top?: number; size?: number; color?: string }> = ({
  text,
  from = 0,
  top = LAYOUT.footnoteY,
  size = 24,
  color = C.dim,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 90,
        right: 90,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: size,
        color,
        opacity: ramp(frame, from, 16) * 0.95,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- fundo

/** Noite da marca com um halo violeta que respira devagar. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 60;
  const breathe = 0.5 + Math.sin(frame / 70) * 0.08;
  return (
    <AbsoluteFill style={{ backgroundColor: C.deep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 700px at ${540 + drift}px 380px, rgba(123,92,255,${breathe * 0.5}) 0%, rgba(75,47,204,0.12) 45%, rgba(10,14,38,0) 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 700px 600px at ${540 - drift}px 1500px, rgba(200,136,28,0.10) 0%, rgba(10,14,38,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(14,18,48,0) 0%, rgba(14,18,48,0.6) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- UI do app

/** Moldura de celular — o conteúdo é uma réplica estilizada da tela. */
export const Phone: React.FC<{
  width: number;
  height: number;
  top: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** conteúdo de borda a borda (stories, imagem cheia) */
  bleed?: boolean;
}> = ({ width, height, top, children, style, bleed = false }) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: (LAYOUT.W - width) / 2,
      width,
      height,
      borderRadius: 64,
      padding: 14,
      background: 'linear-gradient(160deg, #2D3470 0%, #141938 60%)',
      boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.10), 0 0 80px rgba(123,92,255,0.18)',
      ...style,
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 52,
        background: C.base,
        overflow: 'hidden',
        position: 'relative',
        padding: bleed ? 0 : '64px 30px 30px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          width: 120,
          height: 30,
          marginLeft: -60,
          borderRadius: 20,
          background: '#05071A',
        }}
      />
      {children}
    </div>
  </div>
);

export const Stars: React.FC<{ n: number; color: string; size?: number }> = ({ n, color, size = 22 }) => (
  <span style={{ display: 'inline-flex', gap: 3 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Icon key={i} name="star" size={size} color={color} />
    ))}
  </span>
);

/** Linha de prática (aba Práticas): halo do ícone, título, estrelas, check. */
export const PracticeRow: React.FC<{
  icon: keyof typeof glyphs;
  color: string;
  title: string;
  stars: number;
  checked: number; // 0..1
  scale?: number;
  dim?: boolean;
  width?: number;
  big?: boolean;
  note?: string;
}> = ({ icon, color, title, stars, checked, scale = 1, dim = false, width, big = false, note }) => {
  const s = big ? 1.25 : 1;
  return (
    <div
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        gap: 20 * s,
        padding: `${18 * s}px ${22 * s}px`,
        borderRadius: 24 * s,
        background: 'rgba(36,42,88,0.62)',
        border: `1.5px solid ${checked > 0.5 ? `${color}66` : C.border}`,
        transform: `scale(${scale})`,
        opacity: dim ? 0.45 : 1,
      }}
    >
      <div
        style={{
          width: 64 * s,
          height: 64 * s,
          borderRadius: 20 * s,
          background: `${color}2E`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={34 * s} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 32 * s,
            color: C.hi,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: dim ? 'line-through' : 'none',
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Stars n={stars} color={C.gold} size={20 * s} />
          {note ? (
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 22 * s, color: C.mid }}>{note}</span>
          ) : null}
        </div>
      </div>
      <div
        style={{
          width: 56 * s,
          height: 56 * s,
          borderRadius: 999,
          border: `3px solid ${checked > 0 ? color : C.faint}`,
          background: checked > 0 ? color : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${1 + Math.sin(checked * Math.PI) * 0.25})`,
          flexShrink: 0,
          boxShadow: checked > 0.5 ? `0 0 30px ${color}88` : 'none',
        }}
      >
        <Icon name="checkmark" size={36 * s} color={C.deep} style={{ opacity: checked }} />
      </div>
    </div>
  );
};

/** Bolinha de luz que viaja de um ponto a outro (a prática "alimentando" o hexágono). */
export const Spark: React.FC<{ from: [number, number]; to: [number, number]; t: number; color: string }> = ({ from, to, t, color }) => {
  if (t <= 0 || t >= 1) return null;
  const e = Easing.inOut(Easing.cubic)(t);
  const x = from[0] + (to[0] - from[0]) * e;
  // arco: sobe um pouco no meio do caminho
  const y = from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * 120;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 14,
        top: y - 14,
        width: 28,
        height: 28,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 24px 10px ${color}AA, 0 0 70px 20px ${color}55`,
        opacity: Math.sin(t * Math.PI) * 0.6 + 0.4,
      }}
    />
  );
};
