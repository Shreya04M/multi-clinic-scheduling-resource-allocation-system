USE clinic_management;

-- Non-destructive, repeatable migration for existing databases.
-- Existing patient ownership is taken from appointments. If a patient has
-- appointments at multiple clinics, the lowest clinic_id is selected
-- deterministically. Patients without appointments use demo clinic 201.

DROP PROCEDURE IF EXISTS migrate_patient_clinic;

DELIMITER //

CREATE PROCEDURE migrate_patient_clinic()
BEGIN
    DECLARE v_column_exists INT DEFAULT 0;
    DECLARE v_fk_exists INT DEFAULT 0;
    DECLARE v_nullable VARCHAR(3) DEFAULT 'YES';

    -- This check runs before any ALTER TABLE statement.
    IF NOT EXISTS (
        SELECT 1
        FROM CLINIC
        WHERE clinic_id = 201
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Migration aborted: default clinic 201 does not exist';
    END IF;

    SELECT COUNT(*)
    INTO v_column_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PATIENT'
      AND COLUMN_NAME = 'clinic_id';

    IF v_column_exists = 0 THEN
        ALTER TABLE PATIENT
            ADD COLUMN clinic_id INT NULL AFTER patient_id;
    END IF;

    -- Only fill missing ownership; existing non-NULL assignments are kept.
    UPDATE PATIENT p
    LEFT JOIN (
        SELECT patient_id, MIN(clinic_id) AS clinic_id
        FROM APPOINTMENT
        GROUP BY patient_id
    ) a ON a.patient_id = p.patient_id
    SET p.clinic_id = COALESCE(a.clinic_id, 201)
    WHERE p.clinic_id IS NULL;

    SELECT IS_NULLABLE
    INTO v_nullable
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PATIENT'
      AND COLUMN_NAME = 'clinic_id';

    IF v_nullable = 'YES' THEN
        ALTER TABLE PATIENT
            MODIFY COLUMN clinic_id INT NOT NULL;
    END IF;

    -- Reject invalid existing clinic assignments before adding the FK.
    IF EXISTS (
        SELECT 1
        FROM PATIENT p
        LEFT JOIN CLINIC c ON c.clinic_id = p.clinic_id
        WHERE c.clinic_id IS NULL
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Migration aborted: patient has an invalid clinic_id';
    END IF;

    SELECT COUNT(*)
    INTO v_fk_exists
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PATIENT'
      AND COLUMN_NAME = 'clinic_id'
      AND REFERENCED_TABLE_NAME = 'CLINIC'
      AND REFERENCED_COLUMN_NAME = 'clinic_id';

    IF v_fk_exists = 0 THEN
        ALTER TABLE PATIENT
            ADD CONSTRAINT fk_patient_clinic
            FOREIGN KEY (clinic_id) REFERENCES CLINIC(clinic_id);
    END IF;
END//

DELIMITER ;

CALL migrate_patient_clinic();
DROP PROCEDURE IF EXISTS migrate_patient_clinic;
