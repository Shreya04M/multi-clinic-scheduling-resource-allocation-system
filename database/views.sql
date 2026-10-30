USE clinic_management;

CREATE VIEW appointment_details AS
SELECT
    a.appointment_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    c.clinic_name,
    r.room_number,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.appointment_type,
    a.status
FROM APPOINTMENT a
JOIN PATIENT p ON a.patient_id = p.patient_id
JOIN DOCTOR d ON a.doctor_id = d.doctor_id
JOIN CLINIC c ON a.clinic_id = c.clinic_id
LEFT JOIN ROOM r ON a.room_id = r.room_id;

SELECT * FROM appointment_details;
