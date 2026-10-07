import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Header, Icon, Phone, PracticeRow, Rich, Spark, fadeUp, ramp } from '../components';
import { Emblema } from '../Emblema';
import { Glyph } from '../Glyph';
import { C, FONT, dimColor } from '../theme';
import { Scene, cue, speechEnd } from '../timeline';
import { useVariant } from '../variant';

// Manifesto v2 (2026-10-07): até 60 s, Insta/TikTok/anúncio e abertura do
// tutorial. Sem número nem estudo. Os 3 módulos como verbos (Se conhecer ·
// Praticar · Aprender) e o clímax no Emblema — o glyph que o app desenha
// com os dados da pessoa (app/components/Emblema.tsx). Texto só entre ~15%
// e ~60% da altura: em cima mora o perfil/Stories, embaixo a legenda e o
// botão do Reels e do anúncio.
type P = { s: Scene };

const TOP = 290; // título das cenas
const PHONE = { width: 540, height: 680, top: 440 }; // vai até 1120

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120, mass: 1, ...config } });
};

const Coin: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: 999,
      background: `radial-gradient(circle at 35% 35%, ${C.gold2} 0%, ${C.gold} 55%, ${C.goldDeep} 100%)`,
      boxShadow: `inset 0 0 0 ${Math.max(2, size * 0.1)}px rgba(200,136,28,0.6)`,
      verticalAlign: 'middle',
    }}
  />
);

// Índices das áreas no Emblema (ordem do hex): 0 sono · 2 força · 4 aprender · 8 amigos · 10 lazer
const HOOK_ROWS = [
  { icon: 'moon' as const, dim: 'health' as const, title: 'Dormir antes da 0h', stars: 2, sub: 0, at: 8, top: 580 },
  { icon: 'barbell' as const, dim: 'body' as const, title: 'Treino de força', stars: 3, sub: 2, at: 26, top: 685 },
  { icon: 'book' as const, dim: 'mind' as const, title: 'Ler 20 minutos', stars: 2, sub: 4, at: 44, top: 790 },
];
// a pergunta do gancho mora logo abaixo do título; práticas e Emblema descem
const EMB_HOOK = { cx: 540, cy: 1035, size: 220 };
const QUESTION_TOP = TOP + 160;

// ===================================================================== 1a
/** Gancho A: cada toque numa prática desenha o Emblema. Pra ser quem? */
export const Hook: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const qAt = cue(s, 'Pra ser quem');
  const lift = spr(qAt - 4, { damping: 16, stiffness: 90 });
  const lit = Array(12).fill(0);
  let rings = 0;
  HOOK_ROWS.forEach((r) => {
    const t = spr(r.at + 14, { damping: 12 });
    lit[r.sub] = t;
    rings += 0.7 * t;
  });
  return (
    <AbsoluteFill>
      <Header title="Seus hábitos estão te *treinando*." size={70} from={-20} top={TOP} />
      {HOOK_ROWS.map((r, i) => (
        <div
          key={r.title}
          style={{
            position: 'absolute',
            top: r.top,
            left: 150,
            opacity: (i === 0 ? 1 : ramp(frame, i * 5, 10)) * (1 - ramp(frame, qAt - 10, 6)),
            transform: `translateY(${-lift * 40}px)`,
          }}
        >
          <PracticeRow icon={r.icon} color={dimColor(r.dim)} title={r.title} stars={r.stars} checked={ramp(frame, r.at, 7)} width={780} />
        </div>
      ))}
      <Emblema
        cx={EMB_HOOK.cx}
        cy={interpolate(lift, [0, 1], [EMB_HOOK.cy, 820])}
        size={EMB_HOOK.size}
        scale={1 + lift * 0.75}
        rings={rings}
        tests={0}
        halo={0.1}
        lit={lit}
        center={frame > HOOK_ROWS[1].at + 14 ? 2 : frame > HOOK_ROWS[0].at + 14 ? 0 : null}
      />
      {HOOK_ROWS.map((r) => (
        <Spark key={r.title} from={[880, r.top + 50]} to={[EMB_HOOK.cx, EMB_HOOK.cy]} t={(frame - r.at - 2) / 16} color={dimColor(r.dim)} />
      ))}
      <div
        style={{
          position: 'absolute',
          top: QUESTION_TOP,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 92,
          color: C.gold2,
          ...fadeUp(frame, qAt, 10, 20),
        }}
      >
        Pra ser quem?
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 1b
/** Gancho B (teste A/B do anúncio): as práticas estão lá, os checks não. */
export const HookB: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const qAt = cue(s, 'Mas tá fazendo');
  return (
    <AbsoluteFill>
      <Header title="Você sabe o que deveria *fazer*." size={70} from={-20} top={TOP} />
      {HOOK_ROWS.map((r, i) => (
        <div key={r.title} style={{ position: 'absolute', top: r.top, left: 150, opacity: i === 0 ? 1 : ramp(frame, i * 5, 10) }}>
          <PracticeRow icon={r.icon} color={dimColor(r.dim)} title={r.title} stars={r.stars} checked={0} width={780} />
        </div>
      ))}
      <Emblema cx={EMB_HOOK.cx} cy={EMB_HOOK.cy} size={EMB_HOOK.size} rings={0} tests={0} halo={0.05} lit={Array(12).fill(0)} center={null} opacity={0.7} />
      <div
        style={{
          position: 'absolute',
          top: EMB_HOOK.cy - 70,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 120,
          color: C.gold2,
          opacity: ramp(frame, qAt, 10),
          textShadow: '0 0 60px rgba(255,224,138,0.4)',
        }}
      >
        ?
      </div>
      <div style={{ position: 'absolute', top: QUESTION_TOP, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 92, color: C.gold2, ...fadeUp(frame, qAt, 10, 20) }}>
        Mas tá fazendo?
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 2
const MODULES = [
  { name: 'Se conhecer', icon: 'person' as const, color: C.violet2 },
  { name: 'Praticar', icon: 'checkmark-circle' as const, color: C.xp },
  { name: 'Aprender', icon: 'book' as const, color: C.gold },
];

/** Três coisas que viviam separadas se juntam embaixo da marca. */
export const Trio: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const join = spr(cue(s, 'três coisas'), { damping: 14, stiffness: 90 });
  return (
    <AbsoluteFill>
      <Glyph size={300} cx={540} cy={560} rings={ramp(frame, 0, 24)} path={ramp(frame, 8, 24)} glow={0.7} />
      {MODULES.map((m, i) => {
        const finalX = 540 + (i - 1) * 300;
        const startX = 540 + (i - 1) * 640;
        const x = startX + (finalX - startX) * join;
        return (
          <div
            key={m.name}
            style={{
              position: 'absolute',
              top: 790 + (1 - join) * (i === 1 ? -30 : 50),
              left: x - 135,
              width: 270,
              height: 280,
              borderRadius: 34,
              background: 'rgba(36,42,88,0.75)',
              border: `2px solid ${join > 0.9 ? `${m.color}99` : C.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              transform: `rotate(${(1 - join) * (i - 1) * 8}deg)`,
              opacity: ramp(frame, 4 + i * 4, 12),
              boxShadow: join > 0.9 ? `0 0 50px ${m.color}33` : 'none',
            }}
          >
            <div style={{ width: 110, height: 110, borderRadius: 999, background: `${m.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={m.icon} size={62} color={m.color} />
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 34, color: C.hi }}>{m.name}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ===================================================================== 3
const TESTS = [
  { name: 'Personalidade', icon: 'person' as const },
  { name: 'Valores', icon: 'compass' as const },
  { name: 'Vínculo', icon: 'heart' as const },
  { name: 'Forças de caráter', icon: 'sparkles' as const },
];
const SELF = [
  { name: 'Sono', icon: 'moon' as const, dim: 'health' as const, v: 2.5 },
  { name: 'Força', icon: 'barbell' as const, dim: 'body' as const, v: 4 },
  { name: 'Aprender', icon: 'book' as const, dim: 'mind' as const, v: 3.5 },
  { name: 'Dinheiro', icon: 'wallet' as const, dim: 'wealth' as const, v: 2 },
  { name: 'Amigos e família', icon: 'people' as const, dim: 'bonds' as const, v: 4.5 },
  { name: 'Lazer', icon: 'game-controller' as const, dim: 'craft' as const, v: 3 },
];

/** Se conhecer: os testes (os profundos são Premium, à vista) e a nota de cada área. */
export const Know: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const rateAt = cue(s, 'E uma nota');
  const swap = ramp(frame, rateAt - 6, 10);
  return (
    <AbsoluteFill>
      <Header title="Se *conhecer*." size={96} top={TOP} />
      <Phone {...PHONE} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        <div style={{ position: 'absolute', inset: '64px 30px 30px', opacity: 1 - swap }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.hi, marginBottom: 20 }}>Testes</div>
          {TESTS.map((t, i) => (
            <div
              key={t.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 18px',
                marginBottom: 14,
                borderRadius: 22,
                background: 'rgba(36,42,88,0.7)',
                border: `1.5px solid ${C.border}`,
                ...fadeUp(frame, 6 + i * 6, 10, 20),
              }}
            >
              <div style={{ width: 62, height: 62, borderRadius: 20, background: 'rgba(123,92,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={34} color={C.violet2} />
              </div>
              <div style={{ flex: 1, fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.hi }}>{t.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: `1.5px solid ${C.gold}88`, fontFamily: FONT.body, fontWeight: 800, fontSize: 18, color: C.gold2 }}>
                <Icon name="lock-closed" size={18} color={C.gold2} /> Premium
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: '64px 30px 30px', opacity: swap, transform: `translateX(${(1 - swap) * 60}px)` }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.hi }}>Como você se vê</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, color: C.mid, margin: '6px 0 16px' }}>Avaliação · grátis</div>
          {SELF.map((a, i) => {
            const t = ramp(frame, rateAt + i * 5, 14);
            const color = dimColor(a.dim);
            return (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <Icon name={a.icon} size={30} color={color} />
                <div style={{ width: 150, fontFamily: FONT.body, fontWeight: 700, fontSize: 22, color: C.text }}>{a.name}</div>
                <div style={{ flex: 1, position: 'relative', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.10)' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(a.v / 5) * 100 * t}%`, borderRadius: 5, background: color }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: -9,
                      left: `calc(${(a.v / 5) * 100 * t}% - 14px)`,
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: C.hi,
                      boxShadow: `0 0 12px ${color}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 4
const TODAY = [
  { icon: 'walk' as const, dim: 'body' as const, title: 'Caminhada', stars: 2 },
  { icon: 'people' as const, dim: 'bonds' as const, title: 'Ligar pra minha mãe', stars: 2 },
  { icon: 'leaf' as const, dim: 'mind' as const, title: 'Meditar 10 min', stars: 1 },
];
const REWARDS = [
  { title: 'Café na padaria', cost: 40, icon: 'cafe' as const },
  { title: 'Episódio da série', cost: 30, icon: 'tv' as const },
];

/** Praticar: um toque marca, a moeda cai, a recompensa é sua. */
export const Practice: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const tapAt = cue(s, 'um toque');
  const coinAt = cue(s, 'vira moeda');
  const rewardAt = cue(s, 'recompensas');
  const toRewards = ramp(frame, rewardAt - 8, 10);
  const redeemAt = rewardAt + 18;
  const coins = 120 + (frame > tapAt + 6 ? 20 : 0) + (frame > tapAt + 20 ? 20 : 0) - (frame > redeemAt ? 40 : 0);
  return (
    <AbsoluteFill>
      <Header title="*Praticar*." size={96} top={TOP} />
      <Phone {...PHONE} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        {/* saldo de moedas, sempre à vista */}
        <div style={{ position: 'absolute', top: 60, right: 30, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.gold2, zIndex: 2 }}>
          <Coin size={30} /> {coins}
        </div>
        <div style={{ position: 'absolute', inset: '64px 30px 30px', opacity: 1 - toRewards, transform: `translateX(${-toRewards * 60}px)` }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.hi, marginBottom: 22 }}>Hoje</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TODAY.map((r, i) => (
              <PracticeRow key={r.title} icon={r.icon} color={dimColor(r.dim)} title={r.title} stars={r.stars} checked={i < 2 ? ramp(frame, tapAt + i * 14, 7) : 0} />
            ))}
          </div>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                right: 40,
                top: 110 + i * 112,
                fontFamily: FONT.body,
                fontWeight: 800,
                fontSize: 30,
                color: C.gold2,
                opacity: ramp(frame, coinAt - 6 + i * 14, 6) * (1 - ramp(frame, coinAt + 10 + i * 14, 10)),
                transform: `translateY(${-ramp(frame, coinAt - 6 + i * 14, 20) * 50}px)`,
              }}
            >
              +20 <Coin size={24} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: '64px 30px 30px', opacity: toRewards, transform: `translateX(${(1 - toRewards) * 60}px)` }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.hi, marginBottom: 22 }}>Recompensas</div>
          {REWARDS.map((rw, i) => {
            const done = i === 0 && frame > redeemAt;
            return (
              <div
                key={rw.title}
                style={{
                  padding: 22,
                  marginBottom: 16,
                  borderRadius: 24,
                  background: done ? 'rgba(255,200,61,0.14)' : 'rgba(36,42,88,0.7)',
                  border: `2px solid ${done ? C.gold : C.border}`,
                  boxShadow: done ? `0 0 40px ${C.gold}44` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 62, height: 62, borderRadius: 20, background: 'rgba(255,200,61,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={rw.icon} size={34} color={C.gold2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.hi }}>{rw.title}</div>
                    <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: C.gold2, marginTop: 4 }}>
                      <Coin size={20} /> {rw.cost}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    textAlign: 'center',
                    padding: '12px 0',
                    borderRadius: 999,
                    background: done ? 'transparent' : C.gold,
                    border: done ? `2px solid ${C.gold}` : 'none',
                    fontFamily: FONT.body,
                    fontWeight: 800,
                    fontSize: 24,
                    color: done ? C.gold2 : C.deep,
                    transform: `scale(${1 - (i === 0 ? Math.sin(ramp(frame, redeemAt - 4, 8) * Math.PI) * 0.05 : 0)})`,
                  }}
                >
                  {done ? '✓ Resgatada' : 'Resgatar'}
                </div>
              </div>
            );
          })}
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 5
/** Nada zera: tocar na prática, "Pular hoje", e a linha fica — sem vermelho. */
export const Skip: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const openAt = s.lead + 2;
  const skipAt = cue(s, 'Nada zera') - 4;
  const sheet = ramp(frame, openAt, 10) * (1 - ramp(frame, skipAt + 4, 8));
  const skipped = frame > skipAt + 6;
  return (
    <AbsoluteFill>
      <Header title="Nada *zera*." size={96} top={TOP} />
      <Phone {...PHONE} style={{ ...fadeUp(frame, 0, 12, 50) }}>
        <div style={{ position: 'absolute', inset: '64px 30px 30px' }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.hi, marginBottom: 22 }}>Hoje</div>
          <PracticeRow icon="walk" color={dimColor('body')} title="Correr 5 km" stars={3} checked={0} dim={skipped} note={skipped ? 'pulado hoje' : undefined} />
          <div style={{ marginTop: 14 }}>
            <PracticeRow icon="book" color={dimColor('mind')} title="Ler 20 minutos" stars={2} checked={1} />
          </div>
          <div
            style={{
              marginTop: 40,
              padding: '26px 28px',
              borderRadius: 24,
              background: 'rgba(36,42,88,0.85)',
              border: `1.5px solid ${C.violet}55`,
              ...fadeUp(frame, cue(s, 'Pular também'), 12, 16),
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 38, lineHeight: 1.15, color: C.hi }}>Pular também é decidir.</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: C.mid, marginTop: 8 }}>Amanhã tem mais.</div>
          </div>
        </div>
        {/* folha que abre ao tocar na prática */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '26px 30px 36px',
            borderRadius: '36px 36px 0 0',
            background: C.surface,
            borderTop: `1.5px solid ${C.borderStrong}`,
            transform: `translateY(${(1 - sheet) * 340}px)`,
          }}
        >
          <div style={{ width: 70, height: 7, borderRadius: 4, background: C.faint, margin: '0 auto 22px' }} />
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 32, color: C.hi, marginBottom: 18 }}>Correr 5 km</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '18px 0', borderRadius: 999, background: dimColor('body'), fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: C.deep }}>Concluir</div>
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '18px 0',
                borderRadius: 999,
                border: `2px solid ${C.borderStrong}`,
                background: frame > skipAt - 4 ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontFamily: FONT.body,
                fontWeight: 800,
                fontSize: 26,
                color: C.hi,
              }}
            >
              Pular hoje
            </div>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 6
/** Aprender: o card de uma ideia (categoria Livro, sem número) vira e fica guardado. */
export const Learn: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const flip = spr(cue(s, 'com fonte'), { damping: 16, stiffness: 90 });
  const absorbed = flip > 0.6;
  const W = 470;
  const H = W * 1.25;
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 32,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    border: `3px solid ${absorbed ? C.gold : `${dimColor('mind')}AA`}`,
    boxShadow: absorbed ? `0 0 60px ${C.gold}55` : '0 30px 90px rgba(0,0,0,0.5)',
  };
  return (
    <AbsoluteFill>
      <Header title="*Aprender*." size={96} top={TOP} />
      <div style={{ position: 'absolute', top: 440, left: (1080 - W) / 2, width: W, height: H, perspective: 2200, ...fadeUp(frame, 0, 12, 40) }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${flip * 180}deg)` }}>
          <div style={face}>
            <Img src={staticFile('img/idea-antifragile.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0.94) 0%, rgba(10,14,38,0.5) 32%, rgba(10,14,38,0) 55%)' }} />
            <div style={{ position: 'absolute', left: 32, right: 32, top: 30 }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 20, letterSpacing: 4, color: C.gold2 }}>LIVRO</div>
              <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 40, lineHeight: 1.1, color: C.hi, marginTop: 8 }}>Melhorar começa por tirar, não por somar.</div>
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
              padding: 40,
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: dimColor('mind') }} />
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 40, lineHeight: 1.16, color: C.hi }}>
              Na dúvida entre adicionar e remover, remova. Comece tirando um ultraprocessado ou uma assinatura.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 26, fontFamily: FONT.body, fontWeight: 700, fontSize: 22, color: C.mid }}>
              <Icon name="library" size={26} color={C.gold2} /> Antifrágil, de Nassim Taleb
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1040, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: absorbed ? 1 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 26px', borderRadius: 999, background: 'rgba(255,200,61,0.16)', border: `2px solid ${C.gold}`, fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: C.gold2 }}>
          <Icon name="checkmark" size={30} color={C.gold2} /> Absorvida
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 7
/** O Emblema: prática → anéis e áreas, teste → braços, ideia → brilho. */
export const EmblemScene: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const pAt = cue(s, 'cada prática');
  const tAt = cue(s, 'teste e');
  const iAt = cue(s, 'ideia desenha');
  const youAt = cue(s, 'quem você');
  const rings = interpolate(frame, [pAt - 4, pAt + 30], [0.4, 3.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const tests = interpolate(frame, [tAt - 2, tAt + 26], [0, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const halo = interpolate(frame, [iAt - 2, iAt + 24], [0.05, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const litOrder = [2, 0, 8, 4, 10, 6, 5];
  const lit = Array(12).fill(0);
  litOrder.forEach((sub, k) => {
    lit[sub] = ramp(frame, pAt + k * 4, 8);
  });
  const breathe = 1 + Math.sin(Math.max(0, frame - youAt) / 10) * 0.015 * ramp(frame, youAt, 10);
  const chip = (label: string, at: number, x: number, y: number, color: string) => (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        padding: '10px 20px',
        borderRadius: 999,
        background: 'rgba(14,18,48,0.85)',
        border: `2px solid ${color}`,
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: 28,
        color,
        ...fadeUp(frame, at, 10, 12),
      }}
    >
      {label}
    </div>
  );
  return (
    <AbsoluteFill>
      <Header title="O seu *Emblema*." size={92} top={TOP} />
      <Emblema cx={540} cy={800} size={560} scale={breathe} rings={rings} tests={tests} halo={halo} lit={lit} center={frame > pAt + 6 ? 2 : null} />
      {chip('práticas', pAt, 70, 560, C.violet2)}
      {chip('testes', tAt, 790, 500, C.goldLight)}
      {chip('ideias', iAt, 760, 1060, C.violet2)}
    </AbsoluteFill>
  );
};

// ===================================================================== 8
/** O porquê, em texto grande (a legenda fica de fora: a tela já diz a fala). */
const WhyBody: React.FC<{ s: Scene; withKnow: boolean }> = ({ s, withKnow }) => {
  const frame = useCurrentFrame();
  const knowAt = withKnow ? cue(s, 'Você sabe') : -100;
  const seeAt = cue(s, 'Aqui');
  const freeAt = cue(s, 'Grátis');
  return (
    <AbsoluteFill>
      <Emblema cx={540} cy={760} size={620} rings={3.4} tests={4} halo={0.9} lit={[1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0]} center={2} opacity={0.08} />
      {withKnow ? (
        <div style={{ position: 'absolute', top: 400, left: 90, right: 90, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 64, lineHeight: 1.12, color: C.mid, ...fadeUp(frame, knowAt, 12, 20) }}>
          Você sabe o que deveria fazer.
        </div>
      ) : null}
      <div style={{ position: 'absolute', top: withKnow ? 620 : 520, left: 80, right: 80, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 84, lineHeight: 1.08, color: C.hi, ...fadeUp(frame, seeAt, 12, 24) }}>
        <Rich text="Aqui, você *vê* se está fazendo." />
      </div>
      <div style={{ position: 'absolute', top: withKnow ? 900 : 820, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...fadeUp(frame, freeAt, 10, 16) }}>
        <div style={{ padding: '18px 40px', borderRadius: 999, border: `3px solid ${C.gold}`, background: 'rgba(255,200,61,0.12)', fontFamily: FONT.body, fontWeight: 800, fontSize: 44, color: C.gold2 }}>
          Grátis pra começar
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const Why: React.FC<P> = ({ s }) => <WhyBody s={s} withKnow />;
export const WhyB: React.FC<P> = ({ s }) => <WhyBody s={s} withKnow={false} />;

// ===================================================================== 9
/** Assinatura + cartão final (anúncio: download; app: "Vamos começar?"). */
export const Sign: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const variant = useVariant();
  const words = ['Perceba.', 'Pratique.', 'Torne-se.'];
  const endAt = speechEnd(s) + 4;
  return (
    <AbsoluteFill>
      <Glyph size={230} cx={540} cy={430} rings={ramp(frame, 0, 22)} path={ramp(frame, 8, 22)} glow={0.9} />
      {words.map((w, i) => (
        <div
          key={w}
          style={{
            position: 'absolute',
            top: 590 + i * 112,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 96,
            color: i === 2 ? C.gold2 : C.hi,
            ...fadeUp(frame, cue(s, w.replace('.', '')), 10, 22),
          }}
        >
          {w}
        </div>
      ))}
      <div style={{ position: 'absolute', top: 960, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, endAt, 12, 18) }}>
        {variant === 'ad' ? (
          <>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 72, letterSpacing: 12, color: C.hi }}>PERCEVA</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.gold2, marginTop: 14 }}>Grátis pra começar · Google Play</div>
          </>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '22px 48px', borderRadius: 999, background: C.violet, fontFamily: FONT.body, fontWeight: 800, fontSize: 44, color: C.hi, boxShadow: `0 0 50px ${C.violet}88` }}>
            Vamos começar? <Icon name="arrow-forward" size={44} color={C.hi} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const SCENES = {
  hook: Hook,
  hookB: HookB,
  trio: Trio,
  know: Know,
  practice: Practice,
  skip: Skip,
  learn: Learn,
  emblem: EmblemScene,
  why: Why,
  whyB: WhyB,
  sign: Sign,
};
