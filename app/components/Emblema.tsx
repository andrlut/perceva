import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import {
  armFills,
  glowLevel,
  LADDER_3,
  LADDER_5,
  PRACTICE_FLOOR_XP,
  ringFills,
  SUB_ORDER,
  angleForSub,
  type EmblemaState,
} from '@/lib/emblema';
import { PALETTES, type PercevaPaletteName } from '@/components/PercevaGlyph';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

/**
 * O Emblema — o glifo da marca desenhado por partes, cada parte lendo um
 * canal dos dados. Ver `app/lib/emblema.ts` para a semântica.
 *
 * Componente PRÓPRIO, e não uma extensão de `PercevaGlyph`: aquele é a
 * marca, usada como marca-d'água em uma dúzia de telas, e não pode passar
 * a depender do estado do usuário. Aqui a geometria é copiada (mesmos
 * centros, mesma curva, mesmas pontas) para que os dois sejam parentes
 * óbvios sem serem o mesmo componente.
 *
 * Sem `<Mask>` — react-native-svg tem histórico de crash no Android com
 * ele, e é por isso que o glifo também o evita.
 */

/** Raio dos anéis por contagem. Os dois conjuntos terminam em 380 para que
 *  a silhueta externa seja a mesma na capa e no perfil. */
const RINGS_5 = [140, 200, 260, 320, 380];
const RINGS_3 = [200, 290, 380];

/** Raio do disco central. Maior na versão de 3 anéis porque ali sobra
 *  espaço — e porque a 92px um ícone pequeno demais some. */
const TILE_R_5 = 105;
const TILE_R_3 = 150;

/** Os dois braços, saindo do centro para as pontas. Juntos formam a mesma
 *  diagonal do glifo; separados, cada um pode crescer no seu ritmo. */
const ARM_LEFT = 'M 512 512 Q 380 600 180 720';
const ARM_RIGHT = 'M 512 512 Q 644 424 844 304';
/**
 * Comprimento das duas quadráticas — idêntico, e igual à distância reta
 * entre as pontas: os pontos de controle são quase colineares, então a
 * "curva" do glifo é visualmente uma diagonal.
 */
const ARM_LEN = 391.8;

/**
 * Os braços nascem no centro (512,512), que fica DEBAIXO do disco central.
 * Sem recuar o começo, o primeiro terço de cada braço seria desenhado
 * dentro do disco e não apareceria — na capa, onde o disco tem raio 150 e
 * o terço tem 130,6 unidades, o primeiro questionário não mudaria nada na
 * tela. Então o traço começa na borda do disco e o que resta do braço é
 * que se divide em três.
 *
 * `strokeDashoffset` negativo desloca o padrão para a frente: com o traço
 * de comprimento `visible` e um vão do tamanho do braço inteiro, o começo
 * do caminho cai no vão e o traço só aparece a partir de `tileR`.
 */
function armDash(fill: number, tileR: number) {
  const visible = (ARM_LEN - tileR) * fill;
  return {
    strokeDasharray: `${visible} ${ARM_LEN}`,
    strokeDashoffset: -tileR,
  };
}

const DOT_LEFT = { x: 180, y: 720, r: 18 };
const DOT_RIGHT = { x: 844, y: 304, r: 22 };

/**
 * A órbita é uma LINHA de verdade, e os doze são contas nela.
 *
 * Antes os satélites ficavam em 440 com raio 50, ou seja, encostavam
 * exatamente na borda externa do anel de esforço (390) — tangentes, o que
 * lê como erro de alinhamento e não como decisão. Agora a linha fica em
 * 455 e os discos têm raio 42: sobram 23 unidades de vão livre até o anel,
 * o extremo (497) ainda cabe no viewBox, e a própria linha explica por que
 * eles estão dispostos em círculo.
 */
const ORBIT_R = 455;
const ORBIT_LINE_W = 4;
/**
 * Raio único para os doze — o sinal aqui é aceso contra apagado, não
 * tamanho. Quem treina mais já é dito pelo centro; variar doze diâmetros
 * em cima disso só embaralha.
 */
const SAT_R = 42;

const RING_TRACK_W = 12;
const RING_FILL_W = 20;
const ARM_W = 22;

interface Props {
  state: EmblemaState;
  /** Lado do quadrado, em px. */
  size: number;
  /** 3 na capa, 5 no perfil. */
  rings?: 3 | 5;
  /**
   * A órbita das doze áreas. Desligada na capa de propósito — a 92px, ao
   * lado do hex que abre para 12 eixos, ela vira ruído.
   */
  showOrbit?: boolean;
  /** Tinta do emblema. As mesmas quatro da marca. */
  palette?: PercevaPaletteName;
  /** Obrigatório: defs (gradientes) não atravessam fronteira de <Svg>. */
  idSuffix: string;
}

export function Emblema({
  state,
  size,
  rings = 5,
  showOrbit = false,
  palette = 'primary',
  idSuffix,
}: Props) {
  // Fallback também aqui, e não só em quem chama: o componente não pode
  // depender de todo call site lembrar de validar. `palette` é tipado, mas
  // o valor real nasce de um jsonb e chega por cast.
  const p = PALETTES[palette] ?? PALETTES.primary;
  const radii = rings === 3 ? RINGS_3 : RINGS_5;
  const ladder = rings === 3 ? LADDER_3 : LADDER_5;
  const tileR = rings === 3 ? TILE_R_3 : TILE_R_5;

  const fills = ringFills(state.xp30, ladder);
  const arms = armFills(state.instruments);
  const glow = glowLevel(state.read30);

  const u = size / 1024; // unidade do viewBox → px
  const fillId = `emb-fill-${idSuffix}`;
  const haloId = `emb-halo-${idSuffix}`;

  const center = state.center;
  const centerDim = center ? DIMENSION_META[center.dimensionId] : null;

  // As DOZE áreas em posição fixa, na ordem do hex. Acesa é a que passou
  // do piso no mês; apagada continua desenhada, porque o emblema tem que
  // dizer o que FALTA e não só o que foi feito. Posição fixa é o que faz
  // o desenho virar reconhecível como o seu.
  const orbit = SUB_ORDER.map((subId) => {
    const meta = SUB_META[subId];
    const rad = (angleForSub(subId) * Math.PI) / 180;
    return {
      subId,
      iconName: meta.iconName,
      color: DIMENSION_META[meta.dimensionId].color,
      lit: (state.subXp[subId] ?? 0) >= PRACTICE_FLOOR_XP,
      cx: 512 + ORBIT_R * Math.cos(rad),
      cy: 512 + ORBIT_R * Math.sin(rad),
    };
  });

  // O halo é o canal da leitura. Fica fora do <Svg> do emblema para poder
  // transbordar a caixa — é atmosfera, não traço, e por isso não disputa
  // espaço com anéis nem com o hex ao lado.
  const haloSize = size * 2;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: haloSize,
            height: haloSize,
            left: (size - haloSize) / 2,
            top: (size - haloSize) / 2,
          },
        ]}
      >
        <Svg width={haloSize} height={haloSize} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={haloId} cx="0.5" cy="0.5" r="0.5">
              <Stop
                offset="0"
                stopColor={p.accent}
                stopOpacity={0.08 + 0.34 * glow}
              />
              <Stop
                offset="0.55"
                stopColor={p.accent}
                stopOpacity={0.02 + 0.1 * glow}
              />
              <Stop offset="1" stopColor={p.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill={`url(#${haloId})`} />
        </Svg>
      </View>

      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        <Defs>
          <LinearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={p.accent} />
            <Stop offset="1" stopColor={p.accentDeep} />
          </LinearGradient>
        </Defs>

        {/* Trilhos. Neutros, nunca dourados: ouro fica reservado para o que
            foi conquistado, e o esforço da janela recua. */}
        {radii.map((r) => (
          <Circle
            key={`track-${r}`}
            cx={512}
            cy={512}
            r={r}
            fill="none"
            stroke={tokens.text.faint}
            strokeWidth={RING_TRACK_W}
            opacity={0.4}
          />
        ))}

        {/* Esforço: cada anel preenche a sua faixa da escada, de dentro
            para fora. Começa no topo e anda no sentido horário. */}
        {radii.map((r, i) => {
          const f = fills[i] ?? 0;
          if (f <= 0) return null;
          const c = 2 * Math.PI * r;
          return (
            <Circle
              key={`fill-${r}`}
              cx={512}
              cy={512}
              r={r}
              fill="none"
              stroke={`url(#${fillId})`}
              strokeWidth={RING_FILL_W}
              strokeLinecap="round"
              strokeDasharray={`${c * f} ${c}`}
              transform="rotate(-90 512 512)"
            />
          );
        })}

        {/* Autoconhecimento: os dois braços crescem um terço por
            instrumento e nunca recuam. */}
        {arms.left > 0 && (
          <Path
            d={ARM_LEFT}
            fill="none"
            stroke={p.mark}
            strokeWidth={ARM_W}
            strokeLinecap="round"
            {...armDash(arms.left, tileR)}
          />
        )}
        {arms.right > 0 && (
          <Path
            d={ARM_RIGHT}
            fill="none"
            stroke={p.mark}
            strokeWidth={ARM_W}
            strokeLinecap="round"
            {...armDash(arms.right, tileR)}
          />
        )}
        {arms.dotLeft && (
          <Circle cx={DOT_LEFT.x} cy={DOT_LEFT.y} r={DOT_LEFT.r} fill={p.mark} />
        )}
        {arms.dotRight && (
          <Circle
            cx={DOT_RIGHT.x}
            cy={DOT_RIGHT.y}
            r={DOT_RIGHT.r}
            fill={p.mark}
          />
        )}

        {/* A linha da órbita, atrás das contas. */}
        {showOrbit && (
          <Circle
            cx={512}
            cy={512}
            r={ORBIT_R}
            fill="none"
            stroke={tokens.text.faint}
            strokeWidth={ORBIT_LINE_W}
            opacity={0.35}
          />
        )}

        {/* Órbita: discos de fundo. Os ícones vão por cima, fora do SVG.
            O preenchimento opaco é o que faz a linha passar POR TRÁS de
            cada conta em vez de cortá-la ao meio. */}
        {showOrbit &&
          orbit.map((o) => (
            <Circle
              key={`sat-${o.subId}`}
              cx={o.cx}
              cy={o.cy}
              r={SAT_R}
              fill={tokens.bg.deep}
              stroke={o.lit ? o.color : tokens.text.faint}
              strokeWidth={7}
              // Opacidade no TRAÇO, nunca no elemento: `opacity` multiplica
              // também o preenchimento, e o disco translúcido deixava a
              // linha da órbita atravessar a conta apagada — exatamente o
              // artefato que o preenchimento opaco existe para evitar.
              strokeOpacity={o.lit ? 1 : 0.38}
            />
          ))}

        {/* Práticas: o disco central. Sem prática na janela ele fica
            neutro — vazio, nunca quebrado. */}
        <Circle
          cx={512}
          cy={512}
          r={tileR}
          fill={centerDim ? centerDim.bg : 'rgba(255,255,255,0.04)'}
          stroke={centerDim ? centerDim.color : tokens.text.faint}
          strokeWidth={8}
          opacity={centerDim ? 1 : 0.5}
        />
      </Svg>

      {/* Ícones por cima do SVG: o mesmo recurso que o avatar já usava para
          desenhar o Ionicon da dimensão sobre o brasão. */}
      {center && centerDim && (
        <View pointerEvents="none" style={styles.centerIcon}>
          <Ionicons
            name={center.iconName as never}
            size={Math.round(tileR * 2 * u * 0.56)}
            color={centerDim.color}
          />
        </View>
      )}

      {showOrbit &&
        orbit.map((o) => {
          const iconSize = Math.round(SAT_R * 2 * u * 0.64);
          if (iconSize < 8) return null;
          return (
            <View
              key={`sat-icon-${o.subId}`}
              pointerEvents="none"
              style={[
                styles.satIcon,
                {
                  left: o.cx * u - iconSize / 2,
                  top: o.cy * u - iconSize / 2,
                },
                o.lit ? undefined : styles.satOff,
              ]}
            >
              <Ionicons
                name={o.iconName as never}
                size={iconSize}
                color={o.lit ? o.color : tokens.text.faint}
              />
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    // O halo precisa transbordar a caixa do emblema.
    overflow: 'visible',
  },
  halo: {
    position: 'absolute',
  },
  centerIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satIcon: {
    position: 'absolute',
  },
  /** Área ainda não acesa: presente e apagada, nunca cadeado. */
  satOff: {
    opacity: 0.4,
  },
});
