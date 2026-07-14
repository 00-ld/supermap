-- ========================================
-- Migration 001: add role column to user table
-- Role model: admin can execute write operations; user is read-oriented.
-- ========================================
USE `chemical`;

-- Idempotent migration: add role only when the user table exists and lacks it.
-- If the user table does not exist, run deploy/mysql/init.sql first.
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

-- Do not bulk-promote existing users in this migration.
-- Admin promotion must be performed explicitly in a controlled local or deployment session.
