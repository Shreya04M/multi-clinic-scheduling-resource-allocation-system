USE clinic_scheduler;
INSERT IGNORE INTO CLINIC (clinic_id,name,address,phone) VALUES (1,'Central Care Clinic','1 Main Street','555-0100'),(2,'Northside Clinic','2 North Road','555-0101');
INSERT IGNORE INTO DOCTOR (doctor_id,name,specialization,email) VALUES (1,'Dr. Asha Rao','General Medicine','asha@example.com'),(2,'Dr. Daniel Lee','Cardiology','daniel@example.com');
INSERT IGNORE INTO PATIENT (patient_id,name,date_of_birth,email,phone) VALUES (1,'Synthetic Patient One','1990-01-01','patient1@example.com','555-1000');
INSERT IGNORE INTO ROOM (room_id,clinic_id,name,room_type) VALUES (1,1,'Room 101','Consultation'),(2,1,'Room 102','Procedure');
INSERT IGNORE INTO EQUIPMENT (equipment_id,clinic_id,name,quantity) VALUES (1,1,'ECG machine',1),(2,1,'Pulse oximeter',2);
INSERT IGNORE INTO DOCTOR_CLINIC VALUES (1,1),(2,1),(2,2);
INSERT IGNORE INTO MEDICINE (medicine_id,name,description,stock_quantity) VALUES (1,'Demo medicine','Synthetic seed medicine',100);
-- Generate a bcrypt hash with backend/app/auth.py before inserting a local demo user.
