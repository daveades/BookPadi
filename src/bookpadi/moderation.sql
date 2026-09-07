begin;

alter table books add column moderation_status text;
alter table books add column submitted_by bigint;
alter table books add column submitted_at timestamptz not null default now();
alter table books add column review_note text;
alter table books add column reviewed_at timestamptz;

update books set moderation_status = 'approved', reviewed_at = now();

alter table books alter column moderation_status set default 'pending';
alter table books alter column moderation_status set not null;
alter table books add constraint books_moderation_status_check
    check (moderation_status in ('pending', 'approved', 'rejected'));
alter table books add constraint books_rejection_note_check
    check (moderation_status <> 'rejected' or coalesce(btrim(review_note), '') <> '');
alter table books add constraint books_submitted_by_fkey
    foreign key (submitted_by) references user_account (id) on delete set null;
create index books_submitted_by_idx on books (submitted_by);

commit;
