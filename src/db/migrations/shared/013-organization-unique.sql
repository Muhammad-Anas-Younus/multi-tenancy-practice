ALTER TABLE organizations ADD CONSTRAINT unique_name UNIQUE (name);

ALTER TABLE organizations ADD CONSTRAINT unique_schema_name UNIQUE (schema_name);