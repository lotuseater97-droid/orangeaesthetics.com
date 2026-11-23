-- Migration 003: idempotent redemption routine (development branch)
-- Requires initial orange_app schema and migration 002.
-- Backend MUST authenticate staff and derive p_staff_subject from verified session.
-- This function is not exposed to browser roles and is NOT a HIPAA go-live approval.
CREATE OR REPLACE FUNCTION orange_app.redeem_credit_v2(p_grant_id uuid,p_member_id uuid,p_quantity integer,p_staff_subject text,p_idempotency_key text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,orange_app AS $$
DECLARE g orange_app.benefit_grants%ROWTYPE; existing orange_app.redemptions%ROWTYPE; used bigint; result_id uuid;
BEGIN
 IF p_quantity IS NULL OR p_quantity<=0 OR nullif(btrim(p_staff_subject),'') IS NULL OR nullif(btrim(p_idempotency_key),'') IS NULL OR length(p_idempotency_key)>128 THEN
  RAISE EXCEPTION 'Invalid redemption request';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM orange_app.staff_roles WHERE auth_subject=p_staff_subject AND active=true) THEN RAISE EXCEPTION 'Staff not authorized'; END IF;
 SELECT * INTO g FROM orange_app.benefit_grants WHERE id=p_grant_id AND member_id=p_member_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Credit not found for member'; END IF;
 SELECT * INTO existing FROM orange_app.redemptions WHERE idempotency_key=p_idempotency_key;
 IF FOUND THEN
  IF existing.grant_id<>p_grant_id OR existing.member_id<>p_member_id OR existing.quantity<>p_quantity OR existing.staff_subject<>p_staff_subject THEN RAISE EXCEPTION 'Idempotency key reused for different request'; END IF;
  RETURN existing.id;
 END IF;
 IF g.expires_at IS NOT NULL AND g.expires_at<=now() THEN RAISE EXCEPTION 'Credit expired'; END IF;
 IF g.order_item_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM orange_app.order_items oi JOIN orange_app.orders o ON o.id=oi.order_id
  WHERE oi.id=g.order_item_id AND o.member_id=p_member_id AND o.status='paid'
 ) THEN RAISE EXCEPTION 'Purchase not paid'; END IF;
 IF g.membership_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM orange_app.memberships m WHERE m.id=g.membership_id AND m.member_id=p_member_id
  AND m.status='active' AND (m.period_end IS NULL OR m.period_end>now())
 ) THEN RAISE EXCEPTION 'Membership not active'; END IF;
 SELECT coalesce(sum(quantity),0) INTO used FROM orange_app.redemptions WHERE grant_id=p_grant_id AND status='completed';
 IF used+p_quantity>g.quantity THEN RAISE EXCEPTION 'Insufficient credit'; END IF;
 INSERT INTO orange_app.redemptions(member_id,grant_id,quantity,staff_subject,idempotency_key)
 VALUES(p_member_id,p_grant_id,p_quantity,p_staff_subject,p_idempotency_key) RETURNING id INTO result_id;
 INSERT INTO orange_app.audit_events(actor_subject,action,target_type,target_id) VALUES(p_staff_subject,'credit.redeemed','redemption',result_id);
 RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION orange_app.redeem_credit_v2(uuid,uuid,integer,text,text) FROM PUBLIC;
-- Legacy routine remains for backwards compatibility but is not approved for API use.
REVOKE ALL ON FUNCTION orange_app.redeem_credit(uuid,uuid,integer,text) FROM PUBLIC;
