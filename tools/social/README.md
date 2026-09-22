# tools/social — pipeline de conteúdo do Perceva

Gera os carrosséis da série **"Uma ideia com fonte"** (Instagram/TikTok) a partir das
ideias do Recanto, no cânone visual do Playbook. Leia **EDITORIAL.md antes de escrever
qualquer batch** — as regras editoriais moram lá.

## Setup (uma vez)

```bash
cd tools/social
npm install
```

## Gerar um lote

1. Escolher ideias não usadas (`used-ideas.json`) na tabela `learning_material.ideas`.
2. Escrever `batch.json` (formato documentado no topo de `carousel.js`), reescrevendo
   claim/mecanismo/fazer pros slides conforme EDITORIAL.md.
3. Rodar:

```bash
node carousel.js batch.json
```

Saída em `social/lote-AAAA-MM-DD/` + `used-ideas.json` atualizado (commitar).
O gerador valida campos e barra termos da lista negra mecânica; a validação editorial
fina (mito apresentado antes de desmontar, jargão fora da capa) é de quem escreve.

## Publicação

Manual, nos agendadores nativos: Meta Business Suite (Instagram, carrossel), TikTok
(modo foto), com as legendas de `legendas.md` do lote. Cadência: 2 posts/semana.
