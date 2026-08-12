# LGPD × Retrô de humor (Opção A) — análise e minuta de consentimento

> Pesquisa de ago/2026 (lei vigente + atos ANPD 2022–2026). Guia de implementação
> para ligar a rotina de relatório com IA (Opção A) em conformidade. A Opção B
> (MCP conectado ao Claude pessoal do titular) tem seção própria no fim — é a de
> menor risco jurídico das duas.

## 1. Classificação: dados de humor + notas são SENSÍVEIS

- Art. 5º, II inclui "dado referente à saúde". Série longitudinal de humor
  (1–5 + tags de emoção) com finalidade de bem-estar = **saúde mental** — o
  entendimento consolidado (A29WP/ICO, importado pela doutrina brasileira) é
  que **contexto e inferência determinam a classificação**.
- A **nota de texto livre encerra a discussão**: diário íntimo pode conter
  qualquer categoria sensível (saúde, vida sexual, religião, terceiros).
- Consequência (Art. 11, I): consentimento **específico e destacado, para
  finalidades específicas** — tela própria, não parágrafo em política genérica.

## 2. Base legal

- **Consentimento é a única base viável** para dados sensíveis aqui. Legítimo
  interesse NÃO existe para sensíveis (só Art. 7º) — e o precedente Meta
  (medida preventiva ANPD, jul/2024) derrubou exatamente legítimo interesse
  para alimentar IA.
- **Não confiar no Art. 4º, I ("uso doméstico")**: app na Play Store + tier
  premium no schema descaracterizam "exclusivamente particular e não
  econômico". A Res. CD/ANPD 2/2022 já trata pessoa natural operando serviço
  como **agente de pequeno porte** (regime simplificado: sem DPO — basta canal
  de contato; registros simplificados). Cumprir direito nessa escala é barato.

## 3. Transferência internacional (Anthropic/EUA)

- Res. CD/ANPD 19/2024 regulamentou os Arts. 33–36; prazo das cláusulas-padrão
  venceu em 23/08/2025. **Única adequação vigente: UE/EEE (jan/2026). EUA NÃO
  têm adequação.**
- Caminho realista para app pequeno: **Art. 33, VIII — consentimento
  específico e EM DESTAQUE para a transferência**, distinto das demais
  finalidades (a minuta abaixo faz isso, com a menção aos EUA dentro do
  próprio texto do aceite).
- **Achado colateral**: se o projeto Supabase está em `us-east`, a base
  INTEIRA já é transferência internacional hoje — independente desta feature.
  Solução limpa a avaliar: migrar para `sa-east-1` (São Paulo); sobraria só o
  fluxo Anthropic para resolver via consentimento.

## 4. Requisitos operacionais

| Requisito | Fundamento | Implementação |
|---|---|---|
| Prova do aceite | Art. 8º §2º (ônus do controlador) | Gravar `term_version`, `accepted_at`, escopos, locale; texto de cada versão versionado |
| Revogação | Art. 8º §5º; Art. 18, IX | Toggle em Settings, gratuito; rotina para de ler no próximo ciclo |
| Relatórios já gerados | Art. 8º §5º + Art. 18, VI | Revogar NÃO apaga o passado — oferecer botão separado "apagar relatórios"; eliminação inclui transcripts locais |
| Granularidade | Art. 11, I | **3 toggles, não mais** (fadiga de consentimento invalida clareza): stats_only / ler notas / citar trechos |
| Menores | Art. 14 + Enunciado ANPD 2023 | <12: consentimento de responsável; 12–17: aceite + de-acordo de responsável e `ler notas` TRAVADO off (caso Meta: menores de 18 fora de IA) |

**Anthropic (obrigatório antes do 1º run):** na conta que roda a rotina,
desligar "Help improve Claude" (planos consumer treinam por padrão desde
set/2025, retenção até 5 anos com treinamento ligado) — ou usar API (termos
comerciais, sem treinamento). **O termo abaixo assume treinamento desligado；
se não for verdade, o termo fica falso (consentimento nulo, Art. 8º §3º).**

## 5. Direitos do titular a suportar

Acesso/exportação dos check-ins; eliminação (relatórios + transcripts locais);
informação nominal de compartilhamento (Anthropic/EUA, Supabase/AWS);
consequência de não consentir (existe modo stats_only); canal de contato
(login@perceva.app — dispensa DPO via Res. 2/2022).

## 6. Minuta do termo (tela de Settings, pt-BR)

> Declara transcripts locais com expurgo em 30 dias e treinamento Anthropic
> desligado — ajustar se a realidade for outra.

### Retrô do seu humor — como funciona e o que você autoriza

**O que é** — Uma vez por período (ex.: por mês), geramos um relatório em
texto sobre como seu humor evoluiu, para você ler aqui no app. Ele é só seu —
nenhum outro usuário vê.

**O que é lido** — Se você autorizar, o processo lê os seus check-ins de humor
do período: a nota (1–5), as tags de emoção e contexto e, **se você ligar a
opção abaixo, também as suas anotações de texto livre** — aquilo que você
escreveu como diário. Sabemos que isso é íntimo. Por isso essa opção é
separada e começa desligada.

**Quem processa (leia com atenção)**
1. Um processo automatizado roda no computador do mantenedor do Perceva
   (André), com acesso administrativo ao banco de dados. Na prática: a máquina
   dele lê seus check-ins do período para montar o relatório.
2. Para escrever o texto do relatório, esses dados são enviados ao **Claude,
   um serviço de inteligência artificial da Anthropic, processado nos Estados
   Unidos**. 🇺🇸 **Isso é uma transferência internacional dos seus dados**: os
   EUA não têm reconhecimento de proteção equivalente à lei brasileira (LGPD),
   e por isso pedimos seu consentimento específico para esse envio. A conta
   usada está configurada para que a Anthropic **não use seus dados para
   treinar modelos de IA**.

**Para que (e para mais nada)** — Finalidade única: gerar o seu relatório
pessoal de humor. Seus dados **não são vendidos, não viram anúncio, não
treinam IA, não são compartilhados com outras pessoas** e não são usados para
nenhuma outra finalidade. Ponto.

**O que fica guardado, e por quanto tempo**
- O relatório fica no banco do app até você apagar.
- **Transparência total:** a ferramenta que roda na máquina do mantenedor
  guarda um registro local da sessão de processamento (transcript), que pode
  conter trechos dos seus dados. Esses registros são apagados em até **30
  dias**.
- A Anthropic retém os dados enviados pelo prazo da política dela e depois os
  descarta; eles não são usados para treinamento.

**Modo alternativo sem texto** — Se você não quiser que suas anotações sejam
lidas, existe o modo **"só estatísticas"**: o relatório usa apenas as notas e
tags, calculado de forma automática, **sem IA e sem ler nenhuma palavra do que
você escreveu**.

**Você manda: revogar quando quiser** — Você pode desligar tudo isso a
qualquer momento aqui em Configurações, de graça e sem perguntas. Ao revogar:
os próximos relatórios param imediatamente. Os já gerados continuam no app até
você apagá-los — tem um botão pra isso logo abaixo. Se pedir a exclusão,
apagamos também os registros locais na máquina do mantenedor.

**Se você tem menos de 18 anos** — Menores de 12: precisa da autorização de um
responsável. De 12 a 17: você decide junto com um responsável, e a leitura das
anotações de texto fica desativada.

**Suas escolhas** *(toggles)*
- [ ] **Gerar meu retrô (só estatísticas)** — notas e tags, sem IA, sem ler texto.
- [ ] **Permitir leitura das minhas anotações de texto pela IA
      (Claude/Anthropic, EUA)** — relatório mais rico; suas palavras são
      processadas nos EUA.
- [ ] **Permitir citar trechos do que escrevi no relatório** — sem isso, a IA
      lê mas não repete suas palavras literalmente.

**Dúvidas ou pedidos sobre seus dados** — Fale com a gente:
**login@perceva.app**. Você pode pedir acesso, correção, cópia ou exclusão de
tudo a qualquer momento.

**Versão curta (texto do aceite):**

> ☑️ Li e autorizo o uso dos meus check-ins de humor, conforme as opções que
> marquei acima, **incluindo o envio dos dados selecionados para processamento
> pela Anthropic nos Estados Unidos**, apenas para gerar meu relatório
> pessoal. Posso mudar de ideia a qualquer momento em Configurações.
>
> **[Autorizar]** · Termo v1.0 — ago/2026

## 7. Checklist de implementação (quando a Opção A for construída)

**Banco:** tabela `mood_retro_consent` **append-only** (`character_id`,
`term_version`, `accepted_at`, `revoked_at`, `scope_read_notes`,
`scope_quote_excerpts`, `mode stats_only|ai_full`, `locale`); texto integral
de cada versão do termo versionado; RLS de DELETE nos relatórios (eliminação
self-service).

**Rotina (o enforcement é o script — a credencial admin bypassa RLS):** sem
consentimento vigente → pula o usuário; `stats_only` → caminho determinístico
sem tocar em `note`; `scope_read_notes=false` → **não seleciona a coluna**
(não é "ler e descartar"); `scope_quote_excerpts=false` → instrução no prompt
+ pós-validação de que o relatório não contém substrings das notas; expurgo de
transcripts ≤30 dias (tarefa agendada, não disciplina); treinamento Anthropic
desligado verificado antes de cada era de runs.

**App (Settings):** tela do termo com 3 toggles + aceite versionado;
re-consentir se `term_version` mudar (Art. 8º §6º); revogação de 1 toque +
botão "apagar relatórios existentes"; linha "Compartilhado com: Anthropic
(EUA), Supabase/AWS (hospedagem)"; fluxo de menor.

## 8. Opção B (MCP no Claude pessoal) — quadro muito mais leve

Quem envia os dados à Anthropic é **o próprio titular, na conta dele, por
iniciativa própria** — uso particular (aí sim o Art. 4º, I encaixa bem). O
Perceva apenas fornece acesso mediante pedido do titular (≈ portabilidade,
Art. 18, V). Obrigações práticas: (a) a **página de consentimento OAuth é o
momento de aviso** — "Você está conectando sua conta Claude pessoal. Suas
respostas e os dados consultados serão processados pela Anthropic (EUA) sob os
termos e configurações DA SUA conta — incluindo sua escolha sobre treinamento
de IA. O Perceva não vê suas conversas."; (b) escopo mínimo read-only;
(c) logar grant/revoke.

## Essencial vs. excesso de zelo (2–5 usuários)

- ✅ Essencial: termo específico/destacado com EUA em destaque; 3 toggles;
  registro versionado; revogação funcional; enforcement no script; expurgo de
  transcripts; treinamento desligado; canal de contato; trava de menor.
- ⚠️ Vale avaliar: migrar Supabase para `sa-east-1`; pós-validação anti-citação.
- ❌ Excesso nessa escala: RIPD formal, DPO nomeado, CPCs com Anthropic/
  Supabase, política multi-página, consultoria dedicada.

**Risco residual honesto:** a garantia da Opção A é comportamental (credencial
admin + transcript local), não técnica. O consentimento torna o desenho
**lícito**; a Opção B torna a confiança **desnecessária**. Se a feature
crescer além da família, o primeiro redesenho é mover a geração para ambiente
sem transcript persistente.

---

*Fontes principais: Lei 13.709/2018; Res. CD/ANPD 19/2024 (transferência
internacional) e 2/2022 (pequeno porte); adequação Brasil–UE (Res. 32,
jan/2026); Enunciado ANPD crianças/adolescentes (2023); caso Meta (2024);
Anthropic Consumer Terms update (set/2025); A29WP/ICO sobre wellbeing apps;
Supabase DPA.*
