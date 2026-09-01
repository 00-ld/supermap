-- Migration 006: realtime sensor ingestion and SSE replay support.
-- Existing rows receive deterministic event IDs; rerunning is safe.
USE `chemical`;

DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_column_if_missing(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT
)
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
    ) = 0
    THEN
        SET @add_column_sql = CONCAT(
            'ALTER TABLE `', p_table_name, '` ADD COLUMN `',
            p_column_name, '` ', p_column_definition
        );
        PREPARE add_column_stmt FROM @add_column_sql;
        EXECUTE add_column_stmt;
        DEALLOCATE PREPARE add_column_stmt;
    END IF;
END//
DELIMITER ;

CALL add_column_if_missing(
    'sensor_reading',
    'event_id',
    'VARCHAR(100) NULL COMMENT ''采集端事件 ID，用于幂等接入'''
);
CALL add_column_if_missing(
    'sensor_reading',
    'sequence_no',
    'BIGINT NULL COMMENT ''采集端单调序列号'''
);

UPDATE sensor_reading
SET event_id = CONCAT('legacy-', id)
WHERE event_id IS NULL OR event_id = '';

ALTER TABLE sensor_reading
    MODIFY COLUMN event_id VARCHAR(100) NOT NULL COMMENT '采集端事件 ID，用于幂等接入';

SET @event_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sensor_reading'
      AND INDEX_NAME = 'uq_sensor_reading_event_id'
);
SET @event_index_sql = IF(
    @event_index_exists = 0,
    'ALTER TABLE sensor_reading ADD UNIQUE KEY uq_sensor_reading_event_id (event_id)',
    'SELECT 1'
);
PREPARE event_index_stmt FROM @event_index_sql;
EXECUTE event_index_stmt;
DEALLOCATE PREPARE event_index_stmt;

DROP PROCEDURE IF EXISTS add_column_if_missing;
