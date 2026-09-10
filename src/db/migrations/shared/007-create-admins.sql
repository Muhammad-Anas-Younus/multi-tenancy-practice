CREATE TABLE
    admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hashed VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Platform admins are inserted manually, e.g.:
-- INSERT INTO admins (name, email, password_hashed)
-- VALUES ('Admin', 'admin@example.com', '<bcrypt hash>');
