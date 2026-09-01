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

-- ========================================
-- task 表：移动端任务指派闭环（事故→指派→打卡→验收→异常解除）
-- 详见 db/migrations/005_add_task_table.sql
-- ========================================
CREATE TABLE IF NOT EXISTS `task` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `title` VARCHAR(200) NOT NULL COMMENT '任务标题',
    `description` VARCHAR(1000) DEFAULT NULL COMMENT '任务描述',
    `type` VARCHAR(20) NOT NULL DEFAULT 'incident' COMMENT '任务类型：incident事故/patrol巡检/drill演练',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending待指派/assigned已指派/processing处置中/pending_review待验收/completed已完成/canceled已取消',
    `warning_history_id` INT DEFAULT NULL COMMENT '关联告警历史ID',
    `gas_type` VARCHAR(20) DEFAULT NULL COMMENT '气体类型（冗余自告警）',
    `assignee_type` VARCHAR(10) DEFAULT NULL COMMENT '指派对象：car/employee',
    `car_id` INT DEFAULT NULL COMMENT '指派巡检车ID',
    `employee_id` BIGINT DEFAULT NULL COMMENT '指派员工ID',
    `x` DOUBLE DEFAULT NULL COMMENT '目标X坐标（园区本地米制）',
    `y` DOUBLE DEFAULT NULL COMMENT '目标Y坐标',
    `area_name` VARCHAR(100) DEFAULT NULL COMMENT '区域名称',
    `creator_user_id` BIGINT DEFAULT NULL COMMENT '创建人用户ID',
    `assigned_time` DATETIME DEFAULT NULL COMMENT '指派时间',
    `accepted_time` DATETIME DEFAULT NULL COMMENT '接单时间',
    `checkin_time` DATETIME DEFAULT NULL COMMENT '打卡时间',
    `checkin_x` DOUBLE DEFAULT NULL COMMENT '打卡经度（WGS84）',
    `checkin_y` DOUBLE DEFAULT NULL COMMENT '打卡纬度（WGS84）',
    `checkin_photo_base64` LONGTEXT DEFAULT NULL COMMENT '打卡照片base64（与inspect_record.image_base64同类型）',
    `yolo_person_count` INT DEFAULT NULL COMMENT 'YOLO识别人数（算法不可用时为空）',
    `checkin_remark` VARCHAR(500) DEFAULT NULL COMMENT '打卡备注',
    `review_result` VARCHAR(20) DEFAULT NULL COMMENT '验收结果：pass/reject',
    `review_remark` VARCHAR(500) DEFAULT NULL COMMENT '验收备注',
    `review_time` DATETIME DEFAULT NULL COMMENT '验收时间',
    `reviewer_user_id` BIGINT DEFAULT NULL COMMENT '验收人用户ID',
    `warning_resolved` TINYINT NOT NULL DEFAULT 0 COMMENT '异常解除幂等标志：0未解除/1已解除',
    `inspect_record_id` BIGINT DEFAULT NULL COMMENT '关联巡检记录ID（预留，首版不写）',
    `source` VARCHAR(32) NOT NULL DEFAULT 'mobile' COMMENT '任务来源：mobile/web',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_task_status` (`status`),
    KEY `idx_task_warning` (`warning_history_id`),
    KEY `idx_task_car` (`car_id`),
    KEY `idx_task_employee` (`employee_id`),
    KEY `idx_task_creator` (`creator_user_id`),
    KEY `idx_task_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务指派表（巡检/事故处置闭环）';
