from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.main import update_appointment_status
from app.schemas import AppointmentStatusUpdate


class FakeDatabase:
    def __init__(self, rowcount=1, execute_error=None):
        self.rowcount = rowcount
        self.execute_error = execute_error
        self.commits = 0
        self.rollbacks = 0

    def execute(self, statement, params):
        if self.execute_error:
            raise self.execute_error
        self.params = params
        return SimpleNamespace(rowcount=self.rowcount)

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def test_status_update_commits_for_user_clinic():
    db = FakeDatabase()

    response = update_appointment_status(
        801,
        AppointmentStatusUpdate(status="completed"),
        {"role": "STAFF", "clinic_id": 201},
        db,
    )

    assert response == {"appointment_id": 801, "status": "completed"}
    assert db.params["clinic_id"] == 201
    assert db.commits == 1
    assert db.rollbacks == 0


def test_status_update_returns_not_found_for_other_clinic():
    db = FakeDatabase(rowcount=0)

    with pytest.raises(HTTPException) as exc_info:
        update_appointment_status(
            801,
            AppointmentStatusUpdate(status="completed"),
            {"role": "STAFF", "clinic_id": 202},
            db,
        )

    assert exc_info.value.status_code == 404
    assert db.commits == 0
    assert db.rollbacks == 1


def test_status_update_rolls_back_when_database_update_fails():
    db = FakeDatabase(execute_error=RuntimeError("database unavailable"))

    with pytest.raises(RuntimeError):
        update_appointment_status(
            801,
            AppointmentStatusUpdate(status="completed"),
            {"role": "STAFF", "clinic_id": 201},
            db,
        )

    assert db.commits == 0
    assert db.rollbacks == 1
