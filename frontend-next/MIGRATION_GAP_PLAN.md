# Old Frontend → Next.js: Deep Gap Analysis & Plan

Audit of the old Vite app (`Frontend/`) vs the new Next app (`frontend-next/`).
The old dashboard is **~25,760 lines** across 26 pages (Vehicle form alone is
**6,862**). Below is exactly what exists, what's missing, and the build plan.

Legend: ✅ done · 🟡 partial (list/real-data only) · ❌ missing · effort **S/M/L/XL**

---

## 1) Public site
| Old page/feature | New status | Notes |
|---|---|---|
| Home (`HomePage.js`) | ✅ | hero, features, about, why-choose, clients slider, contact-info, blog slider |
| Services | ✅ | hero+badge, clients, focus cards, lead form (→ `/public/inquiry`) |
| About | ✅ | hero, why-choose, 1.2M stats, clients, blog |
| Contact | ✅ | real phone/email/address, map, inquiry form |
| Blog list (`Blog.js`) | 🟡 **S** | grid built; needs old card styling parity |
| **Blog detail** (`BlogDetail.js`) | ❌ **S** | `/blog/[id]` page → `GET /public/blog/:id` |
| Testimonials/Reviews (`Review.js`, `Testimonialslider.js`) | ❌ **S** | reviews slider on Home |
| FAQ (`faq.js`, `Guidequestions.js`) | ❌ **S** | FAQ accordion section |
| Breadcrumb | ❌ **XS** | on inner public pages |
| Promo popup (`CTAPopup`) | ✅ | `PromoPopup` |

## 2) Auth
| Old | New | Notes |
|---|---|---|
| Login (OTP, MSG91) | ✅ | split screen, OTP boxes, phone-flag |

## 3) Dashboard pages
| Old page (lines) | New status | What's missing | Effort |
|---|---|---|---|
| `Dashboard.js` (357) | ✅ | live counts/pipeline/amounts done | — |
| `Consumer.js` (1278) | 🟡 | **family modal**, **KYC documents**, edit categories, builder-type | **L** |
| `VehicleInsurance.js` (6862) | 🟡 | **full multi-step add/edit** (vehicle+nominee+running/previous policy+docs), **KYC reuse**, vehicle dropdowns | **XL** |
| `VehiclePolicies.js` (786) | ❌ | policies list/detail per consumer | **M** |
| `VehicleRenewalSheet.js` (2809) | ❌ | renewal sheet + renew flow + `VehicleRenewalDetailsPopup` | **XL** |
| `EditVehiclePopup.js` | ❌ | vehicle edit popup | **L** |
| `Loan.js` (462) | 🟡 | loan list + create consumer-loan | **M** |
| `Loaninterested.js` (2367) | ❌ | interested pipeline + `View-Loan-Details` + status actions | **XL** |
| `Loanni.js` (302) | ❌ | not-interested pipeline | **M** |
| `Loancancelled.js` (450) | ❌ | cancelled pipeline | **M** |
| `Loandisbuss.js` (689) | ❌ | disbursed/completed + `Loandisburse-popup` | **L** |
| `LoanConfiguration.js` (552) | ❌ | loan PDF templates config | **M** |
| `Mediclaim.js` (1231) | 🟡 | create policy (members/employees), `MediclaimModal` | **L** |
| `MediclaimAllPolicies.js` (2340) | ❌ | all policies + renewal view | **XL** |
| `MediclaimCompany.js` (167) | ❌ | companies CRUD + `MediclaimCompanyModal` | **M** |
| `MedicliamProduct.js` (312) | ❌ | products CRUD + `MediclaimProductModal` + PDF | **M** |
| `RenewalSheet.js` (1376) | ❌ | mediclaim renewal sheet | **L** |
| `LifeInsurance.js` (487) | 🟡 | create/edit `LifeInsuranceModal`, documents | **L** |
| `LifeInsuranceRenewalSheet.js` (507) | ❌ | life renewal sheet | **M** |
| `User.js` (286) | 🟡 | add/edit role-user + assign verticals | **M** |
| `Builder.js` (238) | 🟡 | builder add/edit | **M** |
| `Building.js` (656) | ❌ | buildings + building-manager assignment | **L** |
| `Unit.js` (438) | ❌ | units + unit categories | **L** |
| `Inquiries.js` (94) | ❌ | inquiries list (`GET /user/data/inquiery`) | **S** |
| `Blog.js` dashboard (414) | ❌ | admin blog CRUD (create/edit/delete + image upload) | **M** |
| `Settings.js` (170) | 🟡 | verticals ✅; **data wipe** missing | **S** |
| `Support.js` (132) | ❌ | support page | **S** |

## 4) Shared components
| Old | New | Notes |
|---|---|---|
| Button/Input/Select/Card/StatCard/Modal/Table/Stepper/Pagination/DatePicker/Search/Loader | ✅ | + Dropdown, PhoneInput, OtpInput, Tooltip, Calendar(range), Tabs, Switch, Checkbox, Textarea, Avatar, FileUpload |
| `NotificationCenter.js` | ❌ **M** | header notifications (real data) |
| `Breadcrumb.js` | ❌ **XS** | |
| Domain modals (EditVehiclePopup, LifeInsuranceModal, Mediclaim*Modal, Loan popups) | ❌ | built per module below |

## 5) Cross-cutting (missing)
- ❌ **Client-side role/vertical guards** — hide disabled verticals + role-gate routes (we have `ids.js`).
- ❌ **NotificationCenter** with real data.
- ❌ **Export** (PDF/Excel) where old pages had it (renewal sheets, lists).
- ❌ **Global search** wired to results.
- ❌ Consumer **KYC document** reuse UI (backend ready: `/user/consumer/documents/*`).

---

## Phased Plan (recommended order)

**Phase A — Consumers complete (L)**
Family modal (`/user/household/:mobile`, family add) + KYC documents (upload/reuse) + edit categories. Unlocks the document-reuse pattern reused everywhere.

**Phase B — Vehicle (XL)**
Multi-step add/edit (StepperModal): consumer → vehicle → policy (running/previous) → documents (KYC reuse + RC). Then `VehiclePolicies`, `VehicleRenewalSheet` + renew + details popup.

**Phase C — Mediclaim (XL)**
Company + Product CRUD (modals) → policy create (members/employees) → All Policies → Renewal sheet.

**Phase D — Loan (XL)**
Loan list + create → status pipelines (interested / not-interested / cancelled / disbursed / completed) as tabbed pages → loan-details + disburse popups → configuration.

**Phase E — Life (L)**
Create/edit modal + documents → renewal sheet.

**Phase F — Back-office (L)**
Users & Roles (add/edit + verticals), Builder/Unit/Building, Inquiries, Blog admin CRUD, Support, Settings data-wipe.

**Phase G — Cross-cutting (M)**
NotificationCenter, role/vertical guards, exports (PDF/Excel), global search, breadcrumbs, public BlogDetail/Reviews/FAQ.

### Effort summary
XL: Vehicle, Loan pipelines, Mediclaim all-policies/renewals · L: Consumers, Life, Building/Unit, Loan disburse · M: companies/products, users, builder, blog admin, notifications · S/XS: inquiries, support, breadcrumb, blog detail, FAQ, reviews.

> Reality: this is a multi-session build (the old app is ~26k lines of dashboard
> alone). Each phase ships independently on the shared component library; I'll do
> them in the order above unless you re-prioritise.
