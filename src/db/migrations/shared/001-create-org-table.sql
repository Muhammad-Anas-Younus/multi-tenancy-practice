CREATE TYPE strategy_type AS ENUM ('shared', 'schema', 'database');

CREATE TABLE
    organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        strategy strategy_type NOT NULL,
        connection_string VARCHAR(255), -- This field is only relevant for the 'database' strategy
        schema_name VARCHAR(255) -- This field is only relevant for the 'schema' strategy
    );