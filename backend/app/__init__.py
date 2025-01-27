from flask import Flask
from flask_cors import CORS
from .utils.db import init_db
from .routes.user_routes import user_bp
from .routes.book_routes import book_bp
from app.config import JWT_SECRET_KEY
from flask_jwt_extended import JWTManager

def create_app():
    app = Flask(__name__)
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "https://fluffy-doodle-7xjxggv9p772p7jr-3000.app.github.dev",
                "http://localhost:3000"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    #JWT Config
    app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

    # Initialize the database connection
    init_db()
    jwt = JWTManager(app)

    # Register blueprints
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(book_bp, url_prefix='/api')

    @app.route('/')
    def home():
        return 'Welcome to BookPadi!'
    
    return app