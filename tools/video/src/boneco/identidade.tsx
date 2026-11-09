// A identidade "v5" do molde: a Pessoa de todas as cenas desenhada pelo boneco v5 (o estilo vem do
// spec, `boneco: "serie"`). Entra no IdentityContext no lugar da ativa quando o spec liga o v5.
import type { IdentityOption, PessoaProps } from '../identidade/types';
import { PessoaV5 } from './naCaixa';

export const identidadeV5: IdentityOption = {
  id: 'v5',
  name: 'Boneco v5',
  pitch: 'Corpo de adulto com juntas, roupa que sai da cena, rosto que fala (o estilo vem do spec).',
  Pessoa: (p: PessoaProps) => <PessoaV5 {...p} />,
  // a pessoa espelhada é a mesma (o v5 não tem marca no peito pra não inverter): sem Virada o cenário
  // usa scaleX(-1), que serve; sem Costas o cenário cobre a frente — o v5 de costas fica pra depois
  halo: false,
  frenteElenco: true,
};
