/**
 * Constantes do conector MCP do Perceva.
 *
 * Nenhuma delas é segredo. O endpoint da Edge Function é público e o client
 * OAuth é público e pré-registrado (Dynamic Client Registration está OFF),
 * então embutir no bundle não expõe nada: o token de acesso é sempre o do
 * login do próprio usuário, emitido pelo Supabase Auth no fluxo de consent.
 *
 * São constantes de build e não `app_config` de propósito — a tela que as
 * usa é instrucional, e um valor errado ali vira "os passos não funcionam",
 * nunca uma falha silenciosa de runtime.
 */

export const MCP_CONNECTOR_URL =
  'https://uneqnpyzevosznwkmvvo.supabase.co/functions/v1/perceva-mcp';

export const MCP_CLIENT_ID = 'e89d46ae-194b-4318-9320-415bcbf84950';

export const CLAUDE_CONNECTORS_URL = 'https://claude.ai/settings/connectors';
