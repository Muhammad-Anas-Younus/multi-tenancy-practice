ALTER TABLE projects ADD CONSTRAINT projects_id_tenant_id_uq UNIQUE (id, tenant_id);

ALTER TABLE users ADD CONSTRAINT user_id_tenant_id_uq UNIQUE (id, tenant_id);

ALTER TABLE project_members ADD CONSTRAINT fk_project_constraint FOREIGN KEY (project_id, tenant_id) REFERENCES projects (id, tenant_id) ON DELETE CASCADE;

ALTER TABLE project_members ADD CONSTRAINT fk_user_constraint FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE;