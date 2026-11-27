BEGIN;
ALTER TABLE threed_duplicate_receipts
  DROP CONSTRAINT threed_duplicate_receipts_kind_check,
  ADD CONSTRAINT threed_duplicate_receipts_kind_check
    CHECK (kind IN ('project', 'model', 'character', 'terrain', 'texture'));
COMMIT;
