def get_progress(conn, user_id, book_id):
    with conn.cursor() as cur:
        cur.execute(
            """
            select position, format, updated_at
            from book_progress
            where user_id = %s and book_id = %s
            """,
            (user_id, book_id),
        )
        return cur.fetchone()


def save_progress(conn, user_id, book_id, position, fmt):
    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            """
            insert into book_progress (user_id, book_id, position, format)
            values (%s, %s, %s, %s)
            on conflict (user_id, book_id)
            do update set position = excluded.position,
                          format = excluded.format,
                          updated_at = now()
            """,
            (user_id, book_id, position, fmt),
        )
