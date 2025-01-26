from mongoengine import Document, StringField, EmailField

class User(Document):
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "password": self.password
        }