-- REVIEW-ONLY scheduling migration. NOT applied or deployed.
-- Nonclinical resource reservations; never store PHI, symptoms, notes or payment data.
-- PostgreSQL exclusion constraints protect against concurrent double-booking.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE UNIQUE INDEX IF NOT EXISTS oa_appointments_organization_id_id_unique
 ON public.oa_appointments(organization_id,id);
CREATE TABLE IF NOT EXISTS public.oa_resource_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.oa_organizations(id),
 appointment_id uuid NOT NULL,
 -- A single appointment cannot reserve multiple disjoint provider/room pairs.
 CONSTRAINT oa_one_reservation_per_appointment UNIQUE (organization_id,appointment_id),
 provider_id uuid NOT NULL,
 room_id uuid NOT NULL,
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 status text NOT NULL CHECK (status IN ('under_review','confirmed','cancelled','declined','no_show','completed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (ends_at > starts_at),
 -- Match the maximum eight-hour duration enforced by the scheduling planner.
 CONSTRAINT oa_reservation_max_duration CHECK (ends_at <= starts_at + interval '8 hours'),
 FOREIGN KEY (organization_id, appointment_id) REFERENCES public.oa_appointments(organization_id,id)
);
-- The composite appointment foreign key requires a matching unique key on appointments.
-- This index is safe to create before the reservation table in a reviewed migration.
-- IMPORTANT: apply this statement BEFORE CREATE TABLE on a fresh installation.
-- Reject concurrent overlapping reservations for either provider or room.
-- Exclusion checks are enforced atomically by PostgreSQL, not by a stale UI lookup.
ALTER TABLE public.oa_resource_reservations
 ADD CONSTRAINT oa_provider_no_overlap EXCLUDE USING gist (
 organization_id WITH =, provider_id WITH =,
 tstzrange(starts_at,ends_at,'[)') WITH &&
 ) WHERE (status IN ('under_review','confirmed'));
ALTER TABLE public.oa_resource_reservations
 ADD CONSTRAINT oa_room_no_overlap EXCLUDE USING gist (
 organization_id WITH =, room_id WITH =,
 tstzrange(starts_at,ends_at,'[)') WITH &&
 ) WHERE (status IN ('under_review','confirmed'));
CREATE INDEX IF NOT EXISTS oa_reservations_by_appointment
 ON public.oa_resource_reservations(organization_id,appointment_id);
ALTER TABLE public.oa_resource_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oa_resource_reservations FROM PUBLIC, anon, authenticated;
-- No direct client access. A reviewed authenticated server-side transaction
-- must validate tenant membership, staff role, service and operating hours,
-- and perform insert/update in one transaction; map SQLSTATE 23P01 to 409.
