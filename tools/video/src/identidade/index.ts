// Registro das opções de identidade. Cada designer escreve só options/<id>.tsx.
import { option as atual } from './options/atual';
import { option as aura } from './options/aura';
import { option as feijao } from './options/feijao';
import { option as gente, optionNatural as genteNatural } from './options/gente';
import { option as hex } from './options/hex';
import { hexaCor, hexaLimpo, hexaMascote } from './options/hexa';
import { option as iris } from './options/iris';
import type { IdentityOption } from './types';

export const OPTIONS: IdentityOption[] = [atual, hex, iris, aura, gente, genteNatural, feijao, hexaLimpo, hexaMascote, hexaCor];
