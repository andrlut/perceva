import { Linking } from 'react-native';

/**
 * Ponte Perceva → app do Claude ("Ditar no Claude").
 *
 * O caminho de voz do usuário avançado: um toque aqui abre o app do Claude já
 * na conversa certa, com o conector Perceva ligado, e o ditado acontece LÁ —
 * o app do Claude tem ditado nativo; o Perceva não tem microfone (e ganhar
 * um é rebuild nativo). Nada passa por rede aqui: é um intent do Android.
 *
 * Por que `https://claude.ai/…` e não `claude://…`: o app Android do Claude
 * verifica App Links para todo `claude.ai/*` (assetlinks `handle_all_urls`),
 * então o link https abre DIRETO no app quando ele está instalado e cai no
 * navegador quando não está. O esquema `claude://` só funciona com o app e
 * sem fallback.
 *
 * Três destinos, do mais ao menos recomendado:
 *   - projeto  → `claude.ai/project/<uuid>`: cada dia vira uma conversa
 *     dentro do projeto, e as INSTRUÇÕES do projeto dizem ao Claude o que
 *     fazer com o ditado. Sem prompt no link: a instrução já mora lá.
 *   - conversa → `claude.ai/chat/<uuid>`: sempre a mesma conversa.
 *   - nenhum   → `claude.ai/new?q=<prompt>`: conversa nova com o pedido já
 *     escrito no campo (validado no Android em 2026-09-29). O ditado entra
 *     depois do texto, na mesma mensagem.
 *
 * O prompt NUNCA carrega dado pessoal — só a instrução genérica. O conteúdo
 * do dia é ditado dentro do Claude; nunca passa por URL.
 */

const CLAUDE_ORIGIN = 'https://claude.ai';

export type ClaudeTargetKind = 'project' | 'chat';

export interface ClaudeTarget {
  kind: ClaudeTargetKind;
  id: string;
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

/**
 * O link que o botão abre: o destino salvo quando há um válido, senão uma
 * conversa nova com o prompt. `stored` é o valor cru dos ajustes — re-parsear
 * aqui, em vez de confiar no que foi persistido, cobre um blob antigo ou
 * editado à mão.
 */
export function buildClaudeCheckinUrl(stored: string, prompt: string): string {
  const target = parseClaudeTarget(stored);
  return target ? claudeTargetUrl(target) : claudeNewChatUrl(prompt);
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
