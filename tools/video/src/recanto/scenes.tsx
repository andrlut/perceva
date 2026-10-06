import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Footnote, Header, Icon, Phone, Rich, fadeUp, ramp } from '../components';
import { Glyph } from '../Glyph';
import { C, FONT, LAYOUT, dimColor } from '../theme';
import { Scene, cue, speechEnd } from '../timeline';

// Vídeo do Recanto (v2, pós-revisão de 2026-10-06). Rótulos de tela copiados
// de app/lib/i18n/locales/pt.ts e da BottomNavBar; ideias, títulos de
// material e fontes conferidos no catálogo (só materiais da janela grátis).
type P = { s: Scene };

const useSpr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
    spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120, mass: 1, ...config } });
};

const img = (name: string) => staticFile(`img/${name}.webp`);

/** Citação legível no celular (a pesquisa é a prova do "ideias com fonte"). */
const Cite: React.FC<{ text: string; from: number; top?: number }> = ({ text, from, top = 1318 }) => (
  <Footnote text={text} from={from} top={top} size={30} color={C.text} />
);

// Ideia SEM vídeo em PT (no app, ideia com vídeo abre pelo vídeo 9:16, não pela imagem).
const AGENDA = {
  image: 'idea-friendship-3',
  title: 'Ninguém briga, a amizade morre de agenda',
  claim: 'Depois de uma mudança de vida, escolha duas pessoas e reserve horas fixas com elas.',
  sources: ['Roberts & Dunbar, 2015 · Human Nature · n=25, 18 meses', 'Sander, Schupp & Richter, 2017 · Developmental Psychology · n=36.716'],
  header: 'Vínculos · Ideia 3 de 3',
  color: dimColor('bonds'),
};
// Explorar: as duas primeiras seguram o tempo de leitura; as outras passam rápido.
const EXPLORE = [
  { image: 'idea-awe', title: 'Uma caminhada pode treinar a admiração?', material: 'Uma caminhada pra sentir admiração', n: '1 DE 1' },
  { image: 'idea-bids', title: 'O “olha isso” do parceiro é um pedido de quê?', material: 'Bids: o pedido de atenção que passa batido', n: '1 DE 2' },
  { image: 'idea-hobby-2', title: 'Hobby uma vez por semana já conta', material: 'Hobby e depressão depois dos 50', n: '2 DE 2' },
  { image: 'idea-pinknoise', title: 'Um som pode turbinar a limpeza cerebral do sono', material: 'Ruído rosa cronometrado e a limpeza cerebral', n: '1 DE 1' },
  { image: 'idea-friendship', title: 'Amizade não se faz em três cafés', material: 'A amizade cobra em horas', n: '1 DE 3' },
];
const STORY_FRAMES = [32, 32, 8, 8, 8];
const REREAD = {
  image: 'idea-reread',
  material: 'A sensação de aprender mente',
  title: 'Reler parece aprender. Uma semana depois, não.',
  claim: 'Feche o livro e tente puxar da memória o que leu, mesmo errando. É o esforço que grava.',
  color: dimColor('mind'),
};

/** Duas barras comparadas (mesma linguagem do Manifesto). */
const Bars: React.FC<{ at: number; cols: { pct: number; label: string; color: string }[] }> = ({ at, cols }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const MAXH = 600;
  const base = 1160;
  const xs = [300, 780];
  return (
    <>
      {cols.map((c, i) => {
        const start = at + i * 8;
        const t = spr(start, { damping: 18, stiffness: 110 });
        const h = (c.pct / 100) * MAXH * t;
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
              {Math.round(c.pct * ramp(frame, start, 22))}%
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
                top: base + 26,
                textAlign: 'center',
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 38,
                color: C.hi,
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

/**
 * Card de ideia como o IdeaCard do app: frente = imagem 4:5 com o título no
 * TOPO (degradê em cima) e moldura fina na cor da área; verso = a frase.
 */
const IdeaCardFlip: React.FC<{
  width: number;
  image: string;
  title: string;
  claim: string;
  color: string;
  flip: number;
  absorbed?: boolean;
  style?: React.CSSProperties;
}> = ({ width, image, title, claim, color, flip, absorbed = false, style }) => {
  const height = width * 1.25;
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 34,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    border: `3px solid ${absorbed ? C.gold : `${color}AA`}`,
    boxShadow: absorbed ? `0 0 60px ${C.gold}55` : '0 30px 90px rgba(0,0,0,0.5)',
  };
  return (
    <div style={{ width, height, perspective: 2200, ...style }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${flip * 180}deg)` }}>
        <div style={face}>
          <Img src={img(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0.94) 0%, rgba(10,14,38,0.55) 30%, rgba(10,14,38,0) 55%)' }} />
          <div style={{ position: 'absolute', left: width * 0.07, right: width * 0.07, top: width * 0.07 }}>
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
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: width * 0.082, lineHeight: 1.16, color: C.hi }}>{claim}</div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================== 1
/** Gancho: uma parede de posts salvos, todos já marcados. Tente lembrar de um. */
export const Hook: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const forgetAt = cue(s, 'Um só');
  const forget = ramp(frame, forgetAt, 18);
  const tints = ['#3F2B8F', '#12506B', '#5B3CE0', '#1F1655', '#2D3470', '#4B2FCC', '#6B2F5F', '#1E4D5C'];
  return (
    <AbsoluteFill>
      <Header title="Salvo pra ler *depois*." size={84} from={-20} />
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 72, color: C.gold, opacity: 1 - forget * 0.7 }}>
        <Icon name="bookmark" size={64} color={C.gold} style={{ verticalAlign: -6, marginRight: 16 }} />
        {Math.round(interpolate(frame, [0, forgetAt], [318, 347], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))} salvos
      </div>
      {Array.from({ length: 12 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        // posts genéricos (bloco de cor + linhas de texto) — nunca o acervo do Recanto
        const lines = [0.9, 0.7, 0.85, 0.5].slice(0, 2 + (i % 3));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 130 + col * 210,
              top: 470 + row * 262,
              width: 190,
              height: 238,
              borderRadius: 18,
              overflow: 'hidden',
              background: `linear-gradient(160deg, ${tints[i % tints.length]} 0%, ${tints[(i + 3) % tints.length]} 100%)`,
              opacity: 1 - forget * 0.82,
              filter: `blur(${forget * 7}px)`,
              transform: `scale(${1 - forget * 0.06}) translateY(${Math.sin((frame + i * 9) / 18) * 3}px)`,
            }}
          >
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 18 }}>
              {lines.map((w, k) => (
                <div key={k} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: 'rgba(255,255,255,0.28)', marginTop: 10 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <Icon name="bookmark" size={34} color={C.gold} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          top: 600,
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
/** Salvar não é aprender: print de uma obra × só olhar (Lurie, Fabrizio & Westerman 2025). */
export const Save: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const at = cue(s, 'quem tirou');
  return (
    <AbsoluteFill>
      <Header title="Salvar não é *aprender*." size={86} />
      <div style={{ position: 'absolute', top: 410, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: C.gold, ...fadeUp(frame, at - 6, 12, 12) }}>
        QUANTO LEMBRARAM DA OBRA
      </div>
      <Bars
        at={at}
        cols={[
          { pct: 76, label: 'só olhou', color: C.violet2 },
          { pct: 54, label: 'tirou print', color: C.dim },
        ]}
      />
      <Cite text="Lurie, Fabrizio & Westerman · Memory & Cognition, 2025" from={at} />
    </AbsoluteFill>
  );
};

// ===================================================================== 3
/** Reler engana: sensação de saber × lembrar de fato (Roediger & Karpicke 2006, Exp. 1). */
export const Reread: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const weekAt = cue(s, 'Uma semana');
  const aAt = cue(s, 'quem tentou');
  const bAt = cue(s, 'Quem só releu');
  const phase1 = 1 - ramp(frame, weekAt - 4, 10);
  return (
    <AbsoluteFill>
      <Header title="Reler *engana*." size={96} />
      <div style={{ position: 'absolute', top: 560, left: 140, right: 140, opacity: phase1 * ramp(frame, s.lead - 2, 10) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          <Icon name="refresh" size={70} color={C.text} style={{ transform: `rotate(${frame * 8}deg)` }} />
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.hi }}>leu e releu</span>
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.mid, marginBottom: 16 }}>sensação de que sabe</div>
        <div style={{ height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${92 * ramp(frame, s.lead, 40)}%`, borderRadius: 17, background: `linear-gradient(90deg, ${C.violet} 0%, ${C.gold2} 100%)` }} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...fadeUp(frame, weekAt, 10, 16) }}>
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
            fontSize: 34,
            color: C.text,
          }}
        >
          <Icon name="calendar" size={36} color={C.gold} /> uma semana depois
        </div>
      </div>
      {[
        { at: aAt, pct: '56%', label: 'tentou lembrar', color: C.gold2, x: 290 },
        { at: bAt, pct: '42%', label: 'só releu', color: C.dim, x: 790 },
      ].map((c) => (
        <div key={c.label} style={{ position: 'absolute', top: 730, left: c.x - 230, width: 460, textAlign: 'center', ...fadeUp(frame, c.at, 12, 30) }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 180, lineHeight: 1, color: c.color, letterSpacing: -4 }}>{c.pct}</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.hi, marginTop: 18 }}>{c.label}</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: C.mid, marginTop: 8 }}>do texto</div>
        </div>
      ))}
      <Cite text="Roediger & Karpicke · Psychological Science, 2006" from={weekAt} />
    </AbsoluteFill>
  );
};

// ===================================================================== 4
const TABS = [
  { icon: 'list' as const, label: 'Práticas' },
  { icon: 'gift' as const, label: 'Recompensas' },
  { icon: 'person' as const, label: 'Eu' },
  { icon: 'book' as const, label: 'Aprender' },
  { icon: 'settings' as const, label: 'Ajustes' },
];
const COVERS = ['friendship-hours', 'bids-for-connection', 'awe-walk-vastness-novelty', 'hobbies-depression-older-adults'];

/** A aba Aprender abre o Recanto; a lâmpada conta as ideias que esperam revisão. */
export const Recanto: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const waitAt = cue(s, 'Ela espera');
  const badge = spr(waitAt, { damping: 9, stiffness: 160 });
  const pulse = 0.5 + Math.sin(frame / 6) * 0.5;
  return (
    <AbsoluteFill>
      <Header title="o *Recanto*" size={96} />
      <Phone width={660} height={900} top={460} style={{ ...fadeUp(frame, 0, 16, 60) }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 54, color: C.hi, flex: 1 }}>Recanto</div>
          {/* lâmpada: abre Minhas ideias; o selo dourado conta o que espera revisão */}
          <div
            style={{
              position: 'relative',
              width: 76,
              height: 76,
              borderRadius: 999,
              background: 'rgba(36,42,88,0.85)',
              border: `2px solid ${badge > 0.5 ? C.gold : C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: badge > 0.5 ? `0 0 ${30 + pulse * 20}px rgba(255,200,61,0.5)` : 'none',
            }}
          >
            <Icon name="bulb" size={40} color={badge > 0.5 ? C.gold2 : C.mid} />
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 36,
                height: 36,
                borderRadius: 18,
                background: C.gold,
                color: C.deep,
                fontFamily: FONT.body,
                fontWeight: 800,
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${badge})`,
              }}
            >
              3
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 22,
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
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: C.hi, margin: '26px 0 14px', ...fadeUp(frame, 14, 12, 20) }}>Novidades do mês</div>
        <div style={{ display: 'flex', gap: 14, transform: `translateX(${-ramp(frame, 24, 70) * 110}px)` }}>
          {COVERS.map((slug, i) => (
            <div key={slug} style={{ flexShrink: 0, ...fadeUp(frame, 16 + i * 4, 12, 20) }}>
              <Img src={img(`cover-${slug}`)} style={{ width: 160, height: 240, objectFit: 'cover', borderRadius: 16, border: '2px solid rgba(255,255,255,0.1)' }} />
            </div>
          ))}
        </div>
        {/* barra de abas real: 5 abas, a ativa em violeta */}
        <div
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            height: 96,
            borderRadius: 28,
            background: 'rgba(26,31,68,0.97)',
            border: `1.5px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}
        >
          {TABS.map((tab) => {
            const active = tab.label === 'Aprender';
            return (
              <div key={tab.label} style={{ width: 118, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
                {active ? (
                  <div style={{ position: 'absolute', top: -14, width: 46, height: 5, borderRadius: 3, background: C.violet2, boxShadow: `0 0 ${10 + pulse * 14}px ${C.violet2}` }} />
                ) : null}
                <Icon name={tab.icon} size={active ? 38 : 32} color={active ? C.violet2 : C.dim} />
                <span style={{ fontFamily: FONT.body, fontWeight: active ? 800 : 600, fontSize: active ? 22 : 17, color: active ? C.violet2 : C.dim }}>{tab.label}</span>
              </div>
            );
          })}
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 5
/** A tela da ideia: imagem → título → a frase → fontes (rolagem real, de cima pra baixo). */
export const Idea: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const imgAt = cue(s, 'uma imagem');
  const claimAt = cue(s, 'a resposta');
  const srcAt = cue(s, 'a fonte');
  // uma rolagem só: a partir da frase, frase e fontes ficam juntas na tela
  const scroll = interpolate(frame, [claimAt - 8, claimAt + 16], [0, 560], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const imgGlow = ramp(frame, imgAt - 2, 8) * (1 - ramp(frame, claimAt - 6, 8));
  const claimGlow = ramp(frame, claimAt, 8) * (1 - ramp(frame, srcAt, 8) * 0.6);
  const srcGlow = ramp(frame, srcAt - 2, 8);
  return (
    <AbsoluteFill>
      <Header title="Imagem. Frase. *Fonte.*" size={84} />
      <Phone width={660} height={900} top={460} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130, zIndex: 1, background: `linear-gradient(180deg, ${C.base} 72%, rgba(14,18,48,0) 100%)` }} />
        <div style={{ position: 'absolute', top: 54, left: 30, right: 30, zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: `${AGENDA.color}26` }}>
            <Icon name="people" size={26} color={AGENDA.color} />
            <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 24, color: AGENDA.color }}>{AGENDA.header}</span>
          </div>
          <div style={{ flex: 1 }} />
          <Icon name="close" size={36} color={C.mid} />
        </div>
        <div style={{ position: 'absolute', top: 120, left: 30, right: 30, transform: `translateY(${-scroll}px)` }}>
          <div style={{ borderRadius: 26, overflow: 'hidden', height: 600, outline: `5px solid rgba(255,224,138,${imgGlow})`, outlineOffset: 6 }}>
            <Img src={img(AGENDA.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 46, lineHeight: 1.1, color: C.hi, marginTop: 28 }}>{AGENDA.title}</div>
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
            <div style={{ width: 6, borderRadius: 3, background: AGENDA.color, flexShrink: 0 }} />
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, lineHeight: 1.3, color: C.hi }}>{AGENDA.claim}</div>
          </div>
          {[0.95, 0.88, 0.7].map((w, k) => (
            <div key={k} style={{ height: 16, width: `${w * 100}%`, borderRadius: 8, background: 'rgba(255,255,255,0.10)', marginTop: k === 0 ? 26 : 14 }} />
          ))}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AGENDA.sources.map((src, k) => (
              <div
                key={src}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 18px',
                  borderRadius: 18,
                  background: 'rgba(36,42,88,0.85)',
                  border: `2px solid ${srcGlow > 0.5 ? C.gold2 : C.borderStrong}`,
                  boxShadow: srcGlow > 0.5 ? '0 0 34px rgba(255,224,138,0.35)' : 'none',
                  opacity: 0.6 + 0.4 * ramp(frame, srcAt - 2 + k * 4, 8),
                }}
              >
                <Icon name="library" size={30} color={C.gold2} />
                <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, lineHeight: 1.25, color: C.text }}>{src}</span>
              </div>
            ))}
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 6
/** O Explorar em stories e o fim da série. */
export const Five: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const starts = STORY_FRAMES.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + STORY_FRAMES[i - 1]], []);
  const storiesEnd = starts[4] + STORY_FRAMES[4];
  const endAt = Math.max(storiesEnd, cue(s, 'Continuar') - 4);
  let idx = 0;
  for (let i = 0; i < 5; i++) if (frame >= starts[i]) idx = i;
  const within = Math.min(1, (frame - starts[idx]) / STORY_FRAMES[idx]);
  const endCard = ramp(frame, endAt, 10);
  const story = EXPLORE[idx];
  return (
    <AbsoluteFill>
      <Header title="Para em *cinco*." size={96} />
      <Phone width={620} height={900} top={460} bleed style={{ ...fadeUp(frame, 0, 10, 50) }}>
        <Img src={img(story.image)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + within * 0.03})` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,38,0.55) 0%, rgba(10,14,38,0) 25%, rgba(10,14,38,0) 42%, rgba(10,14,38,0.96) 100%)' }} />
        <div style={{ position: 'absolute', top: 64, left: 26, right: 26, display: 'flex', gap: 8 }}>
          {EXPLORE.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${i < idx ? 100 : i === idx ? within * 100 : 0}%`, background: C.hi }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 36, right: 36, bottom: 150 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: C.gold2 }}>IDEIA {story.n}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 56, lineHeight: 1.08, color: C.hi, marginTop: 12 }}>{story.title}</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.mid, marginTop: 12 }}>{story.material}</div>
        </div>
        <div style={{ position: 'absolute', left: 36, right: 36, bottom: 50, display: 'flex', gap: 14 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 999, border: `2px solid ${C.borderStrong}`, fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: C.hi }}>Ler completo</div>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 999, background: C.hi, fontFamily: FONT.body, fontWeight: 800, fontSize: 24, color: C.deep }}>Abrir ideia</div>
        </div>
        {/* fim da série: painel opaco (nada vaza por trás) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: C.deep,
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
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: C.mid }}>5 conteúdos vistos</div>
          <div style={{ marginTop: 26, padding: '18px 36px', borderRadius: 999, border: `2px solid ${C.gold}88`, fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: C.gold2 }}>Continuar · mais 5</div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 7
/** Absorver: o card do fim da ideia vira e a ideia entra na revisão. */
export const Absorb: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const tapAt = cue(s, 'você vira');
  const flip = spr(tapAt + 4, { damping: 16, stiffness: 90 });
  const absorbed = frame > tapAt + 14;
  const W = 540;
  return (
    <AbsoluteFill>
      <Header title="Vire o card. *Absorva a ideia.*" size={72} />
      <div style={{ position: 'absolute', top: 430, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {[0, 1, 2].map((i) => {
          const gold = i < 2 || absorbed; // ideias 1 e 2 já absorvidas; esta é a 3 de 3
          return <div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: gold ? C.gold : 'rgba(255,255,255,0.2)', boxShadow: i === 2 && absorbed ? `0 0 20px ${C.gold}` : 'none' }} />;
        })}
      </div>
      <IdeaCardFlip
        width={W}
        image={AGENDA.image}
        title={AGENDA.title}
        claim={AGENDA.claim}
        color={AGENDA.color}
        flip={flip}
        absorbed={absorbed}
        style={{ position: 'absolute', top: 490, left: (LAYOUT.W - W) / 2, ...fadeUp(frame, 0, 14, 40) }}
      />
      <div
        style={{
          position: 'absolute',
          left: 540 - 70,
          top: 830 - 70,
          width: 140,
          height: 140,
          borderRadius: 999,
          border: `4px solid ${C.hi}`,
          opacity: (1 - ramp(frame, tapAt, 14)) * ramp(frame, tapAt - 3, 3),
          transform: `scale(${0.5 + ramp(frame, tapAt, 14)})`,
        }}
      />
      <div style={{ position: 'absolute', top: 1200, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
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
            fontSize: 32,
            color: absorbed ? C.gold2 : C.text,
          }}
        >
          {absorbed ? (
            <>
              <Icon name="checkmark" size={34} color={C.gold2} /> Absorvida
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
/** Revisar ideias: título na frente, resposta atrás. O jeito de usar: tentar lembrar antes de virar. */
export const Review: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const spr = useSpr();
  const thinkAt = cue(s, 'Antes de virar');
  const flipAt = Math.max(thinkAt + 34, speechEnd(s) + 4);
  const flip = spr(flipAt, { damping: 16, stiffness: 90 });
  const W = 460;
  return (
    <AbsoluteFill>
      <Header title="Na revisão, só o *título*." size={80} />
      <Phone width={660} height={900} top={460} style={{ ...fadeUp(frame, 0, 14, 60) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: C.hi }}>Revisar ideias</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: C.mid }}>1 de 3</div>
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.mid, marginTop: 8 }}>{REREAD.material}</div>
        <div style={{ position: 'absolute', top: 214, left: (600 - W) / 2 + 10, width: W - 20, height: (W - 20) * 1.25, borderRadius: 34, background: C.surface, opacity: 0.6, transform: 'scale(0.96) translateY(18px)' }} />
        <div style={{ position: 'absolute', top: 204, left: (600 - W) / 2 }}>
          <IdeaCardFlip width={W} image={REREAD.image} title={REREAD.title} claim={REREAD.claim} color={REREAD.color} flip={flip} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 800,
            display: 'flex',
            justifyContent: 'center',
            opacity: ramp(frame, thinkAt, 8) * (1 - ramp(frame, flipAt, 8)),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 999, background: 'rgba(123,92,255,0.25)', border: `2px solid ${C.violet2}` }}>
            <Icon name="bulb" size={32} color={C.gold2} />
            <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: C.hi }}>tente lembrar{'.'.repeat(1 + (Math.floor(frame / 8) % 3))}</span>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 9
/** Anotar: o que você combinou com você mesmo. */
export const Note: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const typeAt = cue(s, 'o que você combinou');
  const text = 'Quinta à noite é da Ju e do Léo. Fixo.';
  const shown = Math.floor(interpolate(frame, [typeAt - 6, typeAt + 34], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const sheet = ramp(frame, 2, 14);
  return (
    <AbsoluteFill>
      <Header title="Uma nota *só sua*." size={84} />
      <Phone width={660} height={900} top={460} bleed style={{ ...fadeUp(frame, 0, 12, 50) }}>
        <Img src={img(AGENDA.image)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,38,0.6)' }} />
        <div style={{ position: 'absolute', top: 110, left: 36, right: 36, fontFamily: FONT.display, fontWeight: 600, fontSize: 46, lineHeight: 1.1, color: C.hi, opacity: 0.85 }}>{AGENDA.title}</div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '30px 34px 44px',
            borderRadius: '40px 40px 0 0',
            background: C.surface,
            borderTop: `1.5px solid ${C.borderStrong}`,
            transform: `translateY(${(1 - sheet) * 520}px)`,
          }}
        >
          <div style={{ width: 70, height: 7, borderRadius: 4, background: C.faint, margin: '0 auto 24px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="create" size={36} color={C.gold2} />
            <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.hi }}>Sua nota</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: C.mid, marginTop: 10 }}>O que você combinou com você mesmo?</div>
          <div
            style={{
              marginTop: 22,
              minHeight: 170,
              padding: 24,
              borderRadius: 22,
              background: C.base,
              border: `2px solid ${C.violet}88`,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 36,
              lineHeight: 1.35,
              color: C.hi,
            }}
          >
            {text.slice(0, shown)}
            <span style={{ opacity: Math.floor(frame / 12) % 2 === 0 ? 1 : 0, color: C.violet2 }}>|</span>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

// ===================================================================== 10
/** Ler ≠ lembrar ≠ fazer — e, sem voz, o gatilho de envio. */
export const Close: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  const words = [
    { w: 'ler', icon: 'book' as const, at: cue(s, 'ler'), color: C.text },
    { w: 'lembrar', icon: 'bulb' as const, at: cue(s, 'lembrar'), color: C.violet2 },
    { w: 'fazer', icon: 'checkmark-circle' as const, at: cue(s, 'fazer'), color: C.gold2 },
  ];
  const sendAt = speechEnd(s) + 8;
  return (
    <AbsoluteFill>
      {words.map((x, i) => (
        <React.Fragment key={x.w}>
          {i > 0 ? (
            <div style={{ position: 'absolute', top: 400 + i * 270 - 110, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.display, fontWeight: 600, fontSize: 104, color: C.gold, opacity: ramp(frame, x.at - 4, 8) }}>≠</div>
          ) : null}
          <div style={{ position: 'absolute', top: 400 + i * 270, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, ...fadeUp(frame, x.at, 12, 30) }}>
            <Icon name={x.icon} size={104} color={x.color} />
            <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 140, color: x.color, letterSpacing: -3 }}>{x.w}</span>
          </div>
        </React.Fragment>
      ))}
      <div
        style={{
          position: 'absolute',
          top: 1250,
          left: 70,
          right: 170,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.2,
          color: C.hi,
          ...fadeUp(frame, sendAt, 14, 24),
        }}
      >
        <Icon name="paper-plane" size={52} color={C.gold2} style={{ verticalAlign: -8, marginRight: 14 }} />
        <Rich text="Não salva. *Manda pra quem salva tudo.*" />
      </div>
    </AbsoluteFill>
  );
};

// ===================================================================== 11
/** Assinatura: o nome que se procura na loja é Perceva. */
export const Tagline: React.FC<P> = ({ s }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Glyph size={260} cx={540} cy={470} rings={ramp(frame, 0, 26)} path={ramp(frame, 10, 26)} glow={0.9} />
      <div style={{ position: 'absolute', top: 690, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, s.lead, 14, 24) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 104, letterSpacing: 14, color: C.hi }}>PERCEVA</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 56, color: C.gold2, marginTop: 18 }}>Recanto · aba Aprender</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 36, color: C.mid, marginTop: 14 }}>ideias com fonte, uma por vez</div>
      </div>
      <div style={{ position: 'absolute', top: 1120, left: 0, right: 0, textAlign: 'center', ...fadeUp(frame, cue(s, 'Perceva'), 14, 20) }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 44, color: C.hi }}>Baixa no Android</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 34, color: C.mid, marginTop: 10 }}>iPhone: entra na lista</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: C.gold, marginTop: 30 }}>link na bio</div>
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
