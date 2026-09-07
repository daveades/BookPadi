READABLE_FORMATS = ("epub", "pdf", "html")


def list_submissions(conn, user_id, is_admin):
    condition = "b.moderation_status = 'pending'" if is_admin else "b.submitted_by = %s"
    params = () if is_admin else (user_id,)
    with conn.cursor() as cur:
        cur.execute(f"""
            select b.id, b.title, b.moderation_status, b.review_note, b.submitted_at,
                   (select array_agg(a.name order by a.name)
                      from book_author ba join author a on a.id = ba.author_id
                     where ba.book_id = b.id) as authors
            from books b
            where {condition}
            order by b.submitted_at desc
        """, params)
        rows = cur.fetchall()
        return [
            {
                **row,
                "submitted_at": row["submitted_at"].isoformat(),
            }
            for row in rows
        ]


def review_submission(conn, book_id, status, review_note, metadata):
    if status not in ("approved", "rejected"):
        raise ValueError("status must be approved or rejected")
    if not isinstance(review_note, str):
        raise ValueError("review_note must be text")

    review_note = review_note.strip()
    if status == "rejected" and not review_note:
        raise ValueError("a rejection reason is required")

    title_value = metadata.get("title", "")
    language_value = metadata.get("language", "")
    author_values = metadata.get("authors", [])
    topic_values = metadata.get("topics", [])
    if not isinstance(title_value, str) or not isinstance(language_value, str):
        raise ValueError("title and language must be text")
    if not isinstance(author_values, list) or not all(isinstance(name, str) for name in author_values):
        raise ValueError("authors must be a list of names")
    if not isinstance(topic_values, list) or not all(isinstance(name, str) for name in topic_values):
        raise ValueError("topics must be a list of names")

    title = title_value.strip()
    language = language_value.strip().lower()
    authors = [name.strip() for name in author_values if name.strip()]
    topics = [name.strip() for name in topic_values if name.strip()]
    pub_year = metadata.get("pub_year")
    if not title:
        raise ValueError("title is required")
    if not 2 <= len(language) <= 3 or not language.isalpha():
        raise ValueError("language must be a 2 or 3 letter code")
    if not authors:
        raise ValueError("book has no authors")
    if not topics:
        raise ValueError("book has no topics")
    if pub_year is not None:
        try:
            pub_year = int(pub_year)
        except (TypeError, ValueError):
            raise ValueError("pub_year must be a number")
        if not 1 <= pub_year <= 2100:
            raise ValueError("pub_year must be between 1 and 2100")

    description_value = metadata.get("description", "")
    publisher_value = metadata.get("publisher", "")
    license_name_value = metadata.get("license_name", "")
    license_url_value = metadata.get("license_url", "")
    if not all(
        isinstance(value, str)
        for value in (description_value, publisher_value, license_name_value, license_url_value)
    ):
        raise ValueError("description, publisher and license fields must be text")
    description = description_value.strip() or None
    publisher = publisher_value.strip() or None
    license_name = license_name_value.strip() or "Open Access"
    license_url = license_url_value.strip() or "https://creativecommons.org/"

    with conn.transaction(), conn.cursor() as cur:
        cur.execute("""
            select b.title, b.description, b.language, b.pub_year, b.publisher,
                   l.name as license_name, l.license_url,
                   (select array_agg(a.name order by a.name)
                      from book_author ba join author a on a.id = ba.author_id
                     where ba.book_id = b.id) as authors,
                   (select array_agg(t.name order by t.name)
                      from book_topic bt join topic t on t.id = bt.topic_id
                     where bt.book_id = b.id) as topics
            from books b
            join license l on l.id = b.license_id
            where b.id = %s and b.moderation_status = 'pending'
            for update
        """, (book_id,))
        existing = cur.fetchone()
        if existing is None:
            return False

        changed = (
            existing["title"] != title
            or existing["description"] != description
            or existing["language"] != language
            or existing["pub_year"] != pub_year
            or existing["publisher"] != publisher
            or existing["license_name"] != license_name
            or existing["license_url"] != license_url
            or sorted(name.lower() for name in existing["authors"]) != sorted(name.lower() for name in authors)
            or sorted(name.lower() for name in existing["topics"]) != sorted(name.lower() for name in topics)
        )
        if status == "approved" and changed and not review_note:
            raise ValueError("a review note is required when approving with changes")

        cur.execute(
            """
            insert into license (name, license_url) values (%s, %s)
            on conflict (lower(name)) do update set license_url = excluded.license_url
            returning id
            """,
            (license_name, license_url),
        )
        license_id = cur.fetchone()["id"]

        cur.execute("delete from book_author where book_id = %s", (book_id,))
        for name in authors:
            author_id = _reuse_or_create(cur, "author", name)
            cur.execute(
                "insert into book_author (book_id, author_id) values (%s, %s) on conflict do nothing",
                (book_id, author_id),
            )

        cur.execute("delete from book_topic where book_id = %s", (book_id,))
        for name in topics:
            topic_id = _reuse_or_create(cur, "topic", name)
            cur.execute(
                "insert into book_topic (book_id, topic_id) values (%s, %s) on conflict do nothing",
                (book_id, topic_id),
            )

        cur.execute("""
            update books
               set title = %s, description = %s, language = %s, pub_year = %s,
                   publisher = %s, license_id = %s, moderation_status = %s,
                   review_note = %s, reviewed_at = now(),
                   index_status = case when %s = 'approved' then 'pending' else 'unindexed' end,
                   index_error = null, index_version = null, indexed_at = null
             where id = %s
        """, (
            title, description, language, pub_year, publisher, license_id,
            status, review_note or None, status, book_id,
        ))
        return True


def list_books(conn):
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, b.cover_ref, array_agg(a.name order by a.name) as authors
            from books b
            join book_author ba on ba.book_id = b.id
            join author a on a.id = ba.author_id
            where b.moderation_status = 'approved'
            group by b.id
            order by b.title
        """)
        return cur.fetchall()


def get_book(conn, book_id):
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, b.description, b.language, b.pub_year,
                   b.publisher, b.edition, b.moderation_status, b.submitted_by,
                   l.name as license_name, l.license_url,
                   (select array_agg(a.name order by a.name)
                      from book_author ba join author a on a.id = ba.author_id
                     where ba.book_id = b.id) as authors,
                   (select array_agg(t.name order by t.name)
                      from book_topic bt join topic t on t.id = bt.topic_id
                     where bt.book_id = b.id) as topics,
                   (select array_agg(f.name order by f.name)
                      from book_format bf join format f on f.id = bf.format_id
                     where bf.book_id = b.id) as formats,
                   (select f.name
                      from book_format bf join format f on f.id = bf.format_id
                     where bf.book_id = b.id and f.name = any(%s)
                     order by f.priority
                     limit 1) as read_format
            from books b
            join license l on l.id = b.license_id
            where b.id = %s
        """, (list(READABLE_FORMATS), book_id))
        return cur.fetchone()


def search_books(conn, q):
    if not q.strip():
        return []
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, b.cover_ref, array_agg(a.name order by a.name) as authors
            from books b
            join book_author ba on ba.book_id = b.id
            join author a on a.id = ba.author_id
            where b.moderation_status = 'approved'
              and (
                   b.title ilike %(q)s
                or b.description ilike %(q)s
                or exists (select 1 from book_author ba2 join author a2 on a2.id = ba2.author_id
                            where ba2.book_id = b.id and a2.name ilike %(q)s)
                or exists (select 1 from book_topic bt2 join topic t2 on t2.id = bt2.topic_id
                            where bt2.book_id = b.id and t2.name ilike %(q)s)
              )
            group by b.id
            order by b.title
        """, {"q": f"%{q}%"})
        return cur.fetchall()


def get_book_file(conn, book_id, fmt=None):
    with conn.cursor() as cur:
        if fmt:
            cur.execute("""
                select bf.location
                from book_format bf
                join format f on f.id = bf.format_id
                where bf.book_id = %s and f.name = %s
            """, (book_id, fmt))
        else:
            cur.execute("""
                select bf.location
                from book_format bf
                join format f on f.id = bf.format_id
                where bf.book_id = %s
                order by f.priority
                limit 1
            """, (book_id,))
        row = cur.fetchone()
        return row and row["location"]


def get_book_cover(conn, book_id):
    with conn.cursor() as cur:
        cur.execute("select cover_ref from books where id = %s", (book_id,))
        row = cur.fetchone()
        return row and row["cover_ref"]


def _reuse_or_create(cur, table, name):
    cur.execute(f"insert into {table} (name) values (%s) on conflict (lower(name)) do nothing", (name,))
    cur.execute(f"select id from {table} where lower(name) = lower(%s)", (name,))
    return cur.fetchone()["id"]


def create_book(conn, book):
    for field in ("authors", "topics", "formats"):
        if not book.get(field):
            raise ValueError(f"book has no {field}")

    license_data = book.get("license") or {"name": "Open Access", "url": "https://creativecommons.org/"}
    lic_name = license_data.get("name") or "Open Access"
    lic_url = license_data.get("url") or "https://creativecommons.org/"

    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            "insert into license (name, license_url) values (%s, %s) on conflict (lower(name)) do nothing",
            (lic_name, lic_url),
        )
        cur.execute("select id from license where lower(name) = lower(%s)", (lic_name,))
        license_id = cur.fetchone()["id"]

        cur.execute("""
            insert into books (
                title, description, language, pub_year, publisher, edition, cover_ref,
                license_id, moderation_status, submitted_by
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            returning id
        """, (book["title"], book.get("description"), book["language"], book.get("pub_year"),
              book.get("publisher"), book.get("edition"), book.get("cover_ref"), license_id,
              book.get("moderation_status", "approved"), book.get("submitted_by")))
        book_id = cur.fetchone()["id"]

        for name in book["authors"]:
            author_id = _reuse_or_create(cur, "author", name)
            cur.execute("insert into book_author (book_id, author_id) values (%s, %s) on conflict (book_id, author_id) do nothing", (book_id, author_id))

        for name in book["topics"]:
            topic_id = _reuse_or_create(cur, "topic", name)
            cur.execute("insert into book_topic (book_id, topic_id) values (%s, %s) on conflict (book_id, topic_id) do nothing", (book_id, topic_id))

        for name, location in book["formats"].items():
            cur.execute("select id from format where name = %s", (name,))
            row = cur.fetchone()
            if row is None:
                raise ValueError(f"unknown format: {name}")
            cur.execute("insert into book_format (book_id, format_id, location) values (%s, %s, %s)",
                        (book_id, row["id"], location))

    return book_id


def add_book_format(conn, book_id, format_name, location):
    with conn.transaction(), conn.cursor() as cur:
        cur.execute("select id from format where name = %s", (format_name,))
        row = cur.fetchone()
        if row is None:
            raise ValueError(f"unknown format: {format_name}")
        cur.execute(
            """
            insert into book_format (book_id, format_id, location)
            values (%s, %s, %s)
            on conflict (book_id, format_id)
            do update set location = excluded.location
            """,
            (book_id, row["id"], location),
        )


def delete_book(conn, book_id):
    with conn.transaction(), conn.cursor() as cur:
        cur.execute("select cover_ref from books where id = %s for update", (book_id,))
        book = cur.fetchone()
        if book is None:
            return None
        cur.execute("select location from book_format where book_id = %s", (book_id,))
        keys = [row["location"] for row in cur.fetchall()]
        if book["cover_ref"]:
            keys.append(book["cover_ref"])
        cur.execute("delete from books where id = %s", (book_id,))
        return keys
