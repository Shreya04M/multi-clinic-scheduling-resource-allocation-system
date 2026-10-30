# Database scripts

These MySQL scripts implement the source-of-truth course schema for the
Multi-Clinic Patient Scheduling and Resource Allocation System.

## Files

- `schema.sql` creates `clinic_management` and the 14 tables in foreign-key
  dependency order.
- `seed.sql` inserts the supplied doctors, clinics, patients, medicines,
  availability records, relationships, rooms, equipment, appointments,
  prescriptions, follow-ups, and clinical notes.
- `functions.sql` creates `appointment_duration` and contains its example
  `SELECT`.
- `procedures.sql` creates `GetPatientAppointments` and contains its example
  `CALL`.
- `views.sql` creates `appointment_details` and contains its example query.
  The room join is `LEFT JOIN` so an appointment with no assigned room is not
  silently excluded.
- `triggers.sql` creates `update_room_after_cancellation`. It only marks a
  cancelled appointment's room available when no overlapping non-cancelled
  appointment still uses that room.
- `indexes.sql` adds the supplied FULLTEXT index
  `idx_clinical_note_search` on `CLINICAL_NOTE.note_text`.
- `queries.sql` contains the supplied counts, filters, joins, aggregates,
  subqueries, CTE, and FULLTEXT searches. Run individual queries as needed.
- `test_operations.sql` contains all supplied `UPDATE` and `DELETE` examples,
  plus the trigger cancellation test. It is not a setup script.

## Requirements and execution order

Use MySQL 8.0.16 or newer. This is the first MySQL release family where
`CHECK` constraints are enforced consistently; FULLTEXT indexes and CTEs are
also supported.

Execute the setup scripts in this order:

1. `schema.sql`
2. `seed.sql`
3. `functions.sql`
4. `procedures.sql`
5. `views.sql`
6. `triggers.sql`
7. `indexes.sql`
8. `queries.sql` (run individual queries as required)
9. `test_operations.sql` (testing only)

In MySQL Workbench, open each file, select the intended statements or the
whole script, and click the lightning-bolt Execute button. Workbench
understands the `DELIMITER //` blocks used by the function, procedure, and
trigger scripts. Run `test_operations.sql` only against a disposable test
database or after taking a backup.

## FastAPI integration

The current FastAPI implementation reads `DATABASE_URL` from `.env` through
`backend/app/config.py` and creates its SQLAlchemy engine in
`backend/app/db.py`; credentials are not stored in these scripts. The backend
default and `.env.example` now target `clinic_management`, while still
allowing a credentialed `DATABASE_URL` override. Appointment scheduling uses
`appointment_date` plus Python `datetime.time` values for the SQL `DATE` and
`TIME` columns, equipment uses the schema's link table without invented
quantity columns, and clinical notes use the actual note columns.

The schema intentionally has no application-user, password, or role table.
Consequently, `/auth/login` returns an explicit service-unavailable response
until an authentication schema is provided; existing JWT-protected endpoints
can still validate tokens issued by a compatible external login mechanism.
No database password is committed.

## Corrections and manual attention

The source view used an inner room join even though `APPOINTMENT.room_id` is
nullable; it is a `LEFT JOIN` here. The cancellation trigger was guarded
against making a room available while another overlapping appointment still
uses it. The source's missing final semicolon on `FOLLOW_UP` was added.
Seed room statuses remain exactly as supplied; the trigger does not infer
occupancy for pre-existing appointments.

No sample records were invented, and no setup script performs `UPDATE`,
`DELETE`, `DROP DATABASE`, or `DROP TABLE`.
