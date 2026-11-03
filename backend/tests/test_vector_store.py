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


class FakeDatabase:
    def __init__(self, row):
        self.row = row
        self.statements = []
        self.params = []

    def execute(self, statement, params):
        self.statements.append(str(statement))
        self.params.append(params)
        assert params["note_id"] == 901
        return SimpleNamespace(
            mappings=lambda: SimpleNamespace(first=lambda: self.row)
        )


class FakeOutboxDatabase:
    def __init__(self, row):
        self.row = row
        self.updates = []
        self.commits = 0

    def execute(self, statement, params):
        if "SELECT o.note_id" in str(statement):
            return SimpleNamespace(
                mappings=lambda: SimpleNamespace(all=lambda: [self.row])
            )
        self.updates.append(params)
        return SimpleNamespace()

    def commit(self):
        self.commits += 1


def test_note_sync_upserts_stable_id_and_metadata(monkeypatch):
    sync._model.cache_clear()
    monkeypatch.setattr(sync.settings, "embedding_dimension", 3)
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
    sync._model.cache_clear()
    monkeypatch.setattr(sync.settings, "embedding_dimension", 3)
    collection = FakeCollection()
    monkeypatch.setattr(search, "get_collection", lambda: collection)
    monkeypatch.setitem(
        sys.modules,
        "sentence_transformers",
        SimpleNamespace(SentenceTransformer=FakeModel),
    )

    database = FakeDatabase({"note_id": 901, "note_text": "Authorized note", "clinic_id": 201})
    response = search.semantic_search(
        "chest",
        5,
        {"role": "DOCTOR", "clinic_id": 201},
        database,
    )

    assert collection.queries[0]["where"] == {"clinic_id": 201}
    assert "JOIN APPOINTMENT a ON a.appointment_id=n.appointment_id" in database.statements[0]
    assert "a.clinic_id=:clinic_id" in database.statements[0]
    assert database.params[0]["clinic_id"] == 201
    assert response["results"][0]["note_id"] == 901
    assert response["results"][0]["text"] == "Authorized note"


def test_semantic_search_keeps_admin_results_unrestricted(monkeypatch):
    sync._model.cache_clear()
    monkeypatch.setattr(sync.settings, "embedding_dimension", 3)
    collection = FakeCollection()
    monkeypatch.setattr(search, "get_collection", lambda: collection)
    monkeypatch.setitem(
        sys.modules,
        "sentence_transformers",
        SimpleNamespace(SentenceTransformer=FakeModel),
    )
    database = FakeDatabase({"note_id": 901, "note_text": "Admin-visible note", "clinic_id": 201})

    response = search.semantic_search(
        "chest",
        5,
        {"role": "ADMIN", "clinic_id": None},
        database,
    )

    assert collection.queries[0]["where"] is None
    assert "JOIN APPOINTMENT a ON a.appointment_id=n.appointment_id" in database.statements[0]
    assert "a.clinic_id=:clinic_id" not in database.statements[0]
    assert database.params[0] == {"note_id": 901}
    assert response["results"][0]["text"] == "Admin-visible note"


def test_semantic_search_drops_missing_sql_records(monkeypatch):
    sync._model.cache_clear()
    monkeypatch.setattr(sync.settings, "embedding_dimension", 3)
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
        {"role": "ADMIN", "clinic_id": None},
        FakeDatabase(None),
    )

    assert response == {"results": []}


def test_pending_note_sync_is_retryable_and_idempotent(monkeypatch):
    sync._model.cache_clear()
    monkeypatch.setattr(sync.settings, "embedding_dimension", 3)
    database = FakeOutboxDatabase(
        {"note_id": 901, "note_text": "Chest discomfort", "clinic_id": 201}
    )
    calls = []
    monkeypatch.setattr(
        sync,
        "sync_note",
        lambda note_id, text_value, metadata: calls.append(
            (note_id, text_value, metadata)
        ),
    )

    assert sync.synchronize_pending_notes(database) == 1
    assert calls == [(901, "Chest discomfort", {"clinic_id": 201})]
    assert database.updates[-1]["note_id"] == 901
    assert database.commits == 1


def test_failed_pending_sync_remains_retryable(monkeypatch):
    database = FakeOutboxDatabase(
        {"note_id": 901, "note_text": "Chest discomfort", "clinic_id": 201}
    )
    attempts = iter([RuntimeError("Chroma unavailable"), None])

    def flaky_sync(*args):
        result = next(attempts)
        if result:
            raise result

    monkeypatch.setattr(sync, "sync_note", flaky_sync)

    assert sync.synchronize_pending_notes(database) == 0
    assert database.updates[0]["note_id"] == 901
    assert sync.synchronize_pending_notes(database) == 1
    assert database.updates[-1]["note_id"] == 901
