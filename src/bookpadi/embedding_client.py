import json
import math
import os
import urllib.error
import urllib.request

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
VECTOR_DIMENSIONS = 384
MAX_BATCH_SIZE = 32
MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class EmbeddingClientError(RuntimeError):
    pass


def _post(path, payload, timeout):
    endpoint = os.environ.get("EMBEDDING_URL", "http://127.0.0.1:8001").rstrip("/")
    try:
        request = urllib.request.Request(
            f"{endpoint}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response_data = response.read(MAX_RESPONSE_BYTES + 1)
    except (OSError, TimeoutError, ValueError, urllib.error.HTTPError, urllib.error.URLError) as error:
        raise EmbeddingClientError("The embedding service is unavailable.") from error
    if len(response_data) > MAX_RESPONSE_BYTES:
        raise EmbeddingClientError("The embedding service response is too large.")
    try:
        result = json.loads(response_data)
    except (TypeError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise EmbeddingClientError("The embedding service returned invalid JSON.") from error
    if not isinstance(result, dict):
        raise EmbeddingClientError("The embedding service returned an invalid response.")
    if result.get("model") != MODEL_NAME or result.get("dimensions") != VECTOR_DIMENSIONS:
        raise EmbeddingClientError("The embedding service returned an incompatible model.")
    return result


def _validate_vector(vector):
    if not isinstance(vector, list) or len(vector) != VECTOR_DIMENSIONS:
        raise EmbeddingClientError("The embedding service returned an invalid vector.")
    if any(
        not isinstance(value, (int, float))
        or isinstance(value, bool)
        or not math.isfinite(value)
        for value in vector
    ):
        raise EmbeddingClientError("The embedding service returned an invalid vector.")
    return vector


def embed_documents(texts):
    if not isinstance(texts, list) or not texts or len(texts) > MAX_BATCH_SIZE:
        raise ValueError(f"texts must contain between 1 and {MAX_BATCH_SIZE} items")
    result = _post("/embed/documents", {"texts": texts}, 120)
    vectors = result.get("vectors")
    if not isinstance(vectors, list) or len(vectors) != len(texts):
        raise EmbeddingClientError("The embedding service returned an unexpected number of vectors.")
    return [_validate_vector(vector) for vector in vectors]


def embed_query(text):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must not be empty")
    result = _post("/embed/query", {"text": text}, 5)
    return _validate_vector(result.get("vector"))
