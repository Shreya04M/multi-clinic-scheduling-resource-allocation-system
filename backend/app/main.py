from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from .auth import current_user
from .config import settings
from .db import get_db
from .schemas import AppointmentCreate, LoginRequest, NoteCreate, SearchRequest
from .services.scheduling import create_appointment

app = FastAPI(title="Multi-Clinic Scheduling System", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}

@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=503,
        detail=(
            "Login is unavailable: clinic_management does not define an "
            "application-user table or password column."
        ),
    )

@app.get("/dashboard")
def dashboard(user=Depends(current_user), db: Session = Depends(get_db)):
    scope = "" if user["role"] == "ADMIN" else " WHERE clinic_id=:clinic_id"
    params = {} if not scope else {"clinic_id": user.get("clinic_id")}
    return {
        "appointments": db.execute(text(f"SELECT COUNT(*) FROM APPOINTMENT{scope}"), params).scalar(),
        "patients": db.execute(text("SELECT COUNT(*) FROM PATIENT")).scalar(),
        "doctors": db.execute(text("SELECT COUNT(*) FROM DOCTOR WHERE status='active'")).scalar(),
    }

@app.post("/appointments", status_code=201)
def schedule(request: AppointmentCreate, user=Depends(current_user), db: Session = Depends(get_db)):
    if user["role"] not in ("ADMIN", "DOCTOR", "RECEPTIONIST"):
        raise HTTPException(403, "Not permitted to schedule appointments")
    if user.get("clinic_id") and user["clinic_id"] != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    return {"appointment_id": create_appointment(db, request)}

@app.get("/appointments")
def appointments(user=Depends(current_user), db: Session = Depends(get_db)):
    query = "SELECT * FROM appointment_details"
    params = {}
    if user["role"] != "ADMIN":
        query += " WHERE clinic_name IN (SELECT clinic_name FROM CLINIC WHERE clinic_id=:clinic_id)"
        params["clinic_id"] = user.get("clinic_id")
    return [dict(row) for row in db.execute(text(query), params).mappings().all()]

@app.post("/notes", status_code=201)
def create_note(request: NoteCreate, user=Depends(current_user), db: Session = Depends(get_db)):
    if user["role"] not in ("ADMIN", "DOCTOR"):
        raise HTTPException(403, "Only doctors and administrators can create notes")
    if user["role"] == "DOCTOR" and user.get("clinic_id") != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    appointment = db.execute(
        text(
            "SELECT appointment_id FROM APPOINTMENT "
            "WHERE appointment_id=:appointment_id AND patient_id=:patient_id "
            "AND doctor_id=:doctor_id AND clinic_id=:clinic_id"
        ),
        {
            "appointment_id": request.appointment_id,
            "patient_id": request.patient_id,
            "doctor_id": request.doctor_id,
            "clinic_id": request.clinic_id,
        },
    ).first()
    if not appointment:
        raise HTTPException(422, "Appointment does not match the supplied patient, doctor, and clinic")
    note_id = db.execute(
        text("SELECT COALESCE(MAX(note_id), 0) + 1 FROM CLINICAL_NOTE")
    ).scalar_one()
    db.execute(
        text(
            "INSERT INTO CLINICAL_NOTE "
            "(note_id, appointment_id, doctor_id, patient_id, created_at, note_text) "
            "VALUES (:note_id, :appointment_id, :doctor_id, :patient_id, "
            "CURRENT_TIMESTAMP, :note_text)"
        ),
        {
            "note_id": note_id,
            "appointment_id": request.appointment_id,
            "doctor_id": request.doctor_id,
            "patient_id": request.patient_id,
            "note_text": request.note_text,
        },
    )
    db.commit()
    return {"note_id": note_id}

@app.post("/notes/search")
def search_notes(request: SearchRequest, user=Depends(current_user)):
    from vector_store.search import semantic_search
    try:
        return semantic_search(request.query, request.top_k, user)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
