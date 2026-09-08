# Escala e custo — playbook (mídia do Learning, infra e pico viral)

Escrito em 2026-09-07, a partir de três rodadas de pesquisa verificada (preços conferidos nas páginas oficiais; medições feitas no bucket real). Vale até alguém medir de novo. Preços em US$.

## 1. A preocupação, respondida

**Pergunta:** "1.000 vídeos + podcasts bilíngues + 5.000 usuários derruba a infra?"

**Resposta:** não. O que serve áudio e vídeo é o CDN na frente do bucket (arquivo estático, Postgres fora do caminho). Não existe "crash" por mídia; existe fatura ou cota. A conta abaixo mostra que a fatura fica entre US$25 e US$70/mês mesmo em cenários exagerados. O que quebra de verdade num pico está na seção 5, e não é mídia.

Pré-requisito em QUALQUER cenário com mídia: sair do Free tier antes de vender. Os 5 GB de egress do Free (cota unificada com API e auth) acabam entre 150 e 350 cadastrados; 1 GB de storage acaba entre 22 e 31 materiais com áudio+vídeo.

## 2. Números medidos (bucket `learning-media`, 2026-09-07)

| item | medido |
|---|---|
| Vídeos do Gemini Notebook (11) | 720×1280 H.264, 64–87 s, 5,6–9,2 MB (média ~7,5 MB, ~830 kbps) |
| Podcasts deep dive (20) | 188,7 MB no total; 5,5–32 min; média ~19 min ≈ 9,4 MB → **0,5 MB/min** (AAC 64k mono) |
| Reel cards 1080×1920 WebP (174) | 55–101 KB, média 67 KB |
| Infográficos (68) | 7,4 MB no total |
| Capas (36) | 12–87 KB |
| Bucket total | ~288 MB · Banco Postgres: 22 MB |
| Cache-Control por **GET** | vídeos `public, max-age=31536000` (alguns `immutable`); capas antigas `max-age=3600`; `CF-Cache-Status: HIT`. **HEAD devolve `no-cache` e engana** — sempre conferir com `curl -s -r 0-0 -D -` |
| Paths mortos | HTTP 400 + `no-cache` (é o header do JSON de erro, não do bucket) |

Usuários em 2026-09-07: 21 cadastrados, 8 ativos em 30 dias. Práticas: 1.007 conclusões (11 pessoas). Learning: 38 leituras (5 pessoas). Não usar como base de mercado (sem campanha ainda).

## 3. Preços verificados

| provedor | storage | egress | observação |
|---|---|---|---|
| Supabase Free | 1 GB (50 MB/arquivo) | 5 GB + 5 GB cacheado, **cota unificada** com API/auth | pausa após 1 semana ocioso; sem backup |
| Supabase Pro US$25/mês | 100 GB incl., depois $0,0213/GB | 250 GB incl. + 250 GB cacheado; excedente $0,09/GB (origem) ou $0,03/GB (cache) | compute Micro incluso; **Spend Cap vem LIGADO** (restringe em vez de cobrar) |
| Cloudflare R2 | $0,015/GB-mês, 10 GB grátis | **$0** | Class B (leituras) 10 M grátis/mês; domínio próprio na zona `perceva.app` que já existe |
| Bunny.net | $0,01/GB | **América do Sul $0,045/GB** (4,5× NA/EU) | a pior tarifa é a nossa região |
| Cloudflare Stream | $5/1.000 min armazenados | $1/1.000 min entregues | HLS: **desliga o cache do expo-video no iOS**; ~US$130/mês a 5.000 |
| Mux | $0,0024/min-mês | 100k min grátis + crédito $20 | HLS, tier promocional; rejeitado |
| Gemini 2.5 Flash Image | $0,039/imagem ($0,0195 em batch) | | |
| Gemini TTS (2.5 Flash) | ~$0,015–0,019 por minuto de áudio por idioma | | 3.1 Flash TTS = 2× |
| Veo 3.1 Lite | $0,05/s (= $0,40 por 8 s; $1,50 por 30 s) | | sem controle de texto na tela; nunca por ideia |
| NotebookLM (Gemini Notebook) | sem API de Video Overview em nenhuma superfície (nem Enterprise) | | limites de UI baseados em compute desde 2026-09-02, não publicados; geração ">30 min"; automação de browser = risco de conta |

## 4. Simulação — 4 cenários de conteúdo

Premissas de mercado (contestáveis): 35% dos cadastrados ativos no mês; catálogo maduro de 300 materiais; 2 idiomas (storage ×2, egress não); 30% dos ativos ouvem 4 deep dives/mês; 70% assistem 40 vídeo-ideias/mês (prefetch ×1,25); texto do Claude ≈ US$3 por material (estimativa, não medido).

| cenário | produção por material | 300 materiais | storage 300 | egress/mês a 5.000 cadastrados (1.750 ativos) | infra/mês a 5.000 | infra/mês a 25.000 |
|---|---|---|---|---|---|---|
| **A. Como está** — Notebook: vídeo 75 s + podcast 20–30 min, 2 idiomas, dirigido pelo Claude no Chrome | US$3 + **1,5 h de sessão** | US$900 + 450 h | 12 GB | 71 GB | US$25 | US$25 (R2) · US$28–34 (só Supabase) |
| **B. Econômico** — ideias em texto + carta + áudio curto 6 min por TTS | US$3,20 + 0,25 h | US$970 + 75 h | 2 GB | 14 GB | US$25 | US$25 |
| **C. Meio-termo** — 4 vídeo-ideias 30 s + deep dive 25 min por TTS + texto | US$4,20 + 0,6 h | US$1.250 + 180 h | 13,5 GB | 163 GB | US$25 | US$25 (R2) · US$42–76 (só Supabase) |
| **C2. Meio-termo enxuto** — vídeo só na ideia que precisa de desenho (1–2/material) + deep dive + texto | US$3,90 + 0,4 h | US$1.180 + 120 h | 10 GB | 79 GB | US$25 | US$25 (R2) · US$29–38 (só Supabase) |

Leitura: a infra não separa os cenários; **horas** separam. O cenário A é o único com parede real: o Notebook não tem API, tem cota de interface opaca e não roda na Routine da nuvem (precisa do Chrome e da conta local). TTS + ffmpeg via API não têm essa parede.

**Pior caso exagerado** (1.000 vídeos do Notebook + 300 podcasts, 2 idiomas, 5.000 usuários TODOS ativos, 40 vídeos + 4 podcasts cada por mês): storage ~22 GB; egress ~1,75 TB/mês; só Supabase Pro ≈ US$70 (cache ok) / US$160 (cache quebrado); **com R2: US$25**.

Estimativas de vídeo-ideia (30 s, 720×1280, H.264 High CRF 24–28, AAC mono 56–64k, `+faststart`): **~2,2 MB — CHUTE não medido**; render local **~1,5–2,5 min/ideia — CHUTE não medido**. Uma renderização real de 30 s fixa os dois números; tudo o mais é aritmética em cima deles.

## 5. Pico viral (100k downloads, 5k assinantes da noite pro dia) — o que quebra, em ordem

Checado em 2026-09-07: checkout ligado (`PURCHASES_ENABLED = true`, RevenueCat com Edge Function `revenuecat-webhook` gravando `profile.subscription_tier`); Google Sign-In ativo (`external_google_enabled`); limites de Auth nos padrões.

1. **E-mail de confirmação (OTP).** `rate_limit_email_sent = 100/hora` via Zoho (`smtppro.zoho.com`) = 2.400 cadastros por e-mail/dia; o Zoho ainda tem teto diário próprio (centenas). Login com Google não passa por isso → **botão do Google como principal**. Fix definitivo: provedor transacional (Resend / SES / ZeptoMail, ~US$20/mês) + subir o limite no Management API (`PATCH /v1/projects/{ref}/config/auth`). Exige DNS/verificação: **não dá pra fazer durante o pico**.
2. **Limites por IP do Auth**: `rate_limit_verify = 30`, `rate_limit_otp = 30`, `rate_limit_token_refresh = 150` (por 5 min por IP). CGNAT das operadoras brasileiras coloca milhares atrás de um IP. Subir no painel/API em 1 minuto.
3. **Compute do Postgres**: Pro vem com Micro (2 núcleos compartilhados, 1 GB, orçamento de IO). Subir pra Small (US$15) ou Medium (US$60) é um clique com ~2 min de reinício. Fazer antes da campanha.
4. **Spend Cap** do Pro: vem ligado; ao estourar cota restringe o serviço. **Desligar** antes de qualquer campanha.
5. **EAS Update**: plano Free limita usuários ativos mensais de OTA (ordem de 1.000 — confirmar em expo.dev/pricing). Passar disso não derruba o app (bundle embutido continua), mas hotfixes param de chegar. Plano pago ~US$99/mês antes da primeira publi.
6. **Mídia**: com R2, nada. Só com Supabase, 100k usuários podem virar terabytes (US$60–200).
7. **RevenueCat**: grátis até US$2,5k de receita rastreada/mês, depois ~1%. 5k × R$14,90 ≈ R$75k/mês → ~US$140/mês.
8. **Banco/consultas**: 100k perfis = centenas de MB. Antes da campanha, um teste de carga (k6, 30 min) nas 5 consultas mais quentes (feed do Recanto, práticas do dia, personagem, humor, leitura) a algumas centenas de req/s, pra achar índice faltando antes do público.

**Kit pré-campanha (~US$160/mês parado, tudo decidível antes, nada no dia):** Pro + compute Small + Spend Cap OFF + limites de Auth elevados · provedor de e-mail transacional + limite de envio subido · Google como botão principal · mídia no R2 com domínio próprio · plano pago do EAS · teste de carga.

## 6. Passo a passo — mídia no Cloudflare R2

1. Bucket R2 `perceva-media` na conta Cloudflare que já hospeda o site; domínio próprio `media.perceva.app` (zona já é Cloudflare) com cache de CDN.
2. `rclone sync` dos ~300 objetos do `learning-media` (Supabase) pro R2, com `--header-upload "Cache-Control: public, max-age=31536000, immutable"` (paths são imutáveis por construção — o CLI do Supabase nunca sobrescreve). Isso também corrige os objetos antigos com `max-age=3600`.
3. App: `app/lib/learningMedia.ts:16-17` → `MEDIA_BASE_URL = process.env.EXPO_PUBLIC_MEDIA_BASE_URL ?? <supabase>` (as linhas do banco guardam paths relativos ao bucket; zero migration). OTA (`/ota-update`, canal `preview` → `production`). Lembrar: `EXPO_PUBLIC_*` é inlined no bundle; nunca fazer `eas update` de checkout sem `app/.env.local`.
4. Pipeline: `tools/content-media/upload.mjs` chamando `wrangler r2 object put` (ou rclone) com cache imutável; atualizar `learning-drops/README.md`, `.claude/agents/learning-publisher.md`, `.claude/skills/content-drop/SKILL.md`, `tools/content-media/generate.mjs` (linha que imprime o comando de upload).
5. Player: `useCaching: true` no `VideoSource` (`app/components/learning/VideoPane.tsx`) — cache de 1 GB no aparelho, re-watch = zero egress. Nunca HLS.
6. Rollback: a constante de volta + OTA.

Alternativa sem trabalho: ficar no Supabase Pro e só ligar o `useCaching`. Custa US$25–70/mês até 25k usuários. A razão de ir pro R2 não é dinheiro, é desacoplar mídia da cota unificada de API/auth.

## 7. Controle de custos — rotina mensal

- Dashboard do Supabase: egress (origem vs cacheado), tamanho do banco, compute (IO budget, conexões).
- Storage: `select sum((metadata->>'size')::bigint) from storage.objects where bucket_id='learning-media'` via `supabase db query` ou Management API (`POST /v1/projects/{ref}/database/query`, header `User-Agent: supabase-cli/2.116.0`, senão 403).
- Cache: `curl -s -r 0-0 -D - <url> | grep -iE "cache-control|cf-cache-status"` num objeto vivo (GET, não HEAD).
- RevenueCat: MTR e fee. EAS: MAU de updates.
- Gatilhos: egress > 200 GB/mês só no Supabase → R2; compute com IO throttling → subir um degrau; qualquer campanha marcada → kit da seção 5 uma semana antes.

## 8. Fontes principais

Supabase pricing e docs de egress/storage (supabase.com/pricing; docs/guides/platform/manage-your-usage/egress; docs/guides/storage/uploads/file-limits; docs/guides/storage/cdn/*). Cloudflare R2 pricing (developers.cloudflare.com/r2/pricing). Cloudflare Stream pricing. Mux pricing. Bunny.net pricing. Gemini API pricing (ai.google.dev/gemini-api/docs/pricing), Veo docs (ai.google.dev/gemini-api/docs/veo), tokens (ai.google.dev/gemini-api/docs/tokens), speech (ai.google.dev/gemini-api/docs/speech-generation). Expo expo-video SDK 54 (docs.expo.dev/versions/latest/sdk/video). Gemini Notebook usage limits (support.google.com/gemininotebook/answer/17670842) e Notebook Enterprise API (docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks). RevenueCat State of Subscription Apps 2026.
