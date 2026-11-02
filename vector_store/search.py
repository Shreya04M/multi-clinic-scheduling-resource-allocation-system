from sqlalchemy import text

from .sync import _embedding, get_collection


def semantic_search(query: str, top_k: int, user: dict, db):
    if not isinstance(query, str) or not query.strip():
        raise ValueError("Search query must not be empty")
    try:
        from backend.app.config import settings
        embedding = _embedding(query)
        where = None if user["role"] == "ADMIN" else {"clinic_id": int(user["clinic_id"])}
        result = get_collection().query(
            query_embeddings=[embedding],
            n_results=min(top_k, settings.search_top_k),
            where=where,
        )
    except Exception as exc:
        raise RuntimeError("Semantic search is currently unavailable") from exc

    authorized = []
    for note_id, distance in zip(result["ids"][0], result["distances"][0]):
        params = {"note_id": int(note_id)}
        query = "SELECT note_id, note_text, clinic_id FROM CLINICAL_NOTE WHERE note_id=:note_id"
        if user["role"] != "ADMIN":
            query += " AND clinic_id=:clinic_id"
            params["clinic_id"] = int(user["clinic_id"])
        try:
            row = db.execute(text(query), params).mappings().first()
        except Exception as exc:
            raise RuntimeError("Clinical-note authorization lookup failed") from exc
        if row:
            authorized.append(
                {"note_id": int(row["note_id"]), "text": row["note_text"], "distance": distance}
            )
    return {"results": authorized}
