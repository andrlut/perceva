import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Footnote, Icon, fadeUp, ramp } from '../components';
import { C, FONT, dimColor } from '../theme';
import { Scene, cue, speechEnd } from '../timeline';

// Teste de 2026-11-04: o vídeo de UMA ideia do Recanto feito em Remotion, pra
// comparar com o Curta do Gemini Notebook. Tudo o que aparece na tela sai do
// texto da ideia `comprar-tempo` (buying-time-chores) — números, ressalvas e
// a frase do verso. Nenhuma alegação de fora.
type P = { s: Scene };

const GOLD = dimColor('wealth');

const IDEA = {
  image: 'idea-buying-time',
  dimension: 'PROSPERIDADE',
  title: 'Vale pagar pra se livrar de uma tarefa chata?',
  claim: 'Pague pra tirar da semana a tarefa que você mais detesta: alivia a pressa mais do que comprar um objeto.',
  material: 'O dinheiro que tira a tarefa chata da semana',
  source: 'Whillans e colegas, 2017 · PNAS',
};

const img = (name: string) => staticFile(`img/${name}.webp`);

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120, mass: 1, ...config } });
};

/** 6271 → "6.271" (sem depender do Intl do Chrome headless). */
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Sobrancelha dourada do quadro — o rótulo da cena, nunca uma frase. */
const Kicker: React.FC<{ text: string; from?: number; top?: number }> = ({ text, from = 0, top = 200 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 7,
        color: GOLD,
        ...fadeUp(frame, from, 12, 16),
      }}
    >
      {text}
    </div>
  );
};

/**
 * Card de ideia como o IdeaCard do app: frente = imagem 4:5 com o título no
 * TOPO e moldura fina na cor da área; verso = a frase. `absorbed` = borda
 * dourada, como depois que a pessoa vira o card no app.
 */
const IdeaCard: React.FC<{ width: number; flip: number; absorbed?: boolean; style?: React.CSSProperties }> = ({
  width,
  flip,
  absorbed = false,
  style,
}) => {
  const height = width * 1.25;
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 36,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    border: `3px solid ${absorbed ? C.gold : `${GOLD}AA`}`,
    boxShadow: absorbed ? `0 0 70px ${C.gold}66` : '0 30px 90px rgba(0,0,0,0.5)',
  };
  return (
    <div style={{ width, height, perspective: 2200, ...style }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${flip * 180}deg)` }}>
        <div style={face}>
          <Img src={img(IDEA.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0.94) 0%, rgba(10,14,38,0.55) 30%, rgba(10,14,38,0) 55%)' }} />
          <div style={{ position: 'absolute', left: width * 0.07, right: width * 0.07, top: width * 0.07 }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: width * 0.078, lineHeight: 1.1, color: C.hi }}>{IDEA.title}</div>
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: GOLD }} />
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: width * 0.078, lineHeight: 1.18, color: C.hi }}>{IDEA.claim}</div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================== 1
/** A pergunta da ideia, como ela aparece no app. */
export const Hook: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const t = spr(0, { damping: 18, stiffness: 90 });
  const push = interpolate(frame, [0, s.frames], [1, 1.035]);
  return (
    <AbsoluteFill>
      <Kicker text={`${IDEA.dimension} · UMA IDEIA DO RECANTO`} />
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <IdeaCard width={700} flip={0} style={{ opacity: t, transform: `scale(${(0.9 + 0.1 * t) * push})` }} />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 2
const COUNTRIES = ['Estados Unidos', 'Canadá', 'Dinamarca', 'Holanda'];

/** 6.271 pessoas, quatro países, mais satisfação com a vida. */
export const Study: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const countT = ramp(frame, s.lead, 38);
  const atCountries = cue(s, 'quatro países');
  const atResult = cue(s, 'mais satisfação');
  const res = spr(atResult, { damping: 16 });
  return (
    <AbsoluteFill>
      <Kicker text="A PESQUISA" />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, s.lead, 14) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 220, lineHeight: 1, color: GOLD, letterSpacing: -4 }}>
          {thousands(Math.round(6271 * countT))}
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 50, color: C.mid, marginTop: 14 }}>pessoas</div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 690,
          left: 110,
          right: 110,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {COUNTRIES.map((c, i) => {
          const t = spr(atCountries + i * 5, { damping: 14, stiffness: 150 });
          return (
            <div
              key={c}
              style={{
                padding: '18px 32px',
                borderRadius: 999,
                border: `2px solid ${C.borderStrong}`,
                background: C.surface,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 38,
                color: C.hi,
                opacity: t,
                transform: `translateY(${(1 - t) * 24}px) scale(${0.9 + 0.1 * t})`,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1000,
          left: 110,
          right: 110,
          padding: '36px 40px',
          borderRadius: 30,
          background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
          border: `2px solid ${GOLD}66`,
          boxShadow: `0 0 60px ${GOLD}22`,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          opacity: res,
          transform: `translateY(${(1 - res) * 30}px)`,
        }}
      >
        <Icon name="trending-up" size={84} color={GOLD} />
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 54, lineHeight: 1.12, color: C.hi }}>
          quem pagava relatava mais satisfação com a vida
        </div>
      </div>

      <Footnote text={IDEA.source} from={atResult + 6} top={1340} size={30} color={C.mid} />
    </AbsoluteFill>
  );
};

// ===================================================================== 3
/** Só 28 em cada 100 faziam isso. */
export const Few: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const at = cue(s, 'vinte e oito');
  const fill = ramp(frame, at, 30);
  const lit = Math.round(28 * fill);
  const DOT = 50;
  const GAP = 18;
  const size = 10 * DOT + 9 * GAP;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, at - 6, 12) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 250, lineHeight: 1, color: GOLD, letterSpacing: -6 }}>
          {Math.round(28 * fill)}%
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 560,
          left: (1080 - size) / 2,
          width: size,
          display: 'grid',
          gridTemplateColumns: `repeat(10, ${DOT}px)`,
          gap: GAP,
        }}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const on = i < lit;
          return (
            <div
              key={i}
              style={{
                width: DOT,
                height: DOT,
                borderRadius: DOT / 2,
                background: on ? GOLD : C.surface2,
                boxShadow: on ? `0 0 22px ${GOLD}88` : 'none',
                opacity: ramp(frame, i * 0.25, 6),
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 4
const Choice: React.FC<{
  x: number;
  icon: 'sparkles' | 'gift';
  label: string;
  from: number;
  win: number;
  lose: number;
}> = ({ x, icon, label, from, win, lose }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const t = spr(from, { damping: 15 });
  return (
    <div
      style={{
        position: 'absolute',
        top: 380,
        left: x,
        width: 410,
        height: 520,
        borderRadius: 34,
        background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
        border: `3px solid ${win > 0 ? `rgba(255,200,61,${0.25 + 0.75 * win})` : C.borderStrong}`,
        boxShadow: `0 0 ${80 * win}px ${GOLD}55`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        opacity: t * (1 - 0.55 * lose),
        transform: `translateY(${(1 - t) * 40}px) scale(${1 + 0.04 * win})`,
      }}
    >
      <Icon name={icon} size={130} color={win > 0 ? GOLD : C.mid} />
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 52, lineHeight: 1.1, color: C.hi, textAlign: 'center', padding: '0 30px' }}>
        {label}
      </div>
      <div
        style={{
          padding: '12px 28px',
          borderRadius: 999,
          background: C.base,
          border: `2px solid ${C.borderStrong}`,
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 40,
          color: C.gold2,
          opacity: ramp(frame, from + 12, 12),
        }}
      >
        US$ 40
      </div>
    </div>
  );
};

/** Os mesmos 40 dólares em tempo ou em objeto. Ganha o tempo. */
export const Experiment: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const atTime = cue(s, 'algo que poupava');
  const atWin = cue(s, 'menos apressadas');
  const atObject = cue(s, 'num objeto');
  const win = ramp(frame, atWin, 16);
  const chips = [
    { icon: 'leaf' as const, text: 'menos pressa', at: atWin },
    { icon: 'happy' as const, text: 'melhor humor', at: cue(s, 'melhor humor') },
  ];
  return (
    <AbsoluteFill>
      <Kicker text="O EXPERIMENTO" />
      <Choice x={95} icon="sparkles" label="Algo que poupa tempo" from={atTime - 4} win={win} lose={0} />
      {/* o objeto continua na tela, só perde o destaque — a ideia não é "objeto não presta" */}
      <Choice x={575} icon="gift" label="Um objeto" from={Math.min(atTime + 6, atObject)} win={0} lose={win} />
      <div style={{ position: 'absolute', top: 950, left: 95, width: 410, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {chips.map((c) => {
          const t = spr(c.at, { damping: 14, stiffness: 150 });
          return (
            <div
              key={c.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 26px',
                borderRadius: 22,
                background: C.surface,
                border: `2px solid ${GOLD}55`,
                opacity: t,
                transform: `translateX(${(1 - t) * -30}px)`,
              }}
            >
              <Icon name={c.icon} size={48} color={GOLD} />
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: C.hi }}>{c.text}</div>
            </div>
          );
        })}
      </div>
      <Footnote text="60 adultos · Vancouver · um fim de semana" from={atTime} top={1340} size={30} color={C.mid} />
    </AbsoluteFill>
  );
};

// ===================================================================== 5 e 6
type Limit = { icon: 'analytics' | 'layers' | 'calendar' | 'wallet'; text: string; sub?: string; phrase: string };
const LIMITS: Limit[] = [
  { icon: 'analytics', text: 'Efeito pequeno', phrase: 'pequeno' },
  { icon: 'layers', text: 'Quase tudo é correlação', sub: 'os dados andam juntos, sem provar causa', phrase: 'correlação' },
  { icon: 'calendar', text: 'Só o humor do dia seguinte', phrase: 'dia seguinte' },
];
const INCOME: Limit = { icon: 'wallet', text: 'Pouca gente de renda muito baixa', sub: 'a renda não mudou o padrão', phrase: 'pouca gente' };

const LimitRow: React.FC<{ l: Limit; t: number; dim?: boolean; fresh?: boolean; top: number }> = ({ l, t, dim = false, fresh = false, top }) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 70,
      right: 70,
      padding: '28px 30px',
      borderRadius: 28,
      background: C.surface,
      border: `2px solid ${fresh ? `${GOLD}99` : dim ? C.border : C.borderStrong}`,
      boxShadow: fresh ? `0 0 50px ${GOLD}33` : 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      opacity: t * (dim ? 0.5 : 1),
      transform: `translateY(${(1 - t) * 26}px)`,
    }}
  >
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: 24,
        background: C.base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={l.icon} size={54} color={fresh ? GOLD : C.violet2} />
    </div>
    <div>
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 45, lineHeight: 1.1, color: C.hi }}>{l.text}</div>
      {l.sub ? <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 32, color: C.mid, marginTop: 8 }}>{l.sub}</div> : null}
    </div>
  </div>
);

const ROW_TOP = 330;
const ROW_STEP = 218;

/** O que a pesquisa NÃO mostra — a parte que o vídeo do Notebook pulou. */
export const Caveat: React.FC<P> = ({ s }) => {
  const spr = useSpr();
  return (
    <AbsoluteFill>
      <Kicker text="OS LIMITES DO ESTUDO" />
      {LIMITS.map((l, i) => (
        <LimitRow key={l.text} l={l} t={spr(cue(s, l.phrase) - 4, { damping: 15 })} top={ROW_TOP + i * ROW_STEP} />
      ))}
    </AbsoluteFill>
  );
};

/** A quarta ressalva entra; as três de antes ficam, mais apagadas. */
export const Income: React.FC<P> = ({ s }) => {
  const spr = useSpr();
  return (
    <AbsoluteFill>
      <Kicker text="OS LIMITES DO ESTUDO" />
      {LIMITS.map((l, i) => (
        <LimitRow key={l.text} l={l} t={1} dim top={ROW_TOP + i * ROW_STEP} />
      ))}
      <LimitRow l={INCOME} t={spr(cue(s, INCOME.phrase) - 4, { damping: 15 })} fresh top={ROW_TOP + 3 * ROW_STEP} />
    </AbsoluteFill>
  );
};

// ===================================================================== 7
/** O card vira: o verso é a resposta que dá pra usar, e é ele que a voz lê. */
export const Do: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const flip = interpolate(frame, [s.lead - 14, s.lead + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const absorbed = frame > speechEnd(s) + 6;
  return (
    <AbsoluteFill>
      <Kicker text="O QUE FAZER COM ISSO" />
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <IdeaCard width={720} flip={flip} absorbed={absorbed} />
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
          fontSize: 34,
          letterSpacing: 5,
          color: C.gold,
          opacity: absorbed ? ramp(frame, speechEnd(s) + 6, 12) : 0,
        }}
      >
        IDEIA ABSORVIDA
      </div>
    </AbsoluteFill>
  );
};

export const SCENES = {
  hook: Hook,
  study: Study,
  few: Few,
  experiment: Experiment,
  caveat: Caveat,
  income: Income,
  do: Do,
};
