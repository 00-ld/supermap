-- 化工园区监测系统数据库初始化脚本。
-- 本脚本不写入默认管理员账号；首次部署后请注册普通用户，再由 DBA 显式提升可信账号为 admin。

CREATE DATABASE IF NOT EXISTS `chemical` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `chemical`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL,
    `password` VARCHAR(180) NOT NULL,
    `role` VARCHAR(16) NOT NULL DEFAULT 'user',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

SET @add_user_role_column = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `user` ADD COLUMN `role` VARCHAR(16) NOT NULL DEFAULT ''user'' COMMENT ''角色：admin 可写，user 只读''',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
      AND COLUMN_NAME = 'role'
);
PREPARE add_user_role_column_stmt FROM @add_user_role_column;
EXECUTE add_user_role_column_stmt;
DEALLOCATE PREPARE add_user_role_column_stmt;

SET @widen_user_password_column = (
    SELECT IF(
        CHARACTER_MAXIMUM_LENGTH < 180,
        'ALTER TABLE `user` MODIFY COLUMN `password` VARCHAR(180) NOT NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
      AND COLUMN_NAME = 'password'
);
PREPARE widen_user_password_column_stmt FROM @widen_user_password_column;
EXECUTE widen_user_password_column_stmt;
DEALLOCATE PREPARE widen_user_password_column_stmt;

DELETE duplicate_user
FROM `user` duplicate_user
JOIN `user` keep_user
  ON duplicate_user.`username` = keep_user.`username`
 AND duplicate_user.`id` > keep_user.`id`;

SET @add_user_username_unique = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `user` ADD UNIQUE KEY `uk_user_username` (`username`)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
      AND INDEX_NAME = 'uk_user_username'
);
PREPARE add_user_username_unique_stmt FROM @add_user_username_unique;
EXECUTE add_user_username_unique_stmt;
DEALLOCATE PREPARE add_user_username_unique_stmt;

CREATE TABLE IF NOT EXISTS `gas` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `detection_range` VARCHAR(200) DEFAULT NULL,
    `installation_height` DOUBLE DEFAULT 1.5,
    `effective_range` DOUBLE DEFAULT 20,
    `install_remark` VARCHAR(500) DEFAULT NULL,
    `priority` INT DEFAULT 3,
    `risk` DOUBLE DEFAULT 0.3,
    `type` VARCHAR(20) DEFAULT 'gas',
    `mode` VARCHAR(10) DEFAULT 'auto',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='气体类型配置表';

INSERT INTO `gas` (`id`, `name`, `detection_range`, `installation_height`, `effective_range`, `install_remark`, `priority`, `risk`, `type`, `mode`) VALUES
('CO', '一氧化碳', '0-1000ppm', 1.5, 15, '有毒气体监测', 1, 0.90, 'gas', 'auto'),
('NH3', '氨气', '0-100ppm', 1.5, 20, '有毒气体监测', 1, 0.90, 'gas', 'auto'),
('CH4', '甲烷', '0-100%LEL', 2.0, 18, '可燃气体监测', 2, 0.80, 'gas', 'auto'),
('O2', '氧气', '0-30%VOL', 1.5, 15, '氧气浓度监测', 2, 0.30, 'gas', 'auto')
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `detection_range` = VALUES(`detection_range`),
    `installation_height` = VALUES(`installation_height`),
    `effective_range` = VALUES(`effective_range`),
    `install_remark` = VALUES(`install_remark`),
    `priority` = VALUES(`priority`),
    `risk` = VALUES(`risk`),
    `type` = VALUES(`type`),
    `mode` = VALUES(`mode`);

-- 巡检小车实时位置表。旧库可能仍叫 `leida`（拼音/原意雷达，语义不清），
-- 若存在旧表则原地改名为可读的 `patrol_car`，再按需建表。
SET @rename_leida = (
    SELECT IF(
        COUNT(*) = 1,
        'RENAME TABLE `leida` TO `patrol_car`',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'leida'
);
PREPARE rename_leida_stmt FROM @rename_leida;
EXECUTE rename_leida_stmt;
DEALLOCATE PREPARE rename_leida_stmt;

CREATE TABLE IF NOT EXISTS `patrol_car` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `car_id` INT NOT NULL,
    `warning` TINYINT NOT NULL DEFAULT 0,
    `x` INT NOT NULL,
    `y` INT NOT NULL,
    `gas_type` VARCHAR(20) NOT NULL,
    `source` VARCHAR(32) NOT NULL DEFAULT 'seeded_dom_patrol' COMMENT '位置来源：seeded_dom_patrol / backend_update / simulation',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_patrol_car_car_id` (`car_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检小车实时位置与气体类型表';

CREATE TABLE IF NOT EXISTS `emergency_plan` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `level` VARCHAR(32) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_emergency_plan_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应急预案模板表';

INSERT INTO `emergency_plan` (`name`, `type`, `description`, `level`) VALUES
('甲烷泄漏应急预案', 'gas', '针对甲烷气体泄漏的应急处置方案', 'high'),
('氨气泄漏应急预案', 'gas', '针对氨气泄漏的应急处置方案', 'critical'),
('火灾应急预案', 'fire', '针对火灾事故的应急处置方案', 'high'),
('爆炸应急预案', 'explosion', '针对爆炸事故的应急处置方案', 'critical'),
('自然灾害应急预案', 'natural', '针对自然灾害的应急处置方案', 'medium')
ON DUPLICATE KEY UPDATE
    `type` = VALUES(`type`),
    `description` = VALUES(`description`),
    `level` = VALUES(`level`);

-- 小车坐标基于真实 DOM 二维地图米制坐标，限制在 1587.2m x 947.2m 数据边界内。
-- 1: 西南储罐泵区；2: 中南反应装置区；3: 中东塔器/公用工程区；4: 东南应急装卸区。
INSERT INTO `patrol_car` (`car_id`, `warning`, `x`, `y`, `gas_type`) VALUES
(1, 0, 450, 565, 'CH4'),
(2, 0, 690, 500, 'NH3'),
(3, 1, 925, 430, 'CO'),
(4, 0, 1125, 610, 'O2')
ON DUPLICATE KEY UPDATE
    `warning` = VALUES(`warning`),
    `x` = VALUES(`x`),
    `y` = VALUES(`y`),
    `gas_type` = VALUES(`gas_type`);

CREATE TABLE IF NOT EXISTS `sensor` (
    `id` VARCHAR(50) NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `installation_height` DOUBLE DEFAULT 1.5,
    `effective_range` DOUBLE DEFAULT 20,
    `detection_range` VARCHAR(200) DEFAULT 'CO / CH4 / NH3 / O2',
    `install_remark` VARCHAR(500) DEFAULT '',
    `priority` INT DEFAULT 3,
    `risk` DOUBLE DEFAULT 0.3,
    `type` VARCHAR(20) DEFAULT 'gas',
    `mode` VARCHAR(10) DEFAULT 'auto',
    `last_sample_time` BIGINT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='传感器布点表';

-- Older local databases created sensor.id as INT. Keep startup re-runnable
-- before sensor_reading adds a VARCHAR(50) foreign key to sensor(id).
ALTER TABLE `sensor` MODIFY COLUMN `id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

CREATE TABLE IF NOT EXISTS `sensor_layout` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `layout_name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) DEFAULT NULL,
    `sensor_count` INT DEFAULT 0,
    `coverage_rate` DOUBLE DEFAULT 0,
    `risk_score` DOUBLE DEFAULT 0,
    `status` VARCHAR(20) DEFAULT 'draft',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='传感器布点方案表';

CREATE TABLE IF NOT EXISTS `sensor_layout_detail` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `layout_id` INT NOT NULL,
    `sensor_id` VARCHAR(50) NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `installation_height` DOUBLE DEFAULT 1.5,
    `effective_range` DOUBLE DEFAULT 20,
    `detection_range` VARCHAR(200) DEFAULT NULL,
    `priority` INT DEFAULT 3,
    `risk` DOUBLE DEFAULT 0.3,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sensor_layout_detail_layout_sensor` (`layout_id`, `sensor_id`),
    KEY `idx_sensor_layout_detail_layout` (`layout_id`),
    CONSTRAINT `fk_sensor_layout_detail_layout`
        FOREIGN KEY (`layout_id`) REFERENCES `sensor_layout`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sensor layout plan detail';

CREATE TABLE IF NOT EXISTS `simulation_scenario` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `scenario_code` VARCHAR(64) NOT NULL COMMENT '仿真场景编码',
    `name` VARCHAR(100) NOT NULL COMMENT '场景名称',
    `source` VARCHAR(32) NOT NULL DEFAULT 'simulation' COMMENT '数据来源，目前仅允许 simulation',
    `gas_type` VARCHAR(20) NOT NULL COMMENT '气体类型',
    `leak_x` DOUBLE NOT NULL COMMENT '泄漏点 X 米制坐标',
    `leak_y` DOUBLE NOT NULL COMMENT '泄漏点 Y 米制坐标',
    `emission_rate` DOUBLE DEFAULT NULL COMMENT '源强 kg/s 或模型约定单位',
    `wind_speed` DOUBLE DEFAULT NULL COMMENT '风速 m/s',
    `wind_direction` INT DEFAULT NULL COMMENT '风向角度 0-359',
    `seed` BIGINT DEFAULT NULL COMMENT '仿真随机种子',
    `started_at` DATETIME NOT NULL COMMENT '场景开始时间',
    `ended_at` DATETIME DEFAULT NULL COMMENT '场景结束时间',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_simulation_scenario_code` (`scenario_code`),
    KEY `idx_simulation_scenario_started_at` (`started_at`),
    KEY `idx_simulation_scenario_gas_type` (`gas_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仿真监测场景表';

CREATE TABLE IF NOT EXISTS `sensor_reading` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `scenario_id` BIGINT DEFAULT NULL COMMENT '仿真场景 ID；真实硬件接入前不冒充实测',
    `sensor_id` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '传感器点位 ID',
    `gas_type` VARCHAR(20) NOT NULL COMMENT '气体类型',
    `concentration` DOUBLE NOT NULL COMMENT '浓度读数',
    `unit` VARCHAR(16) NOT NULL DEFAULT 'ppm' COMMENT '浓度单位',
    `sampled_at` DATETIME NOT NULL COMMENT '采样时间',
    `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库接收时间',
    `source` VARCHAR(32) NOT NULL DEFAULT 'simulation' COMMENT 'simulation / hardware / manual；当前接口只写 simulation',
    `quality_status` VARCHAR(32) NOT NULL DEFAULT 'SIMULATED' COMMENT 'SIMULATED 表示仿真派生读数',
    `raw_payload` JSON DEFAULT NULL COMMENT '原始仿真输入摘要',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '入库创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sensor_reading_sample` (`scenario_id`, `sensor_id`, `gas_type`, `sampled_at`),
    KEY `idx_sensor_reading_sensor_time` (`sensor_id`, `sampled_at`),
    KEY `idx_sensor_reading_scenario_time` (`scenario_id`, `sampled_at`),
    KEY `idx_sensor_reading_gas_time` (`gas_type`, `sampled_at`),
    CONSTRAINT `fk_sensor_reading_scenario`
        FOREIGN KEY (`scenario_id`) REFERENCES `simulation_scenario`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_sensor_reading_sensor`
        FOREIGN KEY (`sensor_id`) REFERENCES `sensor`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='气体传感器连续采样读数表';

CREATE TABLE IF NOT EXISTS `warning_history` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `car_id` INT NOT NULL,
    `area_name` VARCHAR(50) DEFAULT NULL,
    `x` INT DEFAULT NULL,
    `y` INT DEFAULT NULL,
    `gas_type` VARCHAR(20) NOT NULL,
    `gas_value` DOUBLE DEFAULT NULL,
    `warning_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `source` VARCHAR(32) NOT NULL DEFAULT 'patrol_car_warning' COMMENT '告警来源：patrol_car_warning / manual / simulation',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '入库创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_warning_history_time` (`warning_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警历史记录表';

SET @add_warning_history_source_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `warning_history` ADD COLUMN `source` VARCHAR(32) NOT NULL DEFAULT ''patrol_car_warning'' COMMENT ''告警来源：patrol_car_warning / manual / simulation''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'warning_history' AND COLUMN_NAME = 'source'
);
PREPARE add_warning_history_source_column_stmt FROM @add_warning_history_source_column;
EXECUTE add_warning_history_source_column_stmt;
DEALLOCATE PREPARE add_warning_history_source_column_stmt;

SET @add_warning_history_created_at_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `warning_history` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT ''入库创建时间''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'warning_history' AND COLUMN_NAME = 'created_at'
);
PREPARE add_warning_history_created_at_column_stmt FROM @add_warning_history_created_at_column;
EXECUTE add_warning_history_created_at_column_stmt;
DEALLOCATE PREPARE add_warning_history_created_at_column_stmt;

SET @add_warning_history_updated_at_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `warning_history` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'warning_history' AND COLUMN_NAME = 'updated_at'
);
PREPARE add_warning_history_updated_at_column_stmt FROM @add_warning_history_updated_at_column;
EXECUTE add_warning_history_updated_at_column_stmt;
DEALLOCATE PREPARE add_warning_history_updated_at_column_stmt;

DELETE FROM `warning_history` WHERE `warning_time` >= '2026-06-26 00:00:00';
INSERT INTO `warning_history`
    (`car_id`, `area_name`, `x`, `y`, `gas_type`, `gas_value`, `warning_time`, `source`)
VALUES
    (3, '中东塔器与管廊区', 925, 430, 'CO', 68.4, '2026-06-26 09:36:00', 'simulation'),
    (3, '中东塔器与管廊区', 928, 433, 'CO', 73.6, '2026-06-26 09:42:00', 'simulation'),
    (3, '中东塔器与管廊区', 932, 438, 'CO', 81.2, '2026-06-26 09:48:00', 'simulation'),
    (2, '中南反应装置区', 690, 500, 'NH3', 36.5, '2026-06-26 09:52:00', 'simulation'),
    (3, '中东塔器与管廊区', 936, 442, 'CO', 95.8, '2026-06-26 09:56:00', 'simulation'),
    (1, '西南储罐泵区', 450, 565, 'CH4', 42.7, '2026-06-26 10:00:00', 'simulation'),
    (3, '中东塔器与管廊区', 940, 448, 'CO', 104.6, '2026-06-26 10:04:00', 'simulation'),
    (4, '东南应急装卸区', 1125, 610, 'O2', 18.1, '2026-06-26 10:08:00', 'simulation'),
    (3, '中东塔器与管廊区', 945, 452, 'CO', 118.9, '2026-06-26 10:12:00', 'simulation'),
    (3, '中东塔器与管廊区', 948, 455, 'CO', 126.3, '2026-06-26 10:16:00', 'simulation');

CREATE TABLE IF NOT EXISTS `environment_reading` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `source` VARCHAR(100) NOT NULL COMMENT '数据来源：设备网关、气象站、MQTT主题或第三方气象API',
    `wind_speed` DOUBLE DEFAULT NULL COMMENT '风速 m/s',
    `wind_direction` INT DEFAULT NULL COMMENT '风向角度 0-359',
    `temperature` DOUBLE DEFAULT NULL COMMENT '温度 ℃',
    `humidity` INT DEFAULT NULL COMMENT '相对湿度 %',
    `pressure` DOUBLE DEFAULT NULL COMMENT '气压 kPa',
    `noise` DOUBLE DEFAULT NULL COMMENT '噪声 dB',
    `observed_at` DATETIME NOT NULL COMMENT '实测观测时间',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_environment_reading_observed_at` (`observed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境实测数据表';

CREATE TABLE IF NOT EXISTS `inspect_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '识别时间',
    `person_count` INT DEFAULT NULL COMMENT '识别人数',
    `location` VARCHAR(100) DEFAULT NULL COMMENT '识别位置',
    `status` VARCHAR(20) DEFAULT NULL COMMENT '识别状态',
    `source` VARCHAR(32) NOT NULL DEFAULT 'yolo_proxy' COMMENT '记录来源：yolo_proxy / manual_import',
    `image_base64` LONGTEXT DEFAULT NULL COMMENT '识别图片快照',
    `analysis_time` INT DEFAULT NULL COMMENT '算法耗时 ms',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_inspect_record_create_time` (`create_time`),
    KEY `idx_inspect_record_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='YOLO 图像识别记录表';

CREATE TABLE IF NOT EXISTS `monitor_point` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `area_name` VARCHAR(100) DEFAULT NULL COMMENT '所属区域',
    `source_type` VARCHAR(32) NOT NULL DEFAULT 'manual' COMMENT '监测点来源：manual / imported / generated',
    `sensor_id` VARCHAR(50) DEFAULT NULL COMMENT '绑定传感器编号，未绑定时为空',
    `camera_url` VARCHAR(255) DEFAULT NULL COMMENT '绑定视频源地址，未绑定时为空',
    `x` DOUBLE DEFAULT NULL COMMENT '园区地图 X 坐标',
    `y` DOUBLE DEFAULT NULL COMMENT '园区地图 Y 坐标',
    `quality_status` VARCHAR(32) NOT NULL DEFAULT 'UNBOUND' COMMENT '绑定质量状态：UNBOUND / SIMULATED / CONFIGURED / VERIFIED',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监测点表';

SET @add_monitor_point_area_name_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `area_name` VARCHAR(100) DEFAULT NULL COMMENT ''所属区域''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'area_name'
);
PREPARE add_monitor_point_area_name_column_stmt FROM @add_monitor_point_area_name_column;
EXECUTE add_monitor_point_area_name_column_stmt;
DEALLOCATE PREPARE add_monitor_point_area_name_column_stmt;

SET @add_monitor_point_source_type_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `source_type` VARCHAR(32) NOT NULL DEFAULT ''manual'' COMMENT ''监测点来源：manual / imported / generated / seeded_dom_sensor''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'source_type'
);
PREPARE add_monitor_point_source_type_column_stmt FROM @add_monitor_point_source_type_column;
EXECUTE add_monitor_point_source_type_column_stmt;
DEALLOCATE PREPARE add_monitor_point_source_type_column_stmt;

SET @add_monitor_point_sensor_id_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `sensor_id` VARCHAR(50) DEFAULT NULL COMMENT ''绑定传感器编号，未绑定时为空''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'sensor_id'
);
PREPARE add_monitor_point_sensor_id_column_stmt FROM @add_monitor_point_sensor_id_column;
EXECUTE add_monitor_point_sensor_id_column_stmt;
DEALLOCATE PREPARE add_monitor_point_sensor_id_column_stmt;

SET @add_monitor_point_camera_url_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `camera_url` VARCHAR(255) DEFAULT NULL COMMENT ''绑定视频源地址，未绑定时为空''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'camera_url'
);
PREPARE add_monitor_point_camera_url_column_stmt FROM @add_monitor_point_camera_url_column;
EXECUTE add_monitor_point_camera_url_column_stmt;
DEALLOCATE PREPARE add_monitor_point_camera_url_column_stmt;

SET @add_monitor_point_x_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `x` DOUBLE DEFAULT NULL COMMENT ''园区地图 X 坐标''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'x'
);
PREPARE add_monitor_point_x_column_stmt FROM @add_monitor_point_x_column;
EXECUTE add_monitor_point_x_column_stmt;
DEALLOCATE PREPARE add_monitor_point_x_column_stmt;

SET @add_monitor_point_y_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `y` DOUBLE DEFAULT NULL COMMENT ''园区地图 Y 坐标''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'y'
);
PREPARE add_monitor_point_y_column_stmt FROM @add_monitor_point_y_column;
EXECUTE add_monitor_point_y_column_stmt;
DEALLOCATE PREPARE add_monitor_point_y_column_stmt;

SET @add_monitor_point_quality_status_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `quality_status` VARCHAR(32) NOT NULL DEFAULT ''UNBOUND'' COMMENT ''绑定质量状态：UNBOUND / SIMULATED / CONFIGURED / VERIFIED''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'quality_status'
);
PREPARE add_monitor_point_quality_status_column_stmt FROM @add_monitor_point_quality_status_column;
EXECUTE add_monitor_point_quality_status_column_stmt;
DEALLOCATE PREPARE add_monitor_point_quality_status_column_stmt;

SET @add_monitor_point_updated_at_column = (
    SELECT IF(COUNT(*) = 0, 'ALTER TABLE `monitor_point` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间''', 'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitor_point' AND COLUMN_NAME = 'updated_at'
);
PREPARE add_monitor_point_updated_at_column_stmt FROM @add_monitor_point_updated_at_column;
EXECUTE add_monitor_point_updated_at_column_stmt;
DEALLOCATE PREPARE add_monitor_point_updated_at_column_stmt;

UPDATE monitor_point
SET source_type = COALESCE(NULLIF(source_type, ''), 'manual'),
    quality_status = COALESCE(NULLIF(quality_status, ''), 'UNBOUND');

INSERT INTO monitor_point (id, name, area_name, source_type, sensor_id, camera_url, x, y, quality_status)
VALUES
    (1, 'P1 甲烷重点监测点', '生产一区 P1', 'seeded_dom_sensor', 'P1-01H', '/gas_video/气体1.mp4', 318.0, 258.0, 'CONFIGURED'),
    (2, 'P2 生产装置监测点', '西北生产装置区', 'seeded_dom_sensor', 'P2-01L', '/gas_video/气体2.mp4', 984.0, 456.0, 'CONFIGURED'),
    (3, '储罐区甲烷监测点', '储罐与泵区', 'seeded_dom_sensor', 'TK-01L', '/gas_video/气体3.mp4', 276.0, 456.0, 'CONFIGURED'),
    (4, '仓储物流边界监测点', '仓储物流区', 'seeded_dom_sensor', 'WH-01', '/gas_video/气体4.mp4', 1100.0, 560.0, 'CONFIGURED')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    area_name = VALUES(area_name),
    source_type = VALUES(source_type),
    sensor_id = VALUES(sensor_id),
    camera_url = VALUES(camera_url),
    x = VALUES(x),
    y = VALUES(y),
    quality_status = VALUES(quality_status);

CREATE TABLE IF NOT EXISTS `employee` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name` VARCHAR(50) NOT NULL COMMENT '姓名',
    `age` INT DEFAULT NULL COMMENT '年龄',
    `gender` TINYINT DEFAULT NULL COMMENT '性别：1=男 2=女',
    `phone` VARCHAR(50) DEFAULT NULL COMMENT '联系电话',
    `department` VARCHAR(50) DEFAULT NULL COMMENT '所属部门',
    `employee_no` INT DEFAULT NULL COMMENT '工号',
    `status` VARCHAR(10) DEFAULT NULL COMMENT '在岗状态：在岗/休假/离职',
    `job_desc` TEXT DEFAULT NULL COMMENT '岗位职责',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_employee_no` (`employee_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工信息表';

DELETE duplicate_employee
FROM `employee` duplicate_employee
JOIN `employee` keep_employee
  ON duplicate_employee.`employee_no` = keep_employee.`employee_no`
 AND duplicate_employee.`id` > keep_employee.`id`
WHERE duplicate_employee.`employee_no` IS NOT NULL;

SET @add_employee_no_unique = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `employee` ADD UNIQUE KEY `uk_employee_employee_no` (`employee_no`)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'employee'
      AND INDEX_NAME = 'uk_employee_employee_no'
);
PREPARE add_employee_no_unique_stmt FROM @add_employee_no_unique;
EXECUTE add_employee_no_unique_stmt;
DEALLOCATE PREPARE add_employee_no_unique_stmt;

-- 员工信息种子数据。显式给定 id，配合 ON DUPLICATE KEY 幂等，重复执行不产生脏数据。
-- gender：1=男 2=女；这些为脱敏演示数据，非真实人员。
INSERT INTO `employee` (`id`, `name`, `age`, `gender`, `phone`, `department`, `employee_no`, `status`, `job_desc`) VALUES
(1, '员工-1001', 45, 1, '园区内线 6101', '生产部', 1001, '在岗', '负责化工生产线日常巡检、设备维护保养和安全运行记录'),
(2, '员工-1002', 38, 2, '园区内线 6102', '安全部', 1002, '在岗', '制定安全管理制度、开展安全培训并排查园区安全隐患'),
(3, '员工-1003', 50, 1, '园区内线 6103', '技术部', 1003, '休假', '研发化工工艺优化方案、解决生产技术问题并指导现场操作'),
(4, '员工-1004', 35, 2, '园区内线 6104', '质检部', 1004, '在岗', '检测化工产品质量、记录检测数据并出具质量检验报告'),
(5, '员工-1005', 42, 1, '园区内线 6105', '设备部', 1005, '在岗', '管理生产设备台账、定期检修设备并保障设备正常运转'),
(6, '员工-1006', 39, 2, '园区内线 6106', '行政部', 1006, '离职', '负责园区行政事务、员工考勤管理和办公用品采购'),
(7, '员工-1007', 48, 1, '园区内线 6107', '环保部', 1007, '在岗', '监测园区排污情况、落实环保政策并处理环保投诉'),
(8, '员工-1008', 33, 2, '园区内线 6108', '财务部', 1008, '在岗', '核算生产成本、处理财务报销并编制财务报表'),
(9, '员工-1009', 46, 1, '园区内线 6109', '仓储部', 1009, '休假', '管理化工原料仓储、把控物料进出库并盘点库存数量'),
(10, '员工-1010', 37, 2, '园区内线 6110', '采购部', 1010, '在岗', '采购化工原料、维护供应商合作并控制采购成本'),
(11, '员工-1011', 44, 1, '园区内线 6111', '销售部', 1011, '在岗', '拓展化工产品市场、维护客户关系并完成销售指标'),
(12, '员工-1012', 36, 2, '园区内线 6112', '人事部', 1012, '离职', '负责员工招聘、办理入职离职并组织员工培训'),
(13, '员工-1013', 41, 1, '园区内线 6113', '工程部', 1013, '在岗', '负责园区基建工程、维护基础设施并处理工程维修'),
(14, '员工-1014', 49, 1, '园区内线 6114', '应急部', 1014, '在岗', '制定应急救援预案、组织应急演练并处理突发安全事件'),
(15, '员工-1015', 34, 2, '园区内线 6115', '研发部', 1015, '休假', '开展新型化工产品研发、撰写研发报告并申请技术专利')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `age` = VALUES(`age`), `gender` = VALUES(`gender`),
    `phone` = VALUES(`phone`), `department` = VALUES(`department`), `employee_no` = VALUES(`employee_no`),
    `status` = VALUES(`status`), `job_desc` = VALUES(`job_desc`);

-- 真实 DOM 二维地图传感器布点种子数据。
-- 源地图：external-real-dom-source/ResultDOM_2.tiff（脱敏来源标识，不记录本机绝对路径）
-- 源分辨率：0.05 m/pixel；前端资源：frontend/public/maps/real-park-dom.jpg。
-- 坐标为真实地图米制坐标，严格限制在 1587.2m x 947.2m 数据边界内。
-- 布点依据：GB/T 50493-2019。CO/CH4/NH3/O2 混合点按有毒气体 4m 水平覆盖半径控制；
-- 仓储区和应急边界点使用 8m 覆盖半径。


-- 重建真实 DOM 点位集，避免旧版 canvas 假点位继续混入数据库。
DELETE FROM sensor_reading;
DELETE FROM sensor;

INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-01L', 272.0, 286.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(272.0m,286.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.86, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-01H', 272.0, 286.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：生产装置区；点位坐标(272.0m,286.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.86, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-02L', 336.0, 332.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(336.0m,332.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.84, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-03L', 420.0, 354.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(420.0m,354.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-03H', 420.0, 354.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：生产装置区；点位坐标(420.0m,354.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-04L', 510.0, 304.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(510.0m,304.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-05L', 548.0, 398.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(548.0m,398.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.78, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-05H', 548.0, 398.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：生产装置区；点位坐标(548.0m,398.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.78, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P1-01L', 318.0, 258.0, 0.5, 4.0, 'CH4/CO/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产一区 P1；点位坐标(318.0m,258.0m)，安装高度0.5m，覆盖半径4.0m；补充甲烷泄漏源近区低位监测点', 1, 0.88, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P1-01H', 318.0, 258.0, 2.2, 4.0, 'CH4/CO/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：生产一区 P1；点位坐标(318.0m,258.0m)，安装高度2.2m，覆盖半径4.0m；甲烷轻气高位配对监测点', 1, 0.88, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P1-02L', 392.0, 306.0, 0.5, 4.0, 'CH4/CO/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产一区 P1；点位坐标(392.0m,306.0m)，安装高度0.5m，覆盖半径4.0m；补充工艺设备间低位监测点', 1, 0.86, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P1-03L', 468.0, 278.0, 0.5, 4.0, 'CH4/CO/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产一区 P1；点位坐标(468.0m,278.0m)，安装高度0.5m，覆盖半径4.0m；补充装置平台低位监测点', 1, 0.84, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P1-03H', 468.0, 278.0, 2.2, 4.0, 'CH4/CO/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：生产一区 P1；点位坐标(468.0m,278.0m)，安装高度2.2m，覆盖半径4.0m；甲烷轻气高位配对监测点', 1, 0.84, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P1-04L', 560.0, 356.0, 0.5, 4.0, 'CH4/CO/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产一区 P1；点位坐标(560.0m,356.0m)，安装高度0.5m，覆盖半径4.0m；补充东侧连通管廊低位监测点', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-01L', 276.0, 456.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(276.0m,456.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.90, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-02L', 346.0, 500.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(346.0m,500.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.90, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-02H', 346.0, 500.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：储罐与泵区；点位坐标(346.0m,500.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.88, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-03L', 430.0, 470.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(430.0m,470.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.86, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-04L', 520.0, 510.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(520.0m,510.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.84, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-05L', 292.0, 598.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(292.0m,598.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-06L', 372.0, 636.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(372.0m,636.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-07L', 470.0, 604.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(470.0m,604.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-08L', 558.0, 648.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：储罐与泵区；点位坐标(558.0m,648.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TK-08H', 558.0, 648.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：储罐与泵区；点位坐标(558.0m,648.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.78, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-06L', 612.0, 292.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(612.0m,292.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.70, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-07L', 674.0, 288.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(674.0m,288.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.70, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-08L', 730.0, 366.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(730.0m,366.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.68, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-08H', 730.0, 366.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：生产装置区；点位坐标(730.0m,366.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 2, 0.68, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-09L', 620.0, 456.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(620.0m,456.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.74, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-10L', 704.0, 504.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(704.0m,504.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.74, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-11L', 642.0, 590.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(642.0m,590.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.76, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PA-12L', 736.0, 650.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：生产装置区；点位坐标(736.0m,650.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.68, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('UT-01L', 782.0, 300.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.4；真实DOM识别区域：公用工程与管廊区；点位坐标(782.0m,300.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.52, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('UT-01H', 782.0, 300.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：公用工程与管廊区；点位坐标(782.0m,300.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 2, 0.52, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('UT-02L', 826.0, 426.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.4；真实DOM识别区域：公用工程与管廊区；点位坐标(826.0m,426.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.50, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('UT-03L', 800.0, 520.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.4；真实DOM识别区域：公用工程与管廊区；点位坐标(800.0m,520.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.48, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('UT-04L', 832.0, 628.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.4；真实DOM识别区域：公用工程与管廊区；点位坐标(832.0m,628.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.48, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-01L', 872.0, 286.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：塔器与罐组区；点位坐标(872.0m,286.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-01H', 872.0, 286.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：塔器与罐组区；点位坐标(872.0m,286.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-02L', 920.0, 326.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：塔器与罐组区；点位坐标(920.0m,326.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-03L', 892.0, 410.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：塔器与罐组区；点位坐标(892.0m,410.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-04L', 922.0, 500.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：塔器与罐组区；点位坐标(922.0m,500.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.78, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-04H', 922.0, 500.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：塔器与罐组区；点位坐标(922.0m,500.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.78, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-05L', 880.0, 610.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：塔器与罐组区；点位坐标(880.0m,610.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.76, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('TW-06L', 938.0, 650.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：塔器与罐组区；点位坐标(938.0m,650.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.68, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-01L', 982.0, 284.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(982.0m,284.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-01H', 982.0, 284.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：东北罐组与管汇区；点位坐标(982.0m,284.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-02L', 1030.0, 294.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(1030.0m,294.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-03L', 1082.0, 304.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(1082.0m,304.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-03H', 1082.0, 304.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：东北罐组与管汇区；点位坐标(1082.0m,304.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 1, 0.82, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-04L', 1132.0, 314.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(1132.0m,314.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.80, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-05L', 1180.0, 344.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(1180.0m,344.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 1, 0.78, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-06L', 1000.0, 386.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(1000.0m,386.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.70, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('PB-07L', 1100.0, 394.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.1；真实DOM识别区域：东北罐组与管汇区；点位坐标(1100.0m,394.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.70, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P2-01L', 984.0, 456.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：东中生产与污水装置区；点位坐标(984.0m,456.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.64, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P2-02L', 1060.0, 470.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：东中生产与污水装置区；点位坐标(1060.0m,470.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.62, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P2-03L', 1150.0, 470.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.2.1；真实DOM识别区域：东中生产与污水装置区；点位坐标(1150.0m,470.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.62, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P2-03H', 1150.0, 470.0, 2.2, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 6.1.2；真实DOM识别区域：东中生产与污水装置区；点位坐标(1150.0m,470.0m)，安装高度2.2m，覆盖半径4.0m；高位配对点，覆盖轻气上浮或顶部积聚风险', 2, 0.62, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P2-04L', 990.0, 520.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.4；真实DOM识别区域：东中生产与污水装置区；点位坐标(990.0m,520.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.58, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('P2-05L', 1130.0, 520.0, 0.5, 4.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.4；真实DOM识别区域：东中生产与污水装置区；点位坐标(1130.0m,520.0m)，安装高度0.5m，覆盖半径4.0m；低位近源点，覆盖有毒/重气贴地扩散风险', 2, 0.58, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('WH-01', 1100.0, 560.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.4；真实DOM识别区域：仓储物流区；点位坐标(1100.0m,560.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.48, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('WH-02', 1160.0, 560.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.4；真实DOM识别区域：仓储物流区；点位坐标(1160.0m,560.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.48, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('WH-03', 1200.0, 592.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.4；真实DOM识别区域：仓储物流区；点位坐标(1200.0m,592.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.46, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('WH-04', 1120.0, 630.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.4；真实DOM识别区域：仓储物流区；点位坐标(1120.0m,630.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.46, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('WH-05', 1180.0, 650.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.3.4；真实DOM识别区域：仓储物流区；点位坐标(1180.0m,650.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.46, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('FS-01', 1000.0, 560.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.3；真实DOM识别区域：东侧应急与装卸边界区；点位坐标(1000.0m,560.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.40, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);
INSERT INTO sensor (id, x, y, installation_height, effective_range, detection_range, install_remark, priority, risk, type, mode) VALUES ('FS-02', 1040.0, 620.0, 1.5, 8.0, 'CO/CH4/NH3/O2', '依据 GB/T 50493-2019 4.4.3；真实DOM识别区域：东侧应急与装卸边界区；点位坐标(1040.0m,620.0m)，安装高度1.5m，覆盖半径8.0m；边界/装卸通道巡检点，覆盖仓储与应急通道风险', 2, 0.40, 'gas', 'auto') ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y), installation_height = VALUES(installation_height), effective_range = VALUES(effective_range), detection_range = VALUES(detection_range), install_remark = VALUES(install_remark), priority = VALUES(priority), risk = VALUES(risk), type = VALUES(type), mode = VALUES(mode);

-- 开发演示用仿真读数。无硬件接入时必须显式标记 simulation / SIMULATED，不冒充真实实测。
INSERT INTO simulation_scenario
    (scenario_code, name, source, gas_type, leak_x, leak_y, emission_rate, wind_speed, wind_direction, seed, started_at, ended_at)
VALUES
    ('DEMO-LEAK-20260619', '仿真泄漏演示场景', 'simulation', 'CH4', 430.0, 470.0, 0.18, 3.6, 45, 2026061901, '2026-06-19 10:00:00', '2026-06-19 10:10:00')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    source = VALUES(source),
    gas_type = VALUES(gas_type),
    leak_x = VALUES(leak_x),
    leak_y = VALUES(leak_y),
    emission_rate = VALUES(emission_rate),
    wind_speed = VALUES(wind_speed),
    wind_direction = VALUES(wind_direction),
    seed = VALUES(seed),
    started_at = VALUES(started_at),
    ended_at = VALUES(ended_at);

INSERT INTO sensor_reading
    (scenario_id, sensor_id, gas_type, concentration, unit, sampled_at, source, quality_status, raw_payload)
VALUES
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'TK-01L', 'CH4', 31.4, 'ppm', '2026-06-19 10:00:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026061901, 'model', 'gaussian-plume-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'TK-02L', 'CH4', 44.8, 'ppm', '2026-06-19 10:02:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026061901, 'model', 'gaussian-plume-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'TK-03L', 'CH4', 52.6, 'ppm', '2026-06-19 10:04:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026061901, 'model', 'gaussian-plume-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-03L', 'CH4', 25.9, 'ppm', '2026-06-19 10:06:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026061901, 'model', 'gaussian-plume-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'P2-01L', 'CO', 18.2, 'ppm', '2026-06-26 09:34:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'P2-02L', 'CO', 25.6, 'ppm', '2026-06-26 09:38:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'P2-03L', 'CO', 41.3, 'ppm', '2026-06-26 09:42:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'P2-04L', 'CO', 57.9, 'ppm', '2026-06-26 09:46:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'P2-05L', 'CO', 76.4, 'ppm', '2026-06-26 09:50:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-01L', 'CO', 92.7, 'ppm', '2026-06-26 09:54:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-02L', 'CO', 111.8, 'ppm', '2026-06-26 09:58:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-03L', 'CO', 124.5, 'ppm', '2026-06-26 10:02:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-04L', 'CO', 132.6, 'ppm', '2026-06-26 10:06:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-05L', 'CO', 119.4, 'ppm', '2026-06-26 10:10:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062603, 'carId', 3, 'model', 'patrol-co-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'TK-01L', 'CH4', 22.1, 'ppm', '2026-06-26 09:40:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062601, 'carId', 1, 'model', 'patrol-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'PA-06L', 'NH3', 12.4, 'ppm', '2026-06-26 09:44:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062602, 'carId', 2, 'model', 'patrol-demo')),
    ((SELECT id FROM simulation_scenario WHERE scenario_code = 'DEMO-LEAK-20260619'), 'FS-01', 'O2', 18.1, 'ppm', '2026-06-26 10:08:00', 'simulation', 'SIMULATED', JSON_OBJECT('seed', 2026062604, 'carId', 4, 'model', 'patrol-demo'))
ON DUPLICATE KEY UPDATE
    concentration = VALUES(concentration),
    unit = VALUES(unit),
    source = VALUES(source),
    quality_status = VALUES(quality_status),
    raw_payload = VALUES(raw_payload);
