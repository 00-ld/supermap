-- Adds traceable page-operation and evidence fields to AI advice.
USE `chemical`;

DROP PROCEDURE IF EXISTS add_ai_advice_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_ai_advice_column_if_missing(
    IN requested_column_name VARCHAR(64),
    IN requested_column_definition TEXT
)
BEGIN
    IF (
        SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_decision_advice'
    ) = 1
    AND (
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_decision_advice'
          AND COLUMN_NAME = requested_column_name
    ) = 0
    THEN
        SET @add_ai_advice_column_sql = CONCAT(
            'ALTER TABLE `ai_decision_advice` ADD COLUMN `', requested_column_name, '` ', requested_column_definition
        );
        PREPARE add_ai_advice_column_stmt FROM @add_ai_advice_column_sql;
        EXECUTE add_ai_advice_column_stmt;
        DEALLOCATE PREPARE add_ai_advice_column_stmt;
    END IF;
END//
DELIMITER ;

CALL add_ai_advice_column_if_missing('page_operations', 'TEXT NULL');
CALL add_ai_advice_column_if_missing('evidence_standards', 'TEXT NULL');
CALL add_ai_advice_column_if_missing('evidence_documents', 'TEXT NULL');
CALL add_ai_advice_column_if_missing('data_quality', 'VARCHAR(20) NOT NULL DEFAULT ''unknown''');
CALL add_ai_advice_column_if_missing('uncertainties', 'TEXT NULL');

DROP PROCEDURE IF EXISTS add_ai_advice_column_if_missing;
