-- Align DB reservation policy with the server's addon-only catalog.
-- This does not assert that every addon is nonclinical; operator approval is still required.
CREATE OR REPLACE FUNCTION orange_app.reserve_checkout_order(p_member uuid,p_sku text,p_quantity integer,p_expected_price bigint)
RETURNS TABLE(id uuid,status text,member_id uuid,total_cents bigint,currency text)
LANGUAGE plpgsql SET search_path=pg_catalog,orange_app AS $$
DECLARE v_item orange_app.catalog_items%ROWTYPE;v_id uuid;
BEGIN
 IF p_member IS NULL OR p_sku IS NULL OR p_quantity NOT BETWEEN 1 AND 10 OR p_expected_price IS NULL OR p_expected_price<=0 THEN RAISE EXCEPTION 'Invalid checkout request'; END IF;
 IF p_expected_price > 100000000 OR p_expected_price > 9223372036854775807 / p_quantity THEN RAISE EXCEPTION 'Invalid checkout amount'; END IF;
 PERFORM 1 FROM orange_app.members m WHERE m.id=p_member AND m.status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Inactive or unknown member'; END IF;
 SELECT * INTO v_item FROM orange_app.catalog_items c WHERE c.sku=p_sku AND c.active=true AND c.kind='addon' FOR SHARE;
 IF NOT FOUND OR v_item.price_cents<>p_expected_price THEN RAISE EXCEPTION 'Catalog mismatch'; END IF;
 INSERT INTO orange_app.orders(member_id,status,currency,total_cents) VALUES(p_member,'pending','USD',v_item.price_cents*p_quantity) RETURNING orange_app.orders.id INTO v_id;
 INSERT INTO orange_app.order_items(order_id,catalog_item_id,quantity,unit_price_cents) VALUES(v_id,v_item.id,p_quantity,v_item.price_cents);
 RETURN QUERY SELECT o.id,o.status,o.member_id,o.total_cents,o.currency::text FROM orange_app.orders o WHERE o.id=v_id;
END $$;
