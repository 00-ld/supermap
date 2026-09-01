-- 传感器布局与环境观测表
-- 传感器布局方案表
-- 存储传感器布局方案，用于保存和切换不同布局
CREATE TABLE IF NOT EXISTS `sensor_layout` (
    `id`                 INT          AUTO_INCREMENT COMMENT '布局方案ID',
    `layout_name`        VARCHAR(100) NOT NULL COMMENT '布局方案名称',
    `description`        VARCHAR(500) DEFAULT '' COMMENT '布局方案描述',
    `sensor_count`       INT          DEFAULT 0 COMMENT '传感器数量',
    `coverage_rate`      DOUBLE       DEFAULT 0 COMMENT '覆盖率 0~1',
    `risk_score`         DOUBLE       DEFAULT 0 COMMENT '风险评分 0~1',
    `status`             VARCHAR(20)  DEFAULT 'draft' COMMENT '状态 draft/active/archived',
    `created_at`         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='传感器布局方案表';

-- 传感器布局详情表
-- 存储布局方案中的传感器配置
CREATE TABLE IF NOT EXISTS `sensor_layout_detail` (
    `id`                 INT          AUTO_INCREMENT COMMENT '记录ID',
    `layout_id`          INT          NOT NULL COMMENT '所属布局方案ID',
    `sensor_id`          VARCHAR(50)  NOT NULL COMMENT '传感器编号',
    `x`                  DOUBLE       NOT NULL COMMENT '地图 X 坐标',
    `y`                  DOUBLE       NOT NULL COMMENT '地图 Y 坐标',
    `installation_height` DOUBLE      DEFAULT 1.5 COMMENT '安装高度 (m)',
    `effective_range`    DOUBLE       DEFAULT 20 COMMENT '有效监测范围 (m)',
    `detection_range`    VARCHAR(200) DEFAULT 'CO / CH4 / NH3 / O2' COMMENT '检测气体范围',
    `priority`           INT          DEFAULT 3 COMMENT '风险等级 1=重大风险 2=较大风险 3=一般风险 4=低风险',
    `risk`               DOUBLE       DEFAULT 0.3 COMMENT '风险值 0~1',
    `created_at`         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sensor_layout_detail_layout_sensor` (`layout_id`, `sensor_id`),
    KEY `idx_sensor_layout_detail_layout` (`layout_id`),
    FOREIGN KEY (`layout_id`) REFERENCES `sensor_layout`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='传感器布局方案详情表';

-- 环境观测数据表
-- 当前仓库没有真实硬件采集链路；只有外部系统明确写入 source 时，才能按来源解释为外部观测。
CREATE TABLE IF NOT EXISTS `environment_reading` (
    `id`             BIGINT       AUTO_INCREMENT COMMENT '记录ID',
    `source`         VARCHAR(100) NOT NULL COMMENT '数据来源',
    `wind_speed`     DOUBLE       DEFAULT NULL COMMENT '风速 m/s',
    `wind_direction` INT          DEFAULT NULL COMMENT '风向角度 0-359',
    `temperature`    DOUBLE       DEFAULT NULL COMMENT '温度 ℃',
    `humidity`       INT          DEFAULT NULL COMMENT '相对湿度 %',
    `pressure`       DOUBLE       DEFAULT NULL COMMENT '气压 kPa',
    `noise`          DOUBLE       DEFAULT NULL COMMENT '噪声 dB',
    `observed_at`    DATETIME     NOT NULL COMMENT '观测时间',
    `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
    PRIMARY KEY (`id`),
    KEY `idx_environment_reading_observed_at` (`observed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='环境观测数据表';
