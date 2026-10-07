# Manifesto v2: textos que vão junto do vídeo

Este arquivo guarda o que não entra no vídeo e acompanha ele: a legenda do
post e a base científica, que fica **fora** do vídeo por decisão do André
(07/10/2026). O vídeo vende os 3 módulos sem citar pesquisa, e a base vai
aqui, na legenda e nos comentários.

## Cortes

| Composição | Uso | Gancho | Final |
|---|---|---|---|
| `Manifesto` | Fixado do Insta, Reels/TikTok orgânico | "Seus hábitos estão te treinando. Todo dia. Pra ser quem?" | PERCEVA · Grátis pra começar · Google Play |
| `ManifestoB` | Anúncio (teste A/B dos primeiros 3 s, mesmo corpo) | "Você sabe o que deveria fazer. Mas tá fazendo?" | igual |
| `ManifestoApp` | Abertura do tutorial no app (o player abre mudo; a legenda carrega) | igual ao A | "Vamos começar?" |

O render falha se algum corte passar de 60 s (`maxSeconds` em `src/films.ts`).

## Legenda do post (Instagram / TikTok)

> Seus hábitos estão te treinando. A pergunta é: pra ser quem?
>
> O Perceva junta três coisas que sempre viveram separadas:
>
> • **Se conhecer**: testes de personalidade, valores e vínculo, e uma nota pra cada área da sua vida.
> • **Praticar**: um toque por hábito, e cada toque vira moeda pra recompensas que você mesmo escolhe. Pulou um dia? Nada zera.
> • **Aprender**: uma ideia curta por vez, sempre com fonte.
>
> Tudo isso desenha o seu Emblema, o retrato de quem você está se tornando.
>
> Grátis pra começar, no Google Play. Link na bio.
>
> De onde vem a ideia: repetir pequenos comportamentos pode mudar traços de personalidade, e quem convive com você percebe (Stieger et al., PNAS, 2021). Mas isso só acontece em quem completa o que se propôs (Hudson et al., 2019). E tentar lembrar fixa mais do que reler (Roediger & Karpicke, 2006).
>
> #perceva #hábitos #autoconhecimento #appdehabitos

As alegações acima são as nº 11 e 14 de `docs/brand/base-cientifica.md`.
Use só as que estão lá, com autor e ano.

## Antes de impulsionar

- **Lojas:** o final diz só "Google Play". Se o app ainda não estiver na App
  Store, segmente o anúncio só pra Android. Se estiver, troque o texto do
  cartão final em `src/manifesto/scenes.tsx` (cena `Sign`).
- **Anúncio:** use o botão "Instalar" da plataforma. "Link na bio" vale só no
  orgânico.
- **O que não existe mais:** o "Espelho" (contorno de "como me vejo" sobre a
  Praticada) saiu do app no #423 e não aparece no v2. O clímax é o Emblema,
  que existe no app (avatar do Eu e /perfil).
