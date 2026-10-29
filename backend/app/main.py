from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from .auth import current_user, create_token
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
    user = db.execute(text("SELECT email, role, clinic_id, password_hash FROM app_user WHERE email=:email AND active=1"), {"email":request.email}).mappings().first()
    if not user:
        raise HTTPException(401, "Invalid email or password")
    from .auth import verify_password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_token(user["email"], user["role"], user["clinic_id"]), "token_type": "bearer"}

@app.get("/dashboard")
def dashboard(user=Depends(current_user), db: Session = Depends(get_db)):
    scope = "" if user["role"] == "ADMIN" else " WHERE clinic_id=:clinic_id"
    params = {} if not scope else {"clinic_id": user.get("clinic_id")}
    return {"appointments": db.execute(text(f"SELECT COUNT(*) FROM APPOINTMENT{scope}"), params).scalar(), "patients": db.execute(text("SELECT COUNT(*) FROM PATIENT")).scalar(), "doctors": db.execute(text("SELECT COUNT(*) FROM DOCTOR WHERE active=1")).scalar()}

@app.post("/appointments", status_code=201)
def schedule(request: AppointmentCreate, user=Depends(current_user), db: Session = Depends(get_db)):
    if user["role"] not in ("ADMIN", "DOCTOR", "RECEPTIONIST"):
        raise HTTPException(403, "Not permitted to schedule appointments")
    if user.get("clinic_id") and user["clinic_id"] != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    return {"appointment_id": create_appointment(db, request)}

@app.get("/appointments")
def appointments(user=Depends(current_user), db: Session = Depends(get_db)):
    query = "SELECT * FROM appointment_summary"
    params = {}
    if user["role"] != "ADMIN":
        query += " WHERE clinic_name IS NOT NULL AND clinic_name IN (SELECT name FROM CLINIC WHERE clinic_id=:clinic_id)"
        params["clinic_id"] = user.get("clinic_id")
    return [dict(row) for row in db.execute(text(query), params).mappings().all()]

@app.post("/notes", status_code=201)
def create_note(request: NoteCreate, user=Depends(current_user), db: Session = Depends(get_db)):
    if user["role"] not in ("ADMIN", "DOCTOR"):
        raise HTTPException(403, "Only doctors and administrators can create notes")
    if user["role"] == "DOCTOR" and user.get("clinic_id") != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    result = db.execute(text("INSERT INTO CLINICAL_NOTE (patient_id,doctor_id,clinic_id,appointment_id,note_text,embedding_id) VALUES (:p,:d,:c,:a,:t,:id)"), {"p":request.patient_id,"d":request.doctor_id,"c":request.clinic_id,"a":request.appointment_id,"t":request.note_text,"id":None})
    db.commit()
    return {"note_id": result.lastrowid}

@app.post("/notes/search")
def search_notes(request: SearchRequest, user=Depends(current_user)):
    from vector_store.search import semantic_search
    try:
        return semantic_search(request.query, request.top_k, user)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
