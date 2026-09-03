READABLE_FORMATS = ("html", "pdf")


def list_books(conn):
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, b.cover_ref, array_agg(a.name order by a.name) as authors
            from books b
            join book_author ba on ba.book_id = b.id
            join author a on a.id = ba.author_id
            group by b.id
            order by b.title
        """)
        return cur.fetchall()


def get_book(conn, book_id):
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, b.description, b.language, b.pub_year,
                   b.publisher, b.edition,
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
            where b.title ilike %(q)s
               or b.description ilike %(q)s
               or exists (select 1 from book_author ba2 join author a2 on a2.id = ba2.author_id
                           where ba2.book_id = b.id and a2.name ilike %(q)s)
               or exists (select 1 from book_topic bt2 join topic t2 on t2.id = bt2.topic_id
                           where bt2.book_id = b.id and t2.name ilike %(q)s)
            group by b.id
            order by b.title
        """, {"q": f"%{q}%"})
        return cur.fetchall()


def get_book_file(conn, book_id):
    with conn.cursor() as cur:
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
        if not book[field]:
            raise ValueError(f"book has no {field}")

    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            "insert into license (name, license_url) values (%s, %s) on conflict (lower(name)) do nothing",
            (book["license"]["name"], book["license"]["url"]),
        )
        cur.execute("select id from license where lower(name) = lower(%s)", (book["license"]["name"],))
        license_id = cur.fetchone()["id"]

        cur.execute("""
            insert into books (title, description, language, pub_year, publisher, edition, cover_ref, license_id)
            values (%s, %s, %s, %s, %s, %s, %s, %s)
            returning id
        """, (book["title"], book.get("description"), book["language"], book.get("pub_year"),
              book.get("publisher"), book.get("edition"), book.get("cover_ref"), license_id))
        book_id = cur.fetchone()["id"]

        for name in book["authors"]:
            author_id = _reuse_or_create(cur, "author", name)
            cur.execute("insert into book_author (book_id, author_id) values (%s, %s)", (book_id, author_id))

        for name in book["topics"]:
            topic_id = _reuse_or_create(cur, "topic", name)
            cur.execute("insert into book_topic (book_id, topic_id) values (%s, %s)", (book_id, topic_id))

        for name, location in book["formats"].items():
            cur.execute("select id from format where name = %s", (name,))
            row = cur.fetchone()
            if row is None:
                raise ValueError(f"unknown format: {name}")
            cur.execute("insert into book_format (book_id, format_id, location) values (%s, %s, %s)",
                        (book_id, row["id"], location))

    return book_id
