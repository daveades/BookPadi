begin;

create table rate_limit (
    scope             text not null,
    identity_hash     text not null,
    window_started_at timestamptz not null default now(),
    request_count     int not null default 0 check (request_count >= 0),
    primary key (scope, identity_hash)
);

commit;
