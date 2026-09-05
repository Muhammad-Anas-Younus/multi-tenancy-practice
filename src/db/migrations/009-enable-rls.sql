ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users FOR ALL TO public USING (
    tenant_id = current_setting('app.current_tenant_id', true)::INTEGER
);

CREATE POLICY projects_tenant_isolation ON projects FOR ALL TO public USING (
    tenant_id = current_setting('app.current_tenant_id', true)::INTEGER
);

CREATE POLICY project_members_tenant_isolation ON project_members FOR ALL TO public USING (
    tenant_id = current_setting ('app.current_tenant_id', true)::INTEGER
);