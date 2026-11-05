from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .auth import create_token, current_user, hash_password, optional_user, require_roles, verify_password
from .config import settings
from .db import get_db
from .schemas import AppointmentCreate, AppointmentStatusUpdate, EquipmentCreate, LoginRequest, NoteCreate, PatientCreate, PatientUpdate, RegisterRequest, RoomCreate, SearchRequest, UserUpdate
from .services.scheduling import create_appointment

app = FastAPI(title="Multi-Clinic Scheduling System", version="1.0.0")
frontend_origins = [origin.strip() for origin in settings.frontend_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

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
        print("REGISTRATION DATABASE ERROR:", repr(exc.orig), flush=True)
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Registration failed. Check backend terminal.",
        ) from exc
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
    patient_scope = "" if user["role"] == "ADMIN" else " WHERE p.clinic_id=:clinic_id"
    return {
        "appointments": db.execute(text(f"SELECT COUNT(*) FROM APPOINTMENT{scope}"), params).scalar(),
        "patients": db.execute(text(f"SELECT COUNT(*) FROM PATIENT p{patient_scope}"), params).scalar(),
        "doctors": db.execute(text("SELECT COUNT(*) FROM DOCTOR WHERE status='active'")).scalar(),
    }


@app.get("/reference")
def reference(user=Depends(current_user), db: Session = Depends(get_db)):
    clinic_filter = "" if user["role"] == "ADMIN" else " WHERE clinic_id=:clinic_id"
    params = {} if user["role"] == "ADMIN" else {"clinic_id": user.get("clinic_id")}
    clinics = db.execute(text(f"SELECT clinic_id, clinic_name FROM CLINIC{clinic_filter} ORDER BY clinic_name"), params).mappings().all()
    doctors = db.execute(
        text(
            "SELECT DISTINCT d.doctor_id, d.first_name, d.last_name, d.specialization "
            "FROM DOCTOR d JOIN DOCTOR_CLINIC dc ON dc.doctor_id=d.doctor_id "
            "WHERE d.status='active' AND dc.status='active' "
            + ("" if user["role"] == "ADMIN" else "AND dc.clinic_id=:clinic_id ")
            + "ORDER BY d.last_name, d.first_name"
        ),
        params,
    ).mappings().all()
    rooms = db.execute(text(f"SELECT room_id, clinic_id, room_number, room_type, capacity, status FROM ROOM{clinic_filter} ORDER BY clinic_id, room_number"), params).mappings().all()
    equipment = db.execute(text(f"SELECT equipment_id, clinic_id, equipment_type, equipment_name, status FROM EQUIPMENT{clinic_filter} ORDER BY clinic_id, equipment_name"), params).mappings().all()
    patient_scope = "" if user["role"] == "ADMIN" else " WHERE p.clinic_id=:clinic_id"
    patients = db.execute(
        text(
            "SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth, "
            "p.gender, p.phone, p.email, p.address FROM PATIENT p"
            f"{patient_scope} ORDER BY p.last_name, p.first_name, p.patient_id"
        ),
        params,
    ).mappings().all()
    return {"patients": [dict(row) for row in patients], "clinics": [dict(row) for row in clinics], "doctors": [dict(row) for row in doctors], "rooms": [dict(row) for row in rooms], "equipment": [dict(row) for row in equipment]}


@app.get("/patients")
def patients(search: str | None = None, gender: str | None = None, user=Depends(current_user), db: Session = Depends(get_db)):
    clauses = []
    params = {}
    if search:
        clauses.append("(CAST(patient_id AS CHAR) LIKE :search OR first_name LIKE :search OR last_name LIKE :search)")
        params["search"] = f"%{search}%"
    if gender:
        clauses.append("gender=:gender")
        params["gender"] = gender
    if user["role"] != "ADMIN":
        clauses.append("clinic_id=:clinic_id")
        params["clinic_id"] = user.get("clinic_id")
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    return [dict(row) for row in db.execute(text(f"SELECT patient_id, first_name, last_name, date_of_birth, gender, phone, email, address FROM PATIENT{where} ORDER BY last_name, first_name, patient_id"), params).mappings().all()]


@app.get("/patients/{patient_id}")
def patient(patient_id: int, user=Depends(current_user), db: Session = Depends(get_db)):
    params = {"patient_id": patient_id}
    clinic_clause = ""
    if user["role"] != "ADMIN":
        clinic_clause = " AND clinic_id=:clinic_id"
        params["clinic_id"] = user.get("clinic_id")
    row = db.execute(
        text(
            "SELECT patient_id, first_name, last_name, date_of_birth, gender, "
            f"phone, email, address FROM PATIENT WHERE patient_id=:patient_id{clinic_clause}"
        ),
        params,
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Patient not found")
    return dict(row)


@app.post("/patients", status_code=201)
def create_patient(request: PatientCreate, user=Depends(require_roles("ADMIN", "STAFF", "RECEPTIONIST")), db: Session = Depends(get_db)):
    try:
        patient_id = request.patient_id
        if patient_id is None:
            patient_id = db.execute(text("SELECT COALESCE(MAX(patient_id), 0) + 1 FROM PATIENT FOR UPDATE")).scalar_one()
        clinic_id = user.get("clinic_id") or request.clinic_id
        if clinic_id is None:
            raise HTTPException(422, "A clinic is required to create a patient")
        db.execute(
            text("INSERT INTO PATIENT (patient_id, clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address) VALUES (:patient_id, :clinic_id, :first_name, :last_name, :date_of_birth, :gender, :phone, :email, :address)"),
            {"patient_id": patient_id, "clinic_id": clinic_id, **request.model_dump(exclude={"patient_id", "clinic_id"})},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Patient ID already exists or a related constraint failed") from exc
    except Exception:
        db.rollback()
        raise
    return {"patient_id": patient_id, **request.model_dump(exclude={"patient_id", "clinic_id"})}


@app.patch("/patients/{patient_id}")
def update_patient(patient_id: int, request: PatientUpdate, user=Depends(require_roles("ADMIN", "STAFF", "RECEPTIONIST")), db: Session = Depends(get_db)):
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(422, "At least one field is required")
    assignments = ", ".join(f"{field}=:{field}" for field in changes)
    params = {**changes, "patient_id": patient_id}
    clinic_clause = ""
    if user["role"] != "ADMIN":
        clinic_clause = " AND clinic_id=:clinic_id"
        params["clinic_id"] = user.get("clinic_id")
    result = db.execute(text(f"UPDATE PATIENT SET {assignments} WHERE patient_id=:patient_id{clinic_clause}"), params)
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Patient not found")
    return patient(patient_id, user, db)


@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: int, user=Depends(require_roles("ADMIN", "STAFF", "RECEPTIONIST")), db: Session = Depends(get_db)):
    params = {"patient_id": patient_id}
    clinic_clause = ""
    if user["role"] != "ADMIN":
        clinic_clause = " AND clinic_id=:clinic_id"
        params["clinic_id"] = user.get("clinic_id")
    try:
        result = db.execute(text(f"DELETE FROM PATIENT WHERE patient_id=:patient_id{clinic_clause}"), params)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Patient cannot be deleted while referenced by appointments or notes") from exc
    if result.rowcount == 0:
        raise HTTPException(404, "Patient not found")

@app.post("/appointments", status_code=201)
def schedule(request: AppointmentCreate, user=Depends(current_user), db: Session = Depends(get_db)):
    if user["role"] not in ("ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"):
        raise HTTPException(403, "Not permitted to schedule appointments")
    if user.get("clinic_id") and user["clinic_id"] != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    return {"appointment_id": create_appointment(db, request)}


@app.patch("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    request: AppointmentStatusUpdate,
    user=Depends(require_roles("ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST")),
    db: Session = Depends(get_db),
):
    params = {"appointment_id": appointment_id, "status": request.status}
    clinic_clause = ""
    if user["role"] != "ADMIN":
        clinic_clause = " AND clinic_id=:clinic_id"
        params["clinic_id"] = user.get("clinic_id")
    try:
        result = db.execute(
            text(
                f"UPDATE APPOINTMENT SET status=:status "
                f"WHERE appointment_id=:appointment_id{clinic_clause}"
            ),
            params,
        )
        if result.rowcount == 0:
            db.rollback()
            raise HTTPException(404, "Appointment not found")
        db.commit()
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise
    return {"appointment_id": appointment_id, "status": request.status}


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
    db.execute(
        text("INSERT INTO NOTE_VECTOR_OUTBOX (note_id) VALUES (:note_id)"),
        {"note_id": note_id},
    )
    db.commit()
    try:
        from vector_store.sync import synchronize_pending_notes
        if synchronize_pending_notes(db, limit=1) != 1:
            raise RuntimeError("Vector synchronization is pending")
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            503,
            "Clinical note was saved, but vector synchronization is pending; retry synchronization",
        ) from exc
    return {"note_id": note_id}

@app.post("/notes/search")
def search_notes(request: SearchRequest, user=Depends(current_user), db: Session = Depends(get_db)):
    try:
        from vector_store.search import semantic_search
        from vector_store.sync import enqueue_missing_notes, synchronize_pending_notes
        enqueue_missing_notes(db)
        synchronize_pending_notes(db)
        return semantic_search(request.query, request.top_k, user, db)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(503, str(exc)) from exc


@app.post("/notes/sync")
def sync_notes(user=Depends(require_roles("ADMIN")), db: Session = Depends(get_db)):
    from vector_store.sync import enqueue_missing_notes, synchronize_pending_notes
    enqueue_missing_notes(db)
    return {"synchronized": synchronize_pending_notes(db), "status": "ok"}


@app.get("/resources")
def resources(user=Depends(current_user), db: Session = Depends(get_db)):
    clinic_filter = "" if user["role"] == "ADMIN" else " WHERE clinic_id=:clinic_id"
    params = {} if user["role"] == "ADMIN" else {"clinic_id": user.get("clinic_id")}
    rooms = db.execute(text(f"SELECT room_id, clinic_id, room_number, room_type, capacity, status FROM ROOM{clinic_filter} ORDER BY clinic_id, room_number"), params).mappings().all()
    equipment = db.execute(text(f"SELECT equipment_id, clinic_id, equipment_type, equipment_name, status FROM EQUIPMENT{clinic_filter} ORDER BY clinic_id, equipment_name"), params).mappings().all()
    return {"rooms": [dict(row) for row in rooms], "equipment": [dict(row) for row in equipment]}


@app.post("/rooms", status_code=201)
def create_room(request: RoomCreate, user=Depends(require_roles("ADMIN", "STAFF")), db: Session = Depends(get_db)):
    if user["role"] != "ADMIN" and user.get("clinic_id") != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    try:
        result = db.execute(
            text("INSERT INTO ROOM (room_id, clinic_id, room_number, room_type, capacity, status) VALUES (:room_id, :clinic_id, :room_number, :room_type, :capacity, :status)"),
            request.model_dump(),
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Room number already exists for this clinic") from exc
    return request.model_dump()


@app.post("/equipment", status_code=201)
def create_equipment(request: EquipmentCreate, user=Depends(require_roles("ADMIN", "STAFF")), db: Session = Depends(get_db)):
    if user["role"] != "ADMIN" and user.get("clinic_id") != request.clinic_id:
        raise HTTPException(403, "Clinic access denied")
    result = db.execute(
        text("INSERT INTO EQUIPMENT (equipment_id, clinic_id, equipment_type, equipment_name, status) VALUES (:equipment_id, :clinic_id, :equipment_type, :equipment_name, :status)"),
        request.model_dump(),
    )
    db.commit()
    return request.model_dump()
