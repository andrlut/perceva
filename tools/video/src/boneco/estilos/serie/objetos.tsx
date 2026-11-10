// "Animação de série" — o que a mão segura: halter, copo d'água, coqueteleira, garrafinha.
// O copo ENCOSTA na boca: se a borda passa perto de j.boca, o copo gira (e escorrega um tico na
// mão) até a quina da borda pousar exatamente no lábio — o detalhe tátil que a cena pede.
import React from 'react';
import { type Forma, type Grupo, type P, LINHA, Traco, add, capsula, clamp, contornoDe, dist, linha, mix, mul, norm, perp, sub, suave, sw } from './base';
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

/**
 * Halter de verdade (rodada 6, revisor: o de ~45 px lia "celular"): barra cromada, colar dourado,
 * DUAS anilhas grafite de cada lado (a de dentro maior), tampa cromada na ponta — ~50 un de
 * comprimento e anilha de ~27 un (≥ 120 px no quadro do molde). Atravessa a mão no lado do polegar;
 * os dedos fecham por cima (a mão é desenhada depois).
 */
export function halter(c: Ctx, i: 0 | 1): Grupo {
  const { M, t } = quadroMao(c, i);
  const g = M(8.2, 0.4);
  const b = norm(t);
  const n = perp(b);
  // 1,25× o desenho de base: ~58 un de comprimento e anilha de ~34 (≥ 120 px no quadro de 1080)
  const E = 1.25;
  const at = (s: number): P => add(g, mul(b, s * E));
  const ferro = '#D9DDF2';
  const grafite = '#2E3247';
  const grafite2 = '#3B4160';
  const borda = '#8A90B8';
  const formas: Forma[] = [{ d: capsula(at(-23.5), at(23.5), 1.55 * E, 1.55 * E), cor: ferro, k: 0.9 }];
  for (const s of [-1, 1]) {
    formas.push({ d: placa(at(s * 12.6), b, 6.4 * E, 27 * E, 2.2 * E), cor: grafite, k: 3, linhaCor: borda });
    formas.push({ d: placa(at(s * 18.4), b, 5.2 * E, 20.5 * E, 2 * E), cor: grafite2, k: 2.4, linhaCor: borda });
    formas.push({ d: placa(at(s * 22.2), b, 2.4 * E, 7.5 * E, 0.9 * E), cor: ferro, k: 0.8 });
    formas.push({ d: placa(at(s * 8.5), b, 2.4 * E, 6.2 * E, 0.8 * E), cor: '#FFC83D', k: 0.8, linhaCor: '#9A6A12' });
  }
  const risco = (s: number, a: number, b0: number) => linha([add(at(s), mul(n, a * E)), add(at(s), mul(n, b0 * E))]);
  return {
    formas,
    linha: LINHA.dentro,
    depois: (
      <g>
        <Traco d={risco(-14.6, -11, 4)} w={1.0} cor="#FFFFFF" op={0.32} />
        <Traco d={risco(10.6, -11, 4)} w={1.0} cor="#FFFFFF" op={0.32} />
        <Traco d={risco(-19.8, -8, 3)} w={0.8} cor="#FFFFFF" op={0.28} />
        <Traco d={risco(17.0, -8, 3)} w={0.8} cor="#FFFFFF" op={0.28} />
      </g>
    ),
  };
}

/**
 * O que se segura e se leva à boca: o COPO d'água (40% maior que antes, pra ler na mão) e a
 * COQUETELEIRA (garrafa de shaker: corpo laranja da área Corpo, rosca grafite, tampa com bico, sem
 * marca). Embaixo fica de pé na mão (eixo pro lado do polegar). Quando a mão chega na boca, a borda
 * do copo (ou o BICO da coqueteleira) pousa no lábio de baixo e a peça se alinha da boca pra pegada
 * — contínuo pela distância, sem pulo. A água do copo fica sempre horizontal.
 */
function recipiente(c: Ctx, i: 0 | 1, tipo: 'copo' | 'coqueteleira' | 'suco'): Grupo {
  const { M, t } = quadroMao(c, i);
  const shaker = tipo === 'coqueteleira';
  const g = M(7.4, 0.6);
  // copo: 24 de altura (era 17); coqueteleira: ~0,75 da cabeça
  const alt = shaker ? 42 : 24;
  const pega = shaker ? 0.34 : 0.45; // fração da altura onde a mão segura
  const eixoPe = norm(t);
  const topoPe = add(g, mul(eixoPe, alt * (1 - pega)));
  const labio: P = add(c.j.boca, [0.5, 1.9]);
  const dBoca = dist(g, labio);
  const alcance = alt * (1 - pega);
  const kb = clamp((alcance + c.prop.mao * 0.5 - dBoca) / (c.prop.mao * 0.55));
  const eixoBoca = norm(sub(labio, g));
  const eixo = norm(add(mul(eixoPe, 1 - kb), mul(eixoBoca, kb)));
  const topo = add(mul(topoPe, 1 - kb), mul(labio, kb));
  const base = sub(topo, mul(eixo, alt));
  const pt = (a: number, b: number): P => add(add(base, mul(eixo, a)), mul(perp(eixo), b));
  const q = (a: number, b: number) => [...pt(a, b), 1] as [number, number, 1];
  if (shaker) {
    // de baixo pra cima: corpo (0–29), rosca (29–33), tampa em cúpula (33–39), bico (39–42)
    const corpoD = suave([pt(0, -7.0), pt(-0.6, 0), pt(0, 7.0), q(29, 7.7), q(29, -7.7)]);
    const rosca = suave([q(28.6, -8.5), q(28.6, 8.5), q(33.2, 8.5), q(33.2, -8.5)]);
    const tampa = suave([q(33, -8.0), q(33, 8.0), pt(36.6, 7.2), pt(38.8, 3.8), pt(39.4, 0), pt(38.8, -3.8), pt(36.6, -7.2)]);
    const bico = capsula(pt(38.2, 1.4), pt(41.2, 1.9), 1.5, 1.15);
    const laranja = '#FF8A3D';
    return {
      formas: [
        { d: corpoD, cor: laranja, k: 3 },
        { d: rosca, cor: '#2B2F45', k: 1.2, linhaCor: '#7E85B0' },
        { d: tampa, cor: laranja, k: 2 },
        { d: bico, cor: '#2B2F45', k: 0.6, linhaCor: '#7E85B0' },
      ],
      linha: LINHA.dentro,
      depois: (
        <g>
          {/* marcas de medida (sem marca de fabricante) e o brilho do lado da luz */}
          {[7, 12, 17, 22].map((a) => (
            <Traco key={a} d={linha([pt(a, -5.6), pt(a, a % 2 ? -2.6 : -3.8)])} w={0.75} cor="#FFF1E4" op={0.85} />
          ))}
          <Traco d={linha([pt(3, 4.4), pt(26, 4.8)])} w={1.6} cor="#FFFFFF" op={0.35} />
          {[-5, -2, 1, 4].map((b0) => (
            <Traco key={`r${b0}`} d={linha([pt(29.2, b0), pt(32.6, b0)])} w={0.5} cor="#7E85B0" op={0.8} />
          ))}
          <Traco d={linha([pt(34.2, 5.4), pt(37.6, 3.4)])} w={0.9} cor="#FFFFFF" op={0.35} />
        </g>
      ),
    };
  }
  const r0 = 6.8;
  const r1 = 8.8;
  const corpo = suave([pt(0, -r0), pt(-0.8, 0), pt(0, r0), q(alt, r1), q(alt, -r1)]);
  const id = c.pt.id('copo');
  // a água: superfície HORIZONTAL no mundo; com o copo inclinado ela escorre pra borda
  const nivel = pt(alt * (0.58 - 0.18 * kb), 0);
  const R = 80;
  const aguaEmbaixo = eixo[1] < 0;
  const agua = aguaEmbaixo
    ? `M${nivel[0] - R} ${nivel[1]} L${nivel[0] + R} ${nivel[1]} L${nivel[0] + R} ${nivel[1] + R} L${nivel[0] - R} ${nivel[1] + R} Z`
    : `M${nivel[0] - R} ${nivel[1]} L${nivel[0] + R} ${nivel[1]} L${nivel[0] + R} ${nivel[1] - R} L${nivel[0] - R} ${nivel[1] - R} Z`;
  const brilho = linha([pt(alt * 0.12, r0 * 0.55), pt(alt * 0.88, r1 * 0.6)]);
  // a colher do mexer (Pose.colher): o cabo sai pela boca do copo e gira em círculo — é o que diz
  // "misture" sem precisar de outra mão (só com o copo em pé, longe da boca)
  const fase = c.j.colher;
  const colher =
    fase !== undefined && i === 1 && kb < 0.05
      ? (() => {
          const a = fase * Math.PI * 2;
          const fundo = pt(alt * 0.32, Math.cos(a) * r0 * 0.45);
          const cabo = pt(alt + 9, Math.sin(a) * r1 * 0.55 + r1 * 0.2);
          return (
            <g>
              {/* rodada 2: o traço fino lia canudo — cabo grosso de metal e a ponta alargada pra fora */}
              <Traco d={linha([fundo, cabo])} w={4.2} cor="#2B2F45" op={0.95} />
              <Traco d={linha([fundo, cabo])} w={2.6} cor="#E4E9F7" op={1} />
              <circle cx={cabo[0]} cy={cabo[1]} r={2.6} fill="#E4E9F7" stroke="#2B2F45" strokeWidth={1.1} />
            </g>
          );
        })()
      : null;
  const brilho2 = linha([pt(alt * 0.2, r0 * 0.25), pt(alt * 0.5, r1 * 0.32)]);
  const boca = suave([pt(alt, -r1), pt(alt + 1.5, 0), pt(alt, r1), pt(alt - 1.5, 0)]);
  return {
    formas: [{ d: corpo, cor: '#D6F3FF', sombra: null, op: 0.55 }],
    linha: LINHA.dentro,
    depois: (
      <g>
        <clipPath id={id}>
          <path d={corpo} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <path d={agua} fill={tipo === 'suco' ? '#FF9F3D' : '#4DD0FF'} opacity={tipo === 'suco' ? 0.92 : 0.8} />
          <path d={`M${nivel[0] - R} ${nivel[1]} L${nivel[0] + R} ${nivel[1]}`} stroke="#E6FAFF" style={sw(1.1)} opacity={0.95} />
        </g>
        <path d={boca} fill="#E6FAFF" fillOpacity={0.35} stroke={contornoDe('#4DD0FF')} style={sw(LINHA.fino)} />
        {colher}
        <Traco d={brilho} w={1.6} cor="#FFFFFF" op={0.8} />
        <Traco d={brilho2} w={1.0} cor="#FFFFFF" op={0.55} />
      </g>
    ),
  };
}

export const copo = (c: Ctx, i: 0 | 1): Grupo => recipiente(c, i, 'copo');
export const coqueteleira = (c: Ctx, i: 0 | 1): Grupo => recipiente(c, i, 'coqueteleira');
export const suco = (c: Ctx, i: 0 | 1): Grupo => recipiente(c, i, 'suco');

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
