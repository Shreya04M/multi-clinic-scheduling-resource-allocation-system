CREATE DATABASE IF NOT EXISTS clinic_management;
USE clinic_management;

CREATE TABLE DOCTOR (
    doctor_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(150),
    license_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    PRIMARY KEY (doctor_id),
    UNIQUE (email),
    UNIQUE (license_number)
);

CREATE TABLE CLINIC (
    clinic_id INT NOT NULL,
    clinic_name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    PRIMARY KEY (clinic_id)
);

CREATE TABLE PATIENT (
    patient_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(150),
    address VARCHAR(255),
    PRIMARY KEY (patient_id)
);

CREATE TABLE MEDICINE (
    medicine_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    category VARCHAR(100),
    PRIMARY KEY (medicine_id)
);

CREATE TABLE DOCTOR_AVAILABILITY (
    availability_id INT NOT NULL,
    doctor_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    PRIMARY KEY (availability_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
    CHECK (end_time > start_time)
);

CREATE TABLE DOCTOR_CLINIC (
    doctor_id INT NOT NULL,
    clinic_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    PRIMARY KEY (doctor_id, clinic_id, start_date),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
    FOREIGN KEY (clinic_id) REFERENCES CLINIC(clinic_id),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE ROOM (
    room_id INT NOT NULL,
    clinic_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(50),
    capacity INT,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    PRIMARY KEY (room_id),
    FOREIGN KEY (clinic_id) REFERENCES CLINIC(clinic_id),
    UNIQUE (clinic_id, room_number),
    CHECK (capacity > 0)
);

CREATE TABLE EQUIPMENT (
    equipment_id INT NOT NULL,
    clinic_id INT NOT NULL,
    equipment_type VARCHAR(100),
    equipment_name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'operational',
    PRIMARY KEY (equipment_id),
    FOREIGN KEY (clinic_id) REFERENCES CLINIC(clinic_id)
);

CREATE TABLE APPOINTMENT (
    appointment_id INT NOT NULL AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    clinic_id INT NOT NULL,
    room_id INT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_type VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    PRIMARY KEY (appointment_id),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
    FOREIGN KEY (clinic_id) REFERENCES CLINIC(clinic_id),
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id),
    CHECK (end_time > start_time)
);

CREATE TABLE APPOINTMENT_EQUIPMENT (
    appointment_id INT NOT NULL,
    equipment_id INT NOT NULL,
    PRIMARY KEY (appointment_id, equipment_id),
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id),
    FOREIGN KEY (equipment_id) REFERENCES EQUIPMENT(equipment_id)
);

CREATE TABLE CLINICAL_NOTE (
    note_id INT NOT NULL AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    note_text VARCHAR(4000),
    embedding TEXT,
    PRIMARY KEY (note_id),
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id)
);

CREATE TABLE PRESCRIPTION (
    prescription_id INT NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    appointment_id INT,
    prescription_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    PRIMARY KEY (prescription_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id),
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id)
);

CREATE TABLE PRESCRIPTION_MEDICINE (
    prescription_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration VARCHAR(50),
    instructions VARCHAR(255),
    PRIMARY KEY (prescription_id, medicine_id),
    FOREIGN KEY (prescription_id) REFERENCES PRESCRIPTION(prescription_id),
    FOREIGN KEY (medicine_id) REFERENCES MEDICINE(medicine_id)
);

CREATE TABLE FOLLOW_UP (
    follow_up_id INT NOT NULL,
    completed_appointment_id INT,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    recommended_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    PRIMARY KEY (follow_up_id),
    FOREIGN KEY (completed_appointment_id) REFERENCES APPOINTMENT(appointment_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id)
);
