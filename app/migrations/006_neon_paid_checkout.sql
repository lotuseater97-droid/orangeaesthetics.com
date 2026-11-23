-- Migration 006: verified checkout reconciliation and purchased-credit issuance.
-- DEVELOPMENT ONLY. Requires migration 005.
-- CALL ONLY after Stripe raw-body signature verification; browser calls prohibited.
-- Backend must verify Stripe account, event livemode, and use server-only DB credentials.
-- Does not handle subscriptions, refunds, disputes, or fulfillment.
CREATE OR REPLACE FUNCTION orange_app.confirm_paid_checkout(p_event_id text, p_checkout_id text, p_amount_cents bigint, p_currency text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'orange_app'
AS $function$
DECLARE v_order orange_app.orders%ROWTYPE; v_calculated bigint; v_existing uuid; v_item record;
BEGIN
 IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9]+$' OR p_checkout_id IS NULL OR p_checkout_id !~ '^cs_[A-Za-z0-9_]+$'
 OR p_amount_cents IS NULL OR p_amount_cents<=0 OR p_currency IS DISTINCT FROM 'USD' THEN RAISE EXCEPTION 'Invalid verified checkout'; END IF;
 SELECT order_id INTO v_existing FROM orange_app.payment_events WHERE processor='stripe' AND event_id=p_event_id;
 IF FOUND THEN
  SELECT * INTO v_order FROM orange_app.orders WHERE id=v_existing;
  IF NOT FOUND OR v_order.processor_checkout_id IS DISTINCT FROM p_checkout_id OR v_order.total_cents<>p_amount_cents OR v_order.currency<>'USD' OR v_order.status<>'paid'
  THEN RAISE EXCEPTION 'Conflicting duplicate event'; END IF;
  RETURN v_order.id;
 END IF;
 SELECT * INTO v_order FROM orange_app.orders WHERE processor_checkout_id=p_checkout_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown checkout session'; END IF;
 SELECT order_id INTO v_existing FROM orange_app.payment_events WHERE processor='stripe' AND event_id=p_event_id;
 IF FOUND THEN
  IF v_existing IS DISTINCT FROM v_order.id OR v_order.status<>'paid' OR v_order.total_cents<>p_amount_cents THEN RAISE EXCEPTION 'Conflicting duplicate event'; END IF;
  RETURN v_order.id;
 END IF;
 IF v_order.status NOT IN ('pending','paid') OR v_order.total_cents<>p_amount_cents OR v_order.currency<>'USD' THEN RAISE EXCEPTION 'Order mismatch'; END IF;
 SELECT coalesce(sum(oi.quantity*oi.unit_price_cents),0) INTO v_calculated FROM orange_app.order_items oi WHERE oi.order_id=v_order.id;
 IF v_calculated<>v_order.total_cents THEN RAISE EXCEPTION 'Line item total mismatch'; END IF;
 IF v_order.status='pending' THEN UPDATE orange_app.orders SET status='paid' WHERE id=v_order.id; END IF;
 INSERT INTO orange_app.payment_events(processor,event_id,event_type,order_id) VALUES('stripe',p_event_id,'checkout.session.completed',v_order.id);
 FOR v_item IN SELECT oi.id,oi.catalog_item_id,oi.quantity FROM orange_app.order_items oi JOIN orange_app.catalog_items c ON c.id=oi.catalog_item_id WHERE oi.order_id=v_order.id AND c.kind IN ('service','addon') LOOP
  IF NOT EXISTS (SELECT 1 FROM orange_app.benefit_grants WHERE order_item_id=v_item.id) THEN
   INSERT INTO orange_app.benefit_grants(member_id,order_item_id,catalog_item_id,quantity)
   VALUES(v_order.member_id,v_item.id,v_item.catalog_item_id,v_item.quantity);
  END IF;
 END LOOP;
 INSERT INTO orange_app.audit_events(action,target_type,target_id) VALUES('checkout.paid','order',v_order.id);
 RETURN v_order.id;
END $function$
;
REVOKE ALL ON FUNCTION orange_app.confirm_paid_checkout(text,text,bigint,text) FROM PUBLIC;
