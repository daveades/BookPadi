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


def get_user_history(conn, user_id):
    with conn.cursor() as cur:
        cur.execute(
            """
            select b.id, b.title, b.cover_ref,
                   array_agg(distinct a.name order by a.name) as authors,
                   array_agg(distinct f.name) as formats,
                   bp.position, bp.format as progress_format, bp.updated_at
            from book_progress bp
            join books b on b.id = bp.book_id
            join book_author ba on ba.book_id = b.id
            join author a on a.id = ba.author_id
            left join book_format bf on bf.book_id = b.id
            left join format f on f.id = bf.format_id
            where bp.user_id = %s
            group by b.id, bp.position, bp.format, bp.updated_at
            order by bp.updated_at desc
            """,
            (user_id,),
        )
        rows = cur.fetchall()
        return [
            {
                **row,
                "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
            }
            for row in rows
        ]

