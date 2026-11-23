-- Development-only transactional checkout reservation smoke test.
-- Expected: unapproved item rejected, approved item creates pending order + line.
-- The deliberate exception rolls back all synthetic rows.
DO $test$
DECLARE v_member uuid;v_item uuid;v_order uuid;v_denied boolean:=false;
BEGIN
 BEGIN
  INSERT INTO orange_app.members(display_name,auth_subject,status)
  VALUES('Synthetic checkout member','synthetic-checkout-member','active') RETURNING id INTO v_member;
  INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents,active,checkout_approved,requires_clinical_review)
  VALUES('synthetic_checkout_item','Synthetic addon','addon',9900,true,false,false) RETURNING id INTO v_item;
  BEGIN
   PERFORM * FROM orange_app.reserve_checkout_order(v_member,'synthetic_checkout_item',1,9900);
  EXCEPTION WHEN OTHERS THEN v_denied:=true;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Unapproved checkout accepted'; END IF;
  UPDATE orange_app.catalog_items SET checkout_approved=true WHERE id=v_item;
  SELECT id INTO v_order FROM orange_app.reserve_checkout_order(v_member,'synthetic_checkout_item',1,9900);
  IF v_order IS NULL OR NOT EXISTS(SELECT 1 FROM orange_app.orders WHERE id=v_order AND total_cents=9900 AND status='pending')
  THEN RAISE EXCEPTION 'Approved reservation failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM orange_app.order_items WHERE order_id=v_order AND quantity=1 AND unit_price_cents=9900)
  THEN RAISE EXCEPTION 'Order item missing'; END IF;
  RAISE EXCEPTION 'SYNTHETIC_TEST_ROLLBACK';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'SYNTHETIC_TEST_ROLLBACK' THEN RAISE; END IF;
 END;
END $test$;
