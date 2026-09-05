CREATE TYPE USER_TYPE AS ENUM ('org-admin', 'org-user');

ALTER TABLE users ADD user_type USER_TYPE;