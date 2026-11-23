-- Operator-reviewed prerequisite for saving version-10 Designs with Door operations.
-- Prepared only: do not run as a test or as part of App startup/build.
-- Existing rows, ownership, indexes and Project relationships are unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE "threed_designs" DROP CONSTRAINT "threed_designs_document_valid";
ALTER TABLE "threed_designs" ADD CONSTRAINT "threed_designs_document_valid" CHECK (
  coalesce(jsonb_typeof("document") = 'object'
    AND "document"->>'format' = 'threed-home-design'
    AND "document"->>'units' = 'metres'
    AND "document"->'version' = to_jsonb("format_version")
    AND "format_version" IN (5, 6, 7, 8, 9, 10)
    AND "document"->>'name' = "name"
    AND length(trim("name")) > 0, false)
);
COMMIT;
