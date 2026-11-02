-- Non-destructive MySQL verification for a disposable or read-only session.
-- Run after schema.sql, seed.sql, routines, views, triggers, and indexes.
USE clinic_management;

-- Expected table inventory: 14 domain tables plus APP_USER and the outbox.
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Generated-key and index checks.
SELECT table_name, column_name, extra, column_key
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (table_name, column_name) IN
      (('APPOINTMENT', 'appointment_id'), ('CLINICAL_NOTE', 'note_id'));

SELECT table_name, index_name, index_type, column_name
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND (table_name = 'CLINICAL_NOTE' OR index_name = 'idx_clinical_note_search')
ORDER BY table_name, index_name, seq_in_index;

-- Object existence checks.
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = DATABASE()
  AND routine_name IN ('appointment_duration', 'GetPatientAppointments');

SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = DATABASE()
  AND table_name = 'appointment_details';

SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = DATABASE()
  AND trigger_name IN (
      'update_room_after_cancellation',
      'validate_appointment_equipment_clinic'
  );

-- Constraint and seed consistency checks.
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE constraint_schema = DATABASE()
ORDER BY table_name, constraint_name;

SELECT COUNT(*) AS duplicate_note_ids
FROM (
    SELECT note_id
    FROM CLINICAL_NOTE
    GROUP BY note_id
    HAVING COUNT(*) > 1
) duplicates;

SELECT ae.appointment_id, ae.equipment_id, a.clinic_id AS appointment_clinic_id,
       e.clinic_id AS equipment_clinic_id
FROM APPOINTMENT_EQUIPMENT ae
JOIN APPOINTMENT a ON a.appointment_id = ae.appointment_id
JOIN EQUIPMENT e ON e.equipment_id = ae.equipment_id
WHERE a.clinic_id <> e.clinic_id;

-- Safe transaction smoke test using only a temporary table.
CREATE TEMPORARY TABLE _transaction_probe (probe_id INT PRIMARY KEY);
START TRANSACTION;
INSERT INTO _transaction_probe VALUES (1);
ROLLBACK;
SELECT COUNT(*) AS rolled_back_rows FROM _transaction_probe;
DROP TEMPORARY TABLE _transaction_probe;
