from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.book import Book
from ..models.rental import Rental
from ..models.user import User

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

@book_bp.route('/rentals', methods=['POST'])
@jwt_required()
def create_rental():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        book_id = data.get('book_id')
        duration_days = data.get('duration_days')
        
        if not book_id or not duration_days:
            return jsonify({"error": "Missing required fields"}), 400
            
        if not (3 <= duration_days <= 15):
            return jsonify({"error": "Duration must be between 3 and 15 days"}), 400
            
        book = Book.objects.get(id=book_id)
        user = User.objects.get(id=user_id)
        
        # Calculate rental price (10% of book price per day)
        rental_price = float(book.price) * 0.1 * duration_days
        
        rental = Rental(
            user=user,
            book=book,
            duration_days=duration_days,
            rental_price=rental_price
        ).save()
        
        return jsonify(rental.to_dict()), 201
        
    except Book.DoesNotExist:
        return jsonify({"error": "Book not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
