from datetime import date, time
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.schemas import AppointmentCreate
from app.services.scheduling import create_appointment


class FakeTransaction:
    def __init__(self):
        self.rolled_back = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.rolled_back = exc_type is not None
        return False


class FakeDatabase:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.transaction = FakeTransaction()
        self.executed = []

    def begin(self):
        return self.transaction

    def execute(self, statement, params=None):
        self.executed.append((str(statement), params))
        response = next(self.responses)
        if isinstance(response, Exception):
            raise response
        return response


def result(row=None, *, lastrowid=None):
    return SimpleNamespace(first=lambda: row, lastrowid=lastrowid)


def request(**overrides):
    values = {
        "patient_id": 301,
        "doctor_id": 101,
        "clinic_id": 201,
        "room_id": 601,
        "appointment_date": date(2030, 1, 7),
        "start_time": time(9, 30),
        "end_time": time(10, 0),
        "equipment": [701],
    }
    values.update(overrides)
    return AppointmentCreate(**values)


def successful_responses():
    return [
        result((101,)),
        result((601, 201)),
        result((1,)),
        result((1,)),
        result(None),
        result((701,)),
        result(None),
        result(lastrowid=123),
        result(),
    ]


def test_successful_appointment_creation_checks_availability_and_links_equipment():
    db = FakeDatabase(successful_responses())

    appointment_id = create_appointment(db, request())

    assert appointment_id == 123
    assert any("DOCTOR_AVAILABILITY" in sql for sql, _ in db.executed)
    assert db.executed[-1][1] == {"appointment_id": 123, "equipment_id": 701}


def test_doctor_unavailability_returns_conflict():
    db = FakeDatabase(
        [
            result((101,)),
            result((601, 201)),
            result(None),
        ]
    )

    with pytest.raises(HTTPException) as exc_info:
        create_appointment(db, request())

    assert exc_info.value.status_code == 409
    assert "unavailable" in exc_info.value.detail


def test_overlapping_appointment_returns_conflict():
    db = FakeDatabase(
        [
            result((101,)),
            result((601, 201)),
            result((1,)),
            result((1,)),
            result((801,)),
        ]
    )

    with pytest.raises(HTTPException) as exc_info:
        create_appointment(db, request())

    assert exc_info.value.status_code == 409
    assert "overlapping" in exc_info.value.detail


def test_equipment_failure_rolls_back_transaction():
    db = FakeDatabase(
        [
            result((101,)),
            result((601, 201)),
            result((1,)),
            result((1,)),
            result(None),
            result(None),
        ]
    )

    with pytest.raises(HTTPException) as exc_info:
        create_appointment(db, request())

    assert exc_info.value.status_code == 409
    assert db.transaction.rolled_back
