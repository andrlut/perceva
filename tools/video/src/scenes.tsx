import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Footnote, Header, Icon, Phone, PracticeRow, Rich, Spark, fadeUp, ramp } from './components';
import { Glyph } from './Glyph';
import { Hex, hexPoint } from './Hex';
import { C, DIMS, FONT, LAYOUT, dimColor, dimIndex } from './theme';
import { LEAD, Scene, cue } from './timeline';

type P = { s: Scene };

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120, mass: 1, ...config } });
};

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

// Formas de referência — uma pessoa fictícia, coerente de cena a cena.
const PRACTICED = [0.8, 0.72, 0.85, 0.5, 0.22, 0.6];
const PERCEIVED = [0.7, 0.6, 0.78, 0.62, 0.84, 0.55];

// ===================================================================== 1
/** Gancho: cada check alimenta um eixo do hexágono. */
export const Hook: React.FC<P> = () => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const rows = [
    { icon: 'book' as const, dim: 'mind' as const, title: 'Ler 20 minutos', stars: 2, at: 10, top: 470 },
    { icon: 'barbell' as const, dim: 'body' as const, title: 'Treino de força', stars: 3, at: 32, top: 600 },
    { icon: 'people' as const, dim: 'bonds' as const, title: 'Ligar pra minha mãe', stars: 2, at: 54, top: 730 },
  ];
  const hex = { cx: 540, cy: 1140, size: 400 };
  const base = 0.16 * spr(rows[0].at + 14);
  const v = DIMS.map((d) => base);
  const bump: Record<string, number> = { mind: 0.62, body: 0.56, bonds: 0.46 };
  rows.forEach((r) => {
    v[dimIndex(r.dim)] += bump[r.dim] * spr(r.at + 16, { damping: 11 });
  });
  // "todo dia": o resto da forma vai enchendo devagar
  const daily = ramp(frame, 90, 80);
  v[0] += 0.5 * daily;
  v[3] += 0.34 * daily;
  v[5] += 0.4 * daily;

  return (
    <AbsoluteFill>
      <Header title="Seus hábitos estão te *treinando*." size={80} from={-20} />
      {rows.map((r, i) => {
        const enter = i === 0 ? 1 : ramp(frame, i * 6, 12);
        const checked = ramp(frame, r.at, 8);
        return (
          <div
            key={r.title}
            style={{
              position: 'absolute',
              top: r.top,
              left: 120,
              opacity: enter,
              transform: `translateX(${(1 - enter) * 60}px)`,
            }}
          >
            <PracticeRow
              icon={r.icon}
              color={dimColor(r.dim)}
              title={r.title}
              stars={r.stars}
              checked={checked}
              width={840}
              scale={1 - Math.sin(ramp(frame, r.at - 4, 8) * Math.PI) * 0.03}
            />
          </div>
        );
      })}
      <Hex id="hook" {...hex} values={v} grid={0.3 + 0.7 * ramp(frame, 0, 24)} icons />
      {rows.map((r) => {
        const j = dimIndex(r.dim);
        const to = hexPoint(hex.cx, hex.cy, hex.size, j, 0.16 + bump[r.dim]);
        return (
          <Spark key={r.title} from={[910, r.top + 50]} to={to} t={(frame - r.at - 2) / 18} color={dimColor(r.dim)} />
        );
      })}
    </AbsoluteFill>
  );
};

// ===================================================================== 2
/** O estudo: 1.523 pessoas, comportamento → traço → confirmado por quem convive. */
export const Study: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const countAt = cue(s, 'Num estudo');
  const n = Math.round(interpolate(frame, [countAt, countAt + 40], [0, 1523], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  }));
  const steps = [
    { icon: 'refresh' as const, text: 'repetiram pequenos comportamentos', at: cue(s, 'repetir') },
    { icon: 'trending-up' as const, text: 'traços de personalidade mudaram', at: cue(s, 'mudou') },
    { icon: 'people' as const, text: 'amigos e família confirmaram', at: cue(s, 'e amigos') },
  ];
  return (
    <AbsoluteFill>
      <Hex
        id="study-bg"
        size={980}
        cx={540}
        cy={930}
        values={[0.62, 0.7, 0.55, 0.66, 0.6, 0.68]}
        rotate={frame * 0.08}
        opacity={0.1}
      />
      <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, countAt - 6, 12) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 7, color: C.gold }}>
          UM ESTUDO, NÃO UMA METÁFORA
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 230,
            lineHeight: 1.05,
            color: C.goldLight,
            letterSpacing: -6,
            marginTop: 20,
          }}
        >
          {n.toLocaleString('pt-BR')}
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 46, color: C.mid, marginTop: -6 }}>
          pessoas · 3 meses
        </div>
      </div>
      {steps.map((st, i) => (
        <div
          key={st.text}
          style={{
            position: 'absolute',
            top: 820 + i * 150,
            left: 110,
            right: 110,
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            ...fadeUp(frame, st.at, 14),
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 30,
              background: i === 1 ? 'rgba(123,92,255,0.28)' : 'rgba(36,42,88,0.7)',
              border: `1.5px solid ${i === 1 ? C.violet2 : C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={st.icon} size={48} color={i === 1 ? C.violet2 : C.text} />
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 46, color: i === 1 ? C.hi : C.text, lineHeight: 1.15 }}>
            {st.text}
          </div>
        </div>
      ))}
      <Footnote text="Stieger et al., PNAS, 2021 · ensaio controlado" from={countAt + 10} />
    </AbsoluteFill>
  );
};

// ===================================================================== 3
/** Só muda quem completa (Hudson 2019): dois hexágonos lado a lado. */
export const Follow: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const did = spr(LEAD + 2, { damping: 12 });
  const notAt = cue(s, 'Não em');
  const flat = [0.18, 0.16, 0.2, 0.15, 0.18, 0.17];
  return (
    <AbsoluteFill>
      <Header title="Mudou quem *fez*." size={92} />
      <Hex id="did" size={330} cx={285} cy={860} values={mix(flat, [0.78, 0.84, 0.7, 0.66, 0.8, 0.74], did)} icons />
      <Hex
        id="wished"
        size={330}
        cx={795}
        cy={860}
        values={flat}
        icons
        muted
        opacity={interpolate(frame, [notAt - 4, notAt + 8], [0.35, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
      <div style={{ position: 'absolute', top: 1130, left: 60, width: 450, textAlign: 'center', ...fadeUp(frame, LEAD, 12) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.gold2 }}>quem fez</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.mid, marginTop: 8 }}>completou os desafios</div>
      </div>
      <div style={{ position: 'absolute', top: 1130, left: 570, width: 450, textAlign: 'center', ...fadeUp(frame, notAt, 12) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.dim }}>quem só quis</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.faint, marginTop: 8 }}>aceitou e não fez</div>
      </div>
      <Footnote text="Hudson et al., Journal of Personality and Social Psychology, 2019" from={LEAD + 10} />
    </AbsoluteFill>
  );
};

// ===================================================================== 4
const PILLARS = [
  { n: '1', name: 'Autoconhecimento', icon: 'person' as const, color: C.violet2 },
  { n: '2', name: 'Prática', icon: 'checkmark-circle' as const, color: C.xp },
  { n: '3', name: 'Aprendizado', icon: 'bulb' as const, color: C.gold },
];

/** O glyph se desenha; três coisas que viviam separadas se juntam embaixo dele. */
export const Three: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const joinAt = cue(s, 'E junta');
  const join = spr(joinAt, { damping: 14, stiffness: 90 });
  return (
    <AbsoluteFill>
      <Glyph size={400} cx={540} cy={560} rings={ramp(frame, 0, 34)} path={ramp(frame, 12, 30)} glow={0.7} />
      {PILLARS.map((p, i) => {
        const finalX = 540 + (i - 1) * 320;
        const startX = 540 + (i - 1) * 640;
        const x = startX + (finalX - startX) * join;
        const tilt = (1 - join) * (i - 1) * 8;
        return (
          <div
            key={p.name}
            style={{
              position: 'absolute',
              top: 930 + (1 - join) * (i === 1 ? -40 : 60),
              left: x - 150,
              width: 300,
              height: 300,
              borderRadius: 36,
              background: 'rgba(36,42,88,0.7)',
              border: `2px solid ${join > 0.9 ? `${p.color}88` : C.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
              transform: `rotate(${tilt}deg)`,
              opacity: ramp(frame, 6 + i * 5, 14),
              boxShadow: join > 0.9 ? `0 0 50px ${p.color}33` : 'none',
            }}
          >
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 999,
                background: `${p.color}26`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={p.icon} size={58} color={p.color} />
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 27, color: C.hi }}>{p.name}</div>
          </div>
        );
      })}
      {/* o fio que une as três quando elas se encontram */}
      <div
        style={{
          position: 'absolute',
          top: 1080,
          left: 540 - 320,
          width: 640 * join,
          marginLeft: 320 * (1 - join),
          height: 4,
          background: `linear-gradient(90deg, ${C.violet2}, ${C.xp}, ${C.gold})`,
          opacity: join * 0.6,
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1290,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 50,
          color: C.text,
          ...fadeUp(frame, joinAt + 10, 14),
        }}
      >
        que sempre viveram <span style={{ color: C.gold2 }}>separadas</span>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 5
const INSTRUMENTS = [
  { icon: 'person' as const, name: 'Big Five', sub: 'personalidade · 120 itens', phrase: 'personalidade' },
  { icon: 'compass' as const, name: 'Valores de Schwartz', sub: 'o que te move', phrase: 'valores' },
  { icon: 'heart' as const, name: 'Apego (ECR-R)', sub: 'como você se vincula', phrase: 'vínculo' },
  { icon: 'analytics' as const, name: 'Avaliação', sub: 'as seis áreas da sua vida', phrase: 'uma avaliação', free: true },
];

/** Pilar 1: os instrumentos, cada um acende quando é dito. */
export const Self: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Header kicker="1 · AUTOCONHECIMENTO" title="o teste que *te conhece*" size={72} />
      <Phone width={660} height={880} top={480} style={{ ...fadeUp(frame, 2, 16, 60) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: C.hi, marginBottom: 6 }}>Autoconhecimento</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.mid, marginBottom: 26 }}>
          reflexão, não diagnóstico
        </div>
        {INSTRUMENTS.map((it, i) => {
          const at = cue(s, it.phrase);
          const lit = ramp(frame, at - 2, 8);
          return (
            <div
              key={it.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '20px 22px',
                marginBottom: 16,
                borderRadius: 24,
                background: `rgba(36,42,88,${0.5 + lit * 0.3})`,
                border: `2px solid ${lit > 0.5 ? C.violet2 : C.border}`,
                boxShadow: lit > 0.5 ? '0 0 36px rgba(123,92,255,0.35)' : 'none',
                transform: `scale(${1 + Math.sin(lit * Math.PI) * 0.03})`,
                ...fadeUp(frame, 8 + i * 5, 12, 24),
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 22,
                  background: 'rgba(123,92,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={it.icon} size={38} color={C.violet2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 31, color: C.hi }}>{it.name}</div>
                <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 23, color: C.mid, marginTop: 4 }}>{it.sub}</div>
              </div>
              {it.free ? (
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontWeight: 800,
                    fontSize: 20,
                    color: C.deep,
                    background: C.xp,
                    borderRadius: 999,
                    padding: '6px 14px',
                  }}
                >
                  GRÁTIS
                </div>
              ) : null}
            </div>
          );
        })}
      </Phone>
      <Footnote text="instrumentos inspirados no Big Five, na teoria de valores de Schwartz e na escala ECR-R" from={20} />
    </AbsoluteFill>
  );
};

// ===================================================================== 6
const TODAY = [
  { icon: 'moon' as const, dim: 'health' as const, title: 'Dormir antes da 0h', stars: 2 },
  { icon: 'barbell' as const, dim: 'body' as const, title: 'Treino de força', stars: 3 },
  { icon: 'book' as const, dim: 'mind' as const, title: 'Ler 20 minutos', stars: 2 },
  { icon: 'wallet' as const, dim: 'wealth' as const, title: 'Anotar gastos', stars: 1 },
];
const MOODS = ['#FF5C7A', '#FF9F43', '#9AA0D4', '#4DD0FF', '#3DD68C'];

/** Pilar 2: um toque por prática, uma linha de humor. */
export const Practice: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const tapAt = cue(s, 'um toque');
  const moodAt = cue(s, 'uma linha');
  return (
    <AbsoluteFill>
      <Header kicker="2 · PRÁTICA" title="o hábito que você *mede*" size={72} />
      <Phone width={660} height={880} top={480} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: C.hi }}>Hoje</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.mid, marginBottom: 22 }}>
          {Math.min(3, Math.max(0, Math.floor((frame - tapAt) / 9) + 1))} de 4 práticas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {TODAY.map((r, i) => (
            <PracticeRow
              key={r.title}
              icon={r.icon}
              color={dimColor(r.dim)}
              title={r.title}
              stars={r.stars}
              checked={i < 3 ? ramp(frame, tapAt + i * 9, 7) : 0}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 26,
            padding: '22px 24px',
            borderRadius: 24,
            background: 'rgba(36,42,88,0.62)',
            border: `1.5px solid ${C.border}`,
            ...fadeUp(frame, moodAt - 8, 10, 20),
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: C.hi, marginBottom: 18 }}>Como foi o seu dia?</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {MOODS.map((col, i) => {
              const picked = i === 3 ? ramp(frame, moodAt + 6, 8) : 0;
              return (
                <div
                  key={col}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 999,
                    border: `3px solid ${col}`,
                    background: picked > 0 ? col : `${col}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT.body,
                    fontWeight: 800,
                    fontSize: 32,
                    color: picked > 0.5 ? C.deep : col,
                    transform: `scale(${1 + Math.sin(picked * Math.PI) * 0.22})`,
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 7
/** A sensação mente: 62% dizem, 9,6% no acelerômetro (Tucker 2011). */
export const Feeling: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const aAt = cue(s, '62%');
  const bAt = cue(s, 'No acelerômetro');
  const MAXH = 640;
  const cols = [
    { pct: 62, label: 'dizem que\ncumprem a meta', color: C.violet2, at: aAt, x: 300 },
    { pct: 9.6, label: 'medido com\nacelerômetro', color: C.gold, at: bAt, x: 780 },
  ];
  return (
    <AbsoluteFill>
      <Header title="A sensação *mente*." size={92} />
      {cols.map((c) => {
        const t = spr(c.at, { damping: 18, stiffness: 110 });
        const n = ramp(frame, c.at, 22);
        const h = (c.pct / 100) * MAXH * t;
        const shown = (c.pct * n).toFixed(c.pct % 1 ? 1 : 0).replace('.', ',');
        return (
          <React.Fragment key={c.label}>
            <div
              style={{
                position: 'absolute',
                left: c.x - 130,
                width: 260,
                top: 1180 - h - 150,
                textAlign: 'center',
                fontFamily: FONT.display,
                fontWeight: 600,
                fontSize: 120,
                color: c.color,
                opacity: ramp(frame, c.at, 8),
              }}
            >
              {shown}%
            </div>
            <div
              style={{
                position: 'absolute',
                left: c.x - 110,
                width: 220,
                top: 1180 - h,
                height: Math.max(h, 0),
                borderRadius: '28px 28px 6px 6px',
                background: `linear-gradient(180deg, ${c.color} 0%, ${c.color}55 100%)`,
                boxShadow: `0 0 60px ${c.color}44`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: c.x - 180,
                width: 360,
                top: 1208,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1.2,
                color: C.text,
                opacity: ramp(frame, c.at, 10),
              }}
            >
              {c.label}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: 'absolute', top: 1180, left: 120, right: 120, height: 3, background: C.borderStrong }} />
      <Footnote text="adultos nos EUA · Tucker, Welk & Beyler, 2011" from={aAt} />
    </AbsoluteFill>
  );
};

// ===================================================================== 8
/** Pilar 3: a ideia do Recanto — frente (imagem + título) e verso (a resposta). */
export const Learn: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const flipAt = cue(s, 'curta');
  const flip = spr(flipAt, { damping: 16, stiffness: 80 });
  const eqAt = cue(s, 'Porque ler');
  const rot = flip * 180;
  const W = 540;
  const H = 675;
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 36,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
  };
  return (
    <AbsoluteFill>
      <Header kicker="3 · APRENDIZADO" title="a ideia que você *lembra*" size={72} />
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: (LAYOUT.W - W) / 2,
          width: W,
          height: H,
          perspective: 2200,
          ...fadeUp(frame, 0, 14, 50),
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)` }}>
          <div style={face}>
            <Img src={staticFile('img/idea-sleep.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(10,14,38,0) 40%, rgba(10,14,38,0.92) 100%)',
              }}
            />
            <div style={{ position: 'absolute', left: 34, right: 34, bottom: 34 }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 20, letterSpacing: 4, color: C.gold2 }}>SAÚDE · SONO</div>
              <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 44, lineHeight: 1.1, color: C.hi, marginTop: 10 }}>
                Dormir até tarde no sábado não é pra todo mundo
              </div>
            </div>
          </div>
          <div
            style={{
              ...face,
              transform: 'rotateY(180deg)',
              background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
              border: `2px solid ${C.violet}66`,
              padding: 44,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 22, letterSpacing: 5, color: C.gold }}>A IDEIA</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 50, lineHeight: 1.14, color: C.hi, marginTop: 18 }}>
              Dormir mais no fim de semana só compensa quem dorme menos de 6h durante a semana.
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, color: C.mid, marginTop: 30 }}>
              Depner et al., Current Biology, 2019 · ELSA-Brasil, 2025
            </div>
          </div>
        </div>
      </div>
      {/* cinco por vez */}
      <div
        style={{
          position: 'absolute',
          top: 1178,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
          ...fadeUp(frame, cue(s, 'cinco'), 10, 10),
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: i === 0 ? 46 : 18,
              height: 18,
              borderRadius: 999,
              background: i === 0 ? C.gold2 : C.faint,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1250,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 50,
          color: C.hi,
          letterSpacing: 1,
          ...fadeUp(frame, eqAt, 12, 16),
        }}
      >
        ler <span style={{ color: C.gold }}>≠</span> lembrar <span style={{ color: C.gold }}>≠</span> fazer
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 9
/** O Espelho: o que você pratica (forma) × como você se vê (contorno). */
export const Mirror: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const shapeAt = cue(s, 'num hexágono');
  const seeAt = cue(s, 'como você se vê');
  const doAt = cue(s, 'o que você pratica');
  const gapAt = cue(s, 'Onde não bate');
  const grow = spr(Math.min(shapeAt, doAt - 10), { damping: 14 });
  return (
    <AbsoluteFill>
      <Header title="Como você se vê *×* o que você pratica" size={66} />
      <Hex
        id="mirror"
        size={560}
        cx={540}
        cy={900}
        values={PRACTICED.map((v) => v * grow)}
        contour={PERCEIVED}
        contourDraw={ramp(frame, seeAt, 40)}
        grid={ramp(frame, 0, 24)}
        labels
        highlight={4}
        highlightAmt={ramp(frame, gapAt, 12) * (0.75 + Math.sin((frame - gapAt) / 5) * 0.25)}
      />
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.footnoteY - 4,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 46,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 28,
          color: C.text,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: ramp(frame, seeAt, 12) }}>
          <span style={{ width: 40, height: 6, borderRadius: 3, background: C.gold2, boxShadow: `0 0 12px ${C.gold2}` }} />
          como você se vê
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: ramp(frame, doAt, 12) }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: C.violet }} />o que você pratica
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 10
/** Gentileza por arquitetura: pular é decisão, nada zera. */
export const Kind: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const pressAt = LEAD;
  const skipAt = cue(s, 'Pular');
  const pressed = ramp(frame, pressAt, 6) * (1 - ramp(frame, pressAt + 14, 6));
  const menu = ramp(frame, pressAt + 10, 8) * (1 - ramp(frame, skipAt, 6));
  const skipped = ramp(frame, skipAt, 8);
  return (
    <AbsoluteFill>
      <Header title="Nada *zera*." size={96} />
      <div style={{ position: 'absolute', top: 560, left: 110 }}>
        <PracticeRow
          icon="walk"
          color={dimColor('body')}
          title="Correr 5 km"
          stars={3}
          checked={0}
          width={860}
          big
          scale={1 - pressed * 0.04}
          dim={skipped > 0.5}
          note={skipped > 0.5 ? 'pulado hoje' : undefined}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 760,
          left: 540 - 200,
          width: 400,
          padding: '22px 30px',
          borderRadius: 26,
          background: C.surface2,
          border: `1.5px solid ${C.borderStrong}`,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          opacity: menu,
          transform: `translateY(${(1 - menu) * -20}px)`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        <Icon name="play-skip-forward" size={40} color={C.text} />
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.hi }}>Pular hoje</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 840,
          left: 110,
          right: 110,
          padding: '36px 40px',
          borderRadius: 30,
          background: 'rgba(36,42,88,0.85)',
          border: `1.5px solid ${C.violet}55`,
          ...fadeUp(frame, skipAt + 6, 12, 20),
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 52, lineHeight: 1.12, color: C.hi }}>
          Pular também é decidir.
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 34, color: C.mid, marginTop: 12 }}>Amanhã tem mais.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1140,
          left: 110,
          right: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...fadeUp(frame, skipAt + 14, 12, 16),
        }}
      >
        <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: C.gold }}>DEDICAÇÃO</span>
        <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.hi }}>
          1.240 <span style={{ fontFamily: FONT.body, fontSize: 30, color: C.mid }}>continua</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 11
/** A forma praticada cresce até encontrar o contorno. */
export const Close: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, LEAD, 90);
  return (
    <AbsoluteFill>
      <Header title="Você já está se tornando *alguém*." size={78} />
      <Hex
        id="close"
        size={600}
        cx={540}
        cy={930}
        values={mix(PRACTICED, PERCEIVED.map((v) => Math.min(1, v + 0.06)), t)}
        contour={PERCEIVED}
        icons
        rotate={frame * 0.06}
        opacity={1 - ramp(frame, s.frames - 14, 12)}
      />
    </AbsoluteFill>
  );
};

// ===================================================================== 12
/** Assinatura: glyph + tríade. */
export const Tagline: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const words = ['Perceba.', 'Pratique.', 'Torne-se.'];
  return (
    <AbsoluteFill>
      <Glyph size={320} cx={540} cy={520} rings={ramp(frame, 0, 26)} path={ramp(frame, 10, 26)} glow={0.9} />
      {words.map((w, i) => (
        <div
          key={w}
          style={{
            position: 'absolute',
            top: 800 + i * 128,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 108,
            color: i === 2 ? C.gold2 : C.hi,
            ...fadeUp(frame, cue(s, w), 12, 24),
          }}
        >
          {w}
        </div>
      ))}
      <div style={{ position: 'absolute', top: 1250, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, s.speech, 14, 16) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 46, letterSpacing: 16, color: C.hi }}>PERCEVA</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 32, color: C.mid, marginTop: 14 }}>
          <Rich text="perceba quem você está se tornando" />
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.gold, marginTop: 34 }}>link na bio</div>
      </div>
    </AbsoluteFill>
  );
};

export const SCENES: Record<string, React.FC<P>> = {
  hook: Hook,
  study: Study,
  follow: Follow,
  three: Three,
  self: Self,
  practice: Practice,
  feeling: Feeling,
  learn: Learn,
  mirror: Mirror,
  kind: Kind,
  close: Close,
  tagline: Tagline,
};
