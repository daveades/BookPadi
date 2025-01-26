from flask import Blueprint, request, jsonify
from ..models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Check if the email already exists
    if User.objects(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)  
    user = User(email=email, password=hashed_password).save()
    return jsonify(user.to_dict()), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.objects(email=email).first()
    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
    return jsonify({"error": "Invalid email or password"}), 401

@user_bp.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.objects.get(id=user_id)
    return jsonify(user.to_json()), 200