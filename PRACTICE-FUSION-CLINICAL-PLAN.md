# Practice Fusion clinical integration and cash-pay privacy architecture
**Status:** researched design; no Practice Fusion access, app approval, data export, integration or BAA established. Never place real patient records in GitHub.

## Preferred cost-conscious architecture
1. **Clinical source of truth:** Existing Practice Fusion EHR, subject to written confirmation that Orange Aesthetics may lawfully and contractually use the existing organization/account, with proper distinct provider, legal entity, location, role permissions and records access. If not, request an independent Practice Fusion practice/tenant quote. Do not silently share Pacific Urgent Care records or logins.
2. **Cash-pay business platform:** Protected Orange Aesthetics portal for member accounts, discounts, benefit grant history, Stripe payment state, stock, expenses, scheduling logistics, staff time and owner reports. Do not duplicate clinical histories, allergies, clinical eligibility details, encounter notes or consents in this database.
3. **Clinical bridge:** Start with manual EHR workflows: create chart and clinical note in Practice Fusion; staff business system records only minimal encounter reference and clinician clearance state when authorized. No real-time integration until vendor approves API and privacy/data-flow review.
4. **FHIR integration possibility:** Practice Fusion advertises SMART on FHIR R4, provider/system apps, read resources including Patient, Encounter, Procedure, DocumentReference, and bulk patient/group export. API partner registration and practice authorization are required. Do **not** assume write access, free API usage, realtime webhooks, document upload, consent signing, or that FHIR export is a complete recoverable EHR backup.
5. **EHI export:** Practice Fusion documents a manual EHI export for single patients or a practice population, in TSV format. Assess availability, completeness, format, time, ownership, permissions and vendor-supported recovery/import. Schedule separate encrypted clinical exports only with proper permission, documented authorization and HIPAA/CMIA-reviewed storage. An EHI export is not a database restore.

## Verified vendor facts (checked November 2026)
- Practice Fusion lists starting price $199/month/provider with annual commitment, includes 3 signing staff licenses and unlimited non-signing staff licenses. This is public *new-license* pricing, not a quote for your existing account or extra Orange Aesthetics legal entity. https://www.practicefusion.com/pricing/
- Practice Fusion FHIR API and registration: https://practicefusion.com/fhir/get-started/ and https://practicefusion.com/fhir/api-specifications/
- Practice Fusion EHI export documentation: https://www.practicefusion.com/ehi-export-documentation/v11/index/
- HIPAA coverage test: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html . Cash-only does not alone settle covered entity/business associate status; review shared Pacific operations, covered transactions and legal entity.
- Cloud hosting with ePHI requires appropriate BAA where HIPAA applies, plus security controls: https://www.hhs.gov/hipaa/for-professionals/faq/business-associates/index.html

## Practice Fusion vendor questions — obtain written answers
- Can the existing Pacific Urgent Care account support a legally separate Orange Aesthetics cash-pay entity and its own charting, access permissions, location, clinician and billing identity? If not, what is the least expensive separate configuration?
- What is the marginal monthly cost per clinician and staff user; can existing non-signing staff accounts be reused without violating licenses or privacy separation?
- Are cash-pay encounters, electronic consent documents, attachments, custom note templates and clinical workflows supported without billing enrollment?
- Is there a supported way to link an external membership app to a Practice Fusion encounter? Is API access/partner approval free or charged? Which exact FHIR operations are read/write and which are restricted?
- Can a permitted admin obtain routine single-patient and practice-wide EHI exports? Does it include uploaded consents, chart attachments, audit trails, images, messages and eRx? What is the supported export schedule, cost, encryption and restore/import procedure?
- Who owns the data, how does offboarding work, and what retention/export rights apply if accounts are separate?
- What agreements and notices apply to two legally separate practices sharing a location and staff?

## Clinical data backup and segregation
Business backups: daily encrypted database, weekly independent copy, monthly owner export. Clinical EHR: vendor retention and availability controls plus authorized encrypted EHI export on a separately approved schedule. **Never** bundle clinical charts in the ordinary business ZIP or email them. Encrypt clinical exports, limit to authorized clinical custodians, log access, set retention/legal holds and test readability; never promise they can restore directly into Practice Fusion.

## Compliance and go-live checklist
- California CMIA; HIPAA covered-entity and BA status; shared-service arrangements and record ownership; professional entity and NP scope; record retention, patient access, breach response and vendor BAAs where required.
- Risk assessment, unique accounts, MFA, least privilege, access logging, encryption, vulnerability management, device policies, training, incident response, recovery tests, documented vendor contracts.
- Never use test patient data that identifies real people. Do not transmit PHI through Cloudflare Pages contact forms, Stripe metadata, GitHub, email or unapproved analytics.
- Clinical records remain Practice Fusion-controlled unless vendor approval, signed agreements, architecture and security review authorize a different path.

## Decisions
**Default:** reuse Practice Fusion if legally/contractually feasible and cheaper; otherwise compare a separate Practice Fusion tenant against another appropriately secured EHR. No new EHR subscription or API integration without owner approval and price comparison.
