USE clinic_management;

-- Row counts
SELECT COUNT(*) FROM DOCTOR;
SELECT COUNT(*) FROM CLINIC;
SELECT COUNT(*) FROM PATIENT;
SELECT COUNT(*) FROM MEDICINE;
SELECT COUNT(*) FROM DOCTOR_AVAILABILITY;
SELECT COUNT(*) FROM DOCTOR_CLINIC;
SELECT COUNT(*) FROM ROOM;
SELECT COUNT(*) FROM EQUIPMENT;
SELECT COUNT(*) FROM APPOINTMENT;
SELECT COUNT(*) FROM APPOINTMENT_EQUIPMENT;
SELECT COUNT(*) FROM CLINICAL_NOTE;
SELECT COUNT(*) FROM PRESCRIPTION;
SELECT COUNT(*) FROM PRESCRIPTION_MEDICINE;
SELECT COUNT(*) FROM FOLLOW_UP;

-- Basic filters and projections
SELECT * FROM DOCTOR WHERE specialization = 'Cardiology';
SELECT * FROM DOCTOR;
SELECT * FROM PATIENT;
SELECT * FROM APPOINTMENT;
SELECT * FROM DOCTOR WHERE specialization = 'Cardiology';
SELECT * FROM DOCTOR WHERE status = 'active';
SELECT * FROM PATIENT WHERE gender = 'Female';
SELECT * FROM APPOINTMENT WHERE status = 'scheduled';
SELECT DISTINCT specialization FROM DOCTOR;
SELECT DISTINCT appointment_type FROM APPOINTMENT;
SELECT DISTINCT room_type FROM ROOM;

-- Sorting and pattern filters
SELECT * FROM DOCTOR ORDER BY first_name ASC;
SELECT * FROM PATIENT ORDER BY last_name ASC;
SELECT * FROM APPOINTMENT ORDER BY appointment_date ASC;
SELECT * FROM ROOM ORDER BY capacity DESC;
SELECT * FROM PATIENT WHERE first_name LIKE 'A%';
SELECT * FROM DOCTOR WHERE last_name LIKE 'S%';
SELECT * FROM CLINIC WHERE clinic_name LIKE '%Clinic%';
SELECT * FROM DOCTOR WHERE specialization IN ('Cardiology', 'Neurology');
SELECT * FROM APPOINTMENT WHERE status IN ('scheduled', 'completed');
SELECT * FROM PATIENT WHERE gender IN ('Male', 'Female');
SELECT * FROM APPOINTMENT WHERE appointment_date BETWEEN '2026-10-05' AND '2026-10-08';
SELECT * FROM PATIENT WHERE date_of_birth BETWEEN '1995-01-01' AND '2005-12-31';
SELECT * FROM ROOM WHERE capacity BETWEEN 2 AND 4;

-- Appointment and resource joins
SELECT
    a.appointment_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
    d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
    a.appointment_date, a.start_time, a.status
FROM APPOINTMENT a
JOIN PATIENT p ON a.patient_id = p.patient_id
JOIN DOCTOR d ON a.doctor_id = d.doctor_id;

SELECT
    a.appointment_id, p.first_name AS patient_name, d.specialization,
    c.clinic_name, r.room_number, a.appointment_date, a.start_time
FROM APPOINTMENT a
JOIN PATIENT p ON a.patient_id = p.patient_id
JOIN DOCTOR d ON a.doctor_id = d.doctor_id
JOIN CLINIC c ON a.clinic_id = c.clinic_id
LEFT JOIN ROOM r ON a.room_id = r.room_id;

SELECT d.doctor_id, d.first_name, d.last_name, c.clinic_name
FROM DOCTOR d
JOIN DOCTOR_CLINIC dc ON d.doctor_id = dc.doctor_id
JOIN CLINIC c ON dc.clinic_id = c.clinic_id;

SELECT
    a.appointment_id, p.first_name AS patient_name, d.first_name AS doctor_name,
    m.medicine_name, pm.dosage, pm.frequency, pm.duration
FROM PRESCRIPTION psc
JOIN APPOINTMENT a ON psc.appointment_id = a.appointment_id
JOIN PATIENT p ON psc.patient_id = p.patient_id
JOIN DOCTOR d ON psc.doctor_id = d.doctor_id
JOIN PRESCRIPTION_MEDICINE pm ON psc.prescription_id = pm.prescription_id
JOIN MEDICINE m ON pm.medicine_id = m.medicine_id;

SELECT a.appointment_id, e.equipment_name, e.equipment_type
FROM APPOINTMENT_EQUIPMENT ae
JOIN APPOINTMENT a ON ae.appointment_id = a.appointment_id
JOIN EQUIPMENT e ON ae.equipment_id = e.equipment_id;

-- Aggregate queries
SELECT COUNT(*) AS total_doctors FROM DOCTOR;
SELECT COUNT(*) AS total_patients FROM PATIENT;
SELECT COUNT(*) AS total_appointments FROM APPOINTMENT;
SELECT COUNT(*) AS total_appointments FROM APPOINTMENT WHERE status = 'scheduled';
SELECT COUNT(*) AS total_appointments FROM APPOINTMENT WHERE status = 'completed';
SELECT doctor_id, COUNT(*) AS appointment_count FROM APPOINTMENT GROUP BY doctor_id;
SELECT clinic_id, COUNT(*) AS appointment_count FROM APPOINTMENT GROUP BY clinic_id;
SELECT appointment_type, COUNT(*) AS appointment_count FROM APPOINTMENT GROUP BY appointment_type;
SELECT status, COUNT(*) AS appointment_count FROM APPOINTMENT GROUP BY status;
SELECT doctor_id, COUNT(*) AS appointment_count FROM APPOINTMENT GROUP BY doctor_id HAVING COUNT(*) > 1;
SELECT clinic_id, COUNT(*) AS appointment_count FROM APPOINTMENT GROUP BY clinic_id HAVING COUNT(*) > 1;
SELECT doctor_id, COUNT(*) AS appointment_count
FROM APPOINTMENT GROUP BY doctor_id ORDER BY appointment_count DESC;

-- Subqueries
SELECT * FROM DOCTOR WHERE doctor_id IN (SELECT doctor_id FROM APPOINTMENT);
SELECT * FROM PATIENT WHERE patient_id IN (SELECT patient_id FROM APPOINTMENT);
SELECT * FROM DOCTOR WHERE doctor_id IN (
    SELECT doctor_id FROM DOCTOR_CLINIC WHERE clinic_id = 201
);
SELECT * FROM MEDICINE WHERE medicine_id IN (
    SELECT medicine_id FROM PRESCRIPTION_MEDICINE
);
SELECT * FROM APPOINTMENT WHERE appointment_id IN (
    SELECT completed_appointment_id FROM FOLLOW_UP WHERE status = 'pending'
);

-- CTE
WITH DoctorAppointments AS (
    SELECT doctor_id, COUNT(*) AS appointment_count
    FROM APPOINTMENT
    GROUP BY doctor_id
)
SELECT doctor_id, appointment_count
FROM DoctorAppointments
WHERE appointment_count > 1;

-- Full-text clinical-note searches (run after indexes.sql)
SELECT note_id, patient_id, note_text
FROM CLINICAL_NOTE
WHERE MATCH(note_text) AGAINST('headaches' IN NATURAL LANGUAGE MODE);

SELECT note_id, patient_id, note_text
FROM CLINICAL_NOTE
WHERE MATCH(note_text) AGAINST('chest discomfort' IN NATURAL LANGUAGE MODE);
