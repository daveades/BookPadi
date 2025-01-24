from flask import Flask

from .utils.db import init_db
from .routes.user_routes import user_bp

app = Flask(__name__)

#initialize the database connection
init_db(app)

#Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')

@app.route('/')
def home():
    return 'Welcome to BookPadi!'

if __name__ == '__main__':
    app.run(debug=True)