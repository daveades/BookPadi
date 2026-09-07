from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
VECTOR_DIMENSIONS = 384
MAX_BATCH_SIZE = 32
MAX_TEXT_CHARACTERS = 5000
MAX_REQUEST_BYTES = 1_000_000

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_REQUEST_BYTES
model = SentenceTransformer(MODEL_NAME, device="cpu")


def validate_text(value):
    if not isinstance(value, str):
        raise ValueError("text must be a string")
    value = value.strip()
    if not value:
        raise ValueError("text must not be empty")
    if len(value) > MAX_TEXT_CHARACTERS:
        raise ValueError(f"text must not exceed {MAX_TEXT_CHARACTERS} characters")
    return value


def embed_texts(texts):
    vectors = model.encode(texts, normalize_embeddings=True).tolist()
    if any(len(vector) != VECTOR_DIMENSIONS for vector in vectors):
        raise RuntimeError("embedding model returned an unexpected vector size")
    return vectors


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_NAME,
        "dimensions": VECTOR_DIMENSIONS,
    }


@app.post("/embed/documents")
def embed_documents():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return {"error": "request body must be a JSON object"}, 400
    texts = data.get("texts")
    if not isinstance(texts, list):
        return {"error": "texts must be a list"}, 400
    if not texts:
        return {"error": "texts must not be empty"}, 400
    if len(texts) > MAX_BATCH_SIZE:
        return {"error": f"texts must contain at most {MAX_BATCH_SIZE} items"}, 400
    try:
        texts = [validate_text(text) for text in texts]
    except ValueError as error:
        return {"error": str(error)}, 400
    vectors = embed_texts(texts)
    return jsonify(
        {
            "model": MODEL_NAME,
            "dimensions": VECTOR_DIMENSIONS,
            "vectors": vectors,
        }
    )


@app.post("/embed/query")
def embed_query():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return {"error": "request body must be a JSON object"}, 400
    try:
        text = validate_text(data.get("text"))
    except ValueError as error:
        return {"error": str(error)}, 400
    vector = embed_texts([text])[0]
    return jsonify(
        {
            "model": MODEL_NAME,
            "dimensions": VECTOR_DIMENSIONS,
            "vector": vector,
        }
    )
