-- Version 2. CRM records retain their validated camelCase API shape in JSONB.
-- A locked singleton makes numbering, payments and slip billing atomic in both adapters.
-- Existing legacy tables are left untouched. This schema does not import legacy SQL tables.
CREATE TABLE IF NOT EXISTS crm_state (
  id SMALLINT PRIMARY KEY CHECK (id=1),
  schema_version INTEGER NOT NULL CHECK (schema_version=2),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload)='object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
