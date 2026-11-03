
USE clinic_management;

-- Reviewed, non-destructive migration for an existing database.
-- BEFORE running this file, take a logical backup and verify it:
-- mysqldump --single-transaction --routines --triggers clinic_management > clinic_management_before_repair.sql
-- mysql clinic_management < clinic_management_before_repair.sql
-- Do not run schema.sql or seed.sql against the live database.
-- The ALTER TABLE statements preserve rows and existing foreign keys.

-- 1. Create the missing authentication table
CREATE TABLE IF NOT EXISTS APP_USER (
    user_id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STAFF',
    clinic_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE (email),
    FOREIGN KEY (clinic_id) REFERENCES CLINIC(clinic_id),
    CHECK (role IN ('ADMIN', 'STAFF')),
    CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_app_user_clinic_status
ON APP_USER (clinic_id, status);

-- 2. Enable generated IDs
ALTER TABLE APPOINTMENT
MODIFY appointment_id INT NOT NULL AUTO_INCREMENT;

ALTER TABLE CLINICAL_NOTE
MODIFY note_id INT NOT NULL AUTO_INCREMENT;

-- 3. Create the missing vector synchronization outbox
CREATE TABLE IF NOT EXISTS NOTE_VECTOR_OUTBOX (
    note_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    last_error VARCHAR(500),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id),
    FOREIGN KEY (note_id) REFERENCES CLINICAL_NOTE(note_id),
    CHECK (status IN ('pending', 'synced'))
);

-- 4. Correct the existing equipment assignments
UPDATE APPOINTMENT_EQUIPMENT
SET equipment_id = 703
WHERE appointment_id = 803 AND equipment_id = 707;

UPDATE APPOINTMENT_EQUIPMENT
SET equipment_id = 707
WHERE appointment_id = 806 AND equipment_id = 701;

-- 5. Add the equipment-clinic validation trigger
DELIMITER //

CREATE TRIGGER validate_appointment_equipment_clinic
BEFORE INSERT ON APPOINTMENT_EQUIPMENT
FOR EACH ROW
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM APPOINTMENT a
        JOIN EQUIPMENT e
            ON e.equipment_id = NEW.equipment_id
        WHERE a.appointment_id = NEW.appointment_id
          AND a.clinic_id = e.clinic_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Equipment must belong to the appointment clinic';
    END IF;
END //

DELIMITER ;
