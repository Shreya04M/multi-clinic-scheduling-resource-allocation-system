USE clinic_management;

DELIMITER //

CREATE PROCEDURE GetPatientAppointments(IN p_patient_id INT)
BEGIN
    SELECT
        a.appointment_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.appointment_type,
        a.status
    FROM APPOINTMENT a
    WHERE a.patient_id = p_patient_id
    ORDER BY a.appointment_date, a.start_time;
END //

DELIMITER ;

CALL GetPatientAppointments(301);
