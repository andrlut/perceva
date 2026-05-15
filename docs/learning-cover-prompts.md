# Learning material — cover image prompts (Headway-style)

> Reference visual style: Headway / Blinkist app cards. Single flat
> illustration, one central subject, vibrant colored background, soft
> rounded shapes, no text, no logo, mobile-friendly 16:10 aspect.

## Style guide (paste before every prompt)

```
Flat vector illustration in a modern editorial style, minimal and warm.
One central subject, soft rounded shapes, gentle shading, no outlines.
Limited palette of 3–4 colors. No text, no logo, no watermark.
Painterly soft gradient background, subtle grain. 16:10 aspect ratio.
The vibe should feel like a Headway / Blinkist book-summary card —
inviting, contemplative, premium.
```

## Test prompts

Generate these 2 first to confirm the style works. If the result feels
right, the remaining 10 prompts (one per sub) follow the same pattern.

### 1. Sleep (sub `sleep`, dim `health`)

```
A single crescent moon resting softly on a cloud, surrounded by 3–4
glowing stars at varied sizes. Background: deep midnight-blue to dusty
violet gradient. Mood: peaceful, restorative, end-of-day. The moon is
the clear focal point — large, gently smiling or eyes closed.
```

### 2. Strength (sub `strength`, dim `body`)

```
A single black kettlebell at the center, slightly tilted, with a soft
glow around its handle. A small dumbbell rests behind it for depth.
Background: warm coral-to-burnt-orange gradient with a faint diagonal
"sweat drop" highlight. Mood: grounded, motivating, capable. No human
figure — just the iron.
```

## How to use the prompts

1. Paste the style guide block + one of the prompts into ChatGPT
   (DALL·E 3) or Midjourney.
2. Generate 2–3 variants per material; pick the strongest.
3. Save the chosen image as `<slug>.png` (e.g. `glossary-sleep.png`).
4. Upload to Supabase Storage bucket `learning-hero/`.
5. UPDATE the row: `update learning_material set hero_image_url =
   '<public-url>' where slug = 'glossary-<sub>';`

The `MaterialCover` component automatically swaps the generated gradient
cover for the real image when `hero_image_url` is set on a row.
