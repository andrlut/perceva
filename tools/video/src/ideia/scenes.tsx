import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Icon, fadeUp, ramp } from '../components';
import { C, FONT, dimColor } from '../theme';
import { Scene, cue, speechEnd } from '../timeline';
import { Brilho, Cesto, Livro, Louca, Moeda, Pessoa, Relogio, Sacola, Semana, Sofa, Vassoura } from '../elenco/cast';

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
/** A pessoa sem tempo: relógio acelerado e as tarefas chatas caindo em volta. */
export const Hook: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const me = spr(0, { damping: 16 });
  const drop = (at: number) => {
    const t = spr(at, { damping: 11, stiffness: 140 });
    return { opacity: Math.min(1, t * 2), transform: `translateY(${(1 - t) * -120}px)` };
  };
  return (
    <AbsoluteFill>
      <Kicker text={IDEA.dimension} />
      <div style={{ position: 'absolute', top: 330, left: 640, ...drop(4) }}>
        <Relogio t={frame} size={230} speed={5} accent={C.violet2} />
      </div>
      <div style={{ position: 'absolute', top: 660, left: 390, opacity: me, transform: `scale(${0.85 + 0.15 * me})` }}>
        <Pessoa t={frame} size={300} mood="cansado" arms="down" accent={C.violet} />
      </div>
      <div style={{ position: 'absolute', top: 700, left: 140, ...drop(cue(s, 'dia não cabe')) }}>
        <Vassoura size={300} tilt={-16} />
      </div>
      <div style={{ position: 'absolute', top: 960, left: 700, ...drop(cue(s, 'nas horas')) }}>
        <Cesto size={250} />
      </div>
      <div style={{ position: 'absolute', top: 1110, left: 80, ...drop(cue(s, 'vale pagar')) }}>
        <Louca size={220} />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 2
const SKINS = ['#F2C9A0', '#C68B5E', '#8D5A3B', '#E0AC7E', '#5C3A24', '#F5D5B8'];
const HELPER = dimColor('craft');

/** A semana enchendo de tarefas e o relógio disparando: a corrida. */
export const Pressure: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const atFill = cue(s, 'a semana enche');
  const atRun = cue(s, 'corrida');
  const fill = ramp(frame, atFill, atRun - atFill + 10);
  const speed = interpolate(frame, [atFill, atRun + 10], [1.5, 9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const week = spr(s.lead - 4, { damping: 16 });
  return (
    <AbsoluteFill>
      <Kicker text="PRESSÃO DO TEMPO" />
      <div style={{ position: 'absolute', top: 320, left: 110, opacity: week, transform: `translateY(${(1 - week) * 30}px)` }}>
        <Semana width={860} fill={fill} />
      </div>
      <div style={{ position: 'absolute', top: 820, left: 150, opacity: week }}>
        <Relogio t={frame} size={230} speed={speed} accent={C.violet2} />
      </div>
      <div style={{ position: 'absolute', top: 760, left: 500 }}>
        <Pessoa t={frame * (1 + fill)} size={300} mood="cansado" arms="down" sweat={frame >= atRun - 6} accent={C.violet} />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 3
/** Paga, entrega a vassoura pra alguém, e o relógio acalma. */
export const Buyers: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const atPay = cue(s, 'Quem paga');
  const atHand = cue(s, 'se livrar');
  const atGood = cue(s, 'mais satisfeito');
  const atCalm = cue(s, 'menos o peso');
  const helper = spr(atPay + 4, { damping: 14 });
  const pass = spr(atHand, { damping: 18, stiffness: 80 });
  const coin = spr(atPay - 2, { damping: 12 });
  const speed = interpolate(frame, [atCalm - 4, atCalm + 18], [6, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const happy = frame >= atGood;
  const sweep = frame >= atHand + 12 ? Math.sin(frame / 4) * 14 : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 300, left: 190 }}>
        <Relogio t={frame} size={200} speed={speed} accent={frame >= atCalm ? GOLD : C.violet2} />
      </div>
      <div style={{ position: 'absolute', top: 600, left: 90 }}>
        <Pessoa t={frame} size={300} mood={happy ? 'feliz' : 'cansado'} arms={happy ? 'up' : frame >= atPay ? 'out' : 'down'} accent={C.violet} />
      </div>
      <div style={{ position: 'absolute', top: 560, left: 50 }}>
        <Brilho t={frame} size={380} on={ramp(frame, atGood, 10)} />
      </div>
      <div style={{ position: 'absolute', top: 760, left: 362, opacity: coin * (1 - pass) }}>
        <Moeda t={frame} size={80} />
      </div>
      <div style={{ position: 'absolute', top: 600, left: 620, opacity: helper, transform: `translateX(${(1 - helper) * 200}px)` }}>
        <Pessoa t={frame} size={300} seed={4} arms={pass > 0.5 ? 'out' : 'down'} mood="ok" accent={HELPER} skin="#8D5A3B" cap={GOLD} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 620,
          left: interpolate(pass, [0, 1], [330, 860]),
          transform: `rotate(${sweep}deg)`,
          transformOrigin: '50% 10%',
        }}
      >
        <Vassoura size={290} tilt={-10} />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 4
/** Pouca gente faz isso — cem pessoas, poucas acendem. Sem número na tela. */
export const Few: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const at = cue(s, 'pouca gente');
  const lit = Math.round(28 * ramp(frame, at, 24));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 300, left: 115, width: 850, display: 'flex', flexWrap: 'wrap', rowGap: 6 }}>
        {Array.from({ length: 100 }, (_, i) => {
          // as que acendem ficam espalhadas, não num bloco
          const on = (i * 37) % 100 < lit;
          return (
            <div key={i} style={{ width: 85, display: 'flex', justifyContent: 'center', opacity: ramp(frame, i * 0.2, 6) }}>
              <Pessoa t={frame} size={70} seed={i} still skin={SKINS[(i * 7) % SKINS.length]} accent={on ? GOLD : C.surface3} mood={on ? 'feliz' : 'ok'} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 5
const Panel: React.FC<{ x: number; from: number; win: number; lose: number; label: string; children: React.ReactNode }> = ({
  x,
  from,
  win,
  lose,
  label,
  children,
}) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const t = spr(from, { damping: 15 });
  return (
    <div
      style={{
        position: 'absolute',
        top: 330,
        left: x,
        width: 450,
        height: 640,
        borderRadius: 34,
        background: `linear-gradient(160deg, ${C.surface2} 0%, ${C.base} 100%)`,
        border: `3px solid ${win > 0 ? `rgba(255,200,61,${0.25 + 0.75 * win})` : C.borderStrong}`,
        boxShadow: `0 0 ${80 * win}px ${GOLD}55`,
        overflow: 'hidden',
        opacity: t * (1 - 0.45 * lose),
        transform: `translateY(${(1 - t) * 40}px) scale(${1 + 0.03 * win})`,
      }}
    >
      {children}
      <div style={{ position: 'absolute', top: 500, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 46, color: C.hi }}>{label}</div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            padding: '4px 22px 4px 8px',
            borderRadius: 999,
            background: C.base,
            border: `2px solid ${C.borderStrong}`,
            fontFamily: FONT.body,
            fontWeight: 800,
            fontSize: 30,
            color: C.gold2,
            opacity: ramp(frame, from + 12, 12),
          }}
        >
          <Moeda size={50} t={8} />
          mesmo dinheiro
        </div>
      </div>
    </div>
  );
};

/** O mesmo dinheiro: um compra tempo (a vassoura vai embora), o outro compra um objeto. */
export const Experiment: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const atTime = cue(s, 'comprou tempo');
  const atObject = cue(s, 'um objeto');
  const atWin = cue(s, 'menos apressado');
  const atMood = cue(s, 'melhor humor');
  const win = ramp(frame, atWin, 16);
  const gone = spr(atTime + 10, { damping: 20, stiffness: 70 });
  const bag = spr(atObject, { damping: 12 });
  const slow = interpolate(frame, [atWin - 4, atWin + 20], [5, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const chips = [
    { icon: 'leaf' as const, text: 'menos pressa', at: atWin },
    { icon: 'happy' as const, text: 'melhor humor', at: atMood },
  ];
  return (
    <AbsoluteFill>
      <Panel x={70} from={s.lead - 4} win={win} lose={0} label="Comprar tempo">
        <div style={{ position: 'absolute', top: 30, left: 150 }}>
          <Relogio t={frame} size={150} speed={slow} accent={win > 0.5 ? GOLD : C.violet2} />
        </div>
        <div style={{ position: 'absolute', top: 196, left: 60 }}>
          <Pessoa t={frame} size={220} arms={frame >= atMood ? 'up' : frame >= atTime ? 'out' : 'down'} mood={frame >= atMood ? 'feliz' : 'cansado'} accent={C.violet} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 210,
            left: 300,
            opacity: 1 - gone,
            transform: `translate(${gone * 260}px, ${-gone * 120}px) rotate(${gone * 40}deg)`,
          }}
        >
          <Vassoura size={250} tilt={-8} />
        </div>
      </Panel>
      {/* o objeto continua na tela, só perde o destaque — a ideia não é "objeto não presta" */}
      <Panel x={560} from={s.lead + 4} win={0} lose={win} label="Comprar um objeto">
        <div style={{ position: 'absolute', top: 30, left: 150 }}>
          <Relogio t={frame} size={150} speed={5} />
        </div>
        <div style={{ position: 'absolute', top: 196, left: 40 }}>
          <Pessoa t={frame} size={220} seed={3} arms="down" mood="ok" accent={C.surface3} skin="#8D5A3B" />
        </div>
        <div style={{ position: 'absolute', top: 300, left: 250, opacity: bag, transform: `scale(${0.6 + 0.4 * bag})` }}>
          <Sacola size={170} />
        </div>
      </Panel>
      <div style={{ position: 'absolute', top: 1010, left: 70, width: 450, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {chips.map((c) => {
          const t = spr(c.at, { damping: 14, stiffness: 150 });
          return (
            <div
              key={c.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 26px',
                borderRadius: 22,
                background: C.surface,
                border: `2px solid ${GOLD}55`,
                opacity: t,
                transform: `translateX(${(1 - t) * -30}px)`,
              }}
            >
              <Icon name={c.icon} size={46} color={GOLD} />
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 38, color: C.hi }}>{c.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 6
/** Domingo no sofá, lendo, enquanto alguém faz a faxina — a ideia aplicada uma vez. */
export const Try: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const atChore = cue(s, 'como a faxina');
  const atTest = cue(s, 'teste terceirizar');
  const sofa = spr(s.lead - 4, { damping: 16 });
  const helper = spr(atChore, { damping: 14 });
  const walk = Math.sin(frame / 18);
  return (
    <AbsoluteFill>
      <Kicker text="TESTE UMA VEZ" />
      {/* o chão da sala */}
      <div style={{ position: 'absolute', top: 1180, left: 60, right: 60, height: 6, borderRadius: 3, background: C.surface2 }} />
      {/* ajudante varrendo atrás do sofá, indo e voltando */}
      <div style={{ position: 'absolute', top: 880, left: 770 + walk * 50, opacity: helper, transform: `translateY(${(1 - helper) * 40}px)` }}>
        <Pessoa t={frame} size={230} seed={4} arms="out" mood="ok" accent={HELPER} skin="#8D5A3B" cap={GOLD} />
        <div style={{ position: 'absolute', top: 40, left: 170, transform: `rotate(${Math.sin(frame / 4) * 16}deg)`, transformOrigin: '50% 10%' }}>
          <Vassoura size={240} tilt={-14} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 820, left: 90, opacity: sofa, transform: `translateY(${(1 - sofa) * 30}px)` }}>
        <Sofa width={640} seatTop={-150}>
          <div style={{ position: 'relative', left: 170 }}>
            <Pessoa t={frame} size={260} mood="feliz" arms="none" accent={C.violet} />
            <div style={{ position: 'absolute', top: 160, left: 55, transform: 'rotate(-6deg)' }}>
              <Livro size={150} />
            </div>
          </div>
        </Sofa>
      </div>
      <div style={{ position: 'absolute', top: 700, left: 120 }}>
        <Brilho t={frame} size={420} on={ramp(frame, atTest, 10)} />
      </div>
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
  pressure: Pressure,
  buyers: Buyers,
  few: Few,
  experiment: Experiment,
  try: Try,
  do: Do,
};
