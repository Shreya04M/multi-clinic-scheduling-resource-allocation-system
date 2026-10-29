import pytest
from pydantic import ValidationError
from backend.app.schemas import AppointmentCreate

def test_end_must_follow_start():
    with pytest.raises(ValidationError):
        AppointmentCreate(patient_id=1, doctor_id=1, clinic_id=1, room_id=1, start_time="2030-01-01T10:00:00", end_time="2030-01-01T09:00:00")
