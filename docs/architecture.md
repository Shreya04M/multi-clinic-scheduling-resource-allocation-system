# Architecture and design decisions

MySQL owns identities, relationships, constraints, availability, appointment transactions, and clinical-note access metadata. ChromaDB stores only the vector index and minimal note metadata; note content is resolved and authorization-checked by the API in a production deployment. This avoids using a vector index as a source of truth.

The scheduling service uses row locks and a single transaction. It validates doctor-clinic association, future and ordered timestamps, doctor and room overlap, and aggregate equipment quantity before inserting the appointment and allocations.

`APPOINTMENT.appointment_id` and `CLINICAL_NOTE.note_id` are MySQL
`AUTO_INCREMENT` keys. The backend does not calculate IDs with `MAX(...)`,
avoiding duplicate IDs under concurrent requests. Scheduling also validates
the requested weekday and full time range against active
`DOCTOR_AVAILABILITY` rows.

Clinical-note creation currently persists to MySQL only. The standalone
Chroma synchronization utilities support upsert/delete, but note create,
update, and delete API lifecycle hooks are not yet present; MySQL remains the
source of truth until those hooks are added.
