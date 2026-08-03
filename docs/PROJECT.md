# DigiScale Product Studio — Project Reference

> **One document. Everything you need.**
> Stack · Architecture · Database · Pages · API · Roadmap

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| **Backend** | FastAPI (Python 3.14+), Uvicorn |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Custom JWT (HMAC-SHA256, 7-day tokens) stored as HTTP cookie |
| **AI** | `rembg` — `birefnet-general` model for background removal |
| **Image** | `Pillow`, `pillow-heif` (HEIC/HEIF support for iOS) |
| **State** | Supabase Client SDK (direct from frontend) + `localStorage` cache |

---

## 2. Architecture

```
Browser (Next.js :3000)
  │
  ├──► Supabase Postgres      (collections, products, quotations, clients, users, user_settings)
  │
  └──► FastAPI Backend (:8000)
         │
         ├──► rembg AI          (background removal)
         └──► uploads/          (local file storage — originals + processed)
```

### Frontend Structure
```
frontend/
├── app/
│   ├── (auth)/         login · signup · forgot-password · reset-password
│   └── (dashboard)/
│       ├── dashboard/        Home — navigation hub
│       ├── workspace/        Image upload + BG removal + publish
│       ├── projects/         Collections + Products management
│       ├── quotation/        PDF Quotation generator
│       ├── warehouse/        Warehouse & stock view
│       ├── clients/          Client management
│       └── settings/         Account + company + bank settings
├── components/
│   ├── layout/         DashboardNavbar · QuotationView · MainLayout
│   ├── ui/             Shadcn components
│   ├── auth/           Login/Signup forms
│   ├── common/         Shared reusable components
│   ├── preview/        Image preview components
│   ├── sections/       Page sections
│   ├── buttons/        Button components
│   └── upload/         Upload zone components
├── lib/            backup.ts · db.ts · supabase.ts · cache.ts · plans.ts · utils.ts
├── services/       api.ts   (FastAPI calls + user settings)
├── hooks/          useImageUpload.ts
├── constants/      api.ts · config.ts · routes.ts · colors.ts · upload.ts
├── types/          image.ts
└── middleware.ts   (JWT auth guard for all dashboard routes)
```

### Backend Structure
```
backend/
├── app/
│   ├── api/        auth · deps · upload · users · settings
│   ├── models/     user · user_settings · client
│   ├── schemas/    auth · user · settings
│   ├── services/   auth_service · email_service
│   ├── config.py · database.py · main.py
└── uploads/        originals/ · processed/
```

---

## 3. Database Schema

### Supabase Tables

#### `users` (FastAPI / PostgreSQL)
| Column | Type | Notes |
|---|---|---|
| `id` | `integer` | PK, auto-increment |
| `name` | `varchar` | Required |
| `email` | `varchar` | Unique, required |
| `password_hash` | `varchar` | SHA-256 + salt |
| `plan` | `varchar` | `"Free"` / `"Pro"` |
| `credits_limit` | `integer` | Default `999999999` |
| `credits_used` | `integer` | Default `0` |
| `created_at` | `timestamp` | Auto |
| `deletion_scheduled_at` | `timestamp` | Nullable — 7-day grace delete |

#### `user_settings` (FastAPI / PostgreSQL)
| Column | Type | Notes |
|---|---|---|
| `id` | `integer` | PK |
| `user_id` | `integer` | FK → `users.id` |
| `phone` | `varchar` | Nullable |
| `gender` | `varchar` | Nullable |
| `avatar_url` | `text` | Nullable |
| `auto_remove_background` | `boolean` | Default `false` |
| `company_logo` | `text` | Nullable |
| `company_name` | `varchar` | Nullable |
| `company_email` | `varchar` | Nullable |
| `company_primary_phone` | `varchar` | Nullable |
| `company_secondary_phone` | `varchar` | Nullable |
| `company_address` | `text` | Nullable |
| `company_website` | `varchar` | Nullable |
| `company_gst` | `varchar` | Nullable |
| `company_bank_name` | `varchar` | Nullable |
| `company_account_number` | `varchar` | Nullable |
| `company_ifsc` | `varchar` | Nullable |
| `company_upi_id` | `varchar` | Nullable |
| `company_qr_code` | `text` | Nullable (base64 QR image) |
| `company_terms` | `text` | Nullable |
| `regular_client_threshold` | `integer` | Default `0` |
| `vip_client_threshold` | `integer` | Default `25` |

#### `clients` (FastAPI / PostgreSQL)
| Column | Type | Notes |
|---|---|---|
| `id` | `integer` | PK |
| `name` | `varchar` | Required |
| `company` | `varchar` | Nullable |
| `address` | `varchar` | Nullable |
| `contact` | `varchar` | Nullable |
| `user_id` | `varchar` | Owner's user ID |
| `created_at` | `timestamp` | Auto |

#### `collections` (Supabase / PostgreSQL)
| Column | Type | Notes |
|---|---|---|
| `id` | `text` | PK (UUID) |
| `name` | `text` | Required |
| `user_id` | `text` | Owner UUID |
| `created_at` | `timestamptz` | Default `now()` |

#### `products` (Supabase / PostgreSQL)
| Column | Type | Notes |
|---|---|---|
| `id` | `text` | PK (UUID) |
| `name` | `text` | Required |
| `stock` | `integer` | Default `0` |
| `cartonQty` | `integer` | Default `0` |
| `rate` | `text` | Price per unit |
| `unit_type` | `varchar(10)` | `"pcs"` / `"dzn"` |
| `length` | `text` | Physical dimension |
| `color` | `text` | Comma-separated colors |
| `description` | `text` | Nullable |
| `photoUrl` | `text` | Required — processed image URL |
| `warehouse` | `text` | Nullable |
| `collection_id` | `text` | FK → `collections.id` ON DELETE CASCADE |
| `user_id` | `text` | Owner UUID |
| `created_at` | `timestamptz` | Default `now()` |

#### `quotations` (Supabase / PostgreSQL)
| Column | Type | Notes |
|---|---|---|
| `id` | `text` | PK (UUID) |
| `quote_number` | `text` | e.g. `"Q-12"` |
| `user_id` | `text` | Owner UUID |
| `client_name` | `text` | Nullable |
| `client_company` | `text` | Nullable |
| `client_address` | `text` | Nullable |
| `quote_date` | `text` | ISO date string |
| `tax_input` | `numeric` | GST % |
| `cash_amount` | `numeric` | Cash payment |
| `bank_amount` | `numeric` | Bank payment |
| `total_amount` | `numeric` | Total bill |
| `apply_event_markup` | `boolean` | Markup toggle |
| `event_markup_percent` | `numeric` | Markup % |
| `is_order_done` | `boolean` | Order status |
| `items` | `jsonb` | Array of line items |
| `created_at` | `timestamptz` | Default `now()` |

### Entity Relationships
```
users ──► user_settings   (1:1)
users ──► clients          (1:many)
collections ──► products   (1:many, Supabase)
users ──► quotations       (1:many, Supabase)
```

---

## 4. Pages & Routes

| Route | Page | Auth | Description |
|---|---|---|---|
| `/` | Root | ❌ | Redirects to `/login` |
| `/login` | Login | ❌ | Email + password login |
| `/signup` | Signup | ❌ | Account creation |
| `/forgot-password` | Forgot Password | ❌ | Email reset flow |
| `/reset-password` | Reset Password | ❌ | Token-based reset |
| `/dashboard` | Dashboard | ✅ | Navigation hub — links to all sections |
| `/workspace` | Workspace | ✅ | Image upload, AI BG removal, publish to collection |
| `/projects` | Collections | ✅ | List/manage collections and their products |
| `/projects/[id]` | Collection Detail | ✅ | Products inside a specific collection |
| `/quotation` | Quotation | ✅ | Generate PDF quotations from products |
| `/warehouse` | Warehouse | ✅ | Stock + warehouse view across all products |
| `/clients` | Clients | ✅ | Manage client contacts |
| `/clients/[id]` | Client Detail | ✅ | Individual client quotation history |
| `/settings` | Settings | ✅ | Profile · Company · Bank · Plan · Delete account |

---

## 5. Backend API Endpoints

### Auth (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register new user, returns JWT |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/forgot-password` | Placeholder (safe response) |
| `POST` | `/auth/reset-password` | Placeholder |

### Users (`/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | ✅ | Get current user profile |
| `PUT` | `/users/me` | ✅ | Update name/email |
| `PUT` | `/users/me/password` | ✅ | Change password |
| `POST` | `/users/me/upgrade` | ✅ | Upgrade to Pro plan |
| `DELETE` | `/users/me` | ✅ | Schedule account deletion (7-day grace) |

### Upload (`/upload`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/upload` | Optional | Upload image + optional BG removal |

### Settings (`/settings`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/settings/` | ✅ | Get user settings |
| `PUT` | `/settings/` | ✅ | Update all user settings |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | Server health check |

---

## 6. Roadmap

### ✅ Phase 1 — Core Foundation (Done)
- [x] Next.js App Router scaffolding with Tailwind + Shadcn
- [x] Workspace UI — drag & drop, side-by-side preview
- [x] FastAPI backend with `rembg` background removal (`birefnet-general`)
- [x] HEIC/HEIF support (`pillow-heif`) for iOS uploads
- [x] Health check endpoint

### ✅ Phase 2 — Database & Auth (Done)
- [x] Supabase PostgreSQL integration
- [x] Custom JWT auth (signup / login / 7-day deletion grace)
- [x] `collections` and `products` tables in Supabase
- [x] User settings (profile, company, bank, QR code)
- [x] Auth middleware (protected routes)

### ✅ Phase 3 — Core Features (Done)
- [x] Collections page — list, search, create, delete collections
- [x] Products page — inline edit, drag & drop image upload, unit type
- [x] Quotation module — PDF generation, GST, markup, multi-payment
- [x] Warehouse page — full stock view across all products
- [x] Clients page — create, edit, delete clients
- [x] Auto background removal toggle (per-user setting)
- [x] Background cleanup — removed all one-time fix scripts, test files, unused pages

### 🔄 Phase 4 — Polish & Production (In Progress)
- [ ] Quotation — shareable link / email delivery
- [ ] Products — bulk import via CSV
- [ ] Warehouse — low stock alerts
- [ ] API rate limiting and request size validation
- [ ] Image compression pipeline for faster loading
- [ ] Vercel production deployment + custom domain
- [ ] PWA support (offline-capable workspace)

### 🗓️ Phase 5 — Advanced Features (Backlog)
- [ ] Multi-user / team access (role-based)
- [ ] Analytics dashboard (sales trends, top products)
- [ ] WhatsApp / PDF share for quotations
- [ ] Mobile app (React Native or Expo)
