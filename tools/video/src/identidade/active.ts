// A identidade que o Elenco usa em todos os vídeos (molde e elenco).
// Trocar a linha abaixo troca o rosto de todo mundo, sem mexer em cena:
//   gente          → Gente de verdade, olho com a íris violeta do logo
//   gente-natural  → a mesma gente, olho de cor natural
// As outras opções e a comparação ficam em src/identidade (node scripts/identidade.mjs).
import { option } from './options/gente';

export const ACTIVE = option;
