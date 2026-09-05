CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        password_hashed VARCHAR(255),
        tenant_id INT NOT NULL,
        CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES organizations (id)
    );