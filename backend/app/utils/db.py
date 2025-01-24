from mongoengine import connect
from app.config import MONGODB_URI, MONGODB_USERNAME, MONGODB_PASSWORD

def init_db():
    connect(
        db="bookpadi_db",
        host=MONGODB_URI,
        username=MONGODB_USERNAME,
        password=MONGODB_PASSWORD,
    )