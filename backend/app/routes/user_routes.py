from flask import Blueprint, request, jsonify
from ..models.user import User

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(**data).save()
    return jsonify(user.to_json()), 201