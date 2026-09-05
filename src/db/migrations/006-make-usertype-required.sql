UPDATE users
SET
    user_type = 'org-user'
WHERE
    user_type IS NULL;

ALTER TABLE users
ALTER COLUMN user_type
SET
    NOT NULL;