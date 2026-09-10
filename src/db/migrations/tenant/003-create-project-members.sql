CREATE TABLE
    project_members (
        id SERIAL PRIMARY KEY,
        project_id INT,
        user_id INT,
        CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id),
        CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id)
    );