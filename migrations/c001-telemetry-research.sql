-- Additive only: no legacy tables, rows, roles or credentials are modified.
-- A name collision fails the transaction rather than adopting unknown objects.
CREATE SCHEMA analytics;
CREATE SCHEMA research;
REVOKE ALL ON SCHEMA analytics, research FROM PUBLIC;

CREATE ROLE aifactory_analytics NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE aifactory_study_submitter NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE aifactory_researcher NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE aifactory_data_custodian NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

CREATE TABLE analytics.schema_migrations (
  version varchar(64) PRIMARY KEY,
  checksum varchar(64) NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
  applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE analytics.telemetry_events (
  event_id uuid PRIMARY KEY,
  run_id uuid NOT NULL,
  build_sha varchar(40) NOT NULL CHECK (build_sha ~ '^[a-f0-9]{40}$'),
  ruleset_version varchar(32) NOT NULL CHECK (ruleset_version IN ('release-a.1','release-b.1')),
  schema_version integer NOT NULL CHECK (schema_version = 1),
  event_type varchar(40) NOT NULL CHECK (event_type IN ('run_started','first_investment','training_completed','era_reached','run_completed','debrief_viewed','save_recovery','assessment_completed')),
  properties jsonb NOT NULL CHECK (jsonb_typeof(properties) = 'object' AND octet_length(properties::text) <= 512),
  client_occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CHECK (client_occurred_at BETWEEN received_at - interval '24 hours' AND received_at + interval '5 minutes'),
  CHECK (expires_at = received_at + interval '2160 hours')
);
CREATE INDEX telemetry_events_expiry_idx ON analytics.telemetry_events (expires_at);

CREATE TABLE research.active_studies (
  study_id varchar(32) PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false
);
-- Infrastructure only: a custodian must explicitly activate an approved study.
INSERT INTO research.active_studies(study_id, enabled) VALUES ('pilot-v1', false);
CREATE TABLE research.study_responses (
  response_id uuid PRIMARY KEY,
  study_id varchar(32) NOT NULL REFERENCES research.active_studies(study_id),
  participant_id uuid NOT NULL,
  withdrawal_hash varchar(64) NOT NULL CHECK (withdrawal_hash ~ '^[a-f0-9]{64}$'),
  consent_version varchar(32) NOT NULL CHECK (consent_version = 'pilot-consent-v1'),
  assessment_version varchar(32) NOT NULL CHECK (assessment_version = 'pilot-v1'),
  phase varchar(4) NOT NULL CHECK (phase IN ('pre','post')),
  answers text[] NOT NULL CHECK (cardinality(answers) = 5 AND answers <@ ARRAY['A','B','C','D']::text[] AND array_position(answers, NULL) IS NULL),
  received_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT statement_timestamp() + interval '4320 hours',
  CHECK (expires_at = received_at + interval '4320 hours'),
  UNIQUE (study_id, participant_id, phase)
);
CREATE INDEX study_responses_expiry_idx ON research.study_responses (expires_at);
ALTER TABLE research.study_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.study_responses FORCE ROW LEVEL SECURITY;
CREATE POLICY active_study_submit ON research.study_responses FOR INSERT TO aifactory_study_submitter
  WITH CHECK (study_id IN (SELECT study_id FROM research.active_studies WHERE enabled));
CREATE POLICY active_study_read ON research.study_responses FOR SELECT TO aifactory_researcher
  USING (expires_at > statement_timestamp() AND study_id IN (SELECT study_id FROM research.active_studies WHERE enabled));
CREATE POLICY custodian_read ON research.study_responses FOR SELECT TO aifactory_data_custodian USING (true);
CREATE POLICY custodian_delete ON research.study_responses FOR DELETE TO aifactory_data_custodian USING (true);

REVOKE ALL ON ALL TABLES IN SCHEMA analytics, research FROM PUBLIC;
GRANT USAGE ON SCHEMA analytics TO aifactory_analytics, aifactory_data_custodian;
GRANT SELECT ON analytics.schema_migrations TO aifactory_analytics, aifactory_data_custodian;
GRANT INSERT ON analytics.telemetry_events TO aifactory_analytics;
GRANT SELECT, DELETE ON analytics.telemetry_events TO aifactory_data_custodian;
GRANT USAGE ON SCHEMA research TO aifactory_study_submitter, aifactory_researcher, aifactory_data_custodian;
GRANT SELECT ON research.active_studies TO aifactory_study_submitter, aifactory_researcher, aifactory_data_custodian;
GRANT INSERT (response_id, study_id, participant_id, withdrawal_hash, consent_version, assessment_version, phase, answers)
  ON research.study_responses TO aifactory_study_submitter;
GRANT SELECT ON research.study_responses TO aifactory_researcher, aifactory_data_custodian;
GRANT DELETE ON research.study_responses TO aifactory_data_custodian;
