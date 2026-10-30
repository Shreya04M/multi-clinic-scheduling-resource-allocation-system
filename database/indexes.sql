USE clinic_management;

ALTER TABLE CLINICAL_NOTE
ADD FULLTEXT INDEX idx_clinical_note_search (note_text);
