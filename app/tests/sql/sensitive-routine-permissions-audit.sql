-- Read-only development audit. Fails if sensitive routines become PUBLIC
-- executable, SECURITY DEFINER, or unavailable to the database owner.
-- Does not create users, roles, permissions, or application data.
DO $audit$
DECLARE routine record; n integer:=0;
BEGIN
 FOR routine IN
  SELECT p.proname,p.prosecdef,
    coalesce((SELECT bool_or(x.grantee=0 AND x.privilege_type='EXECUTE')
      FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x),false) AS public_execute,
    has_function_privilege('neondb_owner',p.oid,'EXECUTE') AS owner_execute
  FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='orange_app' AND p.proname IN
   ('attach_checkout_session','confirm_paid_checkout','redeem_credit_v2','reserve_checkout_order','set_catalog_checkout_approval')
 LOOP
  n:=n+1;
  IF routine.prosecdef OR routine.public_execute OR NOT routine.owner_execute
  THEN RAISE EXCEPTION 'Unsafe permissions on %',routine.proname; END IF;
 END LOOP;
 IF n<>5 THEN RAISE EXCEPTION 'Expected 5 sensitive routines, found %',n; END IF;
END $audit$;
