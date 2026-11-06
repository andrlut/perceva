// O formato que o render do tutorial lê: public/tour/<tour>.<lang>/spec.json,
// escrito pelo `node scripts/tour.mjs build` a partir de tools/video/tours/<tour>.json
// (bilíngue, revisado). Ver TOUR.md.
import type { Line, Scene } from '../timeline';
import type { Lang } from './screens/i18n';

/** wide = a tela inteira · focus = enquadra o alvo do destaque · hold = não mexe · número = zoom fixo no alvo */
export type CameraSpec = 'wide' | 'focus' | 'hold' | number;
/** tap = toca (a tela reage como o app) · hold = segura · point = só aponta · swipe = arrasta (rola) */
export type Action = 'tap' | 'hold' | 'point' | 'swipe';

/** Uma batida dentro da fala: acontece quando a voz chega em `at`. */
export type Beat = {
  /** deixa LITERAL da fala daquele idioma, ou "@start" (começo da fala) / "@end" (fim da fala) */
  at: string;
  /** segundos depois da deixa */
  after?: number;
  /** alvo do destaque (null apaga o destaque) */
  focus?: string | null;
  camera?: CameraSpec;
  do?: Action;
  /** alvo do dedo (padrão: o do destaque) */
  target?: string;
  /** rolagem: dp ou um alvo que sobe pra perto do topo */
  scroll?: number | string;
  /** mudança de estado direta (raro: o toque já muda o estado como o app muda) */
  set?: Record<string, unknown>;
  /** etiqueta curta junto do alvo (≤ 24) — null tira */
  callout?: string | null;
  /** o anel do destaque pulsa (o fecho no (i)) */
  pulse?: boolean;
  tone?: 'violet' | 'gold';
};

export type TourLine = Line & { title?: string; beats: Beat[] };
export type TourScene = Scene & { title?: string; beats: Beat[] };

export type TourSpec = {
  key: string;
  tour: string;
  /** a réplica (src/tutorial/screens) */
  screen: string;
  fixture: string;
  lang: Lang;
  /** sobrancelha dourada fixa (o nome da tela) */
  kicker: string;
  /** estado inicial além da fixture (ex.: { "goal": null }) */
  state?: Record<string, unknown>;
  /** sem voz: tempos estimados, sem áudio (só pra quadros de conferência) */
  silent: boolean;
  /** nome do mp4: doors/<file>.<lang>.r<rev>.mp4 */
  file: string;
  rev: number;
  posterAt?: number;
  style?: string;
  lines: TourLine[];
};
