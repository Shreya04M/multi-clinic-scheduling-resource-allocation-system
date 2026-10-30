USE clinic_management;

DELIMITER //

CREATE TRIGGER update_room_after_cancellation
AFTER UPDATE ON APPOINTMENT
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND NEW.room_id IS NOT NULL THEN
        UPDATE ROOM
        SET status = 'available'
        WHERE room_id = NEW.room_id
          AND NOT EXISTS (
              SELECT 1
              FROM APPOINTMENT a
              WHERE a.room_id = NEW.room_id
                AND a.appointment_id <> NEW.appointment_id
                AND a.status NOT IN ('cancelled', 'completed')
                AND a.appointment_date = NEW.appointment_date
                AND a.start_time < NEW.end_time
                AND a.end_time > NEW.start_time
          );
    END IF;
END //

DELIMITER ;
