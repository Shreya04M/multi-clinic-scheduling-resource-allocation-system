import sys
from types import SimpleNamespace

from vector_store import search, sync


class FakeModel:
    def __init__(self, model_name):
        self.model_name = model_name

    def encode(self, value):
        return SimpleNamespace(tolist=lambda: [0.1, 0.2, 0.3])


class FakeCollection:
    def __init__(self):
        self.upserts = []
        self.deletions = []
        self.queries = []

    def upsert(self, **kwargs):
        self.upserts.append(kwargs)

    def delete(self, **kwargs):
        self.deletions.append(kwargs)

    def query(self, **kwargs):
        self.queries.append(kwargs)
        return {
            "ids": [["901"]],
            "documents": [["Chest discomfort"]],
            "distances": [[0.1]],
        }


def test_note_sync_upserts_stable_id_and_metadata(monkeypatch):
    collection = FakeCollection()
    monkeypatch.setattr(sync, "get_collection", lambda: collection)
    monkeypatch.setitem(
        sys.modules,
        "sentence_transformers",
        SimpleNamespace(SentenceTransformer=FakeModel),
    )

    sync.sync_note(901, "Chest discomfort", {"clinic_id": 201})

    assert collection.upserts == [
        {
            "ids": ["901"],
            "embeddings": [[0.1, 0.2, 0.3]],
            "documents": ["Chest discomfort"],
            "metadatas": [{"clinic_id": 201}],
        }
    ]


def test_note_delete_removes_stable_id(monkeypatch):
    collection = FakeCollection()
    monkeypatch.setattr(sync, "get_collection", lambda: collection)

    sync.delete_note(901)

    assert collection.deletions == [{"ids": ["901"]}]


def test_semantic_search_filters_non_admin_by_clinic(monkeypatch):
    collection = FakeCollection()
    monkeypatch.setattr(search, "get_collection", lambda: collection)
    monkeypatch.setitem(
        sys.modules,
        "sentence_transformers",
        SimpleNamespace(SentenceTransformer=FakeModel),
    )

    response = search.semantic_search(
        "chest",
        5,
        {"role": "DOCTOR", "clinic_id": 201},
    )

    assert collection.queries[0]["where"] == {"clinic_id": 201}
    assert response["results"][0]["note_id"] == 901
