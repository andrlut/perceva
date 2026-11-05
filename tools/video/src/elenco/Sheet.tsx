import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT, dimColor } from '../theme';
import { Casa, Celular, Moeda, Pensamento, Pessoa, Relogio, Sacola } from './cast';

// Folha de elenco: todas as peças-padrão animando juntas, com nome embaixo.
const Cell: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: 340, height: 400 }}>
    {children}
    <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.mid, marginTop: 18, letterSpacing: 2 }}>{name}</div>
  </div>
);

export const ElencoSheet: React.FC = () => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.deep, alignItems: 'center', paddingTop: 140 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.hi }}>Elenco Perceva</div>
      <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.dim, marginTop: 12 }}>amostra de estilo · v0</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: 1040, marginTop: 60 }}>
        <Cell name="PESSOA · ok"><Pessoa t={t} size={200} /></Cell>
        <Cell name="PESSOA · cansada"><Pessoa t={t} size={200} mood="cansado" accent={dimColor('health')} skin="#C68B5E" seed={2} /></Cell>
        <Cell name="PESSOA · feliz"><Pessoa t={t} size={200} mood="feliz" accent={dimColor('bonds')} skin="#8D5A3B" seed={5} /></Cell>
        <Cell name="CASA"><Casa size={250} lit={(Math.sin(t / 12) + 1) / 2} /></Cell>
        <Cell name="RELÓGIO · pressa"><Relogio t={t} size={230} speed={4} /></Cell>
        <Cell name="PENSAMENTO"><Pensamento t={t % 90} size={300}><Moeda t={t} size={70} /></Pensamento></Cell>
        <Cell name="MOEDA"><Moeda t={t} size={190} /></Cell>
        <Cell name="CELULAR"><Celular size={260} glow={(Math.sin(t / 9) + 1) / 2} /></Cell>
        <Cell name="SACOLA (objeto)"><Sacola size={230} /></Cell>
      </div>
    </AbsoluteFill>
  );
};
