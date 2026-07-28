# fonts (opcional)

O infográfico usa **Manrope** (fonte da marca Perceva). Se ela não estiver aqui
nem instalada no sistema, o resvg cai pra **Segoe UI** — ainda fica limpo.

Pra fidelidade total de marca, baixe o Manrope (OFL, redistribuível —
https://fonts.google.com/specimen/Manrope) e coloque os `.ttf` aqui:

```
tools/content-media/fonts/
├── Manrope-ExtraBold.ttf   (peso 800 — headline, numerais, PERCEVA)
├── Manrope-Bold.ttf        (peso 700 — títulos dos pontos)
└── Manrope-Medium.ttf      (peso 500 — corpo)
```

O `generate.mjs` carrega qualquer `.ttf` desta pasta automaticamente
(`font.fontDirs`). Não precisa configurar nada além de soltar os arquivos.

Os `.ttf` não são versionados por padrão (binários) — cada máquina baixa os
seus. Se quiser garantir render idêntico entre contribuidores, comitá-los é OK
(a licença OFL permite).
