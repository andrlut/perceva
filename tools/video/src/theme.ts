// Tokens da marca — espelho de app/theme/tokens.ts e app/theme/dimensions.ts.
// Se o app mudar uma cor, mude aqui também (o vídeo não importa do app pra
// não puxar React Native pro bundle do Remotion).

export const C = {
  deep: '#0A0E26',
  base: '#0E1230',
  surface: '#1A1F44',
  surface2: '#232958',
  surface3: '#2D3470',
  hi: '#F2F3FF',
  text: '#D9DBFA',
  mid: '#9AA0D4',
  dim: '#6E74A8',
  faint: '#4A4F7A',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  violet: '#7B5CFF',
  violet2: '#9B82FF',
  violetDeep: '#4B2FCC',
  gold: '#FFC83D',
  gold2: '#FFE08A',
  goldLight: '#FFE3A6',
  goldDeep: '#C8881C',
  xp: '#3DD68C',
} as const;

export type DimId = 'health' | 'body' | 'mind' | 'wealth' | 'bonds' | 'craft';

// Ordem do hexágono do app (DIMENSION_ORDER) e rótulos canônicos do playbook.
export const DIMS: { id: DimId; label: string; color: string; icon: string }[] = [
  { id: 'health', label: 'Saúde', color: '#FF6B7A', icon: 'heart' },
  { id: 'body', label: 'Corpo', color: '#FF8A3D', icon: 'fitness' },
  { id: 'mind', label: 'Mente', color: '#B07BFF', icon: 'sparkles' },
  { id: 'wealth', label: 'Prosperidade', color: '#FFC83D', icon: 'cash' },
  { id: 'bonds', label: 'Vínculos', color: '#4DD0FF', icon: 'people' },
  { id: 'craft', label: 'Ofício', color: '#2EC4B6', icon: 'color-palette' },
];

export const dimColor = (id: DimId) => DIMS.find((d) => d.id === id)!.color;
export const dimIndex = (id: DimId) => DIMS.findIndex((d) => d.id === id);

export const FONT = {
  body: 'Manrope',
  display: 'Fraunces',
  icon: 'Ionicons',
} as const;

// Grade vertical do quadro 9:16 (1080×1920). O rodapé de 320 px fica livre
// pra interface do Reels/TikTok; a legenda mora logo acima dela.
export const LAYOUT = {
  W: 1080,
  H: 1920,
  titleTop: 190,
  stageTop: 470,
  stageBottom: 1370,
  footnoteY: 1392,
  captionTop: 1468,
} as const;
