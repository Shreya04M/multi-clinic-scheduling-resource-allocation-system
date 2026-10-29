from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..schemas import AppointmentCreate

def create_appointment(db: Session, request: AppointmentCreate) -> int:
    if request.start_time <= datetime.now(request.start_time.tzinfo):
        raise HTTPException(422, "Appointment must start in the future")
    with db.begin():
        doctor = db.execute(text("SELECT doctor_id FROM DOCTOR WHERE doctor_id=:id FOR UPDATE"), {"id": request.doctor_id}).first()
        room = db.execute(text("SELECT room_id, clinic_id FROM ROOM WHERE room_id=:id AND active=1 FOR UPDATE"), {"id": request.room_id}).first()
        if not doctor or not room or room.clinic_id != request.clinic_id:
            raise HTTPException(409, "Doctor or room is unavailable for this clinic")
        linked = db.execute(text("SELECT 1 FROM DOCTOR_CLINIC WHERE doctor_id=:d AND clinic_id=:c"), {"d":request.doctor_id,"c":request.clinic_id}).first()
        if not linked:
            raise HTTPException(409, "Doctor is not associated with this clinic")
        overlap = "SELECT 1 FROM APPOINTMENT WHERE status <> 'CANCELLED' AND (doctor_id=:d OR room_id=:r) AND start_time < :end AND end_time > :start LIMIT 1"
        if db.execute(text(overlap), {"d":request.doctor_id,"r":request.room_id,"start":request.start_time,"end":request.end_time}).first():
            raise HTTPException(409, "Doctor or room has an overlapping appointment")
        for equipment_id, quantity in request.equipment:
            item = db.execute(text("SELECT quantity FROM EQUIPMENT WHERE equipment_id=:e AND clinic_id=:c AND active=1 FOR UPDATE"), {"e":equipment_id,"c":request.clinic_id}).first()
            if not item or item.quantity < quantity:
                raise HTTPException(409, f"Equipment {equipment_id} is unavailable")
            used = db.execute(text("SELECT COALESCE(SUM(ae.quantity),0) used_quantity FROM APPOINTMENT_EQUIPMENT ae JOIN APPOINTMENT a USING(appointment_id) WHERE ae.equipment_id=:e AND a.status <> 'CANCELLED' AND a.start_time < :end AND a.end_time > :start"), {"e":equipment_id,"start":request.start_time,"end":request.end_time}).scalar()
            if used + quantity > item.quantity:
                raise HTTPException(409, f"Equipment {equipment_id} has an overlapping allocation")
        result = db.execute(text("INSERT INTO APPOINTMENT (patient_id,doctor_id,clinic_id,room_id,start_time,end_time,reason) VALUES (:p,:d,:c,:r,:s,:e,:reason)"), {"p":request.patient_id,"d":request.doctor_id,"c":request.clinic_id,"r":request.room_id,"s":request.start_time,"e":request.end_time,"reason":request.reason})
        appointment_id = result.lastrowid
        for equipment_id, quantity in request.equipment:
            db.execute(text("INSERT INTO APPOINTMENT_EQUIPMENT VALUES (:a,:e,:q)"), {"a":appointment_id,"e":equipment_id,"q":quantity})
    return appointment_id
