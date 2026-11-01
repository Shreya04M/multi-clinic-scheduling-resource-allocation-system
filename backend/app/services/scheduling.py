from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..schemas import AppointmentCreate


def create_appointment(db: Session, request: AppointmentCreate) -> int:
    appointment_start = datetime.combine(request.appointment_date, request.start_time)
    if appointment_start <= datetime.now():
        raise HTTPException(422, "Appointment must start in the future")

    with db.begin():
        doctor = db.execute(
            text("SELECT doctor_id FROM DOCTOR WHERE doctor_id=:id AND status='active' FOR UPDATE"),
            {"id": request.doctor_id},
        ).first()
        room = db.execute(
            text(
                "SELECT room_id, clinic_id FROM ROOM "
                "WHERE room_id=:id AND clinic_id=:clinic_id AND status='available' FOR UPDATE"
            ),
            {"id": request.room_id, "clinic_id": request.clinic_id},
        ).first()
        if not doctor or not room:
            raise HTTPException(409, "Doctor or room is unavailable for this clinic")

        availability = db.execute(
            text(
                "SELECT 1 FROM DOCTOR_AVAILABILITY "
                "WHERE doctor_id=:doctor_id AND day_of_week=:day_of_week "
                "AND status='active' AND start_time <= :start_time "
                "AND end_time >= :end_time LIMIT 1"
            ),
            {
                "doctor_id": request.doctor_id,
                "day_of_week": appointment_start.strftime("%A"),
                "start_time": request.start_time,
                "end_time": request.end_time,
            },
        ).first()
        if not availability:
            raise HTTPException(409, "Doctor is unavailable during the requested time")

        linked = db.execute(
            text(
                "SELECT 1 FROM DOCTOR_CLINIC "
                "WHERE doctor_id=:doctor_id AND clinic_id=:clinic_id AND status='active' "
                "AND start_date <= :appointment_date "
                "AND (end_date IS NULL OR end_date >= :appointment_date)"
            ),
            {
                "doctor_id": request.doctor_id,
                "clinic_id": request.clinic_id,
                "appointment_date": request.appointment_date,
            },
        ).first()
        if not linked:
            raise HTTPException(409, "Doctor is not associated with this clinic")

        overlap = db.execute(
            text(
                "SELECT 1 FROM APPOINTMENT "
                "WHERE status NOT IN ('cancelled', 'completed') "
                "AND appointment_date=:appointment_date "
                "AND (doctor_id=:doctor_id OR room_id=:room_id) "
                "AND start_time < :end_time AND end_time > :start_time LIMIT 1"
            ),
            {
                "doctor_id": request.doctor_id,
                "room_id": request.room_id,
                "appointment_date": request.appointment_date,
                "start_time": request.start_time,
                "end_time": request.end_time,
            },
        ).first()
        if overlap:
            raise HTTPException(409, "Doctor or room has an overlapping appointment")

        if len(request.equipment) != len(set(request.equipment)):
            raise HTTPException(422, "Each equipment item may be selected only once")
        for equipment_id in request.equipment:
            item = db.execute(
                text(
                    "SELECT equipment_id FROM EQUIPMENT "
                    "WHERE equipment_id=:equipment_id AND clinic_id=:clinic_id "
                    "AND status='operational' FOR UPDATE"
                ),
                {"equipment_id": equipment_id, "clinic_id": request.clinic_id},
            ).first()
            if not item:
                raise HTTPException(409, f"Equipment {equipment_id} is unavailable")

            allocated = db.execute(
                text(
                    "SELECT 1 FROM APPOINTMENT_EQUIPMENT ae "
                    "JOIN APPOINTMENT a USING (appointment_id) "
                    "WHERE ae.equipment_id=:equipment_id "
                    "AND a.status NOT IN ('cancelled', 'completed') "
                    "AND a.appointment_date=:appointment_date "
                    "AND a.start_time < :end_time AND a.end_time > :start_time "
                    "LIMIT 1"
                ),
                {
                    "equipment_id": equipment_id,
                    "appointment_date": request.appointment_date,
                    "start_time": request.start_time,
                    "end_time": request.end_time,
                },
            ).first()
            if allocated:
                raise HTTPException(409, f"Equipment {equipment_id} has an overlapping allocation")

        result = db.execute(
            text(
                "INSERT INTO APPOINTMENT "
                "(patient_id, doctor_id, clinic_id, room_id, appointment_date, "
                "start_time, end_time, status) "
                "VALUES (:patient_id, :doctor_id, :clinic_id, :room_id, "
                ":appointment_date, :start_time, :end_time, 'scheduled')"
            ),
            {
                "patient_id": request.patient_id,
                "doctor_id": request.doctor_id,
                "clinic_id": request.clinic_id,
                "room_id": request.room_id,
                "appointment_date": request.appointment_date,
                "start_time": request.start_time,
                "end_time": request.end_time,
            },
        )
        appointment_id = result.lastrowid
        for equipment_id in request.equipment:
            db.execute(
                text(
                    "INSERT INTO APPOINTMENT_EQUIPMENT (appointment_id, equipment_id) "
                    "VALUES (:appointment_id, :equipment_id)"
                ),
                {"appointment_id": appointment_id, "equipment_id": equipment_id},
            )

    return appointment_id
