from flask import Flask
from .utils.db import init_db
from .routes.user_routes import user_bp
from app.config import JWT_SECRET_KEY

def create_app():
    app = Flask(__name__)

    #JWT Config
    app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

    # Initialize the database connection
    init_db()

    # Register blueprints
    app.register_blueprint(user_bp, url_prefix='/api')

    @app.route('/')
    def home():
        return 'Welcome to BookPadi!'
    
    return app