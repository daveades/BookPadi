from flask import Blueprint, jsonify, request
from ..models.book import Book

book_bp = Blueprint('book_bp', __name__)

@book_bp.route('/books', methods=['GET'])
def get_books():
    try:
        books = Book.objects()
        return jsonify([book.to_dict() for book in books]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@book_bp.route('/books/<id>', methods=['GET'])
def get_book(id):
    try:
        book = Book.objects.get(id=id)
        return jsonify(book.to_dict()), 200
    except Book.DoesNotExist:
        return jsonify({"error": "Book not found"}), 404