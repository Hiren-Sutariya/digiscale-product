# DigiScale Product Studio Roadmap

This roadmap tracks the development progress of the DigiScale Product Studio platform.

---

## Phase 1: Core Foundation & UI (Completed)

### Sprint 1 - Dashboard UI
- [x] Responsive layout with top Navbar and navigation
- [x] Upload Card / Drag & Drop dropzone in Workspace
- [x] Original vs Processed side-by-side preview panel
- [x] Sidebar controls for Publish Settings & Background settings

### Sprint 2 - Image Upload & Processing Integration
- [x] Drag & Drop file upload handling on Frontend
- [x] Real-time image validation (file formats, sizes)
- [x] Integration with local file storage (`uploads/`)

### Sprint 3 - Backend Core Services
- [x] FastAPI server scaffolding
- [x] AI-powered background removal integration (`rembg` with `birefnet-general`)
- [x] HEIF/HEIC support for Apple devices (`pillow-heif`)
- [x] Health check and status endpoints

---

## Phase 2: Database Migration & Cloud Transition (Completed)

### Sprint 4 - Supabase Integration
- [x] Connect frontend directly to Supabase client
- [x] Migrate data from SQLite `digiscale.db` to Supabase Postgres
- [x] Reconstruct `collections` and `products` tables in Supabase
- [x] Remove local SQLite dependency from Backend API endpoints

---

## Phase 3: UI Redesign & Advanced Features (In Progress / Backlog)

### Sprint 5 - Collections Page Redesign
- [ ] Implement grid layout adjustments for Collection Cards
- [ ] Optimize size of product image thumbnails
- [ ] Add sorting, filtering, and mass-deletion controls

### Sprint 6 - Quotation Module
- [ ] Dynamic Quotation PDF generation from collection products
- [ ] Support custom fields (Tax/GST percentage, discount rate, markup rate)
- [ ] Downloadable and shareable quotation links

### Sprint 7 - Security & Optimization
- [ ] API Rate limiting and request size verification
- [ ] Setup image compression to optimize loading speeds
- [ ] Vercel hosting setup validation