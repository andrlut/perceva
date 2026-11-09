// "Animação de série" — o que a mão segura: halter, copo d'água, garrafinha.
// O copo ENCOSTA na boca: se a borda passa perto de j.boca, o copo gira (e escorrega um tico na
// mão) até a quina da borda pousar exatamente no lábio — o detalhe tátil que a cena pede.
import React from 'react';
import { type Forma, type Grupo, type P, LINHA, TINTA, Traco, add, capsula, clamp, dist, linha, mix, mul, norm, perp, sub, suave, sw } from './base';
import type { Ctx } from './ctx';
import { quadroMao } from './maos';

/** retângulo arredondado centrado em `c`, largura `w` ao longo de `u`, altura `h` no perpendicular */
function placa(c: P, u: P, w: number, h: number, r: number): string {
  const n = perp(u);
  const q = (x: number, y: number): P => add(add(c, mul(u, x)), mul(n, y));
  const a = w / 2;
  const b = h / 2;
  return suave([q(-a, -b + r), [...q(-a, -b), 1] as [number, number, 1], q(-a + r, -b), q(a - r, -b), [...q(a, -b), 1] as [number, number, 1], q(a, -b + r), q(a, b - r), [...q(a, b), 1] as [number, number, 1], q(a - r, b), q(-a + r, b), [...q(-a, b), 1] as [number, number, 1], q(-a, b - r)], true, 0.6);
}

export function halter(c: Ctx, i: 0 | 1): Grupo {
  const { M, t, sy } = quadroMao(c, i);
  const g = M(8.2, 0.4);
  const b = t;
  const k = sy;
  const at = (s: number): P => add(g, mul(b, s * k));
  const ferro = '#D9DDF2';
  const cab = '#59618F';
  const formas: Forma[] = [
    { d: capsula(at(-10.5), at(10.5), 1.3 * k, 1.3 * k), cor: ferro, k: 0.8 },
    { d: placa(at(-9.6), b, 5.6 * k, 11.6 * k, 1.8 * k), cor: cab, k: 2.6 },
    { d: placa(at(9.6), b, 5.6 * k, 11.6 * k, 1.8 * k), cor: cab, k: 2.6 },
  ];
  const faixa = (s: number) => {
    const n = perp(b);
    return linha([add(at(s), mul(n, 5.0 * k)), add(at(s), mul(n, -5.0 * k))]);
  };
  return {
    formas,
    linha: LINHA.dentro,
    depois: (
      <g>
        <Traco d={faixa(-9.6)} w={1.6 * k} cor={c.pessoa.cor} />
        <Traco d={faixa(9.6)} w={1.6 * k} cor={c.pessoa.cor} />
        <Traco d={linha([add(at(-11.0), mul(perp(b), -4.2 * k)), add(at(-11.0), mul(perp(b), 1.5 * k))])} w={0.9 * k} cor="#FFFFFF" op={0.5} />
        <Traco d={linha([add(at(8.2), mul(perp(b), -4.2 * k)), add(at(8.2), mul(perp(b), 1.5 * k))])} w={0.9 * k} cor="#FFFFFF" op={0.5} />
      </g>
    ),
  };
}

/**
 * Copo d'água. Embaixo, de pé na mão (eixo pro lado do polegar). Quando a mão chega na boca, a
 * BORDA pousa no lábio de baixo e o copo se alinha da boca pra pegada (a mão segura o corpo do
 * copo) — a transição é contínua pela distância, sem pulo. A água fica sempre horizontal.
 */
export function copo(c: Ctx, i: 0 | 1): Grupo {
  const { M, t, sy } = quadroMao(c, i);
  const k = sy;
  const g = M(7.4, 0.6);
  const alt = 17 * k;
  const r0 = 4.9 * k;
  const r1 = 6.3 * k;
  // de pé: borda pro lado do polegar, a pegada a 45% da altura
  const eixoPe = norm(t);
  const bordaPe = add(g, mul(eixoPe, alt * 0.55));
  // na boca: borda no lábio de baixo, eixo da pegada pra borda (o fundo pra fora do rosto)
  const labio: P = add(c.j.boca, [0.4 * k, 1.6 * k]);
  const dBoca = dist(g, labio);
  const kb = clamp((c.prop.mao * 1.15 - dBoca) / (c.prop.mao * 0.45));
  const eixoBoca = norm(sub(labio, g));
  const eixo = norm(add(mul(eixoPe, 1 - kb), mul(eixoBoca, kb)));
  const borda = add(mul(bordaPe, 1 - kb), mul(labio, kb));
  const base = sub(borda, mul(eixo, alt));
  const pt = (a: number, b: number): P => add(add(base, mul(eixo, a)), mul(perp(eixo), b));
  const corpo = suave([pt(0, -r0), pt(-0.6 * k, 0), pt(0, r0), [...pt(alt, r1), 1] as [number, number, 1], [...pt(alt, -r1), 1] as [number, number, 1]]);
  const id = c.pt.id('copo');
  // a água: superfície HORIZONTAL no mundo; com o copo inclinado ela escorre pra borda
  const nivel = pt(alt * (0.58 - 0.18 * kb), 0);
  const R = 60;
  const aguaEmbaixo = eixo[1] < 0;
  const agua = aguaEmbaixo
    ? `M${nivel[0] - R} ${nivel[1]} L${nivel[0] + R} ${nivel[1]} L${nivel[0] + R} ${nivel[1] + R} L${nivel[0] - R} ${nivel[1] + R} Z`
    : `M${nivel[0] - R} ${nivel[1]} L${nivel[0] + R} ${nivel[1]} L${nivel[0] + R} ${nivel[1] - R} L${nivel[0] - R} ${nivel[1] - R} Z`;
  const brilho = linha([pt(alt * 0.12, r0 * 0.55), pt(alt * 0.88, r1 * 0.6)]);
  const brilho2 = linha([pt(alt * 0.2, r0 * 0.25), pt(alt * 0.5, r1 * 0.32)]);
  const boca = suave([pt(alt, -r1), pt(alt + 1.1 * k, 0), pt(alt, r1), pt(alt - 1.1 * k, 0)]);
  return {
    formas: [{ d: corpo, cor: '#D6F3FF', sombra: null, op: 0.5 }],
    linha: LINHA.fino,
    depois: (
      <g>
        <clipPath id={id}>
          <path d={corpo} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <path d={agua} fill="#4DD0FF" opacity={0.75} />
          <path d={`M${nivel[0] - R} ${nivel[1]} L${nivel[0] + R} ${nivel[1]}`} stroke="#E6FAFF" style={sw(0.9 * k)} opacity={0.95} />
        </g>
        <path d={boca} fill="#E6FAFF" fillOpacity={0.35} stroke={TINTA} style={sw(LINHA.fino * 0.8)} />
        <Traco d={brilho} w={1.3 * k} cor="#FFFFFF" op={0.8} />
        <Traco d={brilho2} w={0.8 * k} cor="#FFFFFF" op={0.55} />
      </g>
    ),
  };
}

/** garrafinha de treino na mão de trás (extra 'garrafa') */
export function garrafa(c: Ctx, i: 0 | 1): Grupo {
  const { M, t, sy } = quadroMao(c, i);
  const k = sy;
  const g = M(8, 0.4);
  const ax = norm(t);
  const pt = (a: number, b: number): P => add(add(g, mul(ax, a)), mul(perp(ax), b));
  const corpo = suave([pt(-9, -3.6), pt(-9.6, 0), pt(-9, 3.6), pt(7, 3.6), pt(9, 2.4), pt(9, -2.4), pt(7, -3.6)]);
  const tampa = capsula(pt(9, 0), pt(12.5, 0), 2.2 * k, 2.2 * k);
  const cor = c.roupa.cima.cor2 ?? '#F4F5FF';
  return {
    formas: [
      { d: corpo, cor: mix(c.pessoa.cor, '#FFFFFF', 0.25), k: 1.6 },
      { d: tampa, cor, k: 1 },
    ],
    linha: LINHA.fino,
    depois: <Traco d={linha([pt(-3, -3.6), pt(-3, 3.6)])} w={LINHA.fino} />,
  };
}
