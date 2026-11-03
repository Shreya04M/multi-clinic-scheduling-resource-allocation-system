from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.main import create_patient
from app.schemas import PatientCreate


class FakeDatabase:
    def __init__(self, *, insert_error=None):
        self.insert_error = insert_error
        self.commits = 0
        self.rollbacks = 0
        self.transaction_started = True
        self.begin_called = False

    def begin(self):
        self.begin_called = True
        raise AssertionError("create_patient must not start a nested transaction")

    def execute(self, statement, params=None):
        if "MAX(patient_id)" in str(statement):
            return SimpleNamespace(scalar_one=lambda: 307)
        if self.insert_error:
            raise self.insert_error
        return SimpleNamespace()

    def commit(self):
        self.commits += 1
        self.transaction_started = False

    def rollback(self):
        self.rollbacks += 1
        self.transaction_started = False


def patient_request():
    return PatientCreate(
        first_name="Asha",
        last_name="Rao",
        date_of_birth=date(2000, 1, 1),
        gender="Female",
        phone="9876500000",
        email="asha.rao@example.com",
        address="Bengaluru",
    )


def test_create_patient_commits_using_existing_session_transaction():
    db = FakeDatabase()

    response = create_patient(patient_request(), {"role": "STAFF", "clinic_id": 201}, db)

    assert response["patient_id"] == 307
    assert db.commits == 1
    assert db.rollbacks == 0
    assert not db.transaction_started
    assert not db.begin_called


def test_create_patient_rolls_back_integrity_failure():
    db = FakeDatabase(insert_error=IntegrityError("duplicate", {}, Exception()))

    with pytest.raises(HTTPException) as exc_info:
        create_patient(patient_request(), {"role": "STAFF", "clinic_id": 201}, db)

    assert exc_info.value.status_code == 409
    assert db.commits == 0
    assert db.rollbacks == 1
    assert not db.transaction_started


def test_create_patient_rolls_back_unexpected_database_failure():
    db = FakeDatabase(insert_error=RuntimeError("database unavailable"))

    with pytest.raises(RuntimeError, match="database unavailable"):
        create_patient(patient_request(), {"role": "STAFF", "clinic_id": 201}, db)

    assert db.commits == 0
    assert db.rollbacks == 1
