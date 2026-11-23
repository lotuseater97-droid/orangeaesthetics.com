-- Read-only boundary assertions for migration 011. Run against development only.
-- No member, catalog, order, or payment data is created.
DO $test$
DECLARE
  error_text text;
BEGIN
  BEGIN
    PERFORM * FROM orange_app.reserve_checkout_order(
      '00000000-0000-4000-8000-000000000001'::uuid,
      'test_item', 10, 10000000
    );
    RAISE EXCEPTION 'FAIL: over-limit checkout was accepted';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_text = MESSAGE_TEXT;
    IF error_text <> 'Checkout total exceeds limit' THEN
      RAISE EXCEPTION 'FAIL: unexpected over-limit result: %', error_text;
    END IF;
  END;
  BEGIN
    PERFORM * FROM orange_app.reserve_checkout_order(
      '00000000-0000-4000-8000-000000000001'::uuid,
      'test_item', 1, 99999999
    );
    RAISE EXCEPTION 'FAIL: boundary unexpectedly reserved without member';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_text = MESSAGE_TEXT;
    IF error_text <> 'Inactive or unknown member' THEN
      RAISE EXCEPTION 'FAIL: boundary was rejected for wrong reason: %', error_text;
    END IF;
  END;
END $test$;
