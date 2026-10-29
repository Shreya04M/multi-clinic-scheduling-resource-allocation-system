# API contract

All protected routes use `Authorization: Bearer <JWT>`. Successful responses are JSON; validation failures are `422`, authentication failures `401`, authorization failures `403`, conflicts `409`, and unavailable vector services `503`.

| Method | Path | Purpose | Role |
|---|---|---|---|
| GET | `/health` | database health | public |
| POST | `/auth/login` | issue JWT | public |
| GET | `/dashboard` | aggregate statistics | authenticated |
| GET | `/appointments` | appointment list | authenticated |
| POST | `/appointments` | transactional scheduling | admin, doctor, receptionist |
| POST | `/notes` | create clinical note | admin, doctor |
| POST | `/notes/search` | authorized semantic search | authenticated |

`POST /appointments` accepts `patient_id`, `doctor_id`, `clinic_id`, `room_id`, ISO `start_time` and `end_time`, optional `reason`, and `equipment` as `[equipment_id, quantity]` pairs. A conflict is never partially persisted.
