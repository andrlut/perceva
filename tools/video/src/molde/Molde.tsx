import React from 'react';
import { AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, staticFile } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { Background, Lente } from '../components';
import { Captions } from '../Captions';
import { FADE, FPS, Timing, Voice, buildTimeline } from '../timeline';
import { ACTIVE } from '../identidade/active';
import { IdentityContext } from '../identidade/context';
import { OPTIONS } from '../identidade';
import { VariantContext } from '../variant';
import { MOLDE_SCENES, MS, SpecContext } from './scenes';
import type { MoldeSpec } from './spec';
import { SfxContext, Sfx } from './sfx';
import { passagem, passagens } from './transicao';

/** Teto do vídeo de ideia: passou disso, o render falha (corte o roteiro). */
export const MOLDE_MAX_SECONDS = 60;

export type MoldeProps = {
  specKey: string;
  spec: MoldeSpec | null;
  scenes: MS[];
  /** "door": abertura dentro da porta (Porta.tsx) — legenda centrada e na altura da do tutorial */
  captions?: 'door';
  /** Id de uma opção de src/identidade (comparação); sem ele, a identidade ativa. */
  identity?: string;
  /** Efeitos sonoros por baixo da voz (src/molde/sfx.tsx). Sem ele, silêncio como sempre. */
  sfx?: boolean;
};

/** A legenda da abertura na porta fica onde fica a do tutorial (Tour.tsx CAPTION_TOP). */
export const DOOR_CAPTION_TOP = 1548;

export const calculateMoldeMetadata: CalculateMetadataFunction<MoldeProps> = async ({ props }) => {
  const dir = `molde/${props.specKey}`;
  const spec: MoldeSpec = await (await fetch(staticFile(`${dir}/spec.json`))).json();
  // prévia sem voz (`molde.mjs build --silent`): tempos estimados pelo texto, num arquivo à parte
  // (o timings.json da voz gravada nunca é sobrescrito por estimativa)
  const timings: Timing[] = await (await fetch(staticFile(`${dir}/${spec.silent ? 'timings.silent.json' : 'timings.json'}`))).json();
  // voz medida (fase 2, `molde.mjs` grava antes de stills/render): as deixas ancoram nas pausas reais
  const voices: Record<string, Voice & { dur?: number }> = spec.silent ? {} : await fetch(staticFile(`${dir}/pauses.json`)).then((r) => (r.ok ? r.json() : {}), () => ({}));
  // medição de outra tomada (a fala foi regravada e ninguém mediu de novo): a duração não bate com o
  // timings.json — volta pra estimativa em vez de ancorar nas pausas velhas
  const fresh = (id: string) => {
    const v = voices[id];
    const t = timings.find((x) => x.id === id);
    return !!v && !!t && v.dur !== undefined && Math.abs(v.dur - t.seconds) <= 0.05;
  };
  const { scenes, total } = buildTimeline(spec.lines.map((l) => (fresh(l.id) ? { ...l, voice: voices[l.id] } : l)), timings);
  if (total > MOLDE_MAX_SECONDS * FPS) {
    throw new Error(`${props.specKey}: ${(total / FPS).toFixed(1)} s passa do teto de ${MOLDE_MAX_SECONDS} s — corte o roteiro`);
  }
  return { durationInFrames: total, props: { ...props, spec, scenes: scenes as MS[] } };
};

/** Vídeo de ideia montado a partir de um spec: cenas do molde + voz por fala + legenda. */
export const Molde: React.FC<MoldeProps> = ({ specKey, spec, scenes, captions, identity, sfx = false }) => {
  if (!spec) return null;
  const skip = scenes.filter((s) => s.scene === 'verso').map((s) => s.id);
  const who = identity ? OPTIONS.find((o) => o.id === identity) : ACTIVE;
  if (!who) throw new Error(`identidade desconhecida: ${identity} (tem: ${OPTIONS.map((o) => o.id).join(', ')})`);
  const kinds = passagens(scenes);
  return (
    <IdentityContext.Provider value={who}>
    <SfxContext.Provider value={sfx && !spec.silent}>
    <SpecContext.Provider value={spec}>
      <VariantContext.Provider value="app">
        <AbsoluteFill>
          <Background />
          <TransitionSeries>
            {scenes.map((s, i) => {
              const Comp = MOLDE_SCENES[s.scene];
              if (!Comp) throw new Error(`cena desconhecida: ${s.scene}`);
              return (
                <React.Fragment key={s.id}>
                  {i > 0 ? (
                    // a passagem PRA esta cena (política em transicao.tsx: mergulho, hexa só no verso, um soco)
                    <TransitionSeries.Transition presentation={passagem(kinds[i] ?? 'fade', s.props?.camera)} timing={linearTiming({ durationInFrames: FADE })} />
                  ) : null}
                  <TransitionSeries.Sequence durationInFrames={s.frames} name={`${s.id}·${s.scene}`}>
                    <Comp s={s} />
                  </TransitionSeries.Sequence>
                </React.Fragment>
              );
            })}
          </TransitionSeries>
          {spec.silent
            ? null
            : scenes.map((s) => (
                <Sequence key={s.id} from={s.start + s.lead} durationInFrames={s.speech + 30} name={`voz:${s.id}`}>
                  <Audio src={staticFile(`molde/${specKey}/${s.id}.mp3`)} />
                </Sequence>
              ))}
          {/* som das passagens: whoosh nas que andam, subida curta antes do verso */}
          {scenes.map((s, i) =>
            i === 0 ? null : s.scene === 'verso' ? (
              <Sfx key={`sfx-${s.id}`} at={s.start - 30} name="riser" />
            ) : ['chicote', 'desliza', 'zoom'].includes(kinds[i] ?? 'fade') ? (
              <Sfx key={`sfx-${s.id}`} at={s.start - 6} name="whoosh" gain={kinds[i] === 'zoom' ? 0.6 : 1} />
            ) : null,
          )}
          {/* grão + vinheta presos ao quadro (na porta, quem põe é a Porta, por cima das duas partes) */}
          {captions === 'door' ? null : <Lente />}
          {captions === 'door' ? (
            <Captions scenes={scenes} skip={skip} top={DOOR_CAPTION_TOP} frame="door" />
          ) : (
            <Captions scenes={scenes} skip={skip} top={1440} />
          )}
        </AbsoluteFill>
      </VariantContext.Provider>
    </SpecContext.Provider>
    </SfxContext.Provider>
    </IdentityContext.Provider>
  );
};
