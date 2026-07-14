-- ========================================
-- 迁移脚本: 为 user 表增加角色字段 (H-1 授权层)
-- 角色: admin=管理员(可执行增删改写操作), user=普通用户(仅只读 GET)
-- ========================================
USE `chemical`;

-- 幂等迁移：旧库缺少 role 时才增加字段；重复运行不会报错。
-- 如果 user 表不存在，说明该库尚未执行 deploy/mysql/init.sql，此迁移会跳过。
SET @add_user_role_column = (
    SELECT CASE
        WHEN (
            SELECT COUNT(*)
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'user'
        ) = 0
        THEN 'SELECT ''user table does not exist; run deploy/mysql/init.sql first'' AS migration_add_role_status'
        WHEN (
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'user'
              AND COLUMN_NAME = 'role'
        ) = 0
        THEN 'ALTER TABLE `user` ADD COLUMN `role` VARCHAR(16) NOT NULL DEFAULT ''user'' COMMENT ''角色: admin=管理员可写, user=普通用户只读'''
        ELSE 'SELECT ''role column already exists'' AS migration_add_role_status'
    END
);
PREPARE add_user_role_column_stmt FROM @add_user_role_column;
EXECUTE add_user_role_column_stmt;
DEALLOCATE PREPARE add_user_role_column_stmt;

-- 首次迁移：将已有账号提升为管理员（按需调整；新注册账号一律强制为 user）
-- 谨慎执行：确认现有 user 表中均为可信管理账号后再放开下一行
-- UPDATE `user` SET `role` = 'admin';
