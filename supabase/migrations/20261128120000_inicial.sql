-- Tô saindo: banco inicial (docs/PLANO-APP.md, seção 8).
-- Regra de acesso: o navegador só LÊ ocorrências ativas. Toda escrita passa pelo servidor
-- com a chave secreta (service_role), que ignora o RLS.

-- ---------------------------------------------------------------------------
-- events: o que aparece no mapa e no feed
-- ---------------------------------------------------------------------------
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in (
                  'tiroteio', 'assalto',
                  'transito', 'acidente', 'transporte',
                  'chuva', 'alagamento',
                  'arvore_caida', 'luz_queimada', 'buraco',
                  'noticia', 'outro')),
  -- Derivada do tipo para nunca ficar inconsistente com ele.
  categoria     text generated always as (
                  case
                    when tipo in ('tiroteio', 'assalto') then 'seguranca'
                    when tipo in ('transito', 'acidente', 'transporte') then 'mobilidade'
                    when tipo in ('chuva', 'alagamento') then 'clima'
                    when tipo in ('arvore_caida', 'luz_queimada', 'buraco') then 'zeladoria'
                    else 'geral'
                  end) stored,
  titulo        text not null check (char_length(titulo) between 3 and 140),
  descricao     text check (descricao is null or char_length(descricao) <= 500),
  -- Limite aproximado da cidade do Rio (o app é só do Rio).
  lat           double precision not null check (lat between -23.09 and -22.74),
  lng           double precision not null check (lng between -43.80 and -43.09),
  bairro        text not null check (char_length(bairro) between 2 and 80),
  inicio        timestamptz not null,                 -- hora do ocorrido
  expira_em     timestamptz not null,
  fonte         text not null check (char_length(fonte) between 2 and 60),
  url           text check (url is null or url ~ '^https?://'),
  origem        text not null check (origem in ('oficial', 'noticia', 'usuario')),
  confianca     text not null default 'relato' check (confianca in ('oficial', 'confirmado', 'relato')),
  severidade    smallint not null default 1 check (severidade between 1 and 3),
  confirmacoes  integer not null default 1 check (confirmacoes >= 1),
  id_externo    text,                                 -- id na fonte, para o coletor não duplicar
  exemplo       boolean not null default false,       -- dado fictício da demo
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint events_expira_depois_do_inicio check (expira_em > inicio),
  constraint events_fonte_id_externo_unico unique (fonte, id_externo)
);

create index events_expira_em_idx on public.events (expira_em);
create index events_bairro_expira_idx on public.events (bairro, expira_em);
create index events_tipo_expira_idx on public.events (tipo, expira_em);

-- Regra do plano (seção 6): relato com 2+ confirmações vira "confirmado".
-- Fica no banco para valer em qualquer caminho de escrita.
create or replace function public.events_antes_de_gravar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.confianca = 'relato' and new.confirmacoes >= 2 then
    new.confianca := 'confirmado';
  end if;
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger events_antes_de_gravar
before insert or update on public.events
for each row execute function public.events_antes_de_gravar();

-- ---------------------------------------------------------------------------
-- reports: entrada bruta dos usuários (nunca lida pelo navegador)
-- ---------------------------------------------------------------------------
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  texto            text not null check (char_length(texto) between 5 and 280),
  tipo_sugerido    text,
  lat              double precision not null check (lat between -23.09 and -22.74),
  lng              double precision not null check (lng between -43.80 and -43.09),
  dispositivo_hash text not null check (char_length(dispositivo_hash) between 16 and 128),
  ip_hash          text check (ip_hash is null or char_length(ip_hash) between 16 and 128),
  status           text not null default 'pendente'
                   check (status in ('pendente', 'publicado', 'juntado', 'recusado')),
  event_id         uuid references public.events (id) on delete set null,
  motivo           text check (motivo is null or char_length(motivo) <= 200),
  criado_em        timestamptz not null default now()
);

-- Para o limite de 5 reportes a cada 10 min por dispositivo e por IP (seção 9).
create index reports_dispositivo_criado_idx on public.reports (dispositivo_hash, criado_em desc);
create index reports_ip_criado_idx on public.reports (ip_hash, criado_em desc);

-- ---------------------------------------------------------------------------
-- confirmations: "Eu também vi" (extra). Um dispositivo confirma uma vez só.
-- ---------------------------------------------------------------------------
create table public.confirmations (
  event_id         uuid not null references public.events (id) on delete cascade,
  dispositivo_hash text not null check (char_length(dispositivo_hash) between 16 and 128),
  criado_em        timestamptz not null default now(),
  primary key (event_id, dispositivo_hash)
);

-- ---------------------------------------------------------------------------
-- Acesso (RLS). O projeto foi criado com "conceder acesso automático a tabelas novas",
-- então os privilégios são definidos aqui de forma explícita.
-- ---------------------------------------------------------------------------
alter table public.events        enable row level security;
alter table public.reports       enable row level security;
alter table public.confirmations enable row level security;

revoke all on public.events, public.reports, public.confirmations from anon, authenticated;
grant select on public.events to anon, authenticated;

-- Leitura pública só do que ainda vale; expirado some do mapa e do feed.
create policy "ocorrencias ativas sao publicas"
on public.events
for select
to anon, authenticated
using (expira_em > now());

-- reports e confirmations: sem política = nenhum acesso pelo navegador.
-- Só o servidor (service_role) lê e escreve.

-- ---------------------------------------------------------------------------
-- Tempo real: o app assina INSERT e UPDATE de events (seção 8.3).
-- O Realtime respeita a política de leitura acima.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.events;
