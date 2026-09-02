import os

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
    return send_from_directory(
        os.environ["MEDIA_DIR"],
        location,
        as_attachment=request.args.get("download") == "1",
    )


@app.get("/books/<int:book_id>/cover")
def cover(book_id):
    with db.connect() as conn:
        location = books.get_book_cover(conn, book_id)
    if location is None:
        abort(404)
    return send_from_directory(os.environ["MEDIA_DIR"], location)
