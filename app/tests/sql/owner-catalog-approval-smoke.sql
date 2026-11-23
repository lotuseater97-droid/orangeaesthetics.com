-- Transactional smoke test for migration 010. All synthetic data rolls back.
-- Run on development branch only. A failed assertion aborts the statement.
DO $test$
DECLARE v_item uuid;v_ok boolean;v_denied boolean:=false;v_audits integer;
BEGIN
 BEGIN
  INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents)
  VALUES('synthetic_approval_test','Synthetic approval test','addon',100)
  RETURNING id INTO v_item;
  INSERT INTO orange_app.staff_roles(auth_subject,role,active)
  VALUES('synthetic-owner-test','owner',true);
  SELECT orange_app.set_catalog_checkout_approval('synthetic-owner-test',v_item,true,false,'synthetic-request-0001') INTO v_ok;
  IF v_ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Approval did not succeed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM orange_app.catalog_items WHERE id=v_item AND checkout_approved=true AND requires_clinical_review=false)
  THEN RAISE EXCEPTION 'Approval state not persisted'; END IF;
  SELECT count(*) INTO v_audits FROM orange_app.audit_events
  WHERE target_id=v_item AND action='catalog_checkout_approved' AND actor_subject='synthetic-owner-test';
  IF v_audits<>1 THEN RAISE EXCEPTION 'Expected one audit record, got %',v_audits; END IF;
  BEGIN
   PERFORM orange_app.set_catalog_checkout_approval('synthetic-unauthorized',v_item,false,true,'synthetic-request-0002');
  EXCEPTION WHEN OTHERS THEN v_denied:=true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Unauthorized approval was accepted'; END IF;
  PERFORM orange_app.set_catalog_checkout_approval('synthetic-owner-test',v_item,false,true,'synthetic-request-0003');
  IF NOT EXISTS(SELECT 1 FROM orange_app.catalog_items WHERE id=v_item AND checkout_approved=false AND requires_clinical_review=true)
  THEN RAISE EXCEPTION 'Revocation state not persisted'; END IF;
  RAISE EXCEPTION 'SYNTHETIC_TEST_ROLLBACK';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'SYNTHETIC_TEST_ROLLBACK' THEN RAISE; END IF;
 END;
END $test$;
