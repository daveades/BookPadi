from flask import Flask
from .utils.db import init_db
from .routes.user_routes import user_bp

def create_app():
    app = Flask(__name__)

    # Initialize the database connection
    init_db()

    # Register blueprints
    app.register_blueprint(user_bp, url_prefix='/api')

    @app.route('/')
    def home():
        return 'Welcome to BookPadi!'
    
    return app