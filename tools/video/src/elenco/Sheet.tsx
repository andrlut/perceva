import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ACTIVE } from '../identidade/active';
import { PIECE_NAMES, Peca } from '../molde/Peca';
import { C, FONT, dimColor } from '../theme';
import { Moeda, Pensamento, Pessoa } from './cast';

// Folha de elenco: as pessoas (e as vistas de costas/espelhada da identidade
// ativa), o balão e TODAS as peças que um roteiro pode pedir, animando juntas,
// com o nome embaixo. As peças vêm do registro do molde (src/molde/Peca.tsx),
// então peça nova aparece aqui sozinha — a folha nunca fica pra trás.
const Cell: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: 206, height: 238 }}>
    <div style={{ height: 190, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{children}</div>
    <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 20, color: C.mid, marginTop: 10, letterSpacing: 2 }}>{name}</div>
  </div>
);

/** Tamanho de cada peça na folha (cabe na célula de 190 px; as altas e as largas encolhem). */
const SIZE: Record<string, number> = { cama: 190, computador: 180, celular: 200, lampada: 150, quadro: 150, caderno: 160, agenda: 160, caneta: 180, vassoura: 180, livro: 170, reservatorio: 140 };

export const ElencoSheet: React.FC = () => {
  const t = useCurrentFrame();
  const k = (Math.sin(t / 14) + 1) / 2;
  const Costas = ACTIVE.Costas;
  const Virada = ACTIVE.Virada;
  return (
    <AbsoluteFill style={{ background: C.deep, alignItems: 'center', paddingTop: 80 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 60, color: C.hi }}>Elenco Perceva</div>
      <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.dim, marginTop: 10 }}>
        {ACTIVE.name} · {PIECE_NAMES.length} peças
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: 1060, marginTop: 30 }}>
        <Cell name="PESSOA · ok">
          <Pessoa t={t} size={140} />
        </Cell>
        <Cell name="CANSADA">
          <Pessoa t={t} size={140} mood="cansado" accent={dimColor('health')} skin="#C68B5E" seed={2} />
        </Cell>
        <Cell name="FELIZ">
          <Pessoa t={t} size={140} mood="feliz" arms="up" accent={dimColor('bonds')} skin="#8D5A3B" seed={5} />
        </Cell>
        {Costas ? (
          <Cell name="DE COSTAS">
            <Costas t={t} size={140} seed={3} skin="#E0AC7E" accent="#4A4F8E" />
          </Cell>
        ) : null}
        {Virada ? (
          <Cell name="VIRADA">
            <Virada t={t} size={140} seed={1} arms="out" accent={dimColor('craft')} />
          </Cell>
        ) : null}
        <Cell name="PENSAMENTO">
          <Pensamento t={t % 90} size={200}>
            <Moeda t={t} size={46} />
          </Pensamento>
        </Cell>
        {PIECE_NAMES.map((name) => (
          <Cell key={name} name={name.toUpperCase()}>
            <Peca name={name} t={t} size={SIZE[name] ?? 160} progress={k} />
          </Cell>
        ))}
        <Cell name="ION:…">
          <Peca name="ion:people" t={t} size={160} accent={C.gold} />
        </Cell>
      </div>
    </AbsoluteFill>
  );
};
