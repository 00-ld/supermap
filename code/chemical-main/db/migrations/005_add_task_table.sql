-- ========================================
-- Migration 005: add task table for mobile task assignment loop
-- Closes the on-site disposal loop: accident → assign (car/employee) →
-- field check-in with photo → review → warning resolved.
-- Keeps existing databases aligned with deploy/mysql/init.sql.
-- ========================================
USE `chemical`;

-- 幂等建表：表已存在则跳过。关联列允许 NULL，不加 FK 约束（与既有 warning_history/patrol_car 一致）。
CREATE TABLE IF NOT EXISTS `task` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `title` VARCHAR(200) NOT NULL COMMENT '任务标题',
    `description` VARCHAR(1000) DEFAULT NULL COMMENT '任务描述',
    `type` VARCHAR(20) NOT NULL DEFAULT 'incident' COMMENT '任务类型：incident事故/patrol巡检/drill演练',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending待指派/assigned已指派/processing处置中/pending_review待验收/completed已完成/canceled已取消',

    -- 事故来源
    `warning_history_id` INT DEFAULT NULL COMMENT '关联告警历史ID',
    `gas_type` VARCHAR(20) DEFAULT NULL COMMENT '气体类型（冗余自告警）',

    -- 指派目标
    `assignee_type` VARCHAR(10) DEFAULT NULL COMMENT '指派对象：car/employee',
    `car_id` INT DEFAULT NULL COMMENT '指派巡检车ID',
    `employee_id` BIGINT DEFAULT NULL COMMENT '指派员工ID',

    -- 目标位置
    `x` DOUBLE DEFAULT NULL COMMENT '目标X坐标（园区本地米制）',
    `y` DOUBLE DEFAULT NULL COMMENT '目标Y坐标',
    `area_name` VARCHAR(100) DEFAULT NULL COMMENT '区域名称',

    -- 指派/接单
    `creator_user_id` BIGINT DEFAULT NULL COMMENT '创建人用户ID',
    `assigned_time` DATETIME DEFAULT NULL COMMENT '指派时间',
    `accepted_time` DATETIME DEFAULT NULL COMMENT '接单时间',

    -- 现场打卡
    `checkin_time` DATETIME DEFAULT NULL COMMENT '打卡时间',
    `checkin_x` DOUBLE DEFAULT NULL COMMENT '打卡经度（WGS84）',
    `checkin_y` DOUBLE DEFAULT NULL COMMENT '打卡纬度（WGS84）',
    `checkin_photo_base64` LONGTEXT DEFAULT NULL COMMENT '打卡照片base64（与inspect_record.image_base64同类型）',
    `yolo_person_count` INT DEFAULT NULL COMMENT 'YOLO识别人数（算法不可用时为空）',
    `checkin_remark` VARCHAR(500) DEFAULT NULL COMMENT '打卡备注',

    -- 验收
    `review_result` VARCHAR(20) DEFAULT NULL COMMENT '验收结果：pass/reject',
    `review_remark` VARCHAR(500) DEFAULT NULL COMMENT '验收备注',
    `review_time` DATETIME DEFAULT NULL COMMENT '验收时间',
    `reviewer_user_id` BIGINT DEFAULT NULL COMMENT '验收人用户ID',

    -- 异常解除
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
