-- Trent Chat：持久化硬限额。只保存客户端 IP 的加盐哈希，不保存原始 IP。
create table if not exists public.trent_chat_usage (
    scope text not null,
    bucket text not null,
    request_count integer not null default 0 check (request_count >= 0),
    updated_at timestamptz not null default now(),
    primary key (scope, bucket)
);

alter table public.trent_chat_usage enable row level security;
revoke all on table public.trent_chat_usage from public, anon, authenticated;

create or replace function public.consume_trent_chat_quota(
    p_client_id text,
    p_ip_minute_limit integer,
    p_ip_daily_limit integer,
    p_global_daily_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
    v_day date := timezone('UTC', now())::date;
    v_minute text := to_char(date_trunc('minute', timezone('UTC', now())), 'YYYYMMDDHH24MI');
    v_global_count integer;
    v_ip_minute_count integer;
    v_ip_daily_count integer;
    v_retry_after integer;
begin
    if p_client_id !~ '^[a-f0-9]{64}$' then
        raise exception 'invalid client identifier';
    end if;

    -- 每个 UTC 日使用同一事务锁，检查与计数必须原子完成。
    perform pg_advisory_xact_lock(hashtextextended('trent-chat:' || v_day::text, 0));

    select request_count into v_global_count
        from public.trent_chat_usage
        where scope = 'global_day' and bucket = v_day::text;
    select request_count into v_ip_minute_count
        from public.trent_chat_usage
        where scope = 'ip_minute' and bucket = p_client_id || ':' || v_minute;
    select request_count into v_ip_daily_count
        from public.trent_chat_usage
        where scope = 'ip_day' and bucket = p_client_id || ':' || v_day::text;

    if p_ip_minute_limit <= 0 or coalesce(v_ip_minute_count, 0) >= p_ip_minute_limit then
        v_retry_after := greatest(1, ceil(extract(epoch from (
            date_trunc('minute', now()) + interval '1 minute' - now()
        )))::integer);
        return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED', 'retryAfter', v_retry_after);
    end if;

    if p_ip_daily_limit <= 0 or coalesce(v_ip_daily_count, 0) >= p_ip_daily_limit then
        v_retry_after := greatest(1, ceil(extract(epoch from (
            (v_day + 1)::timestamp at time zone 'UTC' - now()
        )))::integer);
        return jsonb_build_object('ok', false, 'code', 'IP_DAILY_LIMIT', 'retryAfter', v_retry_after);
    end if;

    if p_global_daily_limit <= 0 or coalesce(v_global_count, 0) >= p_global_daily_limit then
        v_retry_after := greatest(1, ceil(extract(epoch from (
            (v_day + 1)::timestamp at time zone 'UTC' - now()
        )))::integer);
        return jsonb_build_object('ok', false, 'code', 'GLOBAL_DAILY_LIMIT', 'retryAfter', v_retry_after);
    end if;

    insert into public.trent_chat_usage (scope, bucket, request_count)
    values
        ('global_day', v_day::text, 1),
        ('ip_minute', p_client_id || ':' || v_minute, 1),
        ('ip_day', p_client_id || ':' || v_day::text, 1)
    on conflict (scope, bucket) do update set
        request_count = public.trent_chat_usage.request_count + 1,
        updated_at = now();

    -- 低频清理旧桶，不影响当前日期的限额计数。
    if random() < 0.02 then
        delete from public.trent_chat_usage where updated_at < now() - interval '32 days';
    end if;

    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.consume_trent_chat_quota(text, integer, integer, integer)
    from public, anon, authenticated;
grant execute on function public.consume_trent_chat_quota(text, integer, integer, integer)
    to service_role;
