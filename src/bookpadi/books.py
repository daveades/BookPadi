def list_books(conn):
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, array_agg(a.name order by a.name) as authors
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
                     where bf.book_id = b.id) as formats
            from books b
            join license l on l.id = b.license_id
            where b.id = %s
        """, (book_id,))
        return cur.fetchone()


def search_books(conn, q):
    if not q.strip():
        return []
    with conn.cursor() as cur:
        cur.execute("""
            select b.id, b.title, array_agg(a.name order by a.name) as authors
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


def get_book_file(conn, book_id, format):
    with conn.cursor() as cur:
        cur.execute("""
            select bf.location
            from book_format bf join format f on f.id = bf.format_id
            where bf.book_id = %s and f.name = %s
        """, (book_id, format))
        row = cur.fetchone()
        return row and row["location"]


def get_book_cover(conn, book_id):
    with conn.cursor() as cur:
        cur.execute("select cover_ref from books where id = %s", (book_id,))
        row = cur.fetchone()
        return row and row["cover_ref"]
