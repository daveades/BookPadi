import hashlib
import math
from datetime import timedelta


def consume(conn, scope, identity, limit, window_seconds):
    identity_hash = hashlib.sha256(str(identity).encode()).hexdigest()

    with conn.transaction(), conn.cursor() as cur:
        cur.execute(
            """
            insert into rate_limit (scope, identity_hash)
            values (%s, %s)
            on conflict (scope, identity_hash) do nothing
            """,
            (scope, identity_hash),
        )
        cur.execute(
            """
            select window_started_at, request_count, now() as current_time
            from rate_limit
            where scope = %s and identity_hash = %s
            for update
            """,
            (scope, identity_hash),
        )
        row = cur.fetchone()
        now = row["current_time"]
        elapsed = now - row["window_started_at"]
        if elapsed >= timedelta(seconds=window_seconds):
            window_started_at = now
            request_count = 1
        else:
            window_started_at = row["window_started_at"]
            request_count = row["request_count"] + 1

        cur.execute(
            """
            update rate_limit
            set window_started_at = %s, request_count = %s
            where scope = %s and identity_hash = %s
            """,
            (window_started_at, request_count, scope, identity_hash),
        )

    if request_count <= limit:
        return None
    remaining = window_seconds - (now - window_started_at).total_seconds()
    return max(1, math.ceil(remaining))
