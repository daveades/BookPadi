import glob
import os
import re

from flask import Flask, abort, request, send_from_directory

from bookpadi import books, db

app = Flask(__name__)


@app.get("/books")
def browse():
    with db.connect() as conn:
        return books.list_books(conn)


@app.get("/search")
def search():
    with db.connect() as conn:
        return books.search_books(conn, request.args.get("q", ""))


@app.get("/books/<int:book_id>")
def details(book_id):
    with db.connect() as conn:
        book = books.get_book(conn, book_id)
    if book is None:
        abort(404)
    return book


@app.get("/books/<int:book_id>/file")
def read(book_id):
    with db.connect() as conn:
        location = books.get_book_file(conn, book_id, request.args.get("format"))
    if location is None:
        abort(404)
    return send_from_directory(os.environ["MEDIA_DIR"], location)


@app.get("/books/<int:book_id>/cover")
def cover(book_id):
    with db.connect() as conn:
        location = books.get_book_cover(conn, book_id)
    if location is None:
        abort(404)
    return send_from_directory(os.environ["MEDIA_DIR"], location)


def _slug(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "book"


def _stem(media_dir, title):
    base = _slug(title)
    stem, n = base, 1
    while glob.glob(os.path.join(media_dir, "books", stem + ".*")):
        n += 1
        stem = f"{base}-{n}"
    return stem


def _lines(raw):
    return [line.strip() for line in raw.splitlines() if line.strip()]


@app.post("/books")
def add():
    form = request.form
    for field in ("title", "language", "license_name", "license_url", "authors", "topics"):
        if not form.get(field, "").strip():
            return {"error": f"{field} is required"}, 400

    uploads = {n: f for n, f in request.files.items() if n != "cover" and f.filename}
    if not uploads:
        return {"error": "at least one format file is required"}, 400

    year = form.get("pub_year", "").strip()
    if year and not year.isdigit():
        return {"error": "pub_year must be a number"}, 400

    media_dir = os.environ["MEDIA_DIR"]
    os.makedirs(os.path.join(media_dir, "books"), exist_ok=True)
    os.makedirs(os.path.join(media_dir, "covers"), exist_ok=True)
    stem = _stem(media_dir, form["title"])

    formats = {}
    for name, upload in uploads.items():
        formats[name] = f"books/{stem}.{name}"
        upload.save(os.path.join(media_dir, formats[name]))

    cover_ref = None
    cover = request.files.get("cover")
    if cover and cover.filename:
        cover_ref = f"covers/{stem}{os.path.splitext(cover.filename)[1].lower() or '.jpg'}"
        cover.save(os.path.join(media_dir, cover_ref))

    book = {
        "title": form["title"].strip(),
        "language": form["language"].strip(),
        "description": form.get("description", "").strip() or None,
        "pub_year": int(year) if year else None,
        "publisher": form.get("publisher", "").strip() or None,
        "edition": form.get("edition", "").strip() or None,
        "cover_ref": cover_ref,
        "authors": _lines(form["authors"]),
        "topics": _lines(form["topics"]),
        "formats": formats,
        "license": {"name": form["license_name"].strip(), "url": form["license_url"].strip()},
    }

    try:
        with db.connect() as conn:
            return {"id": books.create_book(conn, book)}, 201
    except (ValueError, KeyError) as e:
        return {"error": str(e)}, 400
