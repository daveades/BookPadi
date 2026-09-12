-- Xaperio MVP schema.

create extension if not exists vector;

drop table if exists rate_limit cascade;
drop table if exists book_chunk cascade;
drop table if exists book_progress cascade;
drop table if exists book_format cascade;
drop table if exists book_topic cascade;
drop table if exists book_author cascade;
drop table if exists books cascade;
drop table if exists license cascade;
drop table if exists author cascade;
drop table if exists topic cascade;
drop table if exists format cascade;
drop table if exists user_account cascade;

create table user_account (
    id            bigint generated always as identity primary key,
    email         text not null unique,
    password_hash text not null,
    created_at    timestamptz not null default now()
);

create table rate_limit (
    scope             text not null,
    identity_hash     text not null,
    window_started_at timestamptz not null default now(),
    request_count     int not null default 0 check (request_count >= 0),
    primary key (scope, identity_hash)
);

create table license (
    id          bigint generated always as identity primary key,
    name        text not null,
    license_url text not null
);

create unique index on license (lower(name));

create table author (
    id   bigint generated always as identity primary key,
    name text not null
);

create unique index on author (lower(name));

create table topic (
    id   bigint generated always as identity primary key,
    name text not null
);

create unique index on topic (lower(name));

create table format (
    id   bigint generated always as identity primary key,
    name text not null unique,
    priority int not null
);

create table books (
    id          bigint generated always as identity primary key,
    title       text not null,
    description text,
    language    text not null check (language = lower(language)
                                      and char_length(language) between 2 and 3),
    pub_year    int check (pub_year between 1 and 2100),
    publisher   text,
    edition     text,
    source_url  text check (source_url is null or btrim(source_url) <> ''),
    cover_ref   text,
    license_id  bigint not null references license (id) on delete restrict,
    moderation_status text not null default 'pending'
        check (moderation_status in ('pending', 'approved', 'rejected')),
    submitted_by bigint references user_account (id) on delete set null,
    submitted_at timestamptz not null default now(),
    review_note text,
    reviewed_at timestamptz,
    index_status text not null default 'unindexed'
        check (index_status in ('unindexed', 'pending', 'processing', 'indexed', 'failed')),
    index_error text,
    index_version integer check (index_version is null or index_version > 0),
    indexed_at timestamptz,
    check (moderation_status <> 'rejected' or coalesce(btrim(review_note), '') <> '')
);

create index on books (license_id);
create index on books (submitted_by);
create unique index books_source_url_idx
    on books (source_url) where source_url is not null;
create index books_pending_index_idx
    on books (submitted_at, id)
    where moderation_status = 'approved' and index_status = 'pending';

create table book_author (
    book_id   bigint not null references books (id) on delete cascade,
    author_id bigint not null references author (id) on delete cascade,
    primary key (book_id, author_id)
);

create index on book_author (author_id);

create table book_topic (
    book_id  bigint not null references books (id) on delete cascade,
    topic_id bigint not null references topic (id) on delete cascade,
    primary key (book_id, topic_id)
);

create index on book_topic (topic_id);


create table book_format (
    book_id   bigint not null references books (id) on delete cascade,
    format_id bigint not null references format (id) on delete cascade,
    location  text not null,
    primary key (book_id, format_id)
);

create index on book_format (format_id);

create table book_chunk (
    id            bigint generated always as identity primary key,
    book_id       bigint not null,
    format_id     bigint not null,
    section_order integer not null check (section_order >= 0),
    chunk_order   integer not null check (chunk_order >= 0),
    section_title text,
    locator       jsonb not null check (jsonb_typeof(locator) = 'object'),
    content       text not null check (btrim(content) <> ''),
    search_vector tsvector generated always as
        (to_tsvector('english'::regconfig, content)) stored,
    embedding     vector(384) not null,
    model_version text not null check (btrim(model_version) <> ''),
    foreign key (book_id, format_id)
        references book_format (book_id, format_id) on delete cascade,
    unique (book_id, format_id, section_order, chunk_order)
);

create index book_chunk_book_idx on book_chunk (book_id);
create index book_chunk_search_vector_idx on book_chunk using gin (search_vector);

create table book_progress (
    user_id    bigint not null references user_account (id) on delete cascade,
    book_id    bigint not null references books (id) on delete cascade,
    position   text not null,
    format     text not null,
    updated_at timestamptz not null default now(),
    primary key (user_id, book_id)
);

insert into format (name, priority) 
values 
    ('epub', 1),
    ('pdf', 2), 
    ('html', 3);
