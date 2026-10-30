USE clinic_management;

DELIMITER //

CREATE FUNCTION appointment_duration(
    start_time TIME,
    end_time TIME
)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIME_TO_SEC(TIMEDIFF(end_time, start_time)) / 60;
END //

DELIMITER ;

SELECT
    appointment_id,
    appointment_duration(start_time, end_time) AS duration_minutes
FROM APPOINTMENT;
