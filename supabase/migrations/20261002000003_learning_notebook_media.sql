-- migration: 20261002000003_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-02, segunda execução manual pedida pelo André
--          (.claude/agents/learning-notebook-runner.md): nova tomada dos 3 itens que
--          falharam a fidelidade na primeira execução do dia, agora com o texto da ideia
--          corrigido (20261002000002_learning_ideas_text_fixes) e a fonte "ideia 2 PT"
--          substituída no notebook antes de gerar, mais foco dirigido (§6b item 5).
--          A cota diária de "Resumo em Vídeo" acabou no segundo item; só glossary-circle
--          gerou, passou no portão de fidelidade (faixa de legendas a 1 fps × verso e corpo
--          da ideia) e entra aqui. jsonb_set cirúrgico no lado do vídeo de uma ideia, por
--          id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            glossary-circle · variedade-nao-volume · pt · "Por que Diferentes Vínculos Alteram o Risco de Resfriado" · 74

begin;

-- glossary-circle · variedade-nao-volume · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'variedade-nao-volume' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-circle/idea.2.pt.mp4',
               'duration_seconds', 74,
               'poster', 'glossary-circle/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-circle';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-circle'
      and i->>'id' = 'variedade-nao-volume'
      and i->'video'->'pt'->>'path' = 'glossary-circle/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-circle/variedade-nao-volume video.pt was not updated';
  end if;
end
$guard$;

commit;
