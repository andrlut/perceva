# Delta de lojas — check-in de humor (texto livre) + resumos por IA

> Decisões de 2026-08-28 (conversa Artur × Claude). Complementa o
> `00-playbook.md` (formulários base) e o `../retro-lgpd-consentimento.md`
> (base legal + minuta de consentimento). Puxar este doc quando a rotina de
> resumo por IA for ligada — os formulários das lojas DEVEM ser atualizados
> na mesma janela, não depois.

## Decisão central: tratamento dividido

A decisão travada do playbook ("instrumentos = wellness/User Content, nunca
Health") **continua valendo para os instrumentos psicométricos**. Mas o
check-in de humor com nota de texto livre + resumo gerado por IA é outra
categoria: a análise LGPD já concluiu que é dado de saúde mental ("a nota de
texto livre encerra a discussão"), e o resumo é inferência sobre estado
emocional. Para as lojas:

- **Instrumentos** (Big Five, Schwartz, ECR-R, DISC, Forças, Tipos,
  Avaliação): seguem como User Content. Sem mudança.
- **Humor (1–5 + tags + texto livre) e resumos de IA**: declarar como
  **Health info** nas duas lojas. Subdeclarar é o risco maior — remoção por
  formulário incompatível; declarar o TIPO de dado saúde não muda a
  CATEGORIA do app (ver abaixo).

## Play Console — Data Safety (delta item a item)

Adicionar ao formulário existente:

| Pergunta | Resposta |
|---|---|
| Health info → collected? | **Sim** (mood score, tags, nota livre, resumo gerado) |
| Health info → shared? | **Não** — envio à API de IA (Anthropic ou equivalente) é *service provider processing on developer's behalf*, exenção explícita da definição de "sharing" do Play. Vale SOMENTE com API sob termos comerciais (sem treinamento). |
| Purpose | App functionality |
| Optional? | **Sim** — feature inteira é opt-in (tela de consentimento própria; modo stats_only existe) |
| Encrypted in transit? | Sim |
| Deletable? | Sim — delete-account em cascata + botão separado "apagar relatórios" (exigência LGPD, Art. 18) |

## Play Console — política de IA generativa

Conteúdo gerado por IA visível ao usuário (o resumo) exige, mesmo sendo
privado do próprio titular:

1. Declarar no questionário de **App content** que o app contém conteúdo
   gerado por IA;
2. **Mecanismo in-app de report** no conteúdo gerado — um "algo errado com
   este resumo?" na tela do relatório cumpre.

## Apple — Nutrition Label (quando o iOS entrar em revisão com a feature)

- Adicionar tipo **Health** (mood + notas + resumos), *linked to identity*
  (conta), *not used for tracking*.
- "Data Used to Track You" continua vazio.
- A política de privacidade DEVE nomear o processamento por IA e o operador
  **antes** da submissão — App Review pergunta sobre uso de IA com dados do
  usuário; divergência = rejeição 5.1.1.

## O que NÃO muda

- **Categoria do app**: Produtividade/Estilo de vida. Declarar dado de saúde
  ≠ virar app de saúde — e não queremos a categoria Health & Fitness
  (escrutínio médico, Apple 5.1.3).
- Postura sem tracking/ads/analytics de terceiros: intacta. IA como
  operador não é tracking.

## Pré-requisitos antes do 1º run do agente (resumo; detalhes no doc LGPD)

- [ ] Tela de consentimento específica e destacada (minuta pronta no doc
      LGPD; 3 toggles: stats_only / ler notas / citar trechos; prova de
      aceite versionada; menores travados)
- [ ] Menção em destaque à transferência internacional (EUA) — vale para a
      Anthropic E para o próprio banco (projeto Supabase em us-east-2)
- [ ] API comercial sem treinamento (nunca conta consumer com "Help improve
      Claude" ligado — invalida o consentimento)
- [ ] Política de privacidade atualizada (repo pt/en + privacy.html do site):
      diário de humor, processamento por IA, operador nomeado, hosting EUA
- [ ] Botão de report no resumo (política GenAI do Play)
- [ ] Data Safety + App content atualizados NA MESMA janela do rollout

## Notas de defasagem do playbook (para a próxima revisão dele)

Escritas antes destas mudanças de 2026-08:

- "Sem IAP/assinatura real no v1" — **defasado**: Play Billing +
  RevenueCat ativos desde ago/2026. Revisar se "Purchases → Purchase
  history" precisa entrar no Data Safety/Nutrition Label (RevenueCat como
  operador guarda histórico de assinatura).
- "Delete Account é fake / bloqueador" — **resolvido**: edge function
  `delete-account` real e no ar.
- "Notificações locais apenas, sem push token" — conferir: capability de
  push + APNs key existem desde o build iOS; se push real ligar, revisar.
