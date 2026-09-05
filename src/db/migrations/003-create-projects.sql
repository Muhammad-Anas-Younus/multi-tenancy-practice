CREATE TABLE
    PROJECTS (
        id SERIAL PRIMARY KEY,
        tenant_id INT,
        name VARCHAR(255),
        CONSTRAINT fk_projects_organizations FOREIGN KEY (tenant_id) REFERENCES organizations (id)
    );