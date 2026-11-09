// Os lugares da fase 3. Quem registra é o scenes.tsx (`registerLugares(LUGARES)` no topo do módulo);
// o ambientes.tsx nunca importa daqui (sem ciclo). Lugar novo: um arquivo nesta pasta que exporta
// um `Lugar`, a chave aqui, o nome em AmbienteKind (spec.ts) e em catalog.json → ambientes.
import type { AmbienteKind } from '../spec';
import type { Lugar } from '../ambientes';
import { academia } from './academia';
import { banheiro } from './banheiro';
import { cozinha } from './cozinha';
import { parque } from './parque';

export const LUGARES: Partial<Record<AmbienteKind, Lugar>> = { cozinha, banheiro, parque, academia };
