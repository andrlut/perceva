import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Mesmas fontes do app (Manrope) e do site/capas (Fraunces), copiadas de
// tools/social/fonts; Ionicons é a fonte de ícones do app.
const faces: { family: string; file: string; weight: string }[] = [
  { family: 'Manrope', file: 'Manrope_500Medium.ttf', weight: '500' },
  { family: 'Manrope', file: 'Manrope_600SemiBold.ttf', weight: '600' },
  { family: 'Manrope', file: 'Manrope_700Bold.ttf', weight: '700' },
  { family: 'Manrope', file: 'Manrope_800ExtraBold.ttf', weight: '800' },
  { family: 'Fraunces', file: 'Fraunces_600.ttf', weight: '600' },
  { family: 'Ionicons', file: 'Ionicons.ttf', weight: '400' },
];

export const fontsReady = Promise.all(
  faces.map((f) =>
    loadFont({ family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight }),
  ),
);
