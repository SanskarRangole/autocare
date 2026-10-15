
# AutoCare — Product Requirements

> Own Smarter. Maintain Better. Drive Safer.

## 1. Project Overview

AutoCare is a software-only digital vehicle ownership platform for car and motorcycle owners.

It helps users manage their vehicle's complete digital history in one place, including documents, service history, maintenance, tyres, fuel, expenses, reminders and vehicle-related information.

AutoCare is designed to become a long-term digital companion for the vehicle throughout its ownership lifecycle.

---

## 2. Problem Statement

Vehicle-related information is often scattered across paper documents, phone galleries, invoices, service records and personal memory.

Owners may forget:
- Insurance expiry dates
- PUC expiry
- Service schedules
- Maintenance history
- Previous repairs
- Vehicle expenses
- Tyre replacement history

There is a need for a simple platform that brings this information together and helps owners maintain a structured digital history of their vehicle.

---

## 3. Target Users

### Primary Users
- Car owners
- Motorcycle owners
- Individual vehicle owners
- Families managing multiple vehicles

### Future Users
- Used-vehicle buyers
- Vehicle sellers
- Service providers
- Other vehicle ecosystem participants

The initial version focuses on vehicle owners.

---

## 4. Product Vision

AutoCare should become the digital memory of a vehicle.

Instead of treating documents, services, fuel and expenses as separate records, AutoCare connects them into a single vehicle history.

The system should reduce manual work wherever possible while keeping the user in control of their information.

---

## 5. Core Value Proposition

AutoCare provides:

- One digital vehicle profile
- Centralized vehicle documents
- Service and maintenance history
- Fuel and expense tracking
- Important reminders
- Vehicle timeline
- Useful analytics
- OCR-assisted document entry
- AI-powered vehicle information assistance

### Core Principle

**Minimum user input + useful automation + maximum clarity**

---

# 6. Core User Journey

```text
Register / Login
        ↓
Add Vehicle
        ↓
Scan / Upload RC
        ↓
OCR Processing
        ↓
Review Extracted Information
        ↓
User Confirmation
        ↓
Vehicle Created
        ↓
Dashboard
        ↓
Documents / Service / Maintenance /
Fuel / Expenses / Reminders / Timeline / AI

```
# 7. V1 Features

## 7.1 Authentication

- User registration
- Login
- Logout
- Password management
- Secure authentication

## 7.2 Vehicle Management

Users can:

- Add vehicle
- Edit vehicle information
- View vehicle profile
- Delete vehicle
- Switch between multiple vehicles

Vehicle information may include:

- Registration number
- Owner name
- Manufacturer
- Model
- Fuel type
- Registration date
- Odometer
- Other relevant vehicle information

## 7.3 RC OCR

Users can:

- Scan RC using camera
- Upload RC image/PDF
- Process the document
- Extract useful information
- Review extracted information
- Edit incorrect information
- Confirm and save

OCR results must never be blindly trusted.

The user must verify important information before it is saved.

## 7.4 Document Management

Supported documents:

- RC
- Insurance
- PUC
- Warranty
- Service invoices
- Other vehicle documents

Users can:

- Upload
- View
- Replace
- Download
- Delete

Document status:

- Active
- Expiring Soon
- Expired
- Missing

The system should not require users to create ZIP files or submit unnecessary documents.

## 7.5 Service History

Users can record:

- Service date
- Odometer
- Service type
- Garage/service provider
- Cost
- Notes
- Invoice

Service records automatically become part of the vehicle timeline.

## 7.6 Maintenance Tracking

Track important maintenance items such as:

- Engine oil
- Brake pads
- Battery
- Tyres
- Coolant
- Air filter
- Spark plug

Show:

- Last maintenance
- Next due
- Odometer
- Status

Statuses:

- Good
- Due Soon
- Due
- Overdue

V1 uses rule-based maintenance reminders.

AutoCare does not claim to diagnose mechanical faults.

## 7.7 Tyre Management

Tyre information is optional and requested only when the user chooses to add it.

Possible information:

- Position
- Brand
- Model
- Size
- Installation date
- Odometer
- Cost

Supported positions:

- Front Left
- Front Right
- Rear Left
- Rear Right
- Spare

Tyre replacement events become part of the vehicle history.

## 7.8 Fuel Tracking

Users can record:

- Date
- Odometer
- Fuel type
- Litres
- Amount

System calculates:

- Mileage
- Cost per kilometre
- Monthly fuel spending

## 7.9 Expense Tracking

Categories:

- Fuel
- Service
- Insurance
- Tyres
- Battery
- Repairs
- Accessories
- Other

Users can add, edit and delete expenses.

Analytics include:

- Monthly spending
- Yearly spending
- Category distribution
- Total ownership cost

## 7.10 Vehicle Timeline

The timeline creates a chronological history of the vehicle.

Events may include:

- Service
- Repairs
- Tyre replacement
- Battery replacement
- Insurance renewal
- PUC
- Document upload
- Expenses
- Maintenance

The timeline becomes the long-term digital memory of the vehicle.

## 7.11 Reminders

Reminders can be created for:

- Insurance
- PUC
- Service
- Maintenance
- Warranty

Reminder states:

- Upcoming
- Completed
- Dismissed

  ## 7.12 Smart Insights

AutoCare provides useful insights based on the user's actual vehicle data.

Examples:

- Insurance expires soon
- PUC is approaching expiry
- Maintenance is due
- Monthly maintenance spending increased
- Fuel spending changed
- Upcoming service

Simple calculations should be handled by the application rather than unnecessarily using AI.

## 7.13 AI Assistant

Feature name:

**Ask AutoCare**

The AI assistant can help users:

- Understand vehicle-related terms
- Explain service information
- Explain invoices
- Summarize service history
- Answer general vehicle-related questions

The AI must not claim to diagnose mechanical faults or guarantee vehicle safety.

For safety-critical situations, AutoCare should recommend professional inspection.

## 7.14 AI Invoice Explanation

Workflow:

Upload Invoice
        ↓
Extract Information
        ↓
Show Invoice Summary
        ↓
AI Explanation
        ↓
User Understanding

The system can explain service items, invoice terminology and costs in simple language.

## 7.15 Dashboard

The main dashboard should show:

- Selected vehicle
- Vehicle status
- Next maintenance
- Insurance status
- PUC status
- Monthly expenses
- Mileage
- Recent activity

Quick actions:

- Add Service
- Add Fuel
- Add Expense
- Upload Document
- Ask AutoCare

The dashboard should provide useful information without overwhelming the user.

## 7.16 Multiple Vehicle Support

One user can manage multiple vehicles.

Example:

User
 ├── Honda City
 ├── TVS Apache
 └── Maruti Swift

Each vehicle must have independent:

- Documents
- Services
- Maintenance
- Fuel
- Expenses
- Timeline
- Reminders

## 7.17 Reports

AutoCare can generate:

- Vehicle summary
- Maintenance summary
- Expense summary
- Fuel summary
- Document summary

Possible actions:

- Preview
- Generate PDF
- Download
- Share

## 7.18 Profile and Settings

Users should be able to manage:

- Profile
- Vehicles
- Notifications
- Privacy
- Security
- Appearance
- Language
- Data export
- Delete account
- Help
- About AutoCare
- Logout

## 7.19 Edge Cases and Error Handling

AutoCare should provide clear user-friendly states for:

- No vehicles
- No documents
- No service history
- No fuel records
- No expenses
- No reminders
- OCR failure
- Blurry document
- Wrong document
- Unsupported file
- Upload failure
- Duplicate document
- Network unavailable
- Server error
- AI unavailable
- Invalid form data
- Expired session
- Unauthorized access

The application should never expose technical errors or stack traces to normal users.

Create clear loading, success, warning and error states throughout the application.

## 7.20 Vehicle Lifecycle

AutoCare should support the vehicle throughout its ownership lifecycle:

Purchase
   ↓
Registration
   ↓
Insurance
   ↓
PUC
   ↓
Maintenance
   ↓
Service
   ↓
Repairs
   ↓
Expenses
   ↓
Renewals
   ↓
Ownership History
   ↓
Vehicle Sale

The system should preserve the vehicle's important history throughout ownership.

---

# 8. Non-Functional Requirements

## 8.1 Security

The application must protect:

- User accounts
- Vehicle information
- Uploaded documents
- Personal information

Security measures should include:

- Secure authentication
- Authorization
- Password protection
- HTTPS
- Secure API communication
- Protected document access
- Environment variables for secrets

## 8.2 Performance

The application should:

- Load important screens quickly
- Provide responsive interactions
- Avoid unnecessary API requests
- Handle document uploads efficiently
- Provide proper loading indicators

## 8.3 Usability

The application should:

- Be simple for first-time users
- Minimize manual data entry
- Use clear navigation
- Provide understandable error messages
- Work well on mobile and desktop
- Avoid unnecessary forms

## 8.4 Scalability

The architecture should allow AutoCare to grow from a small college project to a larger application.

The system should be designed so that additional users, vehicles and records can be supported without major architectural changes.

## 8.5 Maintainability

The codebase should use:

- Clear project structure
- Separation of responsibilities
- Reusable components
- Meaningful naming
- API documentation
- Version control
- Proper error handling

---

# 9. Planned Technology Stack

## Frontend

- React
- JavaScript
- HTML
- CSS

## Backend

- Java 21
- Spring Boot
- Spring Data JPA
- Spring Security
- REST APIs

## Database

- MySQL

## Development and Testing

- GitHub
- GitHub Projects
- Postman
- Swagger / OpenAPI
- Figma

## Intelligent Features

- OCR technology
- AI API

## Cloud and DevOps

- Docker
- Cloud deployment
- Cloud storage
- CI/CD
- Application monitoring

Specific providers and services will be finalized during architecture planning.

---

# 10. V1 Scope Exclusions

To keep the first version realistic, AutoCare will not include:

- OBD hardware
- IoT sensors
- ECU communication
- Hardware-based vehicle monitoring
- Automatic mechanical fault diagnosis
- Garage billing management
- Garage inventory management
- Government database scraping
- Automatic access to private government documents

These can be considered as future possibilities only where technically, legally and ethically appropriate.

---

# 11. Development Roadmap

The project will be developed incrementally.

## Phase 1 — Requirements and Design

- Finalize requirements
- Finalize user workflows
- Create Figma prototype
- Review UX
- Finalize V1 scope

## Phase 2 — Architecture

- System architecture
- Database design
- ER diagram
- API planning
- Security architecture
- GitHub development workflow

## Phase 3 — Backend Foundation

- Spring Boot setup
- Database connection
- User authentication
- JWT security
- User APIs
- Vehicle APIs

## Phase 4 — Frontend Foundation

- React setup
- Authentication screens
- Dashboard
- Vehicle management
- Responsive UI

## Phase 5 — Core Vehicle Features

- Document management
- Service history
- Maintenance
- Tyres
- Fuel
- Expenses
- Timeline
- Reminders

## Phase 6 — Intelligent Features

- RC OCR
- Invoice extraction
- AI assistant
- AI invoice explanation
- Smart insights

## Phase 7 — Cloud and DevOps

- Docker
- Cloud database
- Cloud storage
- Backend deployment
- Frontend deployment
- CI/CD
- Monitoring

## Phase 8 — Testing

- Unit testing
- API testing
- Integration testing
- UI testing
- Security testing
- Error and edge-case testing

## Phase 9 — Final Release

- Production deployment
- Final documentation
- User testing
- Performance review
- Project presentation
- Demo preparation

---

# 12. Success Criteria

The V1 release should allow a new user to:

1. Create an account
2. Add a vehicle
3. Scan or upload an RC
4. Review extracted information
5. Create a digital vehicle profile
6. Store vehicle documents
7. Record service history
8. Track maintenance
9. Track tyres
10. Track fuel
11. Track expenses
12. Receive important reminders
13. View a complete vehicle timeline
14. Get useful vehicle insights
15. Ask AutoCare AI general vehicle questions
16. Generate vehicle reports

The final product should feel like a real usable consumer application rather than a collection of unrelated college-project features.

---

# 13. Project Development Principle

AutoCare will follow these principles:

- Build the MVP before advanced features
- Minimize user input
- Automate repetitive work
- Keep users in control
- Protect sensitive information
- Use AI only where it adds real value
- Avoid unnecessary complexity
- Test features before integration
- Maintain clean and documented code
- Design for future scalability

**Core principle:**

> Minimum user effort + useful automation + maximum clarity.
