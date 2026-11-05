import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

/**
 * Analytics mínimo (doc "Onboarding simples — proposta", Fase 1).
 *
 * Um evento é um nome e props pequenos (número do passo, nome da aba, modo
 * do destravamento) gravados em `public.app_event`. Sem texto livre, sem
 * conteúdo pessoal, sem SDK de terceiro. O cliente só insere — a tabela não
 * tem política de leitura — e `user_id`/`created_at` são carimbados pelo
 * servidor (trigger `app_event_stamp`).
 *
 * O que já vive em outras tabelas NÃO vira evento: a primeira prática feita
 * sai de `task_completion`, a Avaliação concluída sai de `psych_session`, a
 * retenção D1/D7 sai de `auth.users.last_sign_in_at`. Aqui entram só os
 * fatos que existem apenas no cliente.
 *
 * Nunca lança: analytics não pode derrubar fluxo nenhum do app.
 */
export type AppEventName =
  /** Intro: a página que ficou visível (0..6). */
  | 'intro_page'
  /** Intro: tocou em "Pular introdução" (page = onde estava). */
  | 'intro_skip_pressed'
  /** Intro: saiu pela última página (choice = tour | assessment | skip). */
  | 'intro_done'
  /** Pacote inicial: adotou (picked = marcadas, adopted = que entraram). */
  | 'pack_done'
  /** Pacote inicial: pulou. */
  | 'pack_skipped'
  /** Tour: um módulo terminou (module, outcome = completed | skipped, step). */
  | 'tour_module'
  /** Tour: "Sair do tour" (module, step de onde saiu). */
  | 'tour_exited'
  /** Primeira vez que esta conta abriu uma aba neste aparelho (tab). */
  | 'tab_first_open'
  /** Paywall aberto (source = de onde veio). */
  | 'premium_opened';

export type AppEventProps = Record<string, string | number | boolean | null>;

export function track(name: AppEventName, props: AppEventProps = {}): void {
  try {
    void supabase
      .from('app_event')
      .insert({ name, props })
      .then(
        ({ error }) => {
          if (error && __DEV__) console.warn(`[analytics] ${name}:`, error.message);
        },
        () => {},
      );
  } catch {
    // never let analytics throw into UI code
  }
}

const ONCE_KEY = 'rpgtasks.analytics.v1.once';

/**
 * Emite `name` uma única vez por conta neste aparelho, identificado por
 * `key`. Reinstalar ou trocar de aparelho conta de novo — o funil mede
 * primeiras aberturas, não vale a pena um round-trip pra deduplicar no
 * servidor.
 */
export async function trackOnce(
  key: string,
  name: AppEventName,
  props: AppEventProps = {},
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const storageKey = `${ONCE_KEY}.${uid}`;
    const raw = await AsyncStorage.getItem(storageKey);
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (seen.includes(key)) return;
    seen.push(key);
    await AsyncStorage.setItem(storageKey, JSON.stringify(seen));
    track(name, props);
  } catch {
    // best effort
  }
}
