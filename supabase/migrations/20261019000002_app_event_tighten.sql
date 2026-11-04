-- app_event: o grant padrão do Supabase dá ALL pra authenticated em toda
-- tabela nova (RLS-10 da auditoria). Sem política de select o cliente já via
-- zero linhas; aqui tira o privilégio de vez — só INSERT sobra.
revoke select, update, delete, truncate, references, trigger
  on public.app_event from authenticated;
