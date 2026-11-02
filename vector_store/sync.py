from functools import lru_cache

from backend.app.config import settings
from sqlalchemy import text


@lru_cache(maxsize=2)
def _model(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(model_name)
    except Exception as exc:
        raise RuntimeError("Embedding model is unavailable") from exc


def _embedding(text_value: str) -> list[float]:
    if not isinstance(text_value, str) or not text_value.strip():
        raise ValueError("Clinical-note text must not be empty")
    try:
        embedding = _model(settings.embedding_model).encode(text_value).tolist()
        if len(embedding) != settings.embedding_dimension:
            raise RuntimeError("Embedding dimension does not match configuration")
        return embedding
    except Exception as exc:
        if isinstance(exc, RuntimeError):
            raise
        raise RuntimeError("Embedding model is unavailable") from exc


def get_collection():
    try:
        import chromadb
        return chromadb.PersistentClient(path=settings.chroma_path).get_or_create_collection("clinical_notes", metadata={"hnsw:space":"cosine"})
    except Exception as exc:
        raise RuntimeError("Vector store is unavailable") from exc

def sync_note(note_id: int, text_value: str, metadata: dict):
    collection = get_collection()
    embedding = _embedding(text_value)
    try:
        collection.upsert(ids=[str(note_id)], embeddings=[embedding], documents=[text_value], metadatas=[metadata])
    except Exception as exc:
        raise RuntimeError("Vector store synchronization failed") from exc

def delete_note(note_id: int):
    get_collection().delete(ids=[str(note_id)])


def synchronize_pending_notes(db, limit: int = 100) -> int:
    rows = db.execute(
        text(
            "SELECT o.note_id, n.note_text, a.clinic_id "
            "FROM NOTE_VECTOR_OUTBOX o "
            "JOIN CLINICAL_NOTE n ON n.note_id=o.note_id "
            "JOIN APPOINTMENT a ON a.appointment_id=n.appointment_id "
            "WHERE o.status='pending' ORDER BY o.updated_at, o.note_id "
            "LIMIT :limit"
        ),
        {"limit": limit},
    ).mappings().all()
    synchronized = 0
    for row in rows:
        try:
            sync_note(row["note_id"], row["note_text"], {"clinic_id": row["clinic_id"]})
        except (RuntimeError, ValueError) as exc:
            db.execute(
                text(
                    "UPDATE NOTE_VECTOR_OUTBOX "
                    "SET attempts=attempts+1, last_error=:error "
                    "WHERE note_id=:note_id"
                ),
                {"note_id": row["note_id"], "error": str(exc)[:500]},
            )
            continue
        db.execute(
            text(
                "UPDATE NOTE_VECTOR_OUTBOX "
                "SET status='synced', attempts=attempts+1, last_error=NULL "
                "WHERE note_id=:note_id"
            ),
            {"note_id": row["note_id"]},
        )
        synchronized += 1
    db.commit()
    return synchronized
