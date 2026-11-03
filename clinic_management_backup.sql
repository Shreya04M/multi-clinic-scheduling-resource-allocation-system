-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: clinic_management
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_user`
--

DROP TABLE IF EXISTS `app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'STAFF',
  `clinic_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_app_user_clinic_status` (`clinic_id`,`status`),
  CONSTRAINT `app_user_ibfk_1` FOREIGN KEY (`clinic_id`) REFERENCES `clinic` (`clinic_id`),
  CONSTRAINT `app_user_chk_1` CHECK ((`role` in (_utf8mb4'ADMIN',_utf8mb4'STAFF'))),
  CONSTRAINT `app_user_chk_2` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive')))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_user`
--

LOCK TABLES `app_user` WRITE;
/*!40000 ALTER TABLE `app_user` DISABLE KEYS */;
INSERT INTO `app_user` VALUES (5,'shreyamattimadu@gmail.com','$2b$12$EOJMvjoHmVyi6I9sXTvCX.jUqn7smfwRP1boyXYf4Sq/qfS2XNhGS','STAFF',201,'active','2026-11-02 16:33:50','2026-11-02 16:33:50');
/*!40000 ALTER TABLE `app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `appointment_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `clinic_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `appointment_type` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'scheduled',
  PRIMARY KEY (`appointment_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `clinic_id` (`clinic_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `appointment_ibfk_3` FOREIGN KEY (`clinic_id`) REFERENCES `clinic` (`clinic_id`),
  CONSTRAINT `appointment_ibfk_4` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`),
  CONSTRAINT `appointment_chk_1` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (801,301,101,201,601,'2026-10-05','09:00:00','09:30:00','Consultation','completed'),(802,302,102,201,602,'2026-10-06','10:00:00','10:30:00','Consultation','scheduled'),(803,303,103,202,603,'2026-10-05','14:00:00','14:30:00','Consultation','scheduled'),(804,304,104,202,604,'2026-10-06','09:00:00','10:00:00','Procedure','scheduled'),(805,305,105,203,605,'2026-10-07','10:00:00','10:30:00','Consultation','scheduled'),(806,306,101,204,607,'2026-10-08','09:00:00','09:30:00','Follow-up','scheduled'),(807,301,103,204,608,'2026-10-09','14:00:00','14:30:00','Follow-up','cancelled'),(808,302,104,202,604,'2026-10-13','09:00:00','10:00:00','Procedure','scheduled');
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_room_after_cancellation` AFTER UPDATE ON `appointment` FOR EACH ROW BEGIN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
        UPDATE ROOM
        SET status = 'available'
        WHERE room_id = NEW.room_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `appointment_details`
--

DROP TABLE IF EXISTS `appointment_details`;
/*!50001 DROP VIEW IF EXISTS `appointment_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `appointment_details` AS SELECT 
 1 AS `appointment_id`,
 1 AS `patient_name`,
 1 AS `doctor_name`,
 1 AS `clinic_name`,
 1 AS `room_number`,
 1 AS `appointment_date`,
 1 AS `start_time`,
 1 AS `end_time`,
 1 AS `appointment_type`,
 1 AS `status`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `appointment_equipment`
--

DROP TABLE IF EXISTS `appointment_equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_equipment` (
  `appointment_id` int NOT NULL,
  `equipment_id` int NOT NULL,
  PRIMARY KEY (`appointment_id`,`equipment_id`),
  KEY `equipment_id` (`equipment_id`),
  CONSTRAINT `appointment_equipment_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`),
  CONSTRAINT `appointment_equipment_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`equipment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_equipment`
--

LOCK TABLES `appointment_equipment` WRITE;
/*!40000 ALTER TABLE `appointment_equipment` DISABLE KEYS */;
INSERT INTO `appointment_equipment` VALUES (801,701),(801,702),(802,702),(803,703),(804,704),(808,704),(805,705),(805,706),(806,707),(807,707);
/*!40000 ALTER TABLE `appointment_equipment` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `validate_appointment_equipment_clinic` BEFORE INSERT ON `appointment_equipment` FOR EACH ROW BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM APPOINTMENT a
        JOIN EQUIPMENT e
            ON e.equipment_id = NEW.equipment_id
        WHERE a.appointment_id = NEW.appointment_id
          AND a.clinic_id = e.clinic_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Equipment must belong to the appointment clinic';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `clinic`
--

DROP TABLE IF EXISTS `clinic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinic` (
  `clinic_id` int NOT NULL,
  `clinic_name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`clinic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinic`
--

LOCK TABLES `clinic` WRITE;
/*!40000 ALTER TABLE `clinic` DISABLE KEYS */;
INSERT INTO `clinic` VALUES (201,'PES City Care Clinic','Electronic City, Bengaluru','08040009999','citycare@clinic.com','active'),(202,'Green Valley Clinic','Koramangala, Bengaluru','08040002002','greenvalley@clinic.com','active'),(203,'LifeCare Medical Centre','JP Nagar, Bengaluru','08040002003','lifecare@clinic.com','active'),(204,'MediPlus Clinic','Indiranagar, Bengaluru','08040002004','mediplus@clinic.com','active');
/*!40000 ALTER TABLE `clinic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinical_note`
--

DROP TABLE IF EXISTS `clinical_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinical_note` (
  `note_id` int NOT NULL,
  `appointment_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `created_at` timestamp NOT NULL,
  `note_text` varchar(4000) DEFAULT NULL,
  `embedding` text,
  PRIMARY KEY (`note_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  FULLTEXT KEY `idx_clinical_note_search` (`note_text`),
  CONSTRAINT `clinical_note_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`),
  CONSTRAINT `clinical_note_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `clinical_note_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinical_note`
--

LOCK TABLES `clinical_note` WRITE;
/*!40000 ALTER TABLE `clinical_note` DISABLE KEYS */;
INSERT INTO `clinical_note` VALUES (901,801,101,301,'2026-10-05 04:05:00','Chest discomfort; ECG advised.',NULL),(902,802,102,302,'2026-10-06 05:05:00','Recurring headaches; examination completed.',NULL),(903,803,103,303,'2026-10-05 09:05:00','Mild skin irritation; examination completed.',NULL),(904,804,104,304,'2026-10-06 04:40:00','Knee pain; procedure completed.',NULL),(905,805,105,305,'2026-10-07 05:05:00','Routine checkup completed.',NULL),(906,806,101,306,'2026-10-08 04:05:00','Follow-up completed; condition stable.',NULL);
/*!40000 ALTER TABLE `clinical_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `doctor_id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `license_number` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `license_number` (`license_number`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (101,'Ananya','Rao','Cardiology','9876543210','ananya.rao@clinic.com','LIC101','active'),(102,'Rahul','Sharma','Neurology','9876543211','rahul.sharma@clinic.com','LIC102','active'),(103,'Meera','Nair','Dermatology','9876543212','meera.nair@clinic.com','LIC103','active'),(104,'Arjun','Menon','Orthopedics','9876543213','arjun.menon@clinic.com','LIC104','active'),(105,'Priya','Iyer','General Medicine','9876543214','priya.iyer@clinic.com','LIC105','inactive');
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_availability`
--

DROP TABLE IF EXISTS `doctor_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_availability` (
  `availability_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `day_of_week` varchar(10) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`availability_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_availability_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `doctor_availability_chk_1` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_availability`
--

LOCK TABLES `doctor_availability` WRITE;
/*!40000 ALTER TABLE `doctor_availability` DISABLE KEYS */;
INSERT INTO `doctor_availability` VALUES (501,101,'Monday','09:00:00','13:00:00','active'),(502,101,'Wednesday','09:00:00','13:00:00','active'),(503,102,'Tuesday','10:00:00','14:00:00','active'),(504,102,'Thursday','10:00:00','14:00:00','active'),(505,103,'Monday','14:00:00','18:00:00','active'),(506,103,'Friday','09:00:00','13:00:00','active'),(507,104,'Tuesday','09:00:00','13:00:00','active'),(508,104,'Thursday','14:00:00','18:00:00','active'),(509,105,'Wednesday','10:00:00','14:00:00','active');
/*!40000 ALTER TABLE `doctor_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_clinic`
--

DROP TABLE IF EXISTS `doctor_clinic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_clinic` (
  `doctor_id` int NOT NULL,
  `clinic_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`doctor_id`,`clinic_id`,`start_date`),
  KEY `clinic_id` (`clinic_id`),
  CONSTRAINT `doctor_clinic_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `doctor_clinic_ibfk_2` FOREIGN KEY (`clinic_id`) REFERENCES `clinic` (`clinic_id`),
  CONSTRAINT `doctor_clinic_chk_1` CHECK (((`end_date` is null) or (`end_date` >= `start_date`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_clinic`
--

LOCK TABLES `doctor_clinic` WRITE;
/*!40000 ALTER TABLE `doctor_clinic` DISABLE KEYS */;
INSERT INTO `doctor_clinic` VALUES (101,201,'2026-01-01',NULL,'active'),(101,204,'2026-01-01',NULL,'active'),(102,201,'2026-01-01',NULL,'active'),(103,202,'2026-01-01',NULL,'active'),(103,204,'2026-01-01',NULL,'active'),(104,202,'2026-01-01',NULL,'active');
/*!40000 ALTER TABLE `doctor_clinic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment`
--

DROP TABLE IF EXISTS `equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `equipment_id` int NOT NULL,
  `clinic_id` int NOT NULL,
  `equipment_type` varchar(100) DEFAULT NULL,
  `equipment_name` varchar(150) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'operational',
  PRIMARY KEY (`equipment_id`),
  KEY `clinic_id` (`clinic_id`),
  CONSTRAINT `equipment_ibfk_1` FOREIGN KEY (`clinic_id`) REFERENCES `clinic` (`clinic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment`
--

LOCK TABLES `equipment` WRITE;
/*!40000 ALTER TABLE `equipment` DISABLE KEYS */;
INSERT INTO `equipment` VALUES (701,201,'Diagnostic','ECG Machine','operational'),(702,201,'Monitoring','Patient Monitor','operational'),(703,202,'Diagnostic','Ultrasound Machine','operational'),(704,202,'Procedure','Minor Surgery Kit','operational'),(705,203,'Diagnostic','Blood Pressure Monitor','operational'),(706,203,'Diagnostic','Glucometer','maintenance'),(707,204,'Diagnostic','Dermatoscope','operational');
/*!40000 ALTER TABLE `equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_up`
--

DROP TABLE IF EXISTS `follow_up`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_up` (
  `follow_up_id` int NOT NULL,
  `completed_appointment_id` int DEFAULT NULL,
  `doctor_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `recommended_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`follow_up_id`),
  KEY `completed_appointment_id` (`completed_appointment_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `follow_up_ibfk_1` FOREIGN KEY (`completed_appointment_id`) REFERENCES `appointment` (`appointment_id`),
  CONSTRAINT `follow_up_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `follow_up_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_up`
--

LOCK TABLES `follow_up` WRITE;
/*!40000 ALTER TABLE `follow_up` DISABLE KEYS */;
INSERT INTO `follow_up` VALUES (1101,801,101,301,'2026-11-05','completed'),(1102,802,102,302,'2026-11-06','pending'),(1103,803,103,303,'2026-11-05','pending'),(1104,804,104,304,'2026-11-20','pending'),(1105,805,105,305,'2026-11-07','pending'),(1106,806,101,306,'2026-11-08','pending');
/*!40000 ALTER TABLE `follow_up` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine`
--

DROP TABLE IF EXISTS `medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine` (
  `medicine_id` int NOT NULL,
  `medicine_name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine`
--

LOCK TABLES `medicine` WRITE;
/*!40000 ALTER TABLE `medicine` DISABLE KEYS */;
INSERT INTO `medicine` VALUES (401,'Paracetamol','Acetaminophen','Analgesic'),(402,'Amoxicillin','Amoxicillin','Antibiotic'),(403,'Cetirizine','Cetirizine Hydrochloride','Antihistamine'),(404,'Omeprazole','Omeprazole','Antacid'),(405,'Ibuprofen','Ibuprofen','Anti-inflammatory'),(406,'Azithromycin','Azithromycin','Antibiotic'),(407,'Metformin','Metformin Hydrochloride','Antidiabetic'),(408,'Amlodipine','Amlodipine','Antihypertensive');
/*!40000 ALTER TABLE `medicine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_vector_outbox`
--

DROP TABLE IF EXISTS `note_vector_outbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_vector_outbox` (
  `note_id` int NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `attempts` int NOT NULL DEFAULT '0',
  `last_error` varchar(500) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`),
  CONSTRAINT `note_vector_outbox_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `clinical_note` (`note_id`),
  CONSTRAINT `note_vector_outbox_chk_1` CHECK ((`status` in (_cp850'pending',_cp850'synced')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_vector_outbox`
--

LOCK TABLES `note_vector_outbox` WRITE;
/*!40000 ALTER TABLE `note_vector_outbox` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_vector_outbox` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `patient_id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (301,'Kavya','Sharma','2002-05-14','Female','9876509999','kavya.sharma@email.com','Electronic City, Bengaluru'),(302,'Rohan','Kumar','1998-11-11','Male','9876501002','rohan.kumar@email.com','Koramangala, Bengaluru'),(303,'Sneha','Patil','2005-02-17','Female','9876501003','sneha.patil@email.com','JP Nagar, Bengaluru'),(304,'Aditya','Reddy','1995-08-09','Male','9876501004','aditya.reddy@email.com','Indiranagar, Bengaluru'),(305,'Nisha','Shah','2000-12-30','Female','9876501005','nisha.shah@email.com','Whitefield, Bengaluru'),(306,'Vikram','Joshi','1992-04-18','Male','9876501006','vikram.joshi@email.com','HSR Layout, Bengaluru');
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription`
--

DROP TABLE IF EXISTS `prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription` (
  `prescription_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `appointment_id` int DEFAULT NULL,
  `prescription_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`prescription_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `prescription_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `prescription_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `prescription_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
INSERT INTO `prescription` VALUES (1001,101,301,801,'2026-10-05','active'),(1002,102,302,802,'2026-10-06','active'),(1003,103,303,803,'2026-10-05','active'),(1004,104,304,804,'2026-10-06','active'),(1005,105,305,805,'2026-10-07','active'),(1006,101,306,806,'2026-10-08','active');
/*!40000 ALTER TABLE `prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_medicine`
--

DROP TABLE IF EXISTS `prescription_medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_medicine` (
  `prescription_id` int NOT NULL,
  `medicine_id` int NOT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `instructions` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`prescription_id`,`medicine_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `prescription_medicine_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescription` (`prescription_id`),
  CONSTRAINT `prescription_medicine_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_medicine`
--

LOCK TABLES `prescription_medicine` WRITE;
/*!40000 ALTER TABLE `prescription_medicine` DISABLE KEYS */;
INSERT INTO `prescription_medicine` VALUES (1001,401,'500 mg','Twice daily','5 days','Take after food'),(1001,404,'20 mg','Once daily','5 days','Take before breakfast'),(1002,401,'500 mg','Twice daily','3 days','Take after food'),(1002,403,'10 mg','Once daily','5 days','Take at night'),(1003,403,'10 mg','Once daily','5 days','Take at night'),(1004,405,'400 mg','Twice daily','5 days','Take after food'),(1005,407,'500 mg','Once daily','30 days','Take with breakfast'),(1005,408,'5 mg','Once daily','30 days','Take in the morning'),(1006,401,'500 mg','As needed','3 days','Take after food');
/*!40000 ALTER TABLE `prescription_medicine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `room_id` int NOT NULL,
  `clinic_id` int NOT NULL,
  `room_number` varchar(20) NOT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'available',
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `clinic_id` (`clinic_id`,`room_number`),
  CONSTRAINT `room_ibfk_1` FOREIGN KEY (`clinic_id`) REFERENCES `clinic` (`clinic_id`),
  CONSTRAINT `room_chk_1` CHECK ((`capacity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (601,201,'101','Consultation',2,'available'),(602,201,'102','Examination',2,'available'),(603,202,'201','Consultation',2,'available'),(604,202,'202','Procedure',4,'available'),(605,203,'301','Consultation',2,'available'),(606,203,'302','Examination',2,'maintenance'),(607,204,'401','Consultation',2,'available'),(608,204,'402','Procedure',4,'available');
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `appointment_details`
--

/*!50001 DROP VIEW IF EXISTS `appointment_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `appointment_details` AS select `a`.`appointment_id` AS `appointment_id`,concat(`p`.`first_name`,' ',`p`.`last_name`) AS `patient_name`,concat(`d`.`first_name`,' ',`d`.`last_name`) AS `doctor_name`,`c`.`clinic_name` AS `clinic_name`,`r`.`room_number` AS `room_number`,`a`.`appointment_date` AS `appointment_date`,`a`.`start_time` AS `start_time`,`a`.`end_time` AS `end_time`,`a`.`appointment_type` AS `appointment_type`,`a`.`status` AS `status` from ((((`appointment` `a` join `patient` `p` on((`a`.`patient_id` = `p`.`patient_id`))) join `doctor` `d` on((`a`.`doctor_id` = `d`.`doctor_id`))) join `clinic` `c` on((`a`.`clinic_id` = `c`.`clinic_id`))) join `room` `r` on((`a`.`room_id` = `r`.`room_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-03  0:12:54
