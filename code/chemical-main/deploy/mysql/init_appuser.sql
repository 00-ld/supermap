-- Harden the application database account after the official MySQL image
-- creates it from MYSQL_USER / MYSQL_PASSWORD.
--
-- This script intentionally does not create appuser and never embeds a
-- password. Missing appuser means the deployment environment is incomplete.

USE `chemical`;

DELIMITER //
CREATE PROCEDURE require_appuser()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM mysql.user
        WHERE user = 'appuser' AND host = '%'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'appuser must be created by MYSQL_USER and MYSQL_PASSWORD';
    END IF;
END//
DELIMITER ;

CALL require_appuser();
DROP PROCEDURE require_appuser;

REVOKE ALL PRIVILEGES, GRANT OPTION ON `chemical`.* FROM 'appuser'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `chemical`.* TO 'appuser'@'%';

FLUSH PRIVILEGES;
