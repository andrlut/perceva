// Boneco v5 — o Boneco (pose → juntas → desenho do estilo, no lugar e no tamanho certos) e as
// folhas de comparação dos estilos (node scripts/boneco.mjs <estilo>):
//   BonecoElenco  → o elenco de rua + a mesma pessoa vestida pela cena
//   BonecoAcoes   → fazendo (correr, saltar, rosca, beber, alongar, pensar) + o dedo na pele + humores
//   BonecoClip    → 5 s: tiro de corrida no parque (chão andando) e o dedo na bochecha no banheiro
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { type Humor, type Pose, alturaDe, fk } from './esqueleto';
import { type Contexto, type Pessoa, type Roupa, PESSOAS, pessoa as pessoaDe, roupaDe } from './elenco';
import { type Acao, type PoseOpts, SEGURA, poseDe } from './poses';
import type { Estilo } from './estilo';
import { ESTILOS } from './estilos';
import { parque } from '../molde/lugares/parque';
import { banheiro } from '../molde/lugares/banheiro';
import type { EnvP, Lugar } from '../molde/ambientes';

export type BonecoProps = {
  estilo: Estilo;
  pessoa: Pessoa;
  roupa: Roupa;
  acao: Acao;
  /** quadro da AÇÃO (cada boneco da folha tem o seu) */
  t: number;
  opts?: PoseOpts;
  humor?: Humor;
  /** altura de pé, em px */
  altura: number;
  /** x do meio e y da linha dos pés, em px */
  x: number;
  y: number;
  luz?: string;
  uid: string;
  /** pose pronta (ignora `acao`) */
  pose?: Pose;
  sombra?: boolean;
};

/** Um boneco no quadro: calcula a pose, as juntas, o toque e chama o desenho do estilo. */
export const Boneco: React.FC<BonecoProps> = ({ estilo, pessoa, roupa, acao, t, opts, humor = 'ok', altura, x, y, luz, uid, pose: poseIn, sombra = true }) => {
  const prop = estilo.propDe(pessoa);
  const H = alturaDe(prop);
  const pose = poseIn ?? poseDe(acao, t, prop, opts);
  const j = fk(prop, pose);
  const s = altura / H;
  // caixa: sobra pra braço levantado e salto em cima, e pros lados
  const top = -H * 1.45;
  const w = H * 1.1;
  // o dedo na bochecha: a força vem da pose (Pose.aperto), o ponto do esqueleto
  const toque = acao === 'tocarRosto' && (j.mao[1] === 'aponta' || j.marca > 0) ? { ponto: j.bochecha, forca: j.aperto, marca: j.marca } : undefined;
  const elev = Math.max(0, -(pose.y ?? 0));
  return (
    <svg
      style={{ position: 'absolute', left: x - (w / 2) * s, top: y + top * s, overflow: 'visible' }}
      width={w * s}
      height={(-top + H * 0.08) * s}
      viewBox={`${-w / 2} ${top} ${w} ${-top + H * 0.08}`}
    >
      {sombra && (
        <ellipse
          cx={j.pelvis[0]}
          cy={H * 0.006}
          rx={prop.ombros * (1.25 - Math.min(0.5, elev / H))}
          ry={H * 0.018}
          fill="#05071A"
          opacity={0.45 - Math.min(0.25, elev / H)}
        />
      )}
      <g transform={j.espelho ? 'scale(-1 1)' : undefined}>
        <estilo.Desenho j={j} pessoa={pessoa} roupa={roupa} humor={humor} t={t} uid={uid} luz={luz} segura={SEGURA[acao]} toque={toque} />
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ folhas

const Titulo: React.FC<{ estilo: Estilo; sub: string }> = ({ estilo, sub }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', padding: '0 60px' }}>
    <div style={{ fontFamily: FONT.display, fontSize: 64, color: C.hi, fontWeight: 600 }}>{estilo.nome}</div>
    <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mid, marginTop: 10, lineHeight: 1.35 }}>{estilo.descricao}</div>
    <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.gold, marginTop: 14, letterSpacing: 4, fontWeight: 700 }}>{sub}</div>
  </div>
);

const Rotulo: React.FC<{ y: number; children: React.ReactNode }> = ({ y, children }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT.body, fontSize: 22, letterSpacing: 5, fontWeight: 700, color: C.dim }}>{children}</div>
);

const Legenda: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <div style={{ position: 'absolute', left: x - 140, width: 280, top: y, textAlign: 'center', fontFamily: FONT.body, fontSize: 21, color: C.mid }}>{children}</div>
);

const Chao: React.FC<{ y: number }> = ({ y }) => <div style={{ position: 'absolute', left: 40, right: 40, top: y, height: 2, background: 'rgba(255,255,255,0.06)' }} />;

const FUNDO = `radial-gradient(120% 80% at 50% 30%, ${C.surface} 0%, ${C.base} 55%, ${C.deep} 100%)`;

export type FolhaProps = { estilo: string };
const estiloDe = (id: string): Estilo => {
  const e = ESTILOS[id];
  if (!e) throw new Error(`estilo desconhecido: ${id} (tem: ${Object.keys(ESTILOS).join(', ')})`);
  return e;
};

/** Folha 1: o elenco na roupa de rua + Marina vestida pela cena. */
export const BonecoElenco: React.FC<FolhaProps> = ({ estilo: id }) => {
  const f = useCurrentFrame();
  const e = estiloDe(id);
  const linha1 = PESSOAS.slice(0, 4);
  const linha2 = PESSOAS.slice(4, 8);
  const marina = pessoaDe('marina');
  const ctx: [Contexto, string, Acao][] = [
    ['esporte', 'esporte · parque', 'parado'],
    ['casa', 'casa · cozinha', 'parado'],
    ['trabalho', 'trabalho · escritório', 'parado'],
    ['dormir', 'dormir · quarto', 'parado'],
  ];
  const ALT = 330;
  return (
    <AbsoluteFill style={{ background: FUNDO }}>
      <Titulo estilo={e} sub="ELENCO E ROUPA PELA CENA" />
      <Rotulo y={330}>O ELENCO · ROUPA DE RUA</Rotulo>
      {[linha1, linha2].map((linha, r) => (
        <React.Fragment key={r}>
          <Chao y={760 + r * 440} />
          {linha.map((p, i) => {
            const x = 135 + i * 270;
            const y = 760 + r * 440;
            return (
              <React.Fragment key={p.id}>
                <Boneco estilo={e} pessoa={p} roupa={roupaDe(p, 'rua')} acao="parado" t={f + i * 17} opts={{ vista: i % 2 ? 'tres-quartos' : 'frente', espelho: i === 3 }} humor={i === 1 ? 'feliz' : 'ok'} altura={ALT} x={x} y={y} uid={`e${r}${i}`} />
                <Legenda x={x} y={y + 14}>{p.nome}</Legenda>
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
      <Rotulo y={1270}>A MESMA PESSOA · A ROUPA SAI DA CENA</Rotulo>
      <Chao y={1740} />
      {ctx.map(([c, nome, acao], i) => {
        const x = 135 + i * 270;
        return (
          <React.Fragment key={c}>
            <Boneco estilo={e} pessoa={marina} roupa={roupaDe(marina, c)} acao={acao} t={f + i * 11} opts={{ vista: 'tres-quartos' }} humor={c === 'dormir' ? 'cansado' : 'ok'} altura={360} x={x} y={1740} uid={`m${i}`} />
            <Legenda x={x} y={1754}>{nome}</Legenda>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/** Folha 2: fazendo + o dedo na pele + humores. */
export const BonecoAcoes: React.FC<FolhaProps> = ({ estilo: id }) => {
  const f = useCurrentFrame();
  const e = estiloDe(id);
  // [pessoa, contexto, ação, quadro da ação (o momento que lê melhor), opts, legenda]
  const acoes: [string, Contexto, Acao, number, PoseOpts, string][] = [
    ['bia', 'esporte', 'correr', 4, { vista: 'tres-quartos', ritmo: 'rapido' }, 'tiro de corrida'],
    ['caio', 'esporte', 'saltar', 20, { vista: 'tres-quartos' }, 'salto'],
    ['theo', 'esporte', 'rosca', 18, { vista: 'tres-quartos' }, 'série de força'],
    ['lucia', 'casa', 'beber', 26, { vista: 'tres-quartos' }, 'beber'],
    ['antonio', 'esporte', 'alongar', 10, { vista: 'frente' }, 'alongar'],
    ['rafa', 'trabalho', 'pensar', 12, { vista: 'tres-quartos' }, 'pensar'],
  ];
  const ALT = 330;
  const humores: Humor[] = ['ok', 'feliz', 'cansado', 'focado', 'surpresa'];
  const marina = pessoaDe('marina');
  return (
    <AbsoluteFill style={{ background: FUNDO }}>
      <Titulo estilo={e} sub="FAZENDO · O DEDO NA PELE · HUMOR" />
      <Rotulo y={330}>FAZENDO</Rotulo>
      {acoes.map(([pid, c, acao, ta, o, leg], i) => {
        const r = Math.floor(i / 3);
        const x = 180 + (i % 3) * 360;
        const y = 790 + r * 420;
        const p = pessoaDe(pid);
        return (
          <React.Fragment key={i}>
            {i % 3 === 0 && <Chao y={y} />}
            <Boneco estilo={e} pessoa={p} roupa={roupaDe(p, c)} acao={acao} t={ta + f * 0} opts={o} humor={acao === 'rosca' || acao === 'correr' ? 'focado' : acao === 'pensar' ? 'ok' : 'feliz'} altura={ALT} x={x} y={y} uid={`a${i}`} />
            <Legenda x={x} y={y + 14}>{leg}</Legenda>
          </React.Fragment>
        );
      })}
      <Rotulo y={1250}>O DEDO NA PELE · HUMOR</Rotulo>
      {/* close: o boneco grande, cortado no peito (o recorte é a caixa) */}
      <div style={{ position: 'absolute', left: 60, top: 1300, width: 420, height: 560, overflow: 'hidden', borderRadius: 28, background: C.surface }}>
        <Boneco estilo={e} pessoa={marina} roupa={roupaDe(marina, 'casa')} acao="tocarRosto" t={18} opts={{ vista: 'frente' }} humor="ok" altura={1250} x={210} y={1375} uid="toque" sombra={false} />
      </div>
      {humores.map((h, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = 590 + col * 150 + (row ? 75 : 0);
        const top = 1310 + row * 280;
        return (
          <div key={h} style={{ position: 'absolute', left: cx - 70, top, width: 140, height: 220, overflow: 'hidden', borderRadius: 22, background: C.surface }}>
            <Boneco estilo={e} pessoa={PESSOAS[(i + 1) % PESSOAS.length]} roupa={roupaDe(PESSOAS[(i + 1) % PESSOAS.length], 'rua')} acao="parado" t={f + i * 7} opts={{ vista: 'frente' }} humor={h} altura={640} x={70} y={690} uid={`h${i}`} sombra={false} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center', fontFamily: FONT.body, fontSize: 19, color: C.mid }}>{h}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ clip

const envDe = (t: number, anda?: { v: number; d: number }): EnvP => ({
  t,
  clear: [330, 750],
  gente: 'nenhuma',
  hora: 'dia',
  accent: C.violet,
  desk: false,
  noLeft: false,
  noRight: false,
  busy: [],
  show: [],
  view: [0, 0, 1080, 1920],
  ...(anda ? { anda } : {}),
});

/** O lugar inteiro, sem o desfoque das camadas (a proposta: fundo nítido e vivo). */
const LugarNitido: React.FC<{ lugar: Lugar; p: EnvP; parte: 'fundo' | 'frente' }> = ({ lugar, p, parte }) =>
  parte === 'fundo' ? (
    <>
      <AbsoluteFill>
        <lugar.back {...p} />
      </AbsoluteFill>
      <AbsoluteFill>
        <lugar.mid {...p} />
      </AbsoluteFill>
    </>
  ) : (
    <AbsoluteFill style={{ filter: 'blur(3px) brightness(0.8)' }}>
      <lugar.front {...p} />
    </AbsoluteFill>
  );

/** 5 s: o tiro de corrida no parque (o chão anda) e o dedo na bochecha no banheiro. */
export const BonecoClip: React.FC<FolhaProps> = ({ estilo: id }) => {
  const f = useCurrentFrame();
  const e = estiloDe(id);
  if (f < 75) {
    const bia = pessoaDe('bia');
    const p = envDe(f, { v: 1, d: f / 15 });
    return (
      <AbsoluteFill style={{ background: C.deep }}>
        <LugarNitido lugar={parque} p={p} parte="fundo" />
        <Boneco estilo={e} pessoa={bia} roupa={roupaDe(bia, 'esporte')} acao="correr" t={f} opts={{ vista: 'tres-quartos', ritmo: 'rapido' }} humor="focado" altura={720} x={540} y={1420} uid="clip-bia" luz={C.goldLight} />
        <LugarNitido lugar={parque} p={p} parte="frente" />
        <Etiqueta texto={e.nome} />
      </AbsoluteFill>
    );
  }
  const marina = pessoaDe('marina');
  const t = f - 75;
  const p = envDe(f);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <LugarNitido lugar={banheiro} p={p} parte="fundo" />
      <Boneco estilo={e} pessoa={marina} roupa={roupaDe(marina, 'casa')} acao="tocarRosto" t={t} opts={{ vista: 'frente' }} humor="ok" altura={2300} x={540} y={1920 + 2300 * 0.42} uid="clip-marina" sombra={false} />
      <Etiqueta texto={e.nome} />
    </AbsoluteFill>
  );
};

const Etiqueta: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center' }}>
    <span style={{ fontFamily: FONT.body, fontSize: 30, fontWeight: 700, color: C.hi, background: 'rgba(10,14,38,0.55)', padding: '10px 26px', borderRadius: 40 }}>{texto}</span>
  </div>
);
