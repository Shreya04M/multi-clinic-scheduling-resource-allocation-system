USE clinic_management;

-- Sample UPDATE operations; execute individually when testing only.
UPDATE DOCTOR SET status = 'inactive' WHERE doctor_id = 105;
UPDATE PATIENT SET phone = '9876509999' WHERE patient_id = 301;
UPDATE CLINIC SET phone = '08040009999' WHERE clinic_id = 201;
UPDATE ROOM SET status = 'maintenance' WHERE room_id = 606;
UPDATE EQUIPMENT SET status = 'maintenance' WHERE equipment_id = 706;
UPDATE APPOINTMENT SET status = 'completed' WHERE appointment_id = 801;
UPDATE FOLLOW_UP SET status = 'completed' WHERE follow_up_id = 1101;

-- Sample DELETE operations; execute individually when testing only.
DELETE FROM DOCTOR_AVAILABILITY WHERE availability_id = 510;
DELETE FROM DOCTOR_CLINIC WHERE doctor_id = 105 AND clinic_id = 203;
DELETE FROM EQUIPMENT WHERE equipment_id = 708;
DELETE FROM ROOM WHERE room_id = 608;

-- Trigger test: cancellation should release an unoccupied room.
UPDATE APPOINTMENT SET status = 'cancelled' WHERE appointment_id = 807;
SELECT room_id, status FROM ROOM WHERE room_id = 608;
UPDATE APPOINTMENT SET status = 'scheduled' WHERE appointment_id = 807;
