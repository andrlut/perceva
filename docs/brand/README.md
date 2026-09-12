# Playbook de marca do Perceva

Fonte da verdade de tudo que leva o nome Perceva para fora do app: site, loja, vídeos, posts, e-mail, notificações, imprensa. Versão 1, 12 de setembro de 2026. Editor-chefe: Claude, a pedido do André.

Página publicada (artifact): ver link no PR que criou esta pasta e em `~/.claude/projects/.../memory/project_brand-playbook.md`.

## Como ler

1. **`00-espinha.md`** — o documento-mãe. Doze seções decididas: tese, metodologia (3 pilares × 3 motores, com as correções que a evidência pediu), veredito sobre "all-in-one self-care", público (Marina / Dan), posicionamento e as cinco frases, message house, vocabulário canônico e lista negra, GTM em três fases, sistema de conteúdo, cortes, decisões do dono, correções de produto. **Se um entregável contradiz a espinha, a espinha vence.**
2. **Entregáveis prontos para uso** (derivam da espinha):
   - `roteiros.md` — 10 roteiros em pt-BR + 4 em en-US, prontos para gravar.
   - `site-v5.md` — especificação e copy final do perceva.app v5 (pt + en).
   - `aso-loja.md` — pacote de loja reescrito (Play agora, App Store pronta), com contagem de caracteres.
   - `conteudo-social.md` — sistema de conteúdo para Instagram, TikTok e Shorts: séries, calendário de 30 dias, 40 ganchos, respostas prontas, checklist.
   - `gtm-90-dias.md` — plano operacional de 90 dias, semana a semana.
   - `base-cientifica.md` — o que a evidência sustenta em cada pilar e motor, com força honesta e referências.
3. **`research/`** — os 13 dossiês de pesquisa de 12/09/2026 (evidência dos 3 pilares e 3 motores; mercado; público; GTM; vídeo curto; padrão de brand book; fidelidade produto × discurso; vocabulário) e o brief de identidade de agosto. Cada dossiê tem tabela de alegações com força (forte / moderada / fraca / contestada), fontes com DOI/URL e a seção "o que não encontrei".

## Regras que valem para qualquer peça

- Nada da **lista negra** da espinha (§7), nem parafraseado.
- Toda alegação com número ou ciência vem da **biblioteca aprovada** (`base-cientifica.md`), com autor e ano. Sem "baseado em ciência".
- Instrumentos sempre nomeados e com "inspirado em / baseado em": Big Five (120 itens), Valores de Schwartz, Apego (ECR-R), Forças de caráter. Nunca "teste psicológico" nem "avaliação psicológica" (termos de uso restrito a psicólogos no Brasil).
- O Conector é sempre "conecte o app ao seu assistente de IA (hoje, Claude)". Nunca mentor, coach, terapeuta.
- Social não existe: zero presença em site, loja, anúncio ou vídeo.
- Nunca data de iOS; nunca "assine" antes de uma compra de teste confirmada.
- en-US é escrito nativo, nunca traduzido.

## Como regenerar a página

```bash
python docs/brand/tools/build_playbook.py
```

Precisa do pacote `markdown` (`pip install markdown`). Gera `docs/brand/dist/playbook.html` (a pasta `dist/` é ignorada pelo git). Publique o HTML como artifact ou sirva de onde preferir; a página é single-file e só depende do Google Fonts.

## Como atualizar

Mudou uma decisão: edite o markdown (nunca só a página), regenere, republique e registre a data no rodapé da espinha. Próxima revisão prevista: depois da Fase 0 do GTM (listagem pública da Play e site v5 no ar).
