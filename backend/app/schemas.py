from datetime import date, time

from pydantic import BaseModel, Field, model_validator


class LoginRequest(BaseModel):
    email: str
    password: str


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    clinic_id: int
    room_id: int
    appointment_date: date
    start_time: time
    end_time: time
    equipment: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class NoteCreate(BaseModel):
    patient_id: int
    doctor_id: int
    clinic_id: int
    appointment_id: int
    note_text: str = Field(min_length=1, max_length=4000)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)
