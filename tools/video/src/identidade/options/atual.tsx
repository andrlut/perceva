// A pessoa de hoje (src/elenco/cast.tsx), como linha de base da comparação.
import { PessoaV0 as Pessoa } from '../../elenco/cast';
import type { IdentityOption } from '../types';

export const option: IdentityOption = {
  id: 'atual',
  name: 'Hoje',
  pitch: 'A pessoa atual do molde: cabeça redonda, corpo em cápsula, sem cabelo nem traço próprio.',
  Pessoa,
};
