from flask import Blueprint, request, jsonify
from ..models.user import User

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    email = data.get('email')

    # Check if the email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    user = User(**data).save()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.objects.get(id=user_id)
    return jsonify(user.to_json()), 200