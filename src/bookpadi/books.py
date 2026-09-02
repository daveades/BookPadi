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
                   b.publisher, b.edition, b.cover_ref,
                   l.name as license_name, l.license_url,
                   (select array_agg(a.name order by a.name)
                      from book_author ba join author a on a.id = ba.author_id
                     where ba.book_id = b.id) as authors,
                   (select array_agg(t.name order by t.name)
                      from book_topic bt join topic t on t.id = bt.topic_id
                     where bt.book_id = b.id) as topics,
                   (select jsonb_object_agg(f.name, bf.location)
                      from book_format bf join format f on f.id = bf.format_id
                     where bf.book_id = b.id) as formats
            from books b
            join license l on l.id = b.license_id
            where b.id = %s
        """, (book_id,))
        return cur.fetchone()
