// Estilo "Animação de série" (boneco v5) — contrato em ../estilo.ts.
//
// Desenho 2D de série animada adulta bem feita: ~5 cabeças de altura, corpo de gente (ombro,
// cintura, quadril, cotovelo, joelho), traço de tinta azul-marinho (grosso na silhueta, fino
// por dentro), cor chapada viva + UMA sombra cel por peça, fio de luz de recorte na cor do
// lugar e brilho no cabelo. Os rostos são os mais expressivos dos três estilos.
//
// Ordem de pintura (de trás pra frente): cabelo de trás → braço de trás → perna de trás (com a
// pélvis da calça) → perna da frente → cós → saia → tronco → braço da frente → cabeça → braço
// que passa na frente do rosto (bracoNaFrente). De frente, os dois braços vêm depois do tronco.
// O código mora em ./serie/: base (tinta + cel), fisico, corpo, maos, objetos, cabeca, cabelos.
import React from 'react';
import type { DesenhoProps, Estilo } from '../estilo';
import { Pintor, hash, norm, recorte, silhueta, sombraPele } from './serie/base';
import { cabeloPronto, camadaCabeca, camadaCabeloAtras } from './serie/cabeca';
import { camadaBraco, camadaPerna, camadaSaia, camadaTronco, detalhesCintura } from './serie/corpo';
import type { Ctx } from './serie/ctx';
import { PROP, fisicoDe, movDe, propDe, troncoDe } from './serie/fisico';

/** a luz de recorte quando o lugar não manda a dele: um lilás frio que separa do azul-marinho */
const LUZ_PADRAO = '#A99BFF';

/**
 * Escala do traço: px por unidade medidos no quadro (getScreenCTM) → --sk na raiz. A 330 px de
 * altura (~1,1 px/un) vale 1; num close de 2300 px (~7,7 px/un) cai pra ~0,42 (a linha engrossa
 * devagar em px, não 7×); a 150 px sobe até ~1,5 (continua legível).
 */
const escalaTraco = (pxPorUn: number) => Math.max(0.42, Math.min(1.6, Math.sqrt(1.1 / pxPorUn)));

const SerieDesenho: React.FC<DesenhoProps> = ({ j, pessoa, roupa, humor, t, uid, luz, segura, toque }) => {
  const raiz = React.useRef<SVGGElement>(null);
  React.useLayoutEffect(() => {
    const el = raiz.current;
    const m = el?.getScreenCTM?.();
    if (!el || !m) return;
    const s = Math.hypot(m.a, m.b);
    if (s > 0) el.style.setProperty('--sk', escalaTraco(s).toFixed(3));
  });
  const prop = propDe(pessoa);
  const fis = fisicoDe(pessoa, prop);
  const tr = troncoDe(j, fis);
  const seed = hash(pessoa.id);
  const mov = movDe(j, prop, t, seed);
  // com espelho o desenho inteiro é virado: a luz vira junto pra continuar vindo do mesmo lado da TELA
  const luzX = j.espelho ? -1 : 1;
  const pt = new Pintor(uid, luz ?? LUZ_PADRAO, norm([luzX * 0.6, -0.8]));
  const c: Ctx = { j, prop, fis, tr, mov, pessoa, roupa, humor, t, uid, pt, luzX, pele: pessoa.pele, peleSombra: sombraPele(pessoa.pele), seed, segura, toque };
  const cab = cabeloPronto(c);
  const frente = j.vista === 'frente';
  const camadas: React.ReactNode[] = [];
  camadas.push(camadaCabeloAtras(c, cab, 'cabA'));
  if (!frente && !j.bracoNaFrente[0]) camadas.push(camadaBraco(c, 0, 'b0'));
  camadas.push(camadaPerna(c, 0, 'p0'));
  camadas.push(camadaPerna(c, 1, 'p1'));
  camadas.push(<g key="cint">{detalhesCintura(c)}</g>);
  camadas.push(camadaSaia(c, 'saia'));
  camadas.push(camadaTronco(c, 'tr'));
  if (frente && !j.bracoNaFrente[0]) camadas.push(camadaBraco(c, 0, 'b0'));
  if (!j.bracoNaFrente[1]) camadas.push(camadaBraco(c, 1, 'b1'));
  camadas.push(camadaCabeca(c, cab, 'cab'));
  if (j.bracoNaFrente[0]) camadas.push(camadaBraco(c, 0, 'b0f'));
  if (j.bracoNaFrente[1]) camadas.push(camadaBraco(c, 1, 'b1f'));
  // estampa do pijama (listra fina na cor2), usada pelo tronco, mangas e calça
  if (roupa.cima.tipo === 'pijama' || roupa.baixo.tipo === 'pijama') {
    const cor2 = roupa.cima.cor2 ?? roupa.baixo.cor2 ?? '#F4F5FF';
    camadas.unshift(
      <defs key="estampa">
        <pattern id={`${uid}-listra`} patternUnits="userSpaceOnUse" width={4.6} height={12} patternTransform={`rotate(${(j.ang.tronco * 0.6).toFixed(1)})`}>
          <rect x={0} y={0} width={1.15} height={12} fill={cor2} opacity={0.6} />
        </pattern>
      </defs>,
    );
  }
  // o contorno grosso de fora vem ANTES de tudo (as camadas já registraram as formas)
  camadas.unshift(silhueta(pt));
  camadas.push(recorte(pt));
  return (
    <g ref={raiz}>
      {camadas.map((x, i) => (
        <React.Fragment key={i}>{x}</React.Fragment>
      ))}
    </g>
  );
};

export const serie: Estilo = {
  id: 'serie',
  nome: 'Animação de série',
  descricao: 'Série animada adulta: corpo de gente, contorno na cor de cada peça, cor viva com uma sombra, rosto que fala.',
  prop: PROP,
  propDe,
  Desenho: SerieDesenho,
};
