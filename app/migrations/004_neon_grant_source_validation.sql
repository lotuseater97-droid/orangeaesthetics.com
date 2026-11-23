-- Migration 004: ensure benefit credits belong to their funding source.
-- Development branch only. Requires 001 schema; apply after 003.
-- Invariant: exactly one source (active membership OR paid order item).
CREATE OR REPLACE FUNCTION orange_app.validate_grant_source() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,orange_app AS $$
DECLARE source_member uuid; source_catalog uuid;
BEGIN
 IF (NEW.membership_id IS NULL) = (NEW.order_item_id IS NULL) THEN RAISE EXCEPTION 'Grant must have exactly one source'; END IF;
 IF NEW.order_item_id IS NOT NULL THEN
  SELECT o.member_id,oi.catalog_item_id INTO source_member,source_catalog
  FROM orange_app.order_items oi JOIN orange_app.orders o ON o.id=oi.order_id
  WHERE oi.id=NEW.order_item_id AND o.status='paid';
  IF NOT FOUND THEN RAISE EXCEPTION 'Grant requires paid order'; END IF;
  IF NEW.catalog_item_id IS DISTINCT FROM source_catalog THEN RAISE EXCEPTION 'Grant catalog item mismatch'; END IF;
 ELSE
  SELECT member_id INTO source_member FROM orange_app.memberships
  WHERE id=NEW.membership_id AND status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Grant requires active membership'; END IF;
 END IF;
 IF source_member IS DISTINCT FROM NEW.member_id THEN RAISE EXCEPTION 'Grant member mismatch'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER check_grant_source
BEFORE INSERT OR UPDATE OF member_id,membership_id,order_item_id,catalog_item_id
ON orange_app.benefit_grants FOR EACH ROW EXECUTE FUNCTION orange_app.validate_grant_source();
REVOKE ALL ON FUNCTION orange_app.validate_grant_source() FROM PUBLIC;
-- Still required: revoke/adjust credits on refunds, enforce grant limits,
-- prohibit direct client SQL, and implement authenticated server-only issuance.
