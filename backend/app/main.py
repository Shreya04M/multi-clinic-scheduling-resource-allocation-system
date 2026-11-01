from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .auth import create_token, current_user, hash_password, optional_user, require_roles, verify_password
from .config import settings
from .db import get_db
from .schemas import AppointmentCreate, LoginRequest, NoteCreate, RegisterRequest, SearchRequest, UserUpdate
from .services.scheduling import create_appointment

app = FastAPI(title="Multi-Clinic Scheduling System", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}

@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text(
            "SELECT user_id, email, password_hash, role, clinic_id, status "
            "FROM APP_USER WHERE email=:email"
        ),
        {"email": request.email.lower()},
    ).mappings().first()
    if not user or user["status"] != "active" or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    token = create_token(str(user["user_id"]), user["role"], user["clinic_id"])
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/register", status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db), user=Depends(optional_user)):
    if request.role == "ADMIN" and (not user or user["role"] != "ADMIN"):
        raise HTTPException(403, "Only administrators can create administrators")
    if request.role == "STAFF" and user and user["role"] != "ADMIN":
        raise HTTPException(403, "Authenticated users cannot create accounts")
    if request.role == "STAFF" and request.clinic_id is None:
        raise HTTPException(422, "Staff users must be assigned to a clinic")
    if request.role == "ADMIN" and request.clinic_id is not None:
        raise HTTPException(422, "Administrators cannot be assigned to a clinic")
    try:
        result = db.execute(
            text(
                "INSERT INTO APP_USER (email, password_hash, role, clinic_id) "
                "VALUES (:email, :password_hash, :role, :clinic_id)"
            ),
            {
                "email": request.email.lower(),
                "password_hash": hash_password(request.password),
                "role": request.role,
                "clinic_id": request.clinic_id,
            },
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Email is already registered or clinic is invalid") from exc
    return {"user_id": result.lastrowid, "email": request.email.lower(), "role": request.role, "clinic_id": request.clinic_id}


@app.get("/auth/me")
def me(user=Depends(current_user), db: Session = Depends(get_db)):
    profile = db.execute(
        text(
            "SELECT user_id, email, role, clinic_id, status, created_at, updated_at "
            "FROM APP_USER WHERE user_id=:user_id"
        ),
        {"user_id": int(user["sub"])},
    ).mappings().first()
    if not profile or profile["status"] != "active":
        raise HTTPException(401, "Account is inactive or unavailable")
    return dict(profile)


@app.get("/users")
def list_users(user=Depends(require_roles("ADMIN")), db: Session = Depends(get_db)):
    return [
        dict(row)
        for row in db.execute(
            text(
                "SELECT user_id, email, role, clinic_id, status, created_at, updated_at "
                "FROM APP_USER ORDER BY user_id"
            )
        ).mappings().all()
    ]


@app.get("/users/{user_id}")
def get_user(user_id: int, user=Depends(require_roles("ADMIN")), db: Session = Depends(get_db)):
    profile = db.execute(
        text(
            "SELECT user_id, email, role, clinic_id, status, created_at, updated_at "
            "FROM APP_USER WHERE user_id=:user_id"
        ),
        {"user_id": user_id},
    ).mappings().first()
    if not profile:
        raise HTTPException(404, "User not found")
    return dict(profile)


@app.patch("/users/{user_id}")
def update_user(user_id: int, request: UserUpdate, user=Depends(require_roles("ADMIN")), db: Session = Depends(get_db)):
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(422, "At least one field is required")
    existing = db.execute(
        text("SELECT role, clinic_id FROM APP_USER WHERE user_id=:user_id"),
        {"user_id": user_id},
    ).mappings().first()
    if not existing:
        raise HTTPException(404, "User not found")
    final_role = changes.get("role", existing["role"])
    final_clinic_id = changes.get("clinic_id", existing["clinic_id"])
    if final_role == "ADMIN" and final_clinic_id is not None:
        raise HTTPException(422, "Administrators cannot be assigned to a clinic")
    if final_role == "STAFF" and final_clinic_id is None:
        raise HTTPException(422, "Staff users must be assigned to a clinic")
    if final_role == "ADMIN":
        changes["clinic_id"] = None
    assignments = []
    params = {"user_id": user_id}
    for field in ("email", "role", "clinic_id"):
        if field in changes:
            assignments.append(f"{field}=:{field}")
            params[field] = changes[field].lower() if field == "email" else changes[field]
    try:
        result = db.execute(
            text(f"UPDATE APP_USER SET {', '.join(assignments)} WHERE user_id=:user_id"),
            params,
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Email is already registered or clinic is invalid") from exc
    if result.rowcount == 0:
        raise HTTPException(404, "User not found")
    return get_user(user_id, user, db)


@app.patch("/users/{user_id}/status")
def update_user_status(user_id: int, status_value: str, user=Depends(require_roles("ADMIN")), db: Session = Depends(get_db)):
    if status_value not in ("active", "inactive"):
        raise HTTPException(422, "status must be active or inactive")
    result = db.execute(
        text("UPDATE APP_USER SET status=:status WHERE user_id=:user_id"),
        {"status": status_value, "user_id": user_id},
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "User not found")
    return get_user(user_id, user, db)

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
    if user["role"] not in ("ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"):
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
    db.execute(
        text(
            "INSERT INTO CLINICAL_NOTE "
            "(appointment_id, doctor_id, patient_id, created_at, note_text) "
            "VALUES (:appointment_id, :doctor_id, :patient_id, "
            "CURRENT_TIMESTAMP, :note_text)"
        ),
        {
            "appointment_id": request.appointment_id,
            "doctor_id": request.doctor_id,
            "patient_id": request.patient_id,
            "note_text": request.note_text,
        },
    )
    note_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    db.commit()
    return {"note_id": note_id}

@app.post("/notes/search")
def search_notes(request: SearchRequest, user=Depends(current_user)):
    from vector_store.search import semantic_search
    try:
        return semantic_search(request.query, request.top_k, user)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
