import { Linking } from 'react-native';

/**
 * Ponte Perceva → app do Claude: os botões de IA das telas.
 *
 * Um toque abre o app do Claude já no lugar certo, com o conector Perceva
 * ligado, e o resto acontece LÁ — ditado, leitura, resposta. Nada passa por
 * rede aqui: é um intent do Android. O Perceva não tem microfone (e ganhar
 * um é rebuild nativo).
 *
 * Por que `https://claude.ai/…` e não `claude://…`: o app Android do Claude
 * verifica App Links para todo `claude.ai/*` (assetlinks `handle_all_urls`),
 * então o link https abre DIRETO no app quando ele está instalado e cai no
 * navegador quando não está. O esquema `claude://` só funciona com o app e
 * sem fallback.
 *
 * O que um link consegue carregar é só isto:
 *   - projeto  → `claude.ai/project/<uuid>`: abre o projeto; cada dia vira
 *     uma conversa lá dentro (ou uma fixada), e as INSTRUÇÕES do projeto
 *     dizem ao Claude o que fazer.
 *   - conversa → `claude.ai/chat/<uuid>`: sempre a mesma conversa.
 *   - nenhum   → `claude.ai/new?q=<prompt>`: conversa nova com o pedido já
 *     escrito no campo (validado no Android em 2026-09-29).
 *   - projeto/conversa + `?q=<prompt>`: os dois juntos. Não documentado pelo
 *     app do Claude — fica atrás de uma chave (`claudePromptInLink`) que o
 *     dono liga se o teste no aparelho dele passar.
 * Nenhum link liga o microfone, anexa áudio, escolhe modelo ou conector: o
 * prompt é a única carga, então a intenção vai nele e o MCP faz o resto.
 *
 * Cada botão da tela é uma entrada em CLAUDE_BUTTONS e pode ter o próprio
 * destino (Ajustes › Conector); sem um, vale o padrão. O prompt NUNCA leva
 * dado pessoal — só a instrução; o conteúdo é ditado dentro do Claude.
 */

const CLAUDE_ORIGIN = 'https://claude.ai';

/** Every AI button in the app. The Conector screen lists them off this
 *  registry (i18n `conector.buttons.{key}` / `{key}Desc`); adding a button =
 *  one key here + the two strings + the ClaudeButton on its surface. */
export type ClaudeButtonKey = 'mood' | 'calendar';

export const CLAUDE_BUTTONS: readonly ClaudeButtonKey[] = ['mood', 'calendar'];

export type ClaudeTargetKind = 'project' | 'chat';

export interface ClaudeTarget {
  kind: ClaudeTargetKind;
  id: string;
}

/** The slice of AppSettings the bridge reads (kept here so the settings
 *  module can type its keys without importing the button component). */
export interface ClaudeLinkSettings {
  /** Default destination: canonical project/chat URL, or '' for a new chat. */
  claudeTarget: string;
  /** Append `?q=<prompt>` to a project/chat destination too. */
  claudePromptInLink: boolean;
  /** Per-button destination; a missing or empty entry falls back to the default. */
  claudeButtonTargets: Partial<Record<ClaudeButtonKey, string>>;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TARGET_LINK =
  /^(?:https?:\/\/|claude:\/\/)(?:www\.)?claude\.ai\/(project|chat)\/([^/?#]+)\/?(?:[?#].*)?$/i;

/**
 * Lê um link colado pelo usuário. Aceita as formas web e de esquema:
 *   https://claude.ai/project/<uuid>   claude://claude.ai/project/<uuid>
 *   https://claude.ai/chat/<uuid>      claude://claude.ai/chat/<uuid>
 * com ou sem barra final, query ou fragmento. Qualquer outra coisa — link de
 * share, de Code, `/new` — devolve null: o botão só abre o que sabe abrir.
 */
export function parseClaudeTarget(raw: string): ClaudeTarget | null {
  const m = TARGET_LINK.exec(raw.trim());
  if (!m) return null;
  const id = m[2];
  if (!UUID.test(id)) return null;
  return { kind: m[1].toLowerCase() as ClaudeTargetKind, id: id.toLowerCase() };
}

/** Forma canônica: o que os ajustes guardam e o botão abre. */
export function claudeTargetUrl(target: ClaudeTarget): string {
  return `${CLAUDE_ORIGIN}/${target.kind}/${target.id}`;
}

/** Conversa nova com o pedido já no campo de texto. */
export function claudeNewChatUrl(prompt: string): string {
  return `${CLAUDE_ORIGIN}/new?q=${encodeURIComponent(prompt)}`;
}

/** The destination one button uses: its own when set, else the default. */
export function resolveClaudeTarget(
  settings: ClaudeLinkSettings,
  button: ClaudeButtonKey,
): string {
  const own = settings.claudeButtonTargets[button];
  return own && own.trim() ? own : settings.claudeTarget;
}

/**
 * The link a button opens. `stored` is the raw settings value — re-parsed
 * here, instead of trusting what was persisted, to cover an old or hand-edited
 * blob. No valid destination → a new chat carrying the prompt; a destination
 * → it as is, or with the prompt appended when the owner switched that on.
 */
export function buildClaudeUrl(
  stored: string,
  prompt: string,
  promptInLink: boolean,
): string {
  const target = parseClaudeTarget(stored);
  if (!target) return claudeNewChatUrl(prompt);
  const base = claudeTargetUrl(target);
  return promptInLink ? `${base}?q=${encodeURIComponent(prompt)}` : base;
}

/** Abre no app do Claude (ou no navegador). Resolve false quando o sistema
 *  recusou — quem chama mostra o aviso; nada aqui alerta por conta própria. */
export async function openClaude(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
