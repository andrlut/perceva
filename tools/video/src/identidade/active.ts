// A identidade que o Elenco usa em todos os vídeos (molde e elenco).
// Trocar a linha abaixo troca o rosto de todo mundo, sem mexer em cena:
//   gente          → Gente de verdade, olho com a íris violeta do logo
//   gente-natural  → a mesma gente, olho de cor natural
// As outras opções e a comparação ficam em src/identidade (node scripts/identidade.mjs).
// O tipo é o contrato (IdentityOption): as vistas `Costas` e `Virada` são
// opcionais, então qualquer opção entra aqui sem mexer no cenário.
import { option } from './options/gente';
import type { IdentityOption } from './types';

export const ACTIVE: IdentityOption = option;
