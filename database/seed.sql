USE clinic_management;

INSERT INTO DOCTOR
(doctor_id, first_name, last_name, specialization, phone, email, license_number, status)
VALUES
(101, 'Ananya', 'Rao', 'Cardiology', '9876543210', 'ananya.rao@clinic.com', 'LIC101', 'active'),
(102, 'Rahul', 'Sharma', 'Neurology', '9876543211', 'rahul.sharma@clinic.com', 'LIC102', 'active'),
(103, 'Meera', 'Nair', 'Dermatology', '9876543212', 'meera.nair@clinic.com', 'LIC103', 'active'),
(104, 'Arjun', 'Menon', 'Orthopedics', '9876543213', 'arjun.menon@clinic.com', 'LIC104', 'active'),
(105, 'Priya', 'Iyer', 'General Medicine', '9876543214', 'priya.iyer@clinic.com', 'LIC105', 'active');

INSERT INTO CLINIC
(clinic_id, clinic_name, address, phone, email, status)
VALUES
(201, 'PES City Care Clinic', 'Electronic City, Bengaluru', '08040002001', 'citycare@clinic.com', 'active'),
(202, 'Green Valley Clinic', 'Koramangala, Bengaluru', '08040002002', 'greenvalley@clinic.com', 'active'),
(203, 'LifeCare Medical Centre', 'JP Nagar, Bengaluru', '08040002003', 'lifecare@clinic.com', 'active'),
(204, 'MediPlus Clinic', 'Indiranagar, Bengaluru', '08040002004', 'mediplus@clinic.com', 'active');

INSERT INTO PATIENT
(patient_id, first_name, last_name, date_of_birth, gender, phone, email, address)
VALUES
(301, 'Kavya', 'Sharma', '2002-05-14', 'Female', '9876501001', 'kavya.sharma@email.com', 'Electronic City, Bengaluru'),
(302, 'Rohan', 'Kumar', '1998-11-23', 'Male', '9876501002', 'rohan.kumar@email.com', 'Koramangala, Bengaluru'),
(303, 'Sneha', 'Patil', '2005-02-17', 'Female', '9876501003', 'sneha.patil@email.com', 'JP Nagar, Bengaluru'),
(304, 'Aditya', 'Reddy', '1995-08-09', 'Male', '9876501004', 'aditya.reddy@email.com', 'Indiranagar, Bengaluru'),
(305, 'Nisha', 'Shah', '2000-12-30', 'Female', '9876501005', 'nisha.shah@email.com', 'Whitefield, Bengaluru'),
(306, 'Vikram', 'Joshi', '1992-04-18', 'Male', '9876501006', 'vikram.joshi@email.com', 'HSR Layout, Bengaluru');

INSERT INTO MEDICINE
(medicine_id, medicine_name, generic_name, category)
VALUES
(401, 'Paracetamol', 'Acetaminophen', 'Analgesic'),
(402, 'Amoxicillin', 'Amoxicillin', 'Antibiotic'),
(403, 'Cetirizine', 'Cetirizine Hydrochloride', 'Antihistamine'),
(404, 'Omeprazole', 'Omeprazole', 'Antacid'),
(405, 'Ibuprofen', 'Ibuprofen', 'Anti-inflammatory'),
(406, 'Azithromycin', 'Azithromycin', 'Antibiotic'),
(407, 'Metformin', 'Metformin Hydrochloride', 'Antidiabetic'),
(408, 'Amlodipine', 'Amlodipine', 'Antihypertensive');

INSERT INTO DOCTOR_AVAILABILITY
(availability_id, doctor_id, day_of_week, start_time, end_time, status)
VALUES
(501, 101, 'Monday', '09:00:00', '13:00:00', 'active'),
(502, 101, 'Wednesday', '09:00:00', '13:00:00', 'active'),
(503, 102, 'Tuesday', '10:00:00', '14:00:00', 'active'),
(504, 102, 'Thursday', '10:00:00', '14:00:00', 'active'),
(505, 103, 'Monday', '14:00:00', '18:00:00', 'active'),
(506, 103, 'Friday', '09:00:00', '13:00:00', 'active'),
(507, 104, 'Tuesday', '09:00:00', '13:00:00', 'active'),
(508, 104, 'Thursday', '14:00:00', '18:00:00', 'active'),
(509, 105, 'Wednesday', '10:00:00', '14:00:00', 'active'),
(510, 105, 'Saturday', '09:00:00', '12:00:00', 'active');

INSERT INTO DOCTOR_CLINIC
(doctor_id, clinic_id, start_date, end_date, status)
VALUES
(101, 201, '2026-01-01', NULL, 'active'),
(102, 201, '2026-01-01', NULL, 'active'),
(103, 202, '2026-01-01', NULL, 'active'),
(104, 202, '2026-01-01', NULL, 'active'),
(105, 203, '2026-01-01', NULL, 'active'),
(101, 204, '2026-01-01', NULL, 'active'),
(103, 204, '2026-01-01', NULL, 'active');

INSERT INTO ROOM
(room_id, clinic_id, room_number, room_type, capacity, status)
VALUES
(601, 201, '101', 'Consultation', 2, 'available'),
(602, 201, '102', 'Examination', 2, 'available'),
(603, 202, '201', 'Consultation', 2, 'available'),
(604, 202, '202', 'Procedure', 4, 'available'),
(605, 203, '301', 'Consultation', 2, 'available'),
(606, 203, '302', 'Examination', 2, 'available'),
(607, 204, '401', 'Consultation', 2, 'available'),
(608, 204, '402', 'Procedure', 4, 'available');

INSERT INTO EQUIPMENT
(equipment_id, clinic_id, equipment_type, equipment_name, status)
VALUES
(701, 201, 'Diagnostic', 'ECG Machine', 'operational'),
(702, 201, 'Monitoring', 'Patient Monitor', 'operational'),
(703, 202, 'Diagnostic', 'Ultrasound Machine', 'operational'),
(704, 202, 'Procedure', 'Minor Surgery Kit', 'operational'),
(705, 203, 'Diagnostic', 'Blood Pressure Monitor', 'operational'),
(706, 203, 'Diagnostic', 'Glucometer', 'operational'),
(707, 204, 'Diagnostic', 'Dermatoscope', 'operational'),
(708, 204, 'Monitoring', 'Pulse Oximeter', 'operational');

INSERT INTO APPOINTMENT
(appointment_id, patient_id, doctor_id, clinic_id, room_id, appointment_date, start_time, end_time, appointment_type, status)
VALUES
(801, 301, 101, 201, 601, '2026-10-05', '09:00:00', '09:30:00', 'Consultation', 'scheduled'),
(802, 302, 102, 201, 602, '2026-10-06', '10:00:00', '10:30:00', 'Consultation', 'scheduled'),
(803, 303, 103, 202, 603, '2026-10-05', '14:00:00', '14:30:00', 'Consultation', 'scheduled'),
(804, 304, 104, 202, 604, '2026-10-06', '09:00:00', '10:00:00', 'Procedure', 'scheduled'),
(805, 305, 105, 203, 605, '2026-10-07', '10:00:00', '10:30:00', 'Consultation', 'scheduled'),
(806, 306, 101, 204, 607, '2026-10-08', '09:00:00', '09:30:00', 'Follow-up', 'scheduled'),
(807, 301, 103, 204, 608, '2026-10-09', '14:00:00', '14:30:00', 'Follow-up', 'scheduled'),
(808, 302, 104, 202, 604, '2026-10-13', '09:00:00', '10:00:00', 'Procedure', 'scheduled');

INSERT INTO APPOINTMENT_EQUIPMENT
(appointment_id, equipment_id)
VALUES
(801, 701), (801, 702), (802, 702), (803, 707), (804, 704),
(805, 705), (805, 706), (806, 701), (807, 707), (808, 704);

INSERT INTO PRESCRIPTION
(prescription_id, doctor_id, patient_id, appointment_id, prescription_date, status)
VALUES
(1001, 101, 301, 801, '2026-10-05', 'active'),
(1002, 102, 302, 802, '2026-10-06', 'active'),
(1003, 103, 303, 803, '2026-10-05', 'active'),
(1004, 104, 304, 804, '2026-10-06', 'active'),
(1005, 105, 305, 805, '2026-10-07', 'active'),
(1006, 101, 306, 806, '2026-10-08', 'active');

INSERT INTO PRESCRIPTION_MEDICINE
(prescription_id, medicine_id, dosage, frequency, duration, instructions)
VALUES
(1001, 401, '500 mg', 'Twice daily', '5 days', 'Take after food'),
(1001, 404, '20 mg', 'Once daily', '5 days', 'Take before breakfast'),
(1002, 401, '500 mg', 'Twice daily', '3 days', 'Take after food'),
(1002, 403, '10 mg', 'Once daily', '5 days', 'Take at night'),
(1003, 403, '10 mg', 'Once daily', '5 days', 'Take at night'),
(1004, 405, '400 mg', 'Twice daily', '5 days', 'Take after food'),
(1005, 407, '500 mg', 'Once daily', '30 days', 'Take with breakfast'),
(1005, 408, '5 mg', 'Once daily', '30 days', 'Take in the morning'),
(1006, 401, '500 mg', 'As needed', '3 days', 'Take after food');

INSERT INTO FOLLOW_UP
(follow_up_id, completed_appointment_id, doctor_id, patient_id, recommended_date, status)
VALUES
(1101, 801, 101, 301, '2026-11-05', 'pending'),
(1102, 802, 102, 302, '2026-11-06', 'pending'),
(1103, 803, 103, 303, '2026-11-05', 'pending'),
(1104, 804, 104, 304, '2026-11-20', 'pending'),
(1105, 805, 105, 305, '2026-11-07', 'pending'),
(1106, 806, 101, 306, '2026-11-08', 'pending');

INSERT INTO CLINICAL_NOTE
(note_id, appointment_id, doctor_id, patient_id, created_at, note_text, embedding)
VALUES
(901, 801, 101, 301, '2026-10-05 09:35:00', 'Chest discomfort; ECG advised.', NULL),
(902, 802, 102, 302, '2026-10-06 10:35:00', 'Recurring headaches; examination completed.', NULL),
(903, 803, 103, 303, '2026-10-05 14:35:00', 'Mild skin irritation; examination completed.', NULL),
(904, 804, 104, 304, '2026-10-06 10:10:00', 'Knee pain; procedure completed.', NULL),
(905, 805, 105, 305, '2026-10-07 10:35:00', 'Routine checkup completed.', NULL),
(906, 806, 101, 306, '2026-10-08 09:35:00', 'Follow-up completed; condition stable.', NULL);
