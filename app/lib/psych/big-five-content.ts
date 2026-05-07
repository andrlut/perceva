/**
 * Big Five — narrative content bundle (PT + EN).
 *
 * Source of truth for the trait-level narrative shown on the result
 * screen. Each trait has three buckets (baixo / médio / alto) keyed on
 * the [0, 1] normalized trait score:
 *   bucket = score < 0.33 ? 'low' : score < 0.66 ? 'mid' : 'high'
 *
 * Each bucket carries:
 *   - headline:  one phrase summarizing the level
 *   - body:      2 lines describing how this typically shows up
 *   - dayToDay:  a single concrete behavioral implication
 *
 * Locales are PT (default) and EN. Strings stay short — the result
 * screen must not feel like a textbook.
 *
 * NOTE: this is intentionally trait-level only. Facet-level narratives
 * (30 facets × 2 levels × 2 langs) are deferred to the glossary phase.
 */

export type BigFiveTrait =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism';

export type BigFiveBucket = 'low' | 'mid' | 'high';

export type BigFiveLocale = 'pt' | 'en';

interface NarrativeBlock {
  headline: string;
  body: string;
  dayToDay: string;
}

type TraitLevels = Record<BigFiveBucket, NarrativeBlock>;

interface TraitContent {
  /** Display label for the trait. */
  label: string;
  /** One-line trait definition shown on cards. */
  oneLiner: string;
  /** Three buckets — narrative shown based on user's score. */
  levels: TraitLevels;
}

const PT: Record<BigFiveTrait, TraitContent> = {
  openness: {
    label: 'Abertura',
    oneLiner: 'Curiosidade, gosto pelo novo, profundidade de ideias e emoções.',
    levels: {
      low: {
        headline: 'Pés no chão',
        body:
          'Você prefere o concreto ao abstrato e o conhecido ao novo. ' +
          'Costuma confiar no que já provou que funciona.',
        dayToDay:
          'Tende a ser quem mantém a rotina, evita experimentar por experimentar e desconfia de modas passageiras.',
      },
      mid: {
        headline: 'Curiosidade seletiva',
        body:
          'Você abre espaço pro novo quando faz sentido, mas não vive caçando estímulo. ' +
          'Equilibra estabilidade com pequenas aventuras.',
        dayToDay:
          'Topa explorar quando alguém propõe, mas dificilmente é você quem quebra a rotina sozinho.',
      },
      high: {
        headline: 'Mente aberta',
        body:
          'Você se nutre de novidade, ideias abstratas e experiências fora do padrão. ' +
          'Curtir arte, viajar, especular sobre coisas que talvez nunca aconteçam — tudo isso te alimenta.',
        dayToDay:
          'É comum você estar lendo três livros ao mesmo tempo, planejando uma viagem improvável e questionando uma "regra" que ninguém mais notou.',
      },
    },
  },
  conscientiousness: {
    label: 'Conscienciosidade',
    oneLiner: 'Organização, disciplina, foco em metas, senso de dever.',
    levels: {
      low: {
        headline: 'Espontaneidade primeiro',
        body:
          'Você prioriza flexibilidade sobre planejamento e tende a operar de impulso. ' +
          'Estruturas rígidas te incomodam mais do que ajudam.',
        dayToDay:
          'Pode deixar coisas pra última hora, mudar de plano no meio do caminho e prosperar em ambientes que não exigem rotina dura.',
      },
      mid: {
        headline: 'Disciplina situacional',
        body:
          'Você se organiza no que importa e relaxa no resto. ' +
          'Sabe puxar o foco quando precisa, mas não vive em modo execução.',
        dayToDay:
          'Mete a cara em projeto que importa; deixa a gaveta de meias bagunçada e tudo bem.',
      },
      high: {
        headline: 'Execução em primeiro plano',
        body:
          'Você é movido por metas, prazos e a sensação de coisa entregue. ' +
          'Termina o que começa mesmo quando já não está divertido.',
        dayToDay:
          'Costuma chegar antes, ter checklist na cabeça e se irritar quando outros tratam compromisso como sugestão.',
      },
    },
  },
  extraversion: {
    label: 'Extroversão',
    oneLiner: 'Energia social, busca por estímulo, expressividade.',
    levels: {
      low: {
        headline: 'Reserva e profundidade',
        body:
          'Você se recarrega na quietude e prefere círculos pequenos a multidões. ' +
          'Não significa timidez — significa que estímulo social custa energia.',
        dayToDay:
          'Sai de festa antes de todo mundo, prefere conversa de uma a uma e faz seus melhores trabalhos sozinho.',
      },
      mid: {
        headline: 'Anfíbio social',
        body:
          'Você transita bem entre estar com gente e estar sozinho, sem pesar pra um lado. ' +
          'Adapta a dose conforme o dia.',
        dayToDay:
          'Sai pra evento e curte; também não tem problema em passar o sábado sem ver ninguém.',
      },
      high: {
        headline: 'Energia pra fora',
        body:
          'Você se acende em meio a pessoas e estímulo. ' +
          'Conversa, agitação, ambiente cheio — é onde você funciona melhor.',
        dayToDay:
          'Faz amigo em fila de aeroporto, organiza encontros, sente o silêncio prolongado mais como ausência do que como pausa.',
      },
    },
  },
  agreeableness: {
    label: 'Amabilidade',
    oneLiner: 'Cooperação, empatia, evita confrontação, confia nos outros.',
    levels: {
      low: {
        headline: 'Direto ao ponto',
        body:
          'Você prioriza verdade sobre harmonia e não tem grande problema com discordância. ' +
          'Questiona, defende posição, segue firme mesmo quando a sala discorda.',
        dayToDay:
          'Costuma ser quem fala o que ninguém queria falar, e se irrita com tom passivo-agressivo.',
      },
      mid: {
        headline: 'Empatia equilibrada',
        body:
          'Você coopera quando faz sentido e empurra de volta quando precisa. ' +
          'Não evita conflito, mas também não procura.',
        dayToDay:
          'Cede no que não importa, segura a posição no que importa, e geralmente lê bem qual é qual.',
      },
      high: {
        headline: 'Outros primeiro',
        body:
          'Você se importa de verdade com as pessoas e prioriza harmonia. ' +
          'Lê o que o outro tá sentindo antes mesmo de ele dizer.',
        dayToDay:
          'É a quem ligam quando algo dá errado; pode ter dificuldade em dizer "não" e segurar uma posição que vai magoar alguém.',
      },
    },
  },
  neuroticism: {
    label: 'Neuroticismo',
    oneLiner: 'Sensibilidade ao estresse, frequência de emoções negativas.',
    levels: {
      low: {
        headline: 'Estabilidade emocional',
        body:
          'Você passa pelo dia sem grandes oscilações. ' +
          'Pressão, surpresa, cobrança — você lida sem desmontar.',
        dayToDay:
          'É a pessoa que não perde a cabeça em crise, dorme bem mesmo com pendência aberta, e raramente fica matutando depois que apaga a luz.',
      },
      mid: {
        headline: 'Sensibilidade equilibrada',
        body:
          'Você sente o que o dia te entrega — preocupação, frustração, tristeza — sem virar tendência. ' +
          'As ondas vêm e vão.',
        dayToDay:
          'Tem dias pesados, tem dias leves; geralmente sabe distinguir o que é situação real e o que é só o humor do momento.',
      },
      high: {
        headline: 'Sensibilidade intensa',
        body:
          'Você sente as coisas com profundidade — e isso inclui as negativas. ' +
          'Preocupação, irritação, baixa de humor visitam mais vezes do que você gostaria.',
        dayToDay:
          'Pode ruminar uma conversa ruim por dias, perceber tensão antes dos outros, e às vezes precisar de ferramentas pra não deixar a onda virar tsunami.',
      },
    },
  },
};

const EN: Record<BigFiveTrait, TraitContent> = {
  openness: {
    label: 'Openness',
    oneLiner: 'Curiosity, taste for novelty, depth of ideas and emotions.',
    levels: {
      low: {
        headline: 'Grounded',
        body:
          'You prefer the concrete to the abstract and the familiar to the new. ' +
          'You tend to trust what has already proved itself.',
        dayToDay:
          'You\'re often the one keeping the routine, avoiding novelty for novelty\'s sake, skeptical of passing trends.',
      },
      mid: {
        headline: 'Selective curiosity',
        body:
          'You make room for the new when it makes sense, but you\'re not chasing stimulation. ' +
          'You balance stability with small adventures.',
        dayToDay:
          'You\'re game when someone proposes something new, but rarely the one breaking routine on your own.',
      },
      high: {
        headline: 'Open mind',
        body:
          'You\'re fed by novelty, abstract ideas and experiences off the standard track. ' +
          'Art, travel, speculating about things that may never happen — all of it nourishes you.',
        dayToDay:
          'You\'re probably reading three books at once, planning an unlikely trip, and questioning a "rule" no one else noticed.',
      },
    },
  },
  conscientiousness: {
    label: 'Conscientiousness',
    oneLiner: 'Organization, discipline, goal focus, sense of duty.',
    levels: {
      low: {
        headline: 'Spontaneity first',
        body:
          'You prioritize flexibility over planning and tend to operate on instinct. ' +
          'Rigid structures bother you more than they help.',
        dayToDay:
          'You may leave things to the last minute, change plans midstream, and thrive in environments that don\'t demand a rigid routine.',
      },
      mid: {
        headline: 'Situational discipline',
        body:
          'You organize what matters and let the rest slide. ' +
          'You can summon focus when needed, but you don\'t live in execution mode.',
        dayToDay:
          'You go all in on the project that matters; the sock drawer stays a mess and that\'s fine.',
      },
      high: {
        headline: 'Execution-forward',
        body:
          'You\'re driven by goals, deadlines and the feeling of things shipped. ' +
          'You finish what you start even when it stops being fun.',
        dayToDay:
          'You arrive early, run a mental checklist, and get irritated when others treat commitments as suggestions.',
      },
    },
  },
  extraversion: {
    label: 'Extraversion',
    oneLiner: 'Social energy, search for stimulation, expressiveness.',
    levels: {
      low: {
        headline: 'Reserved and deep',
        body:
          'You recharge in quiet and prefer small circles to crowds. ' +
          'It\'s not shyness — it\'s that social stimulation costs energy.',
        dayToDay:
          'You leave the party before everyone else, prefer one-on-one conversation, and do your best work alone.',
      },
      mid: {
        headline: 'Social amphibian',
        body:
          'You move between being with people and being alone without leaning hard either way. ' +
          'You adjust the dose to the day.',
        dayToDay:
          'You\'ll go to an event and enjoy it; you also have no problem spending Saturday without seeing anyone.',
      },
      high: {
        headline: 'Energy outward',
        body:
          'You light up around people and stimulation. ' +
          'Conversation, action, a packed room — that\'s where you function best.',
        dayToDay:
          'You make friends in airport lines, organize the gatherings, and feel prolonged silence more as absence than as pause.',
      },
    },
  },
  agreeableness: {
    label: 'Agreeableness',
    oneLiner: 'Cooperation, empathy, conflict avoidance, trust.',
    levels: {
      low: {
        headline: 'Straight to the point',
        body:
          'You prioritize truth over harmony and don\'t mind disagreement. ' +
          'You question, you defend your position, you stay firm even when the room disagrees.',
        dayToDay:
          'You\'re usually the one saying what no one else wanted to say, and you\'re irritated by passive-aggressive tone.',
      },
      mid: {
        headline: 'Balanced empathy',
        body:
          'You cooperate when it makes sense and push back when needed. ' +
          'You don\'t avoid conflict, but you don\'t seek it either.',
        dayToDay:
          'You give in on what doesn\'t matter, hold ground on what does, and usually read which is which.',
      },
      high: {
        headline: 'Others first',
        body:
          'You genuinely care about people and prioritize harmony. ' +
          'You read what someone\'s feeling before they say it.',
        dayToDay:
          'You\'re the one people call when something goes wrong; you may struggle to say "no" or hold a position that hurts someone.',
      },
    },
  },
  neuroticism: {
    label: 'Neuroticism',
    oneLiner: 'Sensitivity to stress, frequency of negative emotion.',
    levels: {
      low: {
        headline: 'Emotional stability',
        body:
          'You move through the day without big swings. ' +
          'Pressure, surprises, demands — you handle them without coming apart.',
        dayToDay:
          'You\'re the person who keeps their head in a crisis, sleeps well even with open issues, and rarely lies awake replaying things.',
      },
      mid: {
        headline: 'Balanced sensitivity',
        body:
          'You feel what the day brings — worry, frustration, sadness — without it becoming a trend. ' +
          'The waves come and go.',
        dayToDay:
          'You have heavy days and light days, and you usually tell the difference between a real situation and just the mood of the moment.',
      },
      high: {
        headline: 'Intense sensitivity',
        body:
          'You feel things deeply — including the negative ones. ' +
          'Worry, irritation, low mood visit more often than you\'d like.',
        dayToDay:
          'You may replay a bad conversation for days, sense tension before others do, and sometimes need tools to keep a wave from becoming a tsunami.',
      },
    },
  },
};

const CONTENT: Record<BigFiveLocale, Record<BigFiveTrait, TraitContent>> = {
  pt: PT,
  en: EN,
};

export function bucketForTraitScore(rawScore: number): BigFiveBucket {
  // Trait raw range: [24, 120] → normalize to [0, 1].
  const normalized = Math.max(0, Math.min(1, (rawScore - 24) / 96));
  if (normalized < 0.33) return 'low';
  if (normalized < 0.66) return 'mid';
  return 'high';
}

export function getTraitContent(
  trait: BigFiveTrait,
  locale: BigFiveLocale,
): TraitContent {
  return CONTENT[locale][trait];
}

export function getTraitNarrative(
  trait: BigFiveTrait,
  bucket: BigFiveBucket,
  locale: BigFiveLocale,
): NarrativeBlock {
  return CONTENT[locale][trait].levels[bucket];
}

/** Map facet/trait id from psych_score → trait slug used by this bundle. */
export function traitFromFacetId(facetId: string): BigFiveTrait | null {
  // facet_id format: 'big_five:trait:<slug>' for parents; we only narrate
  // those. Leaf ids look like 'big_five:facet:<trait>:<slug>' and aren't
  // narrated at this stage.
  const match = facetId.match(/^big_five:trait:([a-z_]+)$/);
  if (!match) return null;
  const slug = match[1] as BigFiveTrait;
  return slug;
}

export const BIG_FIVE_TRAIT_ORDER: BigFiveTrait[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];
