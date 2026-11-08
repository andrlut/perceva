import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Mesmas fontes do app (Manrope) e do site/capas (Fraunces), copiadas de
// tools/social/fonts; Ionicons é a fonte de ícones do app.
//
// Fraunces itálico (requinte, fase 2 — 2026-11-07): a variável itálica oficial do Google Fonts
// (github.com/google/fonts, ofl/fraunces, licença SIL OFL 1.1 em public/fonts/Fraunces-OFL.txt).
// Só o itálico: a reta continua sendo a Fraunces_600 estática de sempre, então nada do que já foi
// aprovado muda de desenho. Usada onde o texto é "à mão" (os nomes escritos no caderno).
const faces: { family: string; file: string; weight: string; style?: string }[] = [
  { family: 'Manrope', file: 'Manrope_500Medium.ttf', weight: '500' },
  { family: 'Manrope', file: 'Manrope_600SemiBold.ttf', weight: '600' },
  { family: 'Manrope', file: 'Manrope_700Bold.ttf', weight: '700' },
  { family: 'Manrope', file: 'Manrope_800ExtraBold.ttf', weight: '800' },
  { family: 'Fraunces', file: 'Fraunces_600.ttf', weight: '600' },
  { family: 'Fraunces', file: 'Fraunces_Italic_var.ttf', weight: '100 900', style: 'italic' },
  { family: 'Ionicons', file: 'Ionicons.ttf', weight: '400' },
];

export const fontsReady = Promise.all(
  faces.map((f) =>
    loadFont({ family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight, ...(f.style ? { style: f.style } : {}) }),
  ),
);
