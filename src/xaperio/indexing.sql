begin;

create extension if not exists vector;

alter table books add column index_status text not null default 'unindexed';
alter table books add column index_error text;
alter table books add column index_version integer;
alter table books add column indexed_at timestamptz;

update books
set index_status = 'pending'
where moderation_status = 'approved';

alter table books add constraint books_index_status_check
    check (index_status in ('unindexed', 'pending', 'processing', 'indexed', 'failed'));
alter table books add constraint books_index_version_check
    check (index_version is null or index_version > 0);

create index books_pending_index_idx
    on books (submitted_at, id)
    where moderation_status = 'approved' and index_status = 'pending';

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

commit;
