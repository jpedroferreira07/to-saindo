-- Ajustes pedidos pelos avisos do Supabase depois da migração inicial.

-- Função criada pelo próprio Supabase para "ativar RLS automaticamente" (dispara como event trigger).
-- Ninguém de fora precisa chamá-la pela API; o disparo automático não depende deste privilégio.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Chave estrangeira sem índice (aviso de desempenho).
create index reports_event_id_idx on public.reports (event_id);
