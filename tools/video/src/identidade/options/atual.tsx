// A pessoa de hoje (src/elenco/cast.tsx), como linha de base da comparação.
import React from 'react';
import { PessoaV0 } from '../../elenco/cast';
import type { IdentityOption, PessoaProps } from '../types';

// a de hoje não tem rosto focado (fase 3): lê como ok
const Pessoa: React.FC<PessoaProps> = ({ mood, ...p }) => <PessoaV0 {...p} mood={mood === 'focado' ? 'ok' : mood} />;

export const option: IdentityOption = {
  id: 'atual',
  name: 'Hoje',
  pitch: 'A pessoa atual do molde: cabeça redonda, corpo em cápsula, sem cabelo nem traço próprio.',
  Pessoa,
};
