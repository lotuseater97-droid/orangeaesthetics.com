-- REVIEW ONLY. Dedicated Orange database only. Never run against Silver Iris.
-- Service prices are trusted server-side inputs. The snapshot preserves historical amounts.
CREATE TABLE IF NOT EXISTS public.oa_service_prices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.oa_organizations(id),
 code text NOT NULL CHECK(code ~ '^[A-Za-z0-9_-]{1,64}$'),
 description text NOT NULL,
 unit_price_cents bigint NOT NULL CHECK(unit_price_cents>=0),
 active boolean NOT NULL DEFAULT true,
 UNIQUE(organization_id,code)
);
CREATE TABLE IF NOT EXISTS public.oa_invoice_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.oa_organizations(id),
 invoice_id uuid NOT NULL,
 line_number integer NOT NULL CHECK(line_number>0),
 service_code text NOT NULL,
 description text NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0),
 unit_price_cents bigint NOT NULL CHECK(unit_price_cents>=0),
 total_cents bigint NOT NULL CHECK(total_cents>=0),
 UNIQUE(organization_id,invoice_id,line_number),
 FOREIGN KEY(organization_id,invoice_id) REFERENCES public.oa_invoices(organization_id,id)
);
ALTER TABLE public.oa_service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oa_invoice_lines ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oa_service_prices,public.oa_invoice_lines FROM anon,authenticated;
-- No browser policies. Review server credentials, money limits, and audit protections before applying.
