ALTER TABLE organizations ADD slug TEXT;

UPDATE organizations
SET
    slug = REGEXP_REPLACE (LOWER(TRIM(name)), '[^a-z0-9]+', '_', 'g')
WHERE
    slug IS NULL;

ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;

ALTER TABLE organizations ADD CONSTRAINT unique_slug UNIQUE (slug);