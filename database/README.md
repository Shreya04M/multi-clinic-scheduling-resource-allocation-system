# Database scripts

These MySQL scripts implement the source-of-truth course schema for the
Multi-Clinic Patient Scheduling and Resource Allocation System.

## Files

- `schema.sql` creates `clinic_management` and the 16 tables in foreign-key
  dependency order.
  `APP_USER` stores only bcrypt password hashes, supports `ADMIN` and `STAFF`
  roles, and optionally links staff to a clinic. Email is unique and account
  status is constrained to `active` or `inactive`.
  `APPOINTMENT.appointment_id` and `CLINICAL_NOTE.note_id` are
  `AUTO_INCREMENT`; seed data may still provide explicit IDs, while backend
  inserts omit them and use MySQL-generated values.
- `seed.sql` inserts the supplied doctors, clinics, patients, medicines,
  availability records, relationships, rooms, equipment, appointments,
  prescriptions, follow-ups, and clinical notes.
  It uses `INSERT IGNORE` inside one transaction, so reruns do not duplicate
  seeded primary or unique keys and existing user-created rows are preserved.
  A duplicate seed key is skipped rather than replacing an existing row.
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
2. `seed.sql` (safe to rerun; do not use `test_operations.sql` as setup)
3. `functions.sql`
4. `procedures.sql`
5. `views.sql`
6. `triggers.sql`
7. `indexes.sql`
8. `queries.sql` (run individual queries as required)
9. `test_operations.sql` (testing only)
10. `verify.sql` (non-destructive verification queries)

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

The first administrator must be created securely by generating a bcrypt hash
with `backend/app/auth.py` and inserting it into `APP_USER`, or by using an
already authenticated administrator to create the account. Public registration
creates `STAFF` accounts only; it cannot create `ADMIN` accounts.
No database password or application password is committed.

Appointment creation also checks `DOCTOR_AVAILABILITY` for the appointment
weekday and complete requested time range before checking overlaps and
allocating equipment. The whole insert and equipment-link operation runs in
one transaction with row locks.

The repository does not include a MySQL server or credentials. Run the
backend tests for isolated validation, then execute the SQL scripts and
integration tests against a disposable MySQL 8.0.16+ database.

## Verification status

Static inspection confirms the 14 domain tables plus the application-only
`APP_USER` table, generated appointment and clinical-note IDs, foreign keys,
checks, views, routines, trigger, indexes, and FULLTEXT definitions. Live
execution is currently **BLOCKED** because no MySQL client/server is available
in the development environment. Do not report SQL execution, constraint
enforcement, trigger behavior, or FULLTEXT creation as passing until the
following safe verification is run against a disposable MySQL 8.0.16+
database:

```powershell
mysql -u <user> -p -e "CREATE DATABASE clinic_management_audit;"
mysql -u <user> -p clinic_management_audit < database/schema.sql
mysql -u <user> -p clinic_management_audit < database/seed.sql
mysql -u <user> -p clinic_management_audit < database/functions.sql
mysql -u <user> -p clinic_management_audit < database/procedures.sql
mysql -u <user> -p clinic_management_audit < database/views.sql
mysql -u <user> -p clinic_management_audit < database/triggers.sql
mysql -u <user> -p clinic_management_audit < database/indexes.sql
mysql -u <user> -p clinic_management_audit < database/queries.sql
mysql -u <user> -p clinic_management_audit < database/verify.sql
```

The seed is non-destructive and rerunnable. The corrected equipment links use
equipment from the appointment's clinic, and the verification query reports
any remaining cross-clinic assignments. The database trigger
`validate_appointment_equipment_clinic` rejects new mismatches. Use a
disposable audit database and do not run `test_operations.sql` against
project data.

## Corrections and manual attention

The source view used an inner room join even though `APPOINTMENT.room_id` is
nullable; it is a `LEFT JOIN` here. The cancellation trigger was guarded
against making a room available while another overlapping appointment still
uses it. The source's missing final semicolon on `FOLLOW_UP` was added.
Seed room statuses remain exactly as supplied; the trigger does not infer
occupancy for pre-existing appointments.

No sample records were invented, and no setup script performs `UPDATE`,
`DELETE`, `DROP DATABASE`, or `DROP TABLE`.
