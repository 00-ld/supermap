-- ========================================
-- Migration 002: add audit/source columns to core tables
-- Keeps existing databases aligned with deploy/mysql/init.sql.
-- ========================================
USE `chemical`;

DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_column_if_missing(
    IN table_name VARCHAR(64),
    IN column_name VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name
    ) = 1
    AND (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name
          AND COLUMN_NAME = column_name
    ) = 0
    THEN
        SET @add_column_sql = CONCAT('ALTER TABLE `', table_name, '` ADD COLUMN `', column_name, '` ', column_definition);
        PREPARE add_column_stmt FROM @add_column_sql;
        EXECUTE add_column_stmt;
        DEALLOCATE PREPARE add_column_stmt;
    END IF;
END//
DELIMITER ;

CALL add_column_if_missing('user', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('patrol_car', 'source', 'VARCHAR(32) NOT NULL DEFAULT ''seeded_dom_patrol'' COMMENT ''位置来源：seeded_dom_patrol / backend_update / simulation''');
CALL add_column_if_missing('patrol_car', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('patrol_car', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('sensor_layout_detail', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('simulation_scenario', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

CALL add_column_if_missing('sensor_reading', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT ''入库创建时间''');
CALL add_column_if_missing('sensor_reading', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

CALL add_column_if_missing('warning_history', 'source', 'VARCHAR(32) NOT NULL DEFAULT ''patrol_car_warning'' COMMENT ''告警来源：patrol_car_warning / manual / simulation''');
CALL add_column_if_missing('warning_history', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT ''入库创建时间''');
CALL add_column_if_missing('warning_history', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

CALL add_column_if_missing('environment_reading', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

CALL add_column_if_missing('inspect_record', 'source', 'VARCHAR(32) NOT NULL DEFAULT ''yolo_proxy'' COMMENT ''记录来源：yolo_proxy / manual_import''');
CALL add_column_if_missing('inspect_record', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

CALL add_column_if_missing('monitor_point', 'source_type', 'VARCHAR(32) NOT NULL DEFAULT ''manual'' COMMENT ''监测点来源：manual / imported / generated''');
CALL add_column_if_missing('monitor_point', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL add_column_if_missing('employee', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

DROP PROCEDURE IF EXISTS add_column_if_missing;
