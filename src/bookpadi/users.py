import re

from werkzeug.security import check_password_hash, generate_password_hash

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def register(conn, email, password):
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        raise ValueError("email must be a valid address")
    if len(password) < 8:
        raise ValueError("password must be at least 8 characters")

    with conn.cursor() as cur:
        cur.execute(
            "insert into user_account (email, password_hash) values (%s, %s) returning id",
            (email, generate_password_hash(password)),
        )
        return cur.fetchone()["id"]


def authenticate(conn, email, password):
    email = email.strip().lower()
    with conn.cursor() as cur:
        cur.execute(
            "select id, password_hash from user_account where email = %s",
            (email,),
        )
        row = cur.fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        return None
    return row["id"]


def get_by_id(conn, user_id):
    with conn.cursor() as cur:
        cur.execute(
            "select id, email, created_at from user_account where id = %s",
            (user_id,),
        )
        return cur.fetchone()
