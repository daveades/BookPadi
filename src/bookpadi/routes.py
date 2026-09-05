import glob
import os
import re

import psycopg
from flask import Flask, abort, request, send_from_directory, session

from bookpadi import books, db, ingest, progress, users

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-secret-key")


def current_user_id():
    return session.get("user_id")


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
    book = dict(book)
    user_id = current_user_id()
    if user_id is not None:
        with db.connect() as conn:
            saved = progress.get_progress(conn, user_id, book_id)
        book["progress"] = {
            "position": saved["position"],
            "format": saved["format"],
        } if saved else None
        if saved and saved.get("format") and saved["format"] in (book.get("formats") or []):
            book["read_format"] = saved["format"]
    return book


@app.get("/books/<int:book_id>/read")
def read(book_id):
    with db.connect() as conn:
        location = books.get_book_file(conn, book_id, request.args.get("format"))

    if location is None:
        abort(404)

    response = send_from_directory(os.environ["MEDIA_DIR"], location)
    if response.mimetype == "text/html":
        response.headers["Content-Security-Policy"] = "sandbox allow-same-origin"
    return response

@app.get("/books/<int:book_id>/cover")
def cover(book_id):
    with db.connect() as conn:
        location = books.get_book_cover(conn, book_id)
    if location is None:
        abort(404)
    return send_from_directory(os.environ["MEDIA_DIR"], location)


@app.post("/auth/register")
def register():
    email = request.json.get("email", "") if request.is_json else ""
    password = request.json.get("password", "") if request.is_json else ""
    try:
        with db.connect() as conn:
            user_id = users.register(conn, email, password)
    except ValueError as e:
        return {"error": str(e)}, 400
    except psycopg.errors.UniqueViolation:
        return {"error": "an account with that email already exists"}, 409
    session["user_id"] = user_id
    return {"id": user_id, "email": email.strip().lower()}, 201


@app.post("/auth/login")
def login():
    email = request.json.get("email", "") if request.is_json else ""
    password = request.json.get("password", "") if request.is_json else ""
    if not email or not password:
        return {"error": "email and password are required"}, 400
    with db.connect() as conn:
        user_id = users.authenticate(conn, email, password)
    if user_id is None:
        return {"error": "email or password is incorrect"}, 401
    session["user_id"] = user_id
    return {"id": user_id}

@app.post("/auth/logout")
def logout():
    session.clear()
    return {"ok": True}

@app.get("/auth/me")
def me():
    user_id = current_user_id()
    if user_id is None:
        return {"user": None}
    with db.connect() as conn:
        user = users.get_by_id(conn, user_id)
    if user is None:
        session.clear()
        return {"user": None}
    return {"user": {"id": user["id"], "email": user["email"]}}


@app.get("/books/history")
@app.get("/library")
def library_history():
    user_id = current_user_id()
    if user_id is None:
        return {"error": "not signed in"}, 401
    with db.connect() as conn:
        return progress.get_user_history(conn, user_id)


@app.get("/books/<int:book_id>/progress")
def get_progress(book_id):
    user_id = current_user_id()
    if user_id is None:
        return {"error": "not signed in"}, 401
    with db.connect() as conn:
        saved = progress.get_progress(conn, user_id, book_id)
    if saved is None:
        return {"position": None}
    return {"position": saved["position"], "format": saved["format"]}


@app.put("/books/<int:book_id>/progress")
def put_progress(book_id):
    user_id = current_user_id()
    if user_id is None:
        return {"error": "not signed in"}, 401
    data = request.get_json(silent=True) or {}
    position = data.get("position")
    fmt = data.get("format")
    if not position or not fmt:
        return {"error": "position and format are required"}, 400
    with db.connect() as conn:
        progress.save_progress(conn, user_id, book_id, position, fmt)
    return {"ok": True}


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


@app.post("/books/inspect")
def inspect():
    if current_user_id() is None:
        return {"error": "not signed in"}, 401

    file = None
    format_name = None
    for name in ("file", "epub", "pdf", "html"):
        if name in request.files and request.files[name].filename:
            file = request.files[name]
            format_name = name if name in ("epub", "pdf", "html") else None
            break

    if not file:
        for name, f in request.files.items():
            if f.filename:
                file = f
                format_name = name if name in ("epub", "pdf", "html") else None
                break

    if not file:
        return {"error": "no file uploaded"}, 400

    if not format_name:
        ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
        format_name = ext if ext in ingest.SUPPORTED_FORMATS else "epub"

    file_bytes = file.read()
    try:
        ingest.validate_file(file_bytes, format_name)
        meta = ingest.extract_metadata(file_bytes, format_name)
    except ValueError as e:
        return {"error": str(e)}, 400

    clean_name = os.path.splitext(file.filename)[0].replace("-", " ").replace("_", " ").title()
    return {
        "format": format_name,
        "title": meta.get("title") or clean_name,
        "authors": meta.get("authors") or [],
        "description": meta.get("description") or "",
        "language": meta.get("language") or "en",
        "pub_year": meta.get("pub_year"),
        "publisher": meta.get("publisher") or "",
        "topics": meta.get("topics") or [],
        "license_name": meta.get("license_name") or "Open Access",
        "license_url": meta.get("license_url") or "https://creativecommons.org/",
        "has_cover": bool(meta.get("cover_bytes")),
    }


@app.post("/books")
def add():
    if current_user_id() is None:
        return {"error": "not signed in"}, 401

    form = request.form
    uploads = {}
    extracted_meta = {}

    # Gather and validate uploaded format files
    for name, f in request.files.items():
        if name != "cover" and f.filename:
            fmt = name.lower().strip()
            # If field name was generic 'file', guess format from extension
            if fmt == "file":
                fmt = os.path.splitext(f.filename)[1].lower().lstrip(".")
            if fmt not in ingest.SUPPORTED_FORMATS:
                return {"error": f"unsupported book format: '{fmt}'"}, 400
            file_bytes = f.read()
            try:
                ingest.validate_file(file_bytes, fmt)
            except ValueError as e:
                return {"error": str(e)}, 400
            uploads[fmt] = file_bytes
            # Extract metadata from primary format
            if not extracted_meta:
                extracted_meta = ingest.extract_metadata(file_bytes, fmt)

    if not uploads:
        return {"error": "at least one valid book file (epub, pdf, html) is required"}, 400

    # Validate uploaded cover if provided
    cover = request.files.get("cover")
    cover_bytes = None
    cover_ext = ".jpg"
    if cover and cover.filename:
        cover_bytes = cover.read()
        try:
            ingest.validate_file(cover_bytes, "cover")
            cover_ext = os.path.splitext(cover.filename)[1].lower() or ".jpg"
        except ValueError as e:
            return {"error": str(e)}, 400
    elif extracted_meta.get("cover_bytes"):
        # Auto-use embedded cover from EPUB if not provided
        cover_bytes = extracted_meta["cover_bytes"]
        cover_ext = extracted_meta.get("cover_ext") or ".jpg"

    # Merge form overrides with extracted metadata
    title = form.get("title", "").strip() or extracted_meta.get("title")
    if not title:
        return {"error": "title is required and could not be extracted"}, 400

    language = form.get("language", "").strip() or extracted_meta.get("language") or "en"
    language = ingest.normalize_language(language)

    description = form.get("description", "").strip() or extracted_meta.get("description") or None

    year_str = form.get("pub_year", "").strip()
    pub_year = None
    if year_str:
        if not year_str.isdigit():
            return {"error": "pub_year must be a number"}, 400
        pub_year = int(year_str)
    elif extracted_meta.get("pub_year"):
        pub_year = extracted_meta["pub_year"]

    publisher = form.get("publisher", "").strip() or extracted_meta.get("publisher") or None
    edition = form.get("edition", "").strip() or None

    # Authors
    authors_raw = form.get("authors", "").strip()
    if authors_raw:
        authors = _lines(authors_raw)
    else:
        authors = extracted_meta.get("authors") or ["Unknown"]

    # Topics
    topics_raw = form.get("topics", "").strip()
    if topics_raw:
        topics = _lines(topics_raw)
    else:
        topics = extracted_meta.get("topics") or ["General"]

    # License
    license_name = (
        form.get("license_name", "").strip()
        or extracted_meta.get("license_name")
        or "Open Access"
    )
    license_url = (
        form.get("license_url", "").strip()
        or extracted_meta.get("license_url")
        or "https://creativecommons.org/"
    )

    media_dir = os.environ["MEDIA_DIR"]
    os.makedirs(os.path.join(media_dir, "books"), exist_ok=True)
    os.makedirs(os.path.join(media_dir, "covers"), exist_ok=True)
    stem = _stem(media_dir, title)

    # Save format files
    formats = {}
    for fmt, data in uploads.items():
        rel_path = f"books/{stem}.{fmt}"
        full_path = os.path.join(media_dir, rel_path)
        with open(full_path, "wb") as out:
            out.write(data)
        formats[fmt] = rel_path

    # Save cover image
    cover_ref = None
    if cover_bytes:
        cover_ref = f"covers/{stem}{cover_ext}"
        with open(os.path.join(media_dir, cover_ref), "wb") as out:
            out.write(cover_bytes)

    book = {
        "title": title,
        "language": language,
        "description": description,
        "pub_year": pub_year,
        "publisher": publisher,
        "edition": edition,
        "cover_ref": cover_ref,
        "authors": authors,
        "topics": topics,
        "formats": formats,
        "license": {"name": license_name, "url": license_url},
    }

    try:
        with db.connect() as conn:
            return {"id": books.create_book(conn, book)}, 201
    except (ValueError, KeyError) as e:
        return {"error": str(e)}, 400
