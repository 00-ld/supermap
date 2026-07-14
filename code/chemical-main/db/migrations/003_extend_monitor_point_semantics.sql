-- Extend monitor_point from a name-only directory entry to a typed monitoring-point record.
-- Existing deployments can rerun this migration safely.

DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_missing//
CREATE PROCEDURE add_column_if_missing(
    IN table_name_param VARCHAR(64),
    IN column_name_param VARCHAR(64),
    IN column_definition_param TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_param
          AND COLUMN_NAME = column_name_param
    ) THEN
        SET @ddl = CONCAT(
            'ALTER TABLE `',
            table_name_param,
            '` ADD COLUMN `',
            column_name_param,
            '` ',
            column_definition_param
        );
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

CALL add_column_if_missing('monitor_point', 'area_name', 'VARCHAR(100) DEFAULT NULL COMMENT ''所属区域''');
CALL add_column_if_missing('monitor_point', 'source_type', 'VARCHAR(32) NOT NULL DEFAULT ''manual'' COMMENT ''监测点来源：manual / imported / generated / seeded_dom_sensor''');
CALL add_column_if_missing('monitor_point', 'sensor_id', 'VARCHAR(50) DEFAULT NULL COMMENT ''绑定传感器编号，未绑定时为空''');
CALL add_column_if_missing('monitor_point', 'camera_url', 'VARCHAR(255) DEFAULT NULL COMMENT ''绑定视频源地址，未绑定时为空''');
CALL add_column_if_missing('monitor_point', 'x', 'DOUBLE DEFAULT NULL COMMENT ''园区地图 X 坐标''');
CALL add_column_if_missing('monitor_point', 'y', 'DOUBLE DEFAULT NULL COMMENT ''园区地图 Y 坐标''');
CALL add_column_if_missing('monitor_point', 'quality_status', 'VARCHAR(32) NOT NULL DEFAULT ''UNBOUND'' COMMENT ''绑定质量状态：UNBOUND / SIMULATED / CONFIGURED / VERIFIED''');
CALL add_column_if_missing('monitor_point', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''');

UPDATE monitor_point
SET source_type = COALESCE(NULLIF(source_type, ''), 'manual'),
    quality_status = COALESCE(NULLIF(quality_status, ''), 'UNBOUND');

DROP PROCEDURE IF EXISTS add_column_if_missing;
