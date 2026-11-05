// Recanto em ideias — a montagem da resposta de get_learning_ideas.
//
// Mesma doutrina do self-knowledge.ts: função PURA. O index.ts lê as cinco
// fontes sob o JWT do usuário (RLS é a fronteira) e entrega as linhas cruas
// aqui:
//
//   learning_idea_public   — view security_invoker, uma linha por ideia de
//                            material publicado (herda a leitura pública de
//                            learning_material)
//   learning_idea_collect  — as ideias que ESTE usuário absorveu (self RLS),
//                            com a revisão (20260911000001): reviewed_at null
//                            = esperando revisão em Minhas ideias; favorite
//                            true = guardada, false = solta
//   learning_view          — os materiais que ele fechou (self RLS)
//   learning_material_sub  — as subs de cada material (catálogo)
//   learning_material      — só id + título, pro material ter nome
//
// O join é feito em memória porque a view não tem FK — o PostgREST não
// embute nada nela — e porque "absorvida ou não" é uma pergunta por
// (material, ideia) que o SQL não precisa aprender. Zero migration pra esta
// tool, de propósito: o catálogo inteiro cabe em poucas centenas de linhas.
//
// O que NÃO acontece aqui: escrita. Absorver uma ideia é virar o card no fim
// da tela da ideia (RPC collect_idea), e só lá; revisar (favoritar/soltar) é
// o swipe em Minhas ideias (RPC review_idea), e só lá. O conector devolve o
// deep link e para. A única escrita do Recanto pelo conector é o resultado
// do TREINO (log_idea_training → RPC train_idea), e ela mora no index.ts;
// aqui só se monta o baralho (assembleTraining).

export type IdeaStatus = 'unabsorbed' | 'absorbed' | 'all';

/** Uma linha de `learning_idea_public` (colunas da migration 20260907000002). */
export type IdeaPublicRow = {
  material_id: string;
  slug: string;
  category: string;
  dimension_id: string;
  released_at: string;
  idea_id: string;
  ordinal: number;
  title_pt: string | null;
  title_en: string | null;
  claim_pt: string | null;
  claim_en: string | null;
  image_path: string | null;
  video_pt_path: string | null;
  video_en_path: string | null;
};

export type IdeaCollectRow = {
  material_id: string;
  idea_id: string;
  collected_at: string;
  /** null = absorvida mas ainda não revisada (a pilha de Minhas ideias). */
  reviewed_at: string | null;
  /** Decisão da revisão: true guardada, false solta; null enquanto pendente. */
  favorite: boolean | null;
};

export type MaterialViewRow = { material_id: string; read_at: string };

export type MaterialSubRow = { material_id: string; sub_id: string };

export type MaterialTitleRow = {
  id: string;
  title_pt: string | null;
  title_en: string | null;
};

export type IdeaOut = {
  slug: string;
  material_title_pt: string | null;
  material_title_en: string | null;
  dimension_id: string;
  subs: string[];
  /** research (Pesquisa) | book (Livro) | foundation (Fundamentos). */
  category: string;
  released_at: string;
  idea_id: string;
  ordinal: number;
  idea_count: number;
  title_pt: string | null;
  title_en: string | null;
  claim_pt: string | null;
  claim_en: string | null;
  absorbed: boolean;
  absorbed_at: string | null;
  /** Passou pela pilha de revisão em Minhas ideias (swipe). */
  reviewed: boolean;
  reviewed_at: string | null;
  /**
   * true = guardada como favorita (é o que a grade mostra), false = solta
   * (continua absorvida — XP e contagem não mudam — só saiu da grade),
   * null = absorvida e esperando revisão, ou nem absorvida.
   */
  favorite: boolean | null;
  has_video: { pt: boolean; en: boolean };
  open_in_app: string;
};

export type IdeasSummary = {
  /** Ideias no escopo (dimensão/sub/slug), ANTES do filtro de status e do limit. */
  total_ideas: number;
  absorbed: number;
  unabsorbed: number;
  /** Absorvidas com favorite = true, no escopo. */
  favorites: number;
  /** Absorvidas ainda sem revisão (reviewed_at null), no escopo — o que a lâmpada do Recanto conta. */
  pending_reviews: number;
  materials_total: number;
  /** Materiais do escopo com linha em learning_view (fechados). */
  materials_completed: number;
  /** Quantas ideias vieram em `ideas` (depois de status + limit). */
  returned: number;
  truncated: boolean;
};

/**
 * Esquema de deep link do app (`app.json` → `scheme`). Ainda é `rpgtasks`,
 * não `perceva`: o esquema é independente do package Android e trocá-lo
 * exigiria re-apontar o Auth do Supabase — ver CLAUDE.md, "Brand".
 * `/idea/[slug]?idea=n` lê `idea` como o ordinal 1-based.
 */
export const APP_SCHEME = 'rpgtasks';

export function ideaDeepLink(slug: string, ordinal: number): string {
  return `${APP_SCHEME}://idea/${encodeURIComponent(slug)}?idea=${ordinal}`;
}

function isBlank(s: string | null | undefined): boolean {
  return !s || s.trim().length === 0;
}

function releasedMs(s: string | null): number {
  if (s === null) return 0;
  const n = Date.parse(s);
  return Number.isNaN(n) ? 0 : n;
}

export function assembleIdeas(
  rows: {
    ideas: IdeaPublicRow[];
    collects: IdeaCollectRow[];
    views: MaterialViewRow[];
    subs: MaterialSubRow[];
    titles: MaterialTitleRow[];
  },
  opts: {
    status: IdeaStatus;
    sub_id?: string | undefined;
    limit: number;
    /** Só favorite === true. Implica absorvida: o status deixa de filtrar. */
    favorites_only?: boolean | undefined;
  },
): { ideas: IdeaOut[]; summary: IdeasSummary } {
  const subsBy = new Map<string, string[]>();
  for (const s of rows.subs) {
    const list = subsBy.get(s.material_id) ?? [];
    list.push(s.sub_id);
    subsBy.set(s.material_id, list);
  }
  const collectBy = new Map<string, IdeaCollectRow>();
  for (const c of rows.collects) {
    collectBy.set(`${c.material_id}|${c.idea_id}`, c);
  }
  const readAt = new Map<string, string>();
  for (const v of rows.views) readAt.set(v.material_id, v.read_at);
  const titleBy = new Map<string, MaterialTitleRow>();
  for (const t of rows.titles) titleBy.set(t.id, t);

  // A view expande TODAS as ideias de um material publicado, então contar as
  // linhas por material dá o idea_count sem uma consulta a mais. Contado
  // antes do filtro por sub: um material inteiro entra ou sai do escopo.
  const countBy = new Map<string, number>();
  for (const r of rows.ideas) {
    countBy.set(r.material_id, (countBy.get(r.material_id) ?? 0) + 1);
  }

  const sub = opts.sub_id;
  const scope = sub
    ? rows.ideas.filter((r) => (subsBy.get(r.material_id) ?? []).includes(sub))
    : rows.ideas;

  const all: IdeaOut[] = scope.map((r) => {
    const c = collectBy.get(`${r.material_id}|${r.idea_id}`);
    const at = c?.collected_at ?? null;
    // A revisão só existe sobre uma ideia absorvida; a RPC review_idea grava
    // as duas colunas juntas, então reviewed_at nulo é a única leitura de
    // "pendente" e favorite só vale depois dela.
    const reviewedAt = c?.reviewed_at ?? null;
    const title = titleBy.get(r.material_id);
    const ordinal = Number(r.ordinal);
    return {
      slug: r.slug,
      material_title_pt: title?.title_pt ?? null,
      material_title_en: title?.title_en ?? null,
      dimension_id: r.dimension_id,
      subs: subsBy.get(r.material_id) ?? [],
      category: r.category,
      released_at: r.released_at,
      idea_id: r.idea_id,
      ordinal,
      idea_count: countBy.get(r.material_id) ?? 0,
      title_pt: r.title_pt,
      title_en: r.title_en,
      claim_pt: r.claim_pt,
      claim_en: r.claim_en,
      absorbed: at !== null,
      absorbed_at: at,
      reviewed: reviewedAt !== null,
      reviewed_at: reviewedAt,
      favorite: reviewedAt === null ? null : (c?.favorite ?? null),
      has_video: { pt: !isBlank(r.video_pt_path), en: !isBlank(r.video_en_path) },
      open_in_app: ideaDeepLink(r.slug, ordinal),
    };
  });

  const favoritesOnly = opts.favorites_only === true;

  if (favoritesOnly) {
    // "As que eu guardei": a mais recentemente revisada primeiro — é a
    // ordem em que a pessoa tomou a decisão, não a ordem do catálogo.
    all.sort((a, b) => {
      const dt = releasedMs(b.reviewed_at) - releasedMs(a.reviewed_at);
      if (dt !== 0) return dt;
      if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
      return a.ordinal - b.ordinal;
    });
  } else {
    // Não absorvidas primeiro (é o que há pra fazer), depois o mais novo, e
    // dentro do material a ordem de leitura. O slug desempata dois materiais
    // publicados no mesmo instante, pra não intercalar as ideias deles.
    all.sort((a, b) => {
      if (a.absorbed !== b.absorbed) return a.absorbed ? 1 : -1;
      const dt = releasedMs(b.released_at) - releasedMs(a.released_at);
      if (dt !== 0) return dt;
      if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
      return a.ordinal - b.ordinal;
    });
  }

  // Favorita ⇒ absorvida, então favorites_only já decide o status sozinho
  // (um status "unabsorbed" junto com ele seria contradição, e a favorita
  // vence — o index.ts ecoa o status efetivo nos filters).
  const filtered = favoritesOnly
    ? all.filter((i) => i.favorite === true)
    : opts.status === 'all'
    ? all
    : all.filter((i) => i.absorbed === (opts.status === 'absorbed'));
  const page = filtered.slice(0, opts.limit);

  // "Fechado" vem de learning_view, que é o que collect_idea escreve ao
  // absorver a última ideia. Um material lido no legado ANTES de ganhar
  // ideias também conta como fechado (0 absorvidas) — é o mesmo already_read
  // que o app respeita.
  const materials = new Set(scope.map((r) => r.material_id));
  const absorbed = all.filter((i) => i.absorbed).length;
  const favorites = all.filter((i) => i.favorite === true).length;
  const pendingReviews = all.filter((i) => i.absorbed && !i.reviewed).length;

  return {
    ideas: page,
    summary: {
      total_ideas: all.length,
      absorbed,
      unabsorbed: all.length - absorbed,
      favorites,
      pending_reviews: pendingReviews,
      materials_total: materials.size,
      materials_completed: [...materials].filter((m) => readAt.has(m)).length,
      returned: page.length,
      truncated: page.length < filtered.length,
    },
  };
}

// ─── Treino de ideias ────────────────────────────────────────────────────────
// O mesmo baralho do "Treino do dia" do app (app/lib/ideaTraining.ts): mesma
// regra e mesma ordem — mexeu num, mexa no outro. A AGENDA inteira é do
// servidor (migrations 20261018000003/4): review_idea carimba train_due = dia
// seguinte quando a ideia vira favorita; train_idea move — acertou → 3 / 7 /
// 21 dias, depois firme a cada 60; errou → amanhã; só a primeira resposta do
// dia conta. Aqui só se LÊ:
//
//   no baralho ⟺ favorita (qualquer dia — treinar é livre)
//   vence hoje ⟺ train_due ≤ hoje ∧ trained_on ≠ hoje
//
// Ordem: respondida hoje por último; depois train_due (a vencida há mais
// tempo primeiro), slug e ordinal. Favorita de material que saiu da janela
// de 30 dias do free continua no baralho: o que a pessoa guardou é dela.
// Datas são YYYY-MM-DD locais; comparar strings ordena.

/** The view columns the Recanto reads — one list for get_learning_ideas
 *  and get_idea_training, matching IdeaPublicRow. */
export const IDEA_PUBLIC_COLUMNS =
  'material_id,slug,category,dimension_id,released_at,idea_id,ordinal,' +
  'title_pt,title_en,claim_pt,claim_en,image_path,video_pt_path,video_en_path';

export type TrainCollectRow = {
  material_id: string;
  idea_id: string;
  favorite: boolean | null;
  train_box: number | null;
  train_due: string | null;
  trained_on: string | null;
};

export type TrainingScope = 'due' | 'favorites';

export type TrainingIdeaOut = {
  slug: string;
  idea_id: string;
  ordinal: number;
  material_title_pt: string | null;
  material_title_en: string | null;
  dimension_id: string;
  /** The CUE: say only this, then wait for the answer. */
  title_pt: string | null;
  title_en: string | null;
  /** The ANSWER: reveal only after the user tried. */
  claim_pt: string | null;
  claim_en: string | null;
  /** Spaced hits in a row (0..3). 3 = firm. */
  box: number;
  firm: boolean;
  /** The local day it is (or was) due. */
  due: string | null;
  due_today: boolean;
  /** Already answered today: a new answer would not move the schedule. */
  answered_today: boolean;
  open_in_app: string;
};

export type TrainingSummary = {
  today: string;
  favorites: number;
  due_today: number;
  firm: number;
  /** Next day anything comes due after today (null = nothing scheduled). */
  next_due: string | null;
  returned: number;
  truncated: boolean;
};

export function assembleTraining(
  rows: { ideas: IdeaPublicRow[]; collects: TrainCollectRow[]; titles: MaterialTitleRow[] },
  opts: { today: string; scope: TrainingScope; limit: number },
): { ideas: TrainingIdeaOut[]; summary: TrainingSummary } {
  const ideaBy = new Map<string, IdeaPublicRow>();
  for (const r of rows.ideas) ideaBy.set(`${r.material_id}|${r.idea_id}`, r);
  const titleBy = new Map<string, MaterialTitleRow>();
  for (const t of rows.titles) titleBy.set(t.id, t);

  const all: TrainingIdeaOut[] = [];
  let firm = 0;
  let nextDue: string | null = null;
  for (const c of rows.collects) {
    if (c.favorite !== true) continue;
    // Uma favorita cuja ideia saiu do catálogo (recorte) não tem o que mostrar.
    const r = ideaBy.get(`${c.material_id}|${c.idea_id}`);
    if (!r) continue;
    const box = Number(c.train_box ?? 0);
    const isFirm = box >= 3;
    const due = c.train_due;
    const answeredToday = c.trained_on === opts.today;
    const dueToday = due !== null && due <= opts.today && !answeredToday;
    if (isFirm) firm += 1;
    if (due !== null && due > opts.today && (nextDue === null || due < nextDue)) nextDue = due;
    const title = titleBy.get(r.material_id);
    const ordinal = Number(r.ordinal);
    all.push({
      slug: r.slug,
      idea_id: r.idea_id,
      ordinal,
      material_title_pt: title?.title_pt ?? null,
      material_title_en: title?.title_en ?? null,
      dimension_id: r.dimension_id,
      title_pt: r.title_pt,
      title_en: r.title_en,
      claim_pt: r.claim_pt,
      claim_en: r.claim_en,
      box,
      firm: isFirm,
      due,
      due_today: dueToday,
      answered_today: answeredToday,
      open_in_app: ideaDeepLink(r.slug, ordinal),
    });
  }

  // Same comparator as the app: answered today last, then by due day (so
  // what is due leads), slug, ordinal; an unstamped row sorts last.
  all.sort((a, b) => {
    if (a.answered_today !== b.answered_today) return a.answered_today ? 1 : -1;
    const da = a.due ?? '9999-12-31';
    const db = b.due ?? '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
    return a.ordinal - b.ordinal;
  });

  const dueList = all.filter((i) => i.due_today);
  const scoped = opts.scope === 'due' ? dueList : all;
  const page = scoped.slice(0, opts.limit);

  return {
    ideas: page,
    summary: {
      today: opts.today,
      favorites: all.length,
      due_today: dueList.length,
      firm,
      next_due: nextDue,
      returned: page.length,
      truncated: page.length < scoped.length,
    },
  };
}
