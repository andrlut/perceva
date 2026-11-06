import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, FONT, dimColor } from '../theme';
import { Casa, Celular, Moeda, Pensamento, Pessoa, Relogio, Sacola } from './cast';
import { Agenda, Caneca, Caneta, Envelope, Monitor, Papelada, Planta, Quadro } from './objetos';

// Folha de elenco: personagens e objetos-padrão animando juntos, com nome embaixo.
const Cell: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: 260, height: 300 }}>
    {children}
    <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: C.mid, marginTop: 14, letterSpacing: 2 }}>{name}</div>
  </div>
);

export const ElencoSheet: React.FC = () => {
  const t = useCurrentFrame();
  const k = (Math.sin(t / 14) + 1) / 2;
  return (
    <AbsoluteFill style={{ background: C.deep, alignItems: 'center', paddingTop: 110 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 64, color: C.hi }}>Elenco Perceva</div>
      <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.dim, marginTop: 12 }}>amostra de estilo · v2</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: 1060, marginTop: 40 }}>
        <Cell name="PESSOA · ok"><Pessoa t={t} size={160} /></Cell>
        <Cell name="PESSOA · cansada"><Pessoa t={t} size={160} mood="cansado" accent={dimColor('health')} skin="#C68B5E" seed={2} /></Cell>
        <Cell name="PESSOA · feliz"><Pessoa t={t} size={160} mood="feliz" accent={dimColor('bonds')} skin="#8D5A3B" seed={5} /></Cell>
        <Cell name="CASA"><Casa size={200} lit={k} /></Cell>
        <Cell name="RELÓGIO · pressa"><Relogio t={t} size={190} speed={4} /></Cell>
        <Cell name="PENSAMENTO"><Pensamento t={t % 90} size={240}><Moeda t={t} size={56} /></Pensamento></Cell>
        <Cell name="MOEDA"><Moeda t={t} size={160} /></Cell>
        <Cell name="CELULAR"><Celular size={210} glow={k} /></Cell>
        <Cell name="SACOLA"><Sacola size={190} /></Cell>
        <Cell name="QUADRO"><Quadro size={190} progress={(t % 90) / 60} /></Cell>
        <Cell name="CANECA"><Caneca t={t} size={160} /></Cell>
        <Cell name="PLANTA"><Planta t={t} size={210} /></Cell>
        <Cell name="CANETA"><Caneta size={200} progress={k} /></Cell>
        <Cell name="AGENDA"><Agenda size={190} progress={(t % 90) / 60} /></Cell>
        <Cell name="MONITOR"><Monitor t={t} size={220} progress={k} /></Cell>
        <Cell name="PAPELADA"><Papelada size={200} /></Cell>
        <Cell name="ENVELOPE"><Envelope t={t} size={200} /></Cell>
      </div>
    </AbsoluteFill>
  );
};
