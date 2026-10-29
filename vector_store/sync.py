from pathlib import Path
from backend.app.config import settings

def get_collection():
    try:
        import chromadb
        return chromadb.PersistentClient(path=settings.chroma_path).get_or_create_collection("clinical_notes", metadata={"hnsw:space":"cosine"})
    except Exception as exc:
        raise RuntimeError("Vector store is unavailable") from exc

def sync_note(note_id: int, text_value: str, metadata: dict):
    collection = get_collection()
    try:
        from sentence_transformers import SentenceTransformer
        embedding = SentenceTransformer(settings.embedding_model).encode(text_value).tolist()
    except Exception as exc:
        raise RuntimeError("Embedding model is unavailable") from exc
    collection.upsert(ids=[str(note_id)], embeddings=[embedding], documents=[text_value], metadatas=[metadata])

def delete_note(note_id: int):
    get_collection().delete(ids=[str(note_id)])
