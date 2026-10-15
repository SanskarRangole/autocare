# AutoCare — Smart Vehicle Ownership & Maintenance Companion

**AutoCare** is a modern, intelligent, and simple vehicle ownership companion for car and motorcycle owners. It solves the five everyday challenges of vehicle management: forgetting compliance deadlines (Insurance & PUC), misplacing service bills, losing track of real maintenance costs, forgetting past repairs, and spending too much time manually entering vehicle information.

Engineered with a **minimum user input + useful automation + maximum clarity** philosophy, AutoCare operates with a modern light automotive theme (`#17365D` navy primary, `#2563EB` interactive blue, `#F8FAFC` background, `#FFFFFF` cards, and `#E2E8F0` subtle borders).

---

## 🚀 Key Features & Smart Workflows

### 1. Smart RC OCR Vehicle Onboarding
- **Two Flexible Entry Modes**: Scan / Upload RC (recommended) or Enter Manually.
- **Client-Side OCR Pipeline**: Uses `Tesseract.js` in a dedicated Web Worker with canvas pre-processing (contrast enhancement, sharpening, and dimension scaling).
- **Indian RC Regex Parser**: Custom parsing engine tuned for Indian Vehicle Registration Certificates:
  - Supports standard state series (`DL 01 AB 1234`, `MH 12 CD 5678`, `KA 03 EF 9012`, `HR`, `UP`, `TN`, etc.) and modern Bharat (`BH`) Series (`22 BH 1234 AA`).
  - Converts Indian date formats (`DD/MM/YYYY`, `DD-MM-YYYY`) to ISO format (`YYYY-MM-DD`).
  - Normalizes vehicle classes (e.g. `LMV`, `MCWG`, `MCWOG`) into standard vehicle types (`car`, `motorcycle`, `scooter`, etc.).
  - Extracts Registration Number, Owner Name, Manufacturer, Model, Fuel Type, Registration Date, Insurance Expiry, and PUC Expiry.
- **Verification UI**: Editable verification screen with detected confidence badges, missing fields highlighted, and instant duplicate registration warnings.
- **1-Click Test Generator**: Includes a **"Try with Sample Indian RC"** button that generates an authentic Smart Card RC directly in the browser for instant testing.

### 2. Universal Quick Add
- Prominent Quick Action accessible anywhere across desktop and mobile:
  - **Desktop**: Dedicated **"+ Quick Add"** dropdown button in the top navigation bar.
  - **Mobile**: Elevated center floating action button (`+`) in the bottom navigation bar opening a sleek task-focused bottom sheet.
- Single-click access to **Log Fuel**, **Record Service**, **Add Expense**, **Upload Document**, and **Set Reminder**.
- Automatically preselects the active vehicle and prefills today's date and known vehicle specs.

### 3. Smart Fuel Tracking with 2-of-3 Auto-Calculation
- **Bidirectional 2-of-3 Auto-Calculation**: Entering any two of **Total Cost**, **Litres Filled**, and **Price / Litre** automatically calculates the third field in real-time, eliminating manual math.
- **Active Fuel Badge**: Displays the vehicle's fuel type badge (e.g., Petrol, Diesel, CNG, EV) right on the entry card.
- **Odometer Progression**: Automatically validates and advances vehicle odometer.
- **Zero Double-Counting**: Synchronizes linked fuel entries into the unified expense ledger with unique reference IDs.
- **Calculated Mileage**: Computes genuine tank-to-tank fuel economy (`km/L` or `mpg`) strictly when consecutive full fills exist, without displaying misleading or invented averages.

### 4. Smart Service Recording & Invoice Attachment
- **Garage Memory**: Autocompletes garage and workshop names using dynamic datalists built from the user's past service history.
- **Auto-Suggested Next Service Reminder**: Automatically calculates and schedules the next recommended maintenance reminder (+6 months or +10,000 km) with a single confirmation toggle.
- **Digital Invoice Attachment**: Upload and attach digital service invoices and workshop receipts directly from the service modal.
- **Synchronized Ledger**: Automatically links maintenance costs to the unified expense ledger.

### 5. Automatic Rule-Based Reminders
- **Zero-Effort Reminder Suggestions**: Automatically analyzes vehicle compliance records (Insurance expiry, PUC expiration, warranty, and scheduled service intervals).
- **Proactive Suggestion Cards**: Displays 1-click **"Add to Reminders"** cards for upcoming or unmonitored compliance deadlines.
- **Status Indicators**: Real-time status badges (`Due in 5 days`, `Due in 350 km`, or `Overdue`) with 1-click completion toggle.

### 6. Smart Document Vault
- **Organized Storage**: Store Registration Certificates (RC), Insurance policies, PUC certificates, driving licenses, and repair bills.
- **Instant Search & Category Filtering**: Real-time text search and filter pills by category (`RC`, `Insurance`, `PUC`, `Invoice`, `Other`).
- **1-Click Document Replacement**: Easily replace expired or updated documents directly via a dedicated "Replace Document" modal without creating duplicates.
- **Time-Limited Signed URLs**: Documents are stored privately with secure signed URLs; never exposed publicly.

### 7. Action-Oriented 5-Section Dashboard
Designed to answer the vehicle owner's five most pressing questions in 3 seconds:
1. **Section A — Active Vehicle**: Shows selected vehicle, make, model, registration plate, odometer, and compliance status tags.
2. **Section B — Needs Attention**: Highlights only meaningful urgent or overdue actions (Insurance expiring soon, PUC overdue, service due).
3. **Section C — Quick Actions**: Instant shortcuts for Log Fuel, Record Service, Add Expense, and Upload Document.
4. **Section D — Ownership Snapshot**: Key statistics including Total Spend, Average Mileage (`km/L`), Total Services, and Active Reminders.
5. **Section E — Recent Activity & Timeline**: Chronological digital memory of recent refills, maintenance, and expense records.
### 8. AutoCare Assist — Gemini-Powered Real-World Vehicle Problem Solver
- **Context-Aware Automotive AI**: Integrated assistant with tagline *"Vehicle problems? Let's find the next step."*
- **Enterprise-Grade Security Architecture**:
  - Secure server-side proxy `/api/assist` running via Vite dev/preview middleware and deployable Supabase Edge Function (`supabase/functions/autocare-assist/index.ts`).
  - Secret `GEMINI_API_KEY` stored exclusively in server environment variables; never prefixed with `VITE_` and never bundled or exposed to client React code.
- **Controlled Gemini Tool Registry**:
  - `get_active_vehicle`: Retrieves authorized active vehicle specifications, year, model, fuel type, and current odometer (with masked license plate).
  - `get_vehicle_service_history`: Retrieves real past service logs, costs, and garages without hallucinations.
  - `get_vehicle_expenses`: Retrieves categorical expense breakdowns and ownership totals.
  - `get_vehicle_reminders`: Checks upcoming and overdue maintenance or compliance checkpoints.
  - `get_vehicle_documents_metadata`: Checks document validity and expiration (RC, Insurance, PUC) without exposing private binary file payloads.
  - `get_vehicle_fuel_summary`: Computes fuel refill statistics, mileage, and total fuel expenditure.
  - `search_nearby_places`: Generates real Google Maps queries and turn-by-turn navigation links.
  - `prepare_reminder_action`: Generates structured reminder proposals requiring explicit user confirmation.
- **Safety First & Emergency Diagnostic Protocols**:
  - Immediate red-alert safety banners for engine overheating, smoke/fire, brake failure, and unsafe roadside breakdowns.
  - Explicit warning never to open a hot radiator cap or coolant expansion tank.
  - Prioritizes safe stopping, hazard lights, and professional towing / roadside assistance.
- **Genuine Nearby Assistance & Google Maps Platform Integration**:
  - Category support: Car Garages, Motorcycle Mechanics, Tyre Puncture Shops, Battery Repair & Jumpstart, Towing Services, Fuel Stations, EV Fast Charging Stations, and Authorized Service Centers.
  - Geolocation permission flow with high accuracy coordinates and fallback manual city/locality search.
  - Direct 1-click **Google Maps Turn-by-Turn Navigation** and **Google Maps Search** deep links.
- **Structured Actionable Responses**:
  - Every answer includes direct 1-tap in-app action buttons: *View Service History*, *Record Service*, *Log Fuel*, *View Expenses*, *Renew Insurance/PUC*, *Print Vehicle Dossier*, or *Find Nearby Towing*.

### 9. Vehicle Dossier & Complete Ownership Report
- **1-Click Printable Dossier**: Generates an authoritative, comprehensive ownership and maintenance dossier for insurance, resale, or mechanic visits.
- **Covers**: Complete Vehicle Profile, Lifetime TCO & Cost Per Km, Complete Service Ledger, Fuel Log Refills, Scheduled Maintenance Matrix, and Digital Document Vault records.
- **Export Formats**: Instant "Print / Save PDF" (`window.print()` with custom print stylesheets) and "Copy Text Summary" clipboard exporter.

### 10. Data Integrity & Expense Synchronization
- Strict data model mapping between Vehicles, Fuel Logs, Services, Reminders, Documents, and Expenses.
- Fuel and service costs automatically create synchronized expense ledger entries with `reference_type` and `reference_id` to prevent double-counting in analytics.
- Empty string dates (`""`) are systematically sanitized to `null` to ensure rock-solid PostgreSQL / Supabase date compatibility.
- Seamless dual-mode architecture: Works with Supabase Cloud (PostgreSQL + RLS) or Offline Local Demo Mode with zero configuration.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 + Vite 8 + Modern JavaScript (ES2023)
- **Styling**: Tailwind CSS v4 + Lucide Icons + Plus Jakarta Sans typography
- **OCR Engine**: Tesseract.js v7 with dedicated Web Worker
- **Charts & Data Visualization**: Recharts
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **File Storage**: Supabase Storage (`vehicle-documents` private bucket with signed URLs)
- **Local Fallback**: Browser-persistent storage repository with identical async schema for offline evaluation
- **Testing**: Vitest unit and end-to-end integration test suites

---

## 📂 Project Structure

```
Autocare/
├── index.html                 # App shell with typography & SEO meta tags
├── vite.config.js             # Vite configuration with Tailwind v4 & path aliases
├── package.json               # Dependencies and scripts
├── .env.example               # Environment variables template
├── supabase/
│   ├── schema.sql             # Complete PostgreSQL schema, RLS policies & triggers
│   └── migrations/
│       └── 20261015000000_initial_autocare_schema.sql
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Main layout and modal state coordinator
│   ├── index.css              # Tailwind base styles and theme tokens
│   ├── context/
│   │   ├── AuthContext.jsx    # Auth state, profiles, and regional preferences
│   │   └── VehicleContext.jsx # Garage fleet state and active vehicle selection
│   ├── lib/
│   │   ├── rcOcrService.js    # Tesseract.js Web Worker OCR pipeline
│   │   ├── rcParser.js        # Indian vehicle RC regex & normalization engine
│   │   ├── rcOcrPreprocess.js # Canvas contrast & sharpening filter
│   │   ├── sampleRcGenerator.js # Client-side Indian Smart Card generator for instant demo
│   │   ├── supabase.js        # Supabase client and connection checker
│   │   ├── storage.js         # Unified storage layer (Supabase RLS + Local persistence)
│   │   └── utils.js           # Fuel math, expense math, insights generator, formatters
│   ├── components/
│   │   ├── ui/                # Button, Input, Select, Card, Badge, Modal, ConfirmDialog, EmptyState
│   │   ├── layout/            # Navbar with Quick Add, Sidebar, MobileNav with floating action bar
│   │   ├── auth/              # AuthModal (Login, Register, Reset, Quick Demo)
│   │   ├── vehicles/          # VehicleList, VehicleFormModal (RC OCR + Manual Mode)
│   │   ├── dashboard/         # Action-oriented 5-section dashboard & insights
│   │   ├── services/          # ServiceList, ServiceFormModal (Garage memory & auto-reminders)
│   │   ├── fuel/              # FuelLogList, FuelFormModal (2-of-3 bidirectional calculation)
│   │   ├── reminders/         # ReminderList, ReminderFormModal (Rule-based auto suggestions)
│   │   ├── expenses/          # ExpenseList, ExpenseFormModal, ExpenseCharts
│   │   ├── documents/         # DocumentList, DocumentUploadModal (Search, filter, replacement)
│   │   ├── timeline/          # VehicleTimeline
│   │   └── settings/          # SettingsView & sample fleet seeder
│   └── tests/
│       ├── calculations.test.js # Unit tests for math, formatting, fuel economy & insights
│       ├── rcParser.test.js     # Tests for Indian RC regex parsing & normalization
│       └── userJourney.test.js  # End-to-end integration tests for complete user journey
```

---

## ⚙️ Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Autocare
npm install
```

### 2. Configure Environment Variables (Optional for Supabase)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and configure your Supabase project:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> **Note**: If Supabase credentials are not provided or remain at defaults, AutoCare automatically operates in **Local Demo Mode** so you can immediately interact with every feature, create vehicles, run OCR scans, upload files, and view charts without setup hurdles.

### 3. Supabase Database Migration
1. Go to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` (or `supabase/migrations/20261015000000_initial_autocare_schema.sql`) and click **Run**.
4. This will:
   - Create tables: `profiles`, `vehicles`, `services`, `fuel_logs`, `expenses`, `reminders`, `documents`.
   - Enable **Row Level Security (RLS)** on all tables.
   - Establish RLS policies ensuring users can only read, insert, update, and delete their own records.
   - Create a private storage bucket named `vehicle-documents` with isolated user folder policies.
   - Set up an automated user profile trigger on auth signup.

---

## 🧪 Running Tests & Build

### Run Unit and End-to-End Tests
```bash
npm run test
```
All **28 tests** across calculations, Indian RC parsing, fuel economy math, expense aggregations, and the full vehicle lifecycle will execute and pass:
- `rcParser.test.js` (11 tests)
- `calculations.test.js` (10 tests)
- `userJourney.test.js` (7 tests)

### Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

### Run Development Server
```bash
npm run dev
```
Launches the Vite dev server locally at `http://localhost:5173/`.

---

## 🌐 Vercel Deployment

1. Push your repository to GitHub / GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and select your repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase Anon Key
4. Click **Deploy**.
