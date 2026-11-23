-- Neon development only. Rollback-safe synthetic negative payment tests.
-- Checks event reuse across orders, wrong amount, unknown session and side effects.
DO $test$
DECLARE m uuid;i uuid;o1 uuid;o2 uuid;denied boolean;
BEGIN
 BEGIN
 INSERT INTO orange_app.members(display_name,auth_subject,status) VALUES('Synthetic cross order','cross_order_'||txid_current()::text,'active') RETURNING id INTO m;
 INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents,active,checkout_approved,requires_clinical_review) VALUES('synthetic_cross_item','Synthetic addon','addon',1250,true,true,false) RETURNING id INTO i;
 SELECT id INTO o1 FROM orange_app.reserve_checkout_order(m,'synthetic_cross_item',1,1250);
 SELECT id INTO o2 FROM orange_app.reserve_checkout_order(m,'synthetic_cross_item',1,1250);
 PERFORM orange_app.attach_checkout_session(o1,m,'cs_test_crossorder1');
 PERFORM orange_app.attach_checkout_session(o2,m,'cs_test_crossorder2');
 PERFORM orange_app.confirm_paid_checkout('evt_crossorder1','cs_test_crossorder1',1250,'USD');
 denied:=false;
 BEGIN PERFORM orange_app.confirm_paid_checkout('evt_crossorder1','cs_test_crossorder2',1250,'USD'); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Reused event ID accepted for another order'; END IF;
 denied:=false;
 BEGIN PERFORM orange_app.confirm_paid_checkout('evt_crossorder2','cs_test_crossorder2',1200,'USD'); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Wrong amount accepted'; END IF;
 denied:=false;
 BEGIN PERFORM orange_app.confirm_paid_checkout('evt_crossorder3','cs_test_unknownsession',1250,'USD'); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Unknown checkout accepted'; END IF;
 IF (SELECT count(*) FROM orange_app.payment_events WHERE order_id IN(o1,o2))<>1 OR (SELECT count(*) FROM orange_app.benefit_grants WHERE member_id=m)<>1 THEN RAISE EXCEPTION 'Unexpected side effects'; END IF;
 RAISE EXCEPTION 'SYNTHETIC_TEST_ROLLBACK';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'SYNTHETIC_TEST_ROLLBACK' THEN RAISE; END IF;
 END;
END $test$;
