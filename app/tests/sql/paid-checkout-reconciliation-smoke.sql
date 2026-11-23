-- Development-only, rollback-safe paid-checkout reconciliation smoke test.
-- Does not test Stripe signatures or real payments.
DO $test$
DECLARE v_member uuid;v_item uuid;v_order uuid;v_paid uuid;v_repeat uuid;v_denied boolean:=false;v_grants integer;v_events integer;
BEGIN
 BEGIN
  INSERT INTO orange_app.members(display_name,auth_subject,status) VALUES('Synthetic paid checkout member','synthetic-paid-member','active') RETURNING id INTO v_member;
  INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents,active,checkout_approved,requires_clinical_review)
  VALUES('synthetic_paid_item','Synthetic add-on','addon',9900,true,true,false) RETURNING id INTO v_item;
  SELECT id INTO v_order FROM orange_app.reserve_checkout_order(v_member,'synthetic_paid_item',1,9900);
  PERFORM orange_app.attach_checkout_session(v_order,v_member,'cs_test_syntheticpaid123');
  BEGIN
   PERFORM orange_app.confirm_paid_checkout('evt_syntheticpaidbad','cs_test_syntheticpaid123',9800,'USD');
  EXCEPTION WHEN OTHERS THEN v_denied:=true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Incorrect amount accepted'; END IF;
  SELECT orange_app.confirm_paid_checkout('evt_syntheticpaid123','cs_test_syntheticpaid123',9900,'USD') INTO v_paid;
  SELECT orange_app.confirm_paid_checkout('evt_syntheticpaid123','cs_test_syntheticpaid123',9900,'USD') INTO v_repeat;
  IF v_paid IS DISTINCT FROM v_order OR v_repeat IS DISTINCT FROM v_order THEN RAISE EXCEPTION 'Payment reconciliation failed'; END IF;
  SELECT count(*) INTO v_grants FROM orange_app.benefit_grants WHERE member_id=v_member AND order_item_id IN(SELECT id FROM orange_app.order_items WHERE order_id=v_order);
  SELECT count(*) INTO v_events FROM orange_app.payment_events WHERE order_id=v_order;
  IF v_grants<>1 OR v_events<>1 THEN RAISE EXCEPTION 'Expected one grant/event, got %/%',v_grants,v_events; END IF;
  IF NOT EXISTS(SELECT 1 FROM orange_app.orders WHERE id=v_order AND status='paid') THEN RAISE EXCEPTION 'Order not paid'; END IF;
  RAISE EXCEPTION 'SYNTHETIC_TEST_ROLLBACK';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'SYNTHETIC_TEST_ROLLBACK' THEN RAISE; END IF;
 END;
END $test$;
