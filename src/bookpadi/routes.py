from flask import Flask, abort, request

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
