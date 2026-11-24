import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const sql=readFileSync(new URL("../booking-reservations.staging.sql",import.meta.url),"utf8");

test("staged reservation schema enforces one reservation per appointment",()=>{
 assert.match(sql,/CONSTRAINT\s+oa_one_reservation_per_appointment\s+UNIQUE\s*\(\s*organization_id\s*,\s*appointment_id\s*\)/i);
});

test("staged reservations prevent active provider and room overlaps",()=>{
 assert.match(sql,/CONSTRAINT\s+oa_provider_no_overlap\s+EXCLUDE\s+USING\s+gist/i);
 assert.match(sql,/CONSTRAINT\s+oa_room_no_overlap\s+EXCLUDE\s+USING\s+gist/i);
 assert.match(sql,/WHERE\s*\(status\s+IN\s*\('under_review','confirmed'\)\)/i);
});

test("staged reservations enforce the planner's eight-hour duration ceiling",()=>{
 assert.match(sql,/CONSTRAINT\s+oa_reservation_max_duration\s+CHECK\s*\(\s*ends_at\s*<=\s*starts_at\s*\+\s*interval\s*'8 hours'\s*\)/i);
});


test("staged reservations prepare the appointment composite foreign key target first",()=>{
 const index=sql.indexOf("CREATE UNIQUE INDEX IF NOT EXISTS oa_appointments_organization_id_id_unique");
 const table=sql.indexOf("CREATE TABLE IF NOT EXISTS public.oa_resource_reservations");
 assert.ok(index>=0&&index<table,"Composite appointment index must precede reservation table");
 assert.match(sql,/ON\s+public\.oa_appointments\s*\(\s*organization_id\s*,\s*id\s*\)/i);
});
