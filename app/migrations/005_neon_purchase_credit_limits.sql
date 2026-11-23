-- Migration 005: prevent issuing more purchased credits than paid for.
-- Apply after 004. Development/synthetic data only.
-- Serializes competing grants by locking the source order item row.
CREATE OR REPLACE FUNCTION orange_app.validate_grant_source() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,orange_app AS $$
DECLARE source_member uuid; source_catalog uuid; purchased_qty integer; granted_qty bigint;
BEGIN
 IF (NEW.membership_id IS NULL) = (NEW.order_item_id IS NULL) THEN RAISE EXCEPTION 'Grant must have exactly one source'; END IF;
 IF NEW.order_item_id IS NOT NULL THEN
  SELECT o.member_id,oi.catalog_item_id,oi.quantity INTO source_member,source_catalog,purchased_qty
  FROM orange_app.order_items oi JOIN orange_app.orders o ON o.id=oi.order_id
  WHERE oi.id=NEW.order_item_id AND o.status='paid' FOR UPDATE OF oi;
  IF NOT FOUND THEN RAISE EXCEPTION 'Grant requires paid order'; END IF;
  IF NEW.catalog_item_id IS DISTINCT FROM source_catalog THEN RAISE EXCEPTION 'Grant catalog item mismatch'; END IF;
  SELECT coalesce(sum(quantity),0) INTO granted_qty FROM orange_app.benefit_grants
  WHERE order_item_id=NEW.order_item_id AND id IS DISTINCT FROM NEW.id;
  IF granted_qty+NEW.quantity>purchased_qty THEN RAISE EXCEPTION 'Grant quantity exceeds paid purchase quantity'; END IF;
 ELSE
  SELECT member_id INTO source_member FROM orange_app.memberships
  WHERE id=NEW.membership_id AND status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Grant requires active membership'; END IF;
 END IF;
 IF source_member IS DISTINCT FROM NEW.member_id THEN RAISE EXCEPTION 'Grant member mismatch'; END IF;
 RETURN NEW;
END $$;
CREATE INDEX IF NOT EXISTS idx_grants_order_item
ON orange_app.benefit_grants(order_item_id) WHERE order_item_id IS NOT NULL;
-- Membership-specific grant caps require a reviewed plan/period policy.
-- Refunds and order-item quantity edits require separate reconciliation controls.
