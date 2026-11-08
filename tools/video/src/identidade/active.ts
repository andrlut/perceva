// A identidade que o Elenco usa em todos os vídeos (molde e elenco).
// Trocar a linha abaixo troca o rosto de todo mundo, sem mexer em cena:
//   hexa-limpo     → Hexa Limpo (padrão desde 2026-11-07: o André aprovou o piloto do caderno com ele)
//   gente          → Gente de verdade (descartada como padrão em 2026-11-07)
// As outras opções e a comparação ficam em src/identidade (node scripts/identidade.mjs).
// O tipo é o contrato (IdentityOption): as vistas `Costas` e `Virada` são
// opcionais, então qualquer opção entra aqui sem mexer no cenário.
import { hexaLimpo } from './options/hexa';
import type { IdentityOption } from './types';

export const ACTIVE: IdentityOption = hexaLimpo;
