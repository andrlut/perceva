// Qual identidade desenha o Elenco NESTE vídeo. O padrão é a ativa (active.ts);
// um render de comparação troca por props (`identity` no Molde / Porta, ou
// `node scripts/molde.mjs render --identity <id>`), sem mexer em active.ts.
import { createContext, useContext } from 'react';
import { ACTIVE } from './active';
import type { IdentityOption } from './types';

export const IdentityContext = createContext<IdentityOption>(ACTIVE);
export const useIdentity = () => useContext(IdentityContext);
