// O que toda aba tem em volta do conteúdo: barra de status, a barra de abas
// flutuante (app/components/BottomNavBar.tsx) e a alça de gestos do Android.
// Tudo em dp, nas mesmas medidas do app.
import React from 'react';
import { Ion, Rect, at, textStyle, tokens } from '../ui';
import { naturalLine } from '../text';
import { Lang, tr } from './i18n';

/** Um celular Android de 411 dp (o do print de referência), mais baixo que o real
 *  pra caber no quadro 9:16 sem ficar estreito. */
export type Device = { w: number; h: number; statusBar: number; bottomInset: number };
export const DEVICE: Device = { w: 411, h: 760, statusBar: 24, bottomInset: 20 };

// ---------------------------------------------------------------- barra de abas

export const TAB_ORDER = ['index', 'rewards', 'character', 'learning', 'profile'] as const;
export type TabName = (typeof TAB_ORDER)[number];
const TAB_ICONS: Record<TabName, string> = { index: 'list', rewards: 'gift', character: 'person', learning: 'book', profile: 'settings' };
const TAB_LABEL: Record<TabName, string> = { index: 'tabs.tasks', rewards: 'tabs.rewards', character: 'tabs.hero', learning: 'tabs.learning', profile: 'tabs.settings' };

const BAR_MARGIN = 12;
const BAR_HEIGHT = 64;
const INDICATOR_W = 32;

/** paddingBottom que a aba reserva pra barra (useBottomNavClearance). */
export const navClearance = (d: Device) => BAR_HEIGHT + Math.max(d.bottomInset, 8) + 12;

export const navLayout = (d: Device) => {
  const bar: Rect = { x: BAR_MARGIN, y: d.h - Math.max(d.bottomInset, 8) - BAR_HEIGHT, w: d.w - BAR_MARGIN * 2, h: BAR_HEIGHT, r: 22 };
  // tabs dividem a largura interna (borda 1 + padding 6 de cada lado)
  const innerW = bar.w - 2 - 12;
  const tabW = innerW / TAB_ORDER.length;
  const tabs = TAB_ORDER.map((name, i) => ({
    name,
    rect: { x: bar.x + 1 + 6 + i * tabW, y: bar.y + 1 + (BAR_HEIGHT - 2 - 52) / 2, w: tabW, h: 52, r: 16 } as Rect,
  }));
  return { bar, tabs, tabW: (bar.w - 12) / TAB_ORDER.length };
};

export const BottomNav: React.FC<{ d: Device; lang: Lang; active: TabName; locked?: string[] }> = ({ d, lang, active, locked = [] }) => {
  const { bar, tabs, tabW } = navLayout(d);
  const idx = TAB_ORDER.indexOf(active);
  const indicatorX = 6 + idx * tabW + tabW / 2 - INDICATOR_W / 2;
  const labelH = 12;
  return (
    <div
      style={at(bar, {
        borderRadius: 22,
        background: tokens.bg.glassStrong,
        border: `1px solid ${tokens.border.strong}`,
        boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
      })}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: indicatorX,
          width: INDICATOR_W,
          height: 3,
          borderRadius: 2,
          background: tokens.brand.violet,
          boxShadow: `0 0 6px ${tokens.brand.violet}`,
        }}
      />
      {tabs.map(({ name, rect }) => {
        const focused = name === active;
        const color = focused ? tokens.brand.violet2 : tokens.text.dim;
        const top = (rect.h - (22 + 3 + labelH)) / 2;
        return (
          <div key={name} style={at({ ...rect, x: rect.x - bar.x - 1, y: rect.y - bar.y - 1 })}>
            <div style={{ position: 'absolute', top, left: (rect.w - 22) / 2, width: 22, height: 22 }}>
              <Ion name={TAB_ICONS[name]} size={22} color={color} />
              {locked.includes(name) ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -7,
                    width: 15,
                    height: 15,
                    borderRadius: 8,
                    background: tokens.bg.surface2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ion name="lock-closed" size={9} color={tokens.text.mid} />
                </div>
              ) : null}
            </div>
            <div
              style={{
                position: 'absolute',
                top: top + 22 + 3,
                left: 0,
                width: rect.w,
                textAlign: 'center',
                ...textStyle(10, focused ? 800 : 600, labelH, color, { letterSpacing: 0.2 }),
              }}
            >
              {tr(lang, TAB_LABEL[name])}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- barra de status + alça

export const StatusBar: React.FC<{ d: Device }> = ({ d }) => {
  const lh = naturalLine(12, 600);
  return (
    <div style={at({ x: 0, y: 0, w: d.w, h: d.statusBar }, { background: tokens.bg.deep })}>
      <div style={{ position: 'absolute', left: 18, top: (d.statusBar - lh) / 2, ...textStyle(12, 600, lh, tokens.text.hi) }}>9:41</div>
      <div style={{ position: 'absolute', right: 16, top: (d.statusBar - 13) / 2, display: 'flex', gap: 5, alignItems: 'center' }}>
        <Ion name="wifi" size={13} color={tokens.text.hi} />
        <Ion name="cellular" size={12} color={tokens.text.hi} />
        <Ion name="battery-full" size={16} color={tokens.text.hi} />
      </div>
    </div>
  );
};

export const GestureBar: React.FC<{ d: Device }> = ({ d }) =>
  d.bottomInset >= 12 ? (
    <div
      style={{
        position: 'absolute',
        left: (d.w - 108) / 2,
        top: d.h - d.bottomInset / 2 - 2,
        width: 108,
        height: 4,
        borderRadius: 2,
        background: 'rgba(242,243,255,0.55)',
      }}
    />
  ) : null;

/** Moldura de celular sem detalhe de aparelho: aro escuro arredondado em volta da tela. */
export const BEZEL = 9;
export const SCREEN_RADIUS = 34;
export const PhoneBezel: React.FC<{ d: Device }> = ({ d }) => (
  <div
    style={{
      position: 'absolute',
      left: -BEZEL,
      top: -BEZEL,
      width: d.w + BEZEL * 2,
      height: d.h + BEZEL * 2,
      borderRadius: SCREEN_RADIUS + BEZEL,
      background: 'linear-gradient(160deg, #2D3470 0%, #141938 60%)',
      boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10), 0 0 50px rgba(123,92,255,0.18)',
    }}
  />
);
