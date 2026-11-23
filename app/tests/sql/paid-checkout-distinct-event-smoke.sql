-- Run only on Neon development. Synthetic data is rolled back on success.
-- Verifies identical and distinct event-ID idempotency, single grant/audit,
-- and rejection of an oversized confirmed amount.
DO $test$
DECLARE v_member uuid;v_item uuid;v_order uuid;v_a uuid;v_b uuid;v_c uuid;v_events integer;v_grants integer;v_audits integer;v_rejected boolean:=false;
BEGIN
 BEGIN
  INSERT INTO orange_app.members(display_name,auth_subject,status) VALUES('Synthetic migration 012 test','synthetic_m012_'||txid_current()::text,'active') RETURNING id INTO v_member;
  INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents,active,checkout_approved,requires_clinical_review) VALUES('synthetic_m012_item','Synthetic nonclinical addon','addon',9900,true,true,false) RETURNING id INTO v_item;
  SELECT id INTO v_order FROM orange_app.reserve_checkout_order(v_member,'synthetic_m012_item',1,9900);
  PERFORM orange_app.attach_checkout_session(v_order,v_member,'cs_test_m012synthetic');
  SELECT orange_app.confirm_paid_checkout('evt_m012first','cs_test_m012synthetic',9900,'USD') INTO v_a;
  SELECT orange_app.confirm_paid_checkout('evt_m012first','cs_test_m012synthetic',9900,'USD') INTO v_b;
  SELECT orange_app.confirm_paid_checkout('evt_m012second','cs_test_m012synthetic',9900,'USD') INTO v_c;
  IF v_a IS DISTINCT FROM v_order OR v_b IS DISTINCT FROM v_order OR v_c IS DISTINCT FROM v_order THEN RAISE EXCEPTION 'Unexpected confirmation result'; END IF;
  SELECT count(*) INTO v_events FROM orange_app.payment_events WHERE order_id=v_order;
  SELECT count(*) INTO v_grants FROM orange_app.benefit_grants WHERE order_item_id IN(SELECT id FROM orange_app.order_items WHERE order_id=v_order);
  SELECT count(*) INTO v_audits FROM orange_app.audit_events WHERE action='checkout.paid' AND target_id=v_order;
  IF v_events<>1 OR v_grants<>1 OR v_audits<>1 THEN RAISE EXCEPTION 'Duplicate side effects events=% grants=% audits=%',v_events,v_grants,v_audits; END IF;
  BEGIN
   PERFORM orange_app.confirm_paid_checkout('evt_m012overlimit','cs_test_m012synthetic',100000000,'USD');
  EXCEPTION WHEN OTHERS THEN v_rejected:=true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'Oversized confirmation accepted'; END IF;
  RAISE EXCEPTION 'SYNTHETIC_TEST_ROLLBACK';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'SYNTHETIC_TEST_ROLLBACK' THEN RAISE; END IF;
 END;
END $test$;
