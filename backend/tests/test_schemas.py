import pytest
from pydantic import ValidationError
from app.schemas import AppointmentCreate, PatientCreate

def test_end_must_follow_start():
    with pytest.raises(ValidationError):
        AppointmentCreate(
            patient_id=1,
            doctor_id=1,
            clinic_id=1,
            room_id=1,
            appointment_date="2030-01-01",
            start_time="10:00:00",
            end_time="09:00:00",
        )


def test_appointment_requires_foreign_key_fields():
    with pytest.raises(ValidationError):
        AppointmentCreate(
            doctor_id=1,
            clinic_id=1,
            room_id=1,
            appointment_date="2030-01-01",
            start_time="10:00:00",
            end_time="11:00:00",
        )


def test_appointment_type_is_preserved_in_request():
    request = AppointmentCreate(
        patient_id=1,
        doctor_id=1,
        clinic_id=1,
        room_id=1,
        appointment_date="2030-01-01",
        start_time="10:00:00",
        end_time="11:00:00",
        appointment_type="Consultation",
    )
    assert request.appointment_type == "Consultation"


def test_patient_id_is_optional_for_server_assignment():
    patient = PatientCreate(
        first_name="Asha",
        last_name="Rao",
        date_of_birth="2000-01-01",
    )
    assert patient.patient_id is None
