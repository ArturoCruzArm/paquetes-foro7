-- Foro 7 Producciones - esquema normalizado para cotizador
-- Objetivo: una sola fuente de verdad para servicios, productos, paquetes,
-- horas por servicio y cada decision del cliente.

create extension if not exists pgcrypto;

create table if not exists pricing_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  version_slug text not null unique,
  label text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists service_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references service_groups(id),
  slug text not null unique,
  name text not null,
  unit text not null check (unit in ('hour','event','session','item')),
  base_price numeric(10,2) not null default 0,
  price_per_unit numeric(10,2) not null default 0,
  min_units numeric(8,2) not null default 0,
  is_primary boolean not null default false,
  depends_on_service_id uuid references services(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  max_discount_percent numeric(5,2),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references product_groups(id),
  slug text not null unique,
  name text not null,
  unit text not null check (unit in ('item','photo','page','event','hour')),
  base_price numeric(10,2) not null default 0,
  price_per_unit numeric(10,2) not null default 0,
  included_quantity numeric(8,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_segments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  default_hours numeric(8,2) not null default 0,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists discount_rules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  scope text not null check (scope in ('services','hours','products','package','promotion')),
  rule_type text not null check (rule_type in ('percent_per_service','percent_by_hours','fixed_percent','cap')),
  condition_json jsonb not null default '{}'::jsonb,
  percent numeric(5,2) not null default 0,
  cap_percent numeric(5,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  badge text,
  sort_order integer not null unique,
  base_hours numeric(8,2) not null default 0,
  base_session_hours numeric(8,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id) on delete cascade,
  service_id uuid references services(id),
  product_id uuid references products(id),
  segment_id uuid references event_segments(id),
  quantity numeric(10,2) not null default 1,
  uses_selected_hours boolean not null default false,
  notes text,
  check ((service_id is not null and product_id is null) or (service_id is null and product_id is not null))
);

create unique index if not exists package_items_service_once
  on package_items(package_id, service_id, coalesce(segment_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where service_id is not null;

create unique index if not exists package_items_product_once
  on package_items(package_id, product_id)
  where product_id is not null;

create table if not exists quote_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  client_name text,
  client_phone text,
  event_type text,
  source text not null default 'builder',
  selected_package_id uuid references packages(id),
  status text not null default 'draft' check (status in ('draft','quoted','sent','won','lost','archived')),
  total_hours numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_segments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quote_sessions(id) on delete cascade,
  segment_id uuid not null references event_segments(id),
  active boolean not null default true,
  start_time time,
  end_time time,
  duration_hours numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (quote_id, segment_id)
);

create table if not exists quote_service_hours (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quote_sessions(id) on delete cascade,
  service_id uuid not null references services(id),
  segment_id uuid references event_segments(id),
  hours numeric(8,2) not null default 0,
  unit_price numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (quote_id, service_id, segment_id)
);

create unique index if not exists quote_service_hours_once_by_segment
  on quote_service_hours(quote_id, service_id, segment_id)
  where segment_id is not null;

create unique index if not exists quote_service_hours_once_no_segment
  on quote_service_hours(quote_id, service_id)
  where segment_id is null;

create table if not exists quote_products (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quote_sessions(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (quote_id, product_id)
);

create table if not exists quote_discounts (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quote_sessions(id) on delete cascade,
  discount_rule_id uuid not null references discount_rules(id),
  percent numeric(5,2) not null default 0,
  amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (quote_id, discount_rule_id)
);

create table if not exists quote_totals (
  quote_id uuid primary key references quote_sessions(id) on delete cascade,
  retail_total numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  final_total numeric(10,2) not null default 0,
  savings_percent numeric(5,2) not null default 0,
  calculated_at timestamptz not null default now()
);

create table if not exists quote_decisions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quote_sessions(id) on delete cascade,
  session_token text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quote_decisions_quote_created_idx on quote_decisions(quote_id, created_at desc);
create index if not exists quote_decisions_token_created_idx on quote_decisions(session_token, created_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at before update on services
for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
for each row execute function set_updated_at();

drop trigger if exists packages_set_updated_at on packages;
create trigger packages_set_updated_at before update on packages
for each row execute function set_updated_at();

drop trigger if exists quote_sessions_set_updated_at on quote_sessions;
create trigger quote_sessions_set_updated_at before update on quote_sessions
for each row execute function set_updated_at();

-- Semillas de catalogo actual. Los ON CONFLICT evitan duplicados.
insert into pricing_catalog_versions(version_slug, label, is_active) values
('foro7-2026-04', 'Foro 7 abril 2026', true)
on conflict (version_slug) do update set label = excluded.label, is_active = excluded.is_active;

insert into service_groups(slug, name, sort_order) values
('photo', 'Fotografia', 10),
('video', 'Video', 20),
('drone', 'Dron', 30),
('live', 'Transmision en vivo', 40),
('web', 'Web e invitacion', 50)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into product_groups(slug, name, max_discount_percent, sort_order) values
('prints', 'Fotos impresas', 25, 10),
('frames', 'Ampliaciones con marco', 25, 20),
('albums', 'Fotolibros', 25, 30),
('delivery', 'USB y cajas', 25, 40),
('video_edits', 'Edicion de video', 35, 50),
('web', 'Web', 35, 60)
on conflict (slug) do update set name = excluded.name, max_discount_percent = excluded.max_discount_percent;

insert into event_segments(slug, name, default_hours, sort_order) values
('session', 'Sesion previa', 1, 10),
('home', 'Casa / arreglo / salida', 1, 20),
('ceremony', 'Ceremonia religiosa o civil', 1, 30),
('party', 'Fiesta / recepcion', 4, 40),
('total', 'Cobertura total del evento', 0, 99)
on conflict (slug) do update set name = excluded.name, default_hours = excluded.default_hours, sort_order = excluded.sort_order;

insert into services(group_id, slug, name, unit, base_price, price_per_unit, min_units, is_primary) values
((select id from service_groups where slug='photo'), 'photo_hour', 'Cobertura fotografica', 'hour', 0, 600, 1, true),
((select id from service_groups where slug='video'), 'video_hour', 'Cobertura de video', 'hour', 0, 600, 1, true),
((select id from service_groups where slug='drone'), 'drone_event', 'Dron por evento completo', 'event', 2500, 0, 1, true),
((select id from service_groups where slug='drone'), 'drone_hour', 'Dron por hora', 'hour', 0, 1200, 1, true),
((select id from service_groups where slug='live'), 'live_hour', 'Transmision en vivo', 'hour', 0, 900, 1, true),
((select id from service_groups where slug='web'), 'web_gallery', 'Galeria web privada', 'event', 800, 0, 1, false),
((select id from service_groups where slug='web'), 'web_invitation_full', 'Invitacion web completa', 'event', 2000, 0, 1, false)
on conflict (slug) do update set name = excluded.name, unit = excluded.unit, base_price = excluded.base_price, price_per_unit = excluded.price_per_unit, is_primary = excluded.is_primary;

insert into products(group_id, slug, name, unit, base_price, price_per_unit, included_quantity) values
((select id from product_groups where slug='prints'), 'prints_5x7', 'Fotos impresas 5x7', 'photo', 220, 7, 0),
((select id from product_groups where slug='frames'), 'frame_11x14', 'Ampliacion 11x14 con marco', 'item', 600, 0, 1),
((select id from product_groups where slug='frames'), 'frame_16x20', 'Ampliacion 16x20 con marco', 'item', 900, 0, 1),
((select id from product_groups where slug='frames'), 'frame_20x24', 'Ampliacion 20x24 con marco', 'item', 1200, 0, 1),
((select id from product_groups where slug='frames'), 'frame_24x32', 'Ampliacion 24x32 con marco', 'item', 1700, 0, 1),
((select id from product_groups where slug='albums'), 'photobook_combo', 'Fotolibro 12x24 + caja + mini', 'item', 3400, 0, 1),
((select id from product_groups where slug='delivery'), 'usb_basic', 'USB normal', 'item', 150, 0, 1),
((select id from product_groups where slug='delivery'), 'photo_box', 'Caja para fotos', 'item', 100, 0, 1),
((select id from product_groups where slug='video_edits'), 'video_complete', 'Video completo del evento', 'hour', 1200, 250, 0),
((select id from product_groups where slug='video_edits'), 'video_summary', 'Video resumen', 'hour', 1200, 150, 0),
((select id from product_groups where slug='video_edits'), 'projection_clip', 'Clip para proyeccion en salon', 'hour', 1000, 250, 0),
((select id from product_groups where slug='video_edits'), 'cinematic_movie', 'Pelicula cinematografica', 'hour', 3000, 400, 0),
((select id from product_groups where slug='web'), 'facebook_album', 'Album de fotos en Facebook', 'event', 500, 0, 1),
((select id from product_groups where slug='web'), 'web_selector', 'Selector web de fotos', 'event', 1500, 0, 1),
((select id from product_groups where slug='video_edits'), 'reel_vertical', 'Reel vertical', 'item', 700, 0, 1),
((select id from product_groups where slug='video_edits'), 'custom_song', 'Cancion personalizada adicional', 'item', 700, 0, 1)
on conflict (slug) do update set name = excluded.name, base_price = excluded.base_price, price_per_unit = excluded.price_per_unit;

insert into discount_rules(slug, name, scope, rule_type, condition_json, percent, cap_percent) values
('primary_services_10_each', '10% por cada servicio principal', 'services', 'percent_per_service', '{"per_service":10}', 10, null),
('hours_3_to_6', 'Descuento por horas contratadas', 'hours', 'percent_by_hours', '{"3":5,"4":10,"5":15,"6":20}', 0, 20),
('cap_general_60', 'Tope general 60%', 'package', 'cap', '{}', 0, 60),
('cap_services_45', 'Tope servicios principales 45%', 'services', 'cap', '{}', 0, 45),
('cap_products_25', 'Tope fisicos 25%', 'products', 'cap', '{}', 0, 25),
('cap_video_edit_35', 'Tope edicion 35%', 'products', 'cap', '{"group":"video_edits"}', 0, 35)
on conflict (slug) do update set name = excluded.name, condition_json = excluded.condition_json, cap_percent = excluded.cap_percent;

insert into packages(slug, name, badge, sort_order, base_hours, base_session_hours) values
('esencial', 'Esencial', 'digital', 10, 4, 1),
('basico', 'Basico', 'popular', 20, 6, 1),
('clasico', 'Clasico', 'recomendado', 30, 8, 1),
('plus', 'Plus', 'web incluida', 40, 10, 1),
('premium', 'Premium', 'lucido', 50, 12, 1),
('master', 'Master', 'sin limite', 60, 12, 1)
on conflict (slug) do update set name = excluded.name, badge = excluded.badge, sort_order = excluded.sort_order, base_hours = excluded.base_hours;


-- Permisos y RLS para usar anon key publica sin exponer cotizaciones ajenas.
grant usage on schema public to anon, authenticated;
grant select on pricing_catalog_versions, service_groups, services, product_groups, products, event_segments, discount_rules, packages, package_items to anon, authenticated;
grant insert, select, update on quote_sessions, quote_segments, quote_service_hours, quote_products, quote_discounts, quote_totals, quote_decisions to anon, authenticated;

create or replace function f7_request_session_token()
returns text language sql stable as $$
  select nullif(current_setting('request.headers', true)::jsonb ->> 'x-f7-session-token', '')
$$;

alter table quote_sessions enable row level security;
alter table quote_segments enable row level security;
alter table quote_service_hours enable row level security;
alter table quote_products enable row level security;
alter table quote_discounts enable row level security;
alter table quote_totals enable row level security;
alter table quote_decisions enable row level security;

drop policy if exists discount_rules_public_read on discount_rules;
create policy discount_rules_public_read on discount_rules
for select to anon, authenticated
using (active = true);

drop policy if exists quote_sessions_insert_own on quote_sessions;
create policy quote_sessions_insert_own on quote_sessions
for insert to anon, authenticated with check (session_token = f7_request_session_token());
drop policy if exists quote_sessions_select_own on quote_sessions;
create policy quote_sessions_select_own on quote_sessions
for select to anon, authenticated using (session_token = f7_request_session_token());
drop policy if exists quote_sessions_update_own on quote_sessions;
create policy quote_sessions_update_own on quote_sessions
for update to anon, authenticated using (session_token = f7_request_session_token()) with check (session_token = f7_request_session_token());

drop policy if exists quote_segments_own on quote_segments;
create policy quote_segments_own on quote_segments
for all to anon, authenticated
using (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()))
with check (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()));

drop policy if exists quote_service_hours_own on quote_service_hours;
create policy quote_service_hours_own on quote_service_hours
for all to anon, authenticated
using (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()))
with check (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()));

drop policy if exists quote_products_own on quote_products;
create policy quote_products_own on quote_products
for all to anon, authenticated
using (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()))
with check (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()));

drop policy if exists quote_discounts_own on quote_discounts;
create policy quote_discounts_own on quote_discounts
for all to anon, authenticated
using (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()))
with check (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()));

drop policy if exists quote_totals_own on quote_totals;
create policy quote_totals_own on quote_totals
for all to anon, authenticated
using (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()))
with check (exists (select 1 from quote_sessions q where q.id = quote_id and q.session_token = f7_request_session_token()));

drop policy if exists quote_decisions_insert_own on quote_decisions;
create policy quote_decisions_insert_own on quote_decisions
for insert to anon, authenticated with check (session_token = f7_request_session_token());
drop policy if exists quote_decisions_select_own on quote_decisions;
create policy quote_decisions_select_own on quote_decisions
for select to anon, authenticated using (session_token = f7_request_session_token());
