from mongoengine import Document, StringField, DecimalField, ListField, URLField

class Book(Document):
    title = StringField(required=True)
    author = StringField(required=True)
    cover_image = URLField(required=True)
    description = StringField(required=True)
    price = DecimalField(required=True)
    categories = ListField(StringField())
    rating = DecimalField(default=0.0)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "author": self.author,
            "cover_image": self.cover_image,
            "description": self.description,
            "price": float(self.price),
            "categories": self.categories,
            "rating": float(self.rating)
        }