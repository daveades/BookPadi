begin;

alter table books add column source_url text;
alter table books add constraint books_source_url_check
    check (source_url is null or btrim(source_url) <> '');
create unique index books_source_url_idx
    on books (source_url) where source_url is not null;

commit;
