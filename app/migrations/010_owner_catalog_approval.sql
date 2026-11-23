-- Development only. p_actor_subject MUST be derived from validated server auth.
-- Never grant this function to browser-accessible roles; dedicated owner service only.
CREATE OR REPLACE FUNCTION orange_app.set_catalog_checkout_approval(p_actor_subject text,p_item uuid,p_approved boolean,p_requires_clinical_review boolean,p_request_id text)
RETURNS boolean LANGUAGE plpgsql SET search_path=pg_catalog,orange_app AS $$
DECLARE v_item orange_app.catalog_items%ROWTYPE;
BEGIN
 IF p_actor_subject IS NULL OR length(p_actor_subject)<3 OR p_item IS NULL OR p_approved IS NULL OR p_requires_clinical_review IS NULL OR p_request_id IS NULL OR length(p_request_id)<8 OR length(p_request_id)>128 THEN
  RAISE EXCEPTION 'Invalid approval request';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM orange_app.staff_roles WHERE auth_subject=p_actor_subject AND active=true AND role='owner') THEN
  RAISE EXCEPTION 'Owner authorization required';
 END IF;
 SELECT * INTO v_item FROM orange_app.catalog_items WHERE id=p_item FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown catalog item'; END IF;
 IF p_approved AND (v_item.kind<>'addon' OR NOT v_item.active OR p_requires_clinical_review) THEN
  RAISE EXCEPTION 'Ineligible catalog item';
 END IF;
 UPDATE orange_app.catalog_items SET checkout_approved=p_approved,requires_clinical_review=p_requires_clinical_review WHERE id=p_item;
 INSERT INTO orange_app.audit_events(actor_subject,action,target_type,target_id,request_id)
 VALUES(p_actor_subject,CASE WHEN p_approved THEN 'catalog_checkout_approved' ELSE 'catalog_checkout_revoked' END,'catalog_item',p_item,p_request_id);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION orange_app.set_catalog_checkout_approval(text,uuid,boolean,boolean,text) FROM PUBLIC;
