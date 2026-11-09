// Os estilos de boneco v5 (um arquivo por estilo). A folha de comparação e o clip leem daqui.
import type { Estilo } from '../estilo';
import { esqueletoDebug } from './esqueleto-debug';
import { serie } from './serie';
import { traco } from './traco';
import { volume } from './volume';

export const ESTILOS: Record<string, Estilo> = {
  [esqueletoDebug.id]: esqueletoDebug,
  [traco.id]: traco,
  [serie.id]: serie,
  [volume.id]: volume,
};
