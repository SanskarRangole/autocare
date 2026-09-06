# AutoCare: Master Project Specification & AI Agent Context

## 1. Executive Summary & Core Identity
- **Product Name:** AutoCare[cite: 1]
- **Tagline:** Own Smarter. Maintain Better. Drive Safer.[cite: 1]
- **Core Vision:** AutoCare is a cloud-based digital vehicle ownership platform that consolidates a vehicle's documents, service history, maintenance records, tyres, fuel, expenses, and reminders into a single chronological "digital memory"[cite: 1]. It leverages OCR for automated ingestion and Gemini AI for invoice and technical explanations[cite: 1].
- **Target Audience (V1):** Individual car and motorcycle owners, and multi-vehicle households[cite: 1].

---

## 2. Technical Stack (Strictly Locked - Do Not Deviate)
Any suggestion or generation of code outside this stack is prohibited[cite: 1]:
- **Backend:** Java 21, Spring Boot 3.x, Spring Data JPA, Hibernate, Spring Security, Bean Validation, Maven[cite: 1]
- **Database:** MySQL 8.x[cite: 1]
- **Frontend:** React.js (Vite), JavaScript (ES6+), HTML5, CSS3, Axios, React Router[cite: 1]
- **Authentication:** Stateless Spring Security with JWT (Bearer Token in `Authorization` header)[cite: 1]
- **API Standard:** RESTful JSON APIs, documented via Swagger/OpenAPI (`springdoc-openapi`)[cite: 1]
- **Intelligent Services:** External OCR API (for RC/invoice scanning), Gemini 2.5 API (for invoice breakdown and conversational Q&A)[cite: 1]
- **Storage:** Cloud Object Storage (S3-compatible) for documents/invoices[cite: 1]
- **DevOps & Testing:** Docker, GitHub Actions, JUnit, Mockito, Postman[cite: 1]

---

## 3. Strict Project Boundaries (What AutoCare is NOT)
AI Agents MUST NOT implement or suggest features related to[cite: 1]:
1. Garage management or garage billing systems[cite: 1].
2. Hardware, OBD-II, CAN-bus, or ECU monitoring[cite: 1].
3. Automated mechanical fault diagnosis (AutoCare recommends professional inspection for safety issues; it does NOT diagnose engine/transmission faults)[cite: 1].
4. Government registry scraping (e.g., VAHAN scraping)[cite: 1].
5. Predictive ML models claiming to forecast random mechanical failures[cite: 1].
6. Microservice patterns, message brokers (Kafka/RabbitMQ), or Kubernetes (AutoCare V1 is a well-structured Monolith)[cite: 1].

---

## 4. Architectural Rules for AI Agents

1. **Standard Layering:**
   - Every backend feature must strictly follow: `Controller -> Service -> Repository -> Entity`[cite: 1].
   - Never inject Repositories directly into Controllers.
   - Use DTOs (Records or POJOs) for request bodies and response outputs; never expose JPA Entities directly via REST endpoints.
2. **User Isolation (Multi-Tenancy):**
   - Every `Vehicle` belongs to a `User`[cite: 1].
   - All nested resources (`Document`, `Service`, `Expense`, `FuelLog`, `Tyre`, `MaintenanceRecord`) belong to a `Vehicle`[cite: 1].
   - Every query must enforce ownership: users can ONLY query and mutate their own resources based on the authenticated JWT `userId`[cite: 1].
3. **Timeline Event Pattern:**
   - The Timeline is a dynamic read-only feed, NOT a duplicated database table[cite: 1].
   - Query events across `services`, `fuel_logs`, `maintenance_records`, `documents`, and `tyres`, map them to `TimelineEventDto`, and sort descending by date[cite: 1].
4. **Expense Synchronization:**
   - When a fuel log, tyre replacement, or service invoice with an amount is saved, an associated record in the `expenses` table must be generated or synchronized automatically[cite: 1].
5. **Rule-Based vs. AI Logic:**
   - Calculations (mileage km/L, cost/km, total expense, expiry countdowns) MUST be implemented using standard business logic, never AI[cite: 1].
   - AI is reserved solely for OCR raw data extraction, invoice item explanation, and general automotive concept Q&A[cite: 1].

---

## 5. Database Schema & Entity Relationships

[ users ] (1) ───< has >─── (N) [ vehicles ]
│
┌──────────────┬────────────────┼────────────────┬──────────────┐
│ (1:N)        │ (1:N)          │ (1:N)          │ (1:N)        │ (1:N)
[ documents ]  [ services ]   [ fuel_logs ]    [ tyres ]   [ maintenance_records ]
│              │                │
└──────────────┴───────┬────────┘
│ (Generates / Links)
▼
[ expenses ]


### Table Definitions & Types:
- **`users`**: `id` (BIGINT PK), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `full_name` (VARCHAR), `created_at` (TIMESTAMP)[cite: 1]
- **`vehicles`**: `id` (BIGINT PK), `user_id` (BIGINT FK -> users.id), `make` (VARCHAR), `model` (VARCHAR), `year` (INT), `registration_number` (VARCHAR UNIQUE), `fuel_type` (ENUM: PETROL, DIESEL, ELECTRIC, HYBRID, CNG), `current_odometer` (INT), `created_at` (TIMESTAMP)[cite: 1]
- **`documents`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `doc_type` (ENUM: RC, INSURANCE, PUC, WARRANTY, SERVICE_INVOICE, OTHER), `file_url` (VARCHAR), `issue_date` (DATE), `expiry_date` (DATE), `status` (ENUM: ACTIVE, EXPIRING_SOON, EXPIRED)[cite: 1]
- **`services`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `service_date` (DATE), `odometer` (INT), `service_type` (VARCHAR), `garage_name` (VARCHAR), `cost` (DECIMAL(10,2)), `notes` (TEXT), `document_id` (BIGINT FK NULLABLE)[cite: 1]
- **`maintenance_records`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `component` (ENUM: ENGINE_OIL, BRAKE_PADS, BATTERY, TYRES, COOLANT, AIR_FILTER, SPARK_PLUG), `last_serviced_date` (DATE), `last_odometer` (INT), `next_due_date` (DATE), `next_due_odometer` (INT), `status` (ENUM: GOOD, DUE_SOON, DUE, OVERDUE)[cite: 1]
- **`tyres`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `position` (ENUM: FRONT_LEFT, FRONT_RIGHT, REAR_LEFT, REAR_RIGHT, SPARE), `brand` (VARCHAR), `model` (VARCHAR), `size` (VARCHAR), `installed_odometer` (INT), `installed_date` (DATE), `cost` (DECIMAL(10,2))[cite: 1]
- **`fuel_logs`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `log_date` (DATE), `odometer` (INT), `litres` (DECIMAL(8,2)), `amount` (DECIMAL(10,2)), `fuel_type` (ENUM), `calculated_mileage` (DECIMAL(6,2))[cite: 1]
- **`expenses`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `category` (ENUM: FUEL, SERVICE, INSURANCE, TYRES, BATTERY, REPAIRS, ACCESSORIES, OTHER), `amount` (DECIMAL(10,2)), `expense_date` (DATE), `notes` (VARCHAR), `reference_type` (VARCHAR), `reference_id` (BIGINT)[cite: 1]
- **`reminders`**: `id` (BIGINT PK), `vehicle_id` (BIGINT FK -> vehicles.id), `title` (VARCHAR), `due_date` (DATE), `due_odometer` (INT), `type` (ENUM: EXPIRY, SERVICE, MAINTENANCE, CUSTOM), `status` (ENUM: UPCOMING, COMPLETED, DISMISSED)[cite: 1]

---

## 6. Core REST API Signatures

### Authentication (`/api/v1/auth`)
- `POST /register` -> Body: `{ email, password, fullName }` -> Returns: `{ message, userId }`[cite: 1]
- `POST /login` -> Body: `{ email, password }` -> Returns: `{ token, tokenType: "Bearer", user: { id, email, fullName } }`[cite: 1]

### Vehicles (`/api/v1/vehicles`)
- `GET /` -> Returns: `List<VehicleDto>` (Authenticated user only)[cite: 1]
- `POST /` -> Body: `{ make, model, year, registrationNumber, fuelType, currentOdometer }`[cite: 1]
- `GET /{id}` -> Returns: `VehicleDetailDto`
- `GET /{id}/dashboard` -> Returns: Overview stats (Active documents count, pending reminders, current month expenses, mileage)[cite: 1]
- `GET /{id}/timeline` -> Returns: `List<TimelineEventDto>` sorted descending by event date[cite: 1]

### Documents & OCR (`/api/v1/documents` & `/api/v1/ocr`)
- `POST /api/v1/vehicles/{vehicleId}/documents` -> Multi-part file upload + metadata[cite: 1]
- `POST /api/v1/ocr/scan-rc` -> Multi-part image upload -> Returns extracted JSON: `{ make, model, registrationNumber, fuelType }` for user review (Never direct-save without user confirmation)[cite: 1]

### AI Explainer (`/api/v1/ai`)
- `POST /ask` -> Body: `{ prompt, vehicleId }` -> Calls Gemini API with vehicle context; returns plain-language explanation[cite: 1]
- `POST /explain-invoice` -> Body: `{ invoiceText }` -> Calls Gemini API to summarize parts and labor costs into simplified descriptions[cite: 1]

---

## 7. Direct Instructions for AI Assistant Sessions
When responding to implementation prompts:
1. Always write complete, compilable Java 21 or React code snippets without using placeholder comments like `// implement logic here`.
2. Format all API JSON fields using `camelCase`.
3. Provide unit test stubs (JUnit/Mockito for Java, Vitest/React Testing Library for React) whenever generating services.
4. Keep dependencies minimal; adhere strictly to the dependencies listed in Section 2.