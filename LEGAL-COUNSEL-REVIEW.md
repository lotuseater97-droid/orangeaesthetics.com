# Orange Aesthetics — California attorney review register
**Status:** OPEN — not a legal opinion or launch authorization. Owner wants 90-day IV benefit expiry and permanent recovery history. Resolve before accepting recurring payments or enforcing expiry.

## Decisions to approve in writing (priority order)
| ID | Legal question / source to verify | Proposed operational default | Evidence attorney should return |
|---|---|---|---|
| L01 | California Civil Code §§1749.45, 1749.5 (2026 version): Does a paid recurring membership's included IV constitute a gift certificate, prepaid service, or time-limited service entitlement? | Separate monthly service entitlement, no face value or transfer; 90-day expiry only after affirmative approval | Written classification and exact enforceable terms; if uncertain, disable expiry |
| L02 | CA BPC §§17600–17606 and FTC ROSCA: recurring subscription disclosures, separate consent, retention, reminders, online cancellation, fee changes | Versioned checkout consent, receipt, self-service cancellation, renewal reminders and evidence retention | Approved UX, cancellation flow, notice schedule and retention |
| L03 | BPC §2400, NP practice §§2837.103–104, nursing professional corporation and medical spa ownership; corporate practice of medicine | Orange Aesthetics separate from Pacific; no assumption that ordinary LLC can provide medical care | Entity documents, ownership, license and clinical authority analysis |
| L04 | BPC §650, advertising and fee-splitting, medical discounts and cosmetic procedure promotions | 15/20/25% only on eligible Orange Aesthetics services and retail; no Pacific or external partner discount | Approved discount categories, exclusions, price representation and referral agreements |
| L05 | HIPAA/CMIA, vendor BAAs, payment data, privacy notices and breach response | Clinical data in approved medical system; no PHI in Stripe/public website | Data map, vendor BAAs, security controls, privacy and retention policy |
| L06 | Clinical ineligibility, no-shows, clinic unavailability, cancellation, pause, termination, refunds and chargebacks | No automatic forfeiture where service could not be safely/actually delivered; documented refund/restoration process | Signed exception matrix and approved contract language |
| L07 | Gift cards, prepaid packages, retail returns, taxes, discount stacking, brand resale limitations | Keep purchased stored value outside membership IV expiry engine | Approved separate ledger and retail policy |
| L08 | Credit reporting and remediation if prior expiry is unlawful | Preserve original issue/expiry/payment/redemption events, create audited restoration or refund | Remediation authority, record retention, audit and notification procedure |
| L09 | Membership terms for Elite 2 IV/month and 90-day rollover, membership ending, max accrual | Per-grant quantity 1/1/2; oldest-expiring first; no blanket three-credit cap | Plan-specific entitlement and post-cancellation rules |
| L10 | Federal/state medical advertising, treatment suitability, scope and consent | No guaranteed treatments, no clinically unapproved IV combinations | Clinician-approved service catalog, informed consent and emergency protocols |

## Sources for counsel to check against current law
- CA Civil Code §1749.5: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1749.5.
- CA BPC §17602: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=17602.
- CA BPC §650: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=650.
- CA BPC §2400: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=2400.
- CA BRN AB 890: https://www.rn.ca.gov/practice/ab890.shtml
- Medical Board medical spa guidance: https://www.mbc.ca.gov/Download/Documents/medical-spas-business.pdf
- CA AG automatic renewal: https://oag.ca.gov/consumers/general/subscriptions
These links are review starting points, not a representation that every legal issue has been verified against current text.

## Required counsel signoff fields
For each L-ID record: reviewer name, bar/license details, review date, law version checked, conclusion, exact approved contract language, operational conditions, unresolved risks, effective date, and signed copy location. Store signed advice privately, not in public GitHub.

## Launch-blocking principle
Build the software toward the preferred 90-day outcome, but keep an explicit server-side `expiration_policy_approved=false` until counsel signs off. Never describe a proposed 90-day term as a legally guaranteed forfeiture. No backdating approval.
