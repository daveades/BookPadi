import argparse
import json

from psycopg.types.json import Jsonb

from xaperio import chunks, content, db, embedding_client, storage

INDEX_VERSION = 1
MODEL_VERSION = embedding_client.MODEL_NAME
READABLE_FORMATS = ("epub", "pdf", "html")
EMBEDDING_BATCH_SIZE = embedding_client.MAX_BATCH_SIZE
MAX_BOOK_BYTES = 100 * 1024 * 1024
MAX_INDEX_ERROR_CHARACTERS = 2000


def claim_book(conn):
    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            """
            select b.id, bf.format_id, f.name as format_name, bf.location
            from books b
            join book_format bf on bf.book_id = b.id
            join format f on f.id = bf.format_id
            where b.moderation_status = 'approved'
              and b.index_status = 'pending'
              and f.name = any(%s)
            order by b.submitted_at, b.id, f.priority
            for update of b skip locked
            limit 1
            """,
            (list(READABLE_FORMATS),),
        )
        book = cur.fetchone()
        if book is None:
            return None
        cur.execute(
            """
            update books
               set index_status = 'processing', index_error = null
             where id = %s
            """,
            (book["id"],),
        )
        return book


def download_book(location):
    stored_object = storage.get_object(location)
    if stored_object is None:
        raise FileNotFoundError("The selected book file does not exist in storage.")
    body = stored_object["Body"]
    try:
        content_length = stored_object.get("ContentLength")
        if content_length is not None and int(content_length) > MAX_BOOK_BYTES:
            raise ValueError("The selected book file exceeds the processing limit.")
        data = body.read(MAX_BOOK_BYTES + 1)
    finally:
        body.close()
    if len(data) > MAX_BOOK_BYTES:
        raise ValueError("The selected book file exceeds the processing limit.")
    return data


def embed_chunks(book_chunks):
    vectors = []
    for start in range(0, len(book_chunks), EMBEDDING_BATCH_SIZE):
        batch = book_chunks[start : start + EMBEDDING_BATCH_SIZE]
        vectors.extend(embedding_client.embed_documents([chunk["content"] for chunk in batch]))
    return vectors


def replace_index(conn, book, book_chunks, vectors):
    if not book_chunks or len(book_chunks) != len(vectors):
        raise ValueError("The completed index has inconsistent chunk and vector counts.")
    rows = [
        (
            book["id"],
            book["format_id"],
            chunk["section_order"],
            chunk["chunk_order"],
            chunk["section_title"],
            Jsonb(chunk["locator"]),
            chunk["content"],
            json.dumps(vector, separators=(",", ":")),
            MODEL_VERSION,
        )
        for chunk, vector in zip(book_chunks, vectors, strict=True)
    ]
    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            "select index_status from books where id = %s for update",
            (book["id"],),
        )
        current = cur.fetchone()
        if current is None or current["index_status"] != "processing":
            raise ValueError("The book is no longer being processed.")
        cur.execute("delete from book_chunk where book_id = %s", (book["id"],))
        cur.executemany(
            """
            insert into book_chunk (
                book_id, format_id, section_order, chunk_order, section_title,
                locator, content, embedding, model_version
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            rows,
        )
        cur.execute(
            """
            update books
               set index_status = 'indexed', index_error = null,
                   index_version = %s, indexed_at = now()
             where id = %s
            """,
            (INDEX_VERSION, book["id"]),
        )


def mark_failed(conn, book_id, error):
    message = str(error).strip() or error.__class__.__name__
    message = message[:MAX_INDEX_ERROR_CHARACTERS]
    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            """
            update books
               set index_status = 'failed', index_error = %s
             where id = %s and index_status = 'processing'
            """,
            (message, book_id),
        )


def queue_retry(conn, book_id):
    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            """
            update books
               set index_status = 'pending', index_error = null
             where id = %s
               and moderation_status = 'approved'
               and index_status = 'failed'
            returning id
            """,
            (book_id,),
        )
        return cur.fetchone() is not None


def process_one():
    with db.connect() as conn:
        book = claim_book(conn)
    if book is None:
        return None
    try:
        data = download_book(book["location"])
        sections = content.extract_sections(data, book["format_name"])
        book_chunks = chunks.chunk_sections(sections)
        vectors = embed_chunks(book_chunks)
        with db.connect() as conn:
            replace_index(conn, book, book_chunks, vectors)
    except Exception as error:
        with db.connect() as conn:
            mark_failed(conn, book["id"], error)
        raise
    return book["id"]


def retry_book(book_id):
    with db.connect() as conn:
        return queue_retry(conn, book_id)


def main():
    parser = argparse.ArgumentParser(description="Process one Xaperio search indexing job")
    parser.add_argument("--retry", type=int, metavar="BOOK_ID")
    args = parser.parse_args()
    if args.retry is not None:
        if not retry_book(args.retry):
            parser.error("book is not an approved failed indexing job")
        print(f"Queued book {args.retry} for indexing")
        return
    book_id = process_one()
    if book_id is None:
        print("No pending books to index")
    else:
        print(f"Indexed book {book_id}")


if __name__ == "__main__":
    main()
