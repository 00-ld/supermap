-- 气体传感器基础信息表
-- 存储气体传感器类型/配置的基本数据，与手动录入字段保持一致
CREATE TABLE IF NOT EXISTS `gas` (
    `id`                  VARCHAR(50)  NOT NULL COMMENT '气体编号 (如 CO, NH3, CH4, O2)',
    `name`                VARCHAR(100) NOT NULL COMMENT '气体名称 (如一氧化碳, 氨气)',
    `detection_range`     VARCHAR(200) DEFAULT 'CO / CH4 / NH3 / O2' COMMENT '检测气体范围',
    `installation_height` DOUBLE       DEFAULT 1.5 COMMENT '安装高度 (m)',
    `effective_range`     DOUBLE       DEFAULT 20 COMMENT '有效监测范围 (m)',
    `install_remark`      VARCHAR(500) DEFAULT '' COMMENT '布点说明 / 备注',
    `priority`            INT          DEFAULT 3 COMMENT '风险等级 1=重大风险 2=较大风险 3=一般风险 4=低风险',
    `risk`                DOUBLE       DEFAULT 0.3 COMMENT '风险值 0~1',
    `type`                VARCHAR(20)  DEFAULT 'gas' COMMENT '传感器类型',
    `mode`                VARCHAR(10)  DEFAULT 'auto' COMMENT '数据模式 auto/manual',
    `created_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='气体传感器基础信息表';

-- 初始数据：四气传感器检测气体类型（CO / CH4 / NH3 / O2）
INSERT IGNORE INTO `gas` (`id`, `name`, `detection_range`, `installation_height`, `effective_range`, `install_remark`, `priority`, `risk`) VALUES
('CO', '一氧化碳', '0-1000 ppm', 1.5, 15, '高毒气体，需重点监测', 1, 0.90),
('NH3', '氨气', '0-100 ppm', 1.5, 20, '刺激性有毒气体，重点监测', 1, 0.90),
('CH4', '甲烷', '0-100% LEL', 2.0, 18, '可燃气体，高位安装', 2, 0.80),
('O2', '氧气', '0-30% VOL', 1.5, 15, '缺氧/富氧监测', 2, 0.30);
