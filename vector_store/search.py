from .sync import get_collection

def semantic_search(query: str, top_k: int, user: dict):
    try:
        from sentence_transformers import SentenceTransformer
        from backend.app.config import settings
        embedding = SentenceTransformer(settings.embedding_model).encode(query).tolist()
        where = None if user["role"] == "ADMIN" else {"clinic_id": int(user["clinic_id"])}
        result = get_collection().query(query_embeddings=[embedding], n_results=top_k, where=where)
        return {"results": [{"note_id": int(note_id), "text": text, "distance": distance} for note_id, text, distance in zip(result["ids"][0], result["documents"][0], result["distances"][0])]}
    except Exception as exc:
        raise RuntimeError("Semantic search is currently unavailable") from exc
