-- Migration 011 maximum boundary integration test, safe to repeat on development.
-- All synthetic records and order reservations are rolled back by the exception block.
DO $outer$
DECLARE v_member uuid; v_item uuid; v_order record; v_count integer; v_error text;
BEGIN
 BEGIN
  INSERT INTO orange_app.members(display_name,status) VALUES('Synthetic boundary test','active') RETURNING id INTO v_member;
  INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents,active,checkout_approved,requires_clinical_review)
  VALUES('boundary_011_synthetic','Synthetic boundary item','addon',99999999,true,true,false) RETURNING id INTO v_item;
  SELECT * INTO v_order FROM orange_app.reserve_checkout_order(v_member,'boundary_011_synthetic',1,99999999);
  IF v_order.total_cents <> 99999999 OR v_order.status <> 'pending' THEN RAISE EXCEPTION 'Boundary reservation mismatch'; END IF;
  SELECT count(*) INTO v_count FROM orange_app.order_items WHERE order_id=v_order.id AND catalog_item_id=v_item AND unit_price_cents=99999999 AND quantity=1;
  IF v_count<>1 THEN RAISE EXCEPTION 'Boundary order item mismatch'; END IF;
  RAISE EXCEPTION 'BOUNDARY_TEST_SUCCESS_ROLLBACK';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error=MESSAGE_TEXT;
  IF v_error<>'BOUNDARY_TEST_SUCCESS_ROLLBACK' THEN RAISE EXCEPTION 'Boundary test failed: %',v_error; END IF;
 END;
END $outer$;
