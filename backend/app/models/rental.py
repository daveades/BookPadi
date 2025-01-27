from mongoengine import Document, ReferenceField, DateTimeField, IntField, FloatField
from datetime import datetime, timedelta
from .book import Book
from .user import User

class Rental(Document):
    user = ReferenceField('User', required=True)
    book = ReferenceField('Book', required=True)
    rental_date = DateTimeField(default=datetime.utcnow)
    duration_days = IntField(min_value=3, max_value=15, required=True)
    return_date = DateTimeField()
    rental_price = FloatField(required=True)
    
    def save(self, *args, **kwargs):
        if not self.return_date:
            self.return_date = self.rental_date + timedelta(days=self.duration_days)
        return super().save(*args, **kwargs)

    def to_dict(self):
        return {
            "id": str(self.id),
            "book": self.book.to_dict(),
            "rental_date": self.rental_date.isoformat(),
            "duration_days": self.duration_days,
            "return_date": self.return_date.isoformat(),
            "rental_price": self.rental_price
        }