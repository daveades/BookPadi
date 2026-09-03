-- BookPadi MVP schema.

drop table if exists book_format cascade;
drop table if exists book_topic cascade;
drop table if exists book_author cascade;
drop table if exists books cascade;
drop table if exists license cascade;
drop table if exists author cascade;
drop table if exists topic cascade;
drop table if exists format cascade;

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
    name text not null unique
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
    cover_ref   text,
    license_id  bigint not null references license (id) on delete restrict
);

create index on books (license_id);

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

insert into format (name) values ('epub'), ('html');
