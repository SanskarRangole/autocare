# AutoCare REST API Specification & Contract
**Frontend Lead (Member 3) ➔ Backend Team (Member 1 & Member 2)**

This document defines the exact REST endpoints, headers, JSON payloads, and response structures expected by the AutoCare React frontend.

---

## 1. Global Conventions

- **Base URL**: `http://localhost:8080/api` (Configurable via `VITE_API_BASE_URL`)
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Error Format**:
  ```json
  {
    "status": 400,
    "error": "Bad Request",
    "message": "Detailed error description",
    "timestamp": "2026-09-06T11:30:00Z"
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
**Request**:
```json
{
  "name": "Prathamesh",
  "email": "prathamesh@example.com",
  "phone": "+91 98765 43210",
  "password": "StrongPassword123"
}
```
**Response (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": {
    "id": "usr-1",
    "name": "Prathamesh",
    "email": "prathamesh@example.com",
    "role": "VEHICLE_OWNER"
  }
}
```

### `POST /api/auth/login`
**Request**:
```json
{
  "email": "prathamesh@example.com",
  "password": "StrongPassword123"
}
```
**Response (200 OK)**: (Same format as register response)

---

## 3. Vehicle Endpoints (`/api/vehicles`)

### `GET /api/vehicles`
*Returns all vehicles owned by the authenticated user (identified by JWT).*
**Response (200 OK)**:
```json
[
  {
    "id": "veh-1",
    "nickname": "Honda City",
    "make": "Honda",
    "model": "City ZX i-VTEC",
    "year": 2022,
    "type": "car",
    "registrationNumber": "MH 02 CD 4589",
    "vin": "MA3FNE81S00123984",
    "chassisNumber": "MBH12345ABCD6789",
    "fuelType": "Petrol",
    "transmission": "Manual",
    "odometer": 32450,
    "color": "Platinum White Pearl",
    "purchaseDate": "2022-04-15",
    "imageUrl": "https://..."
  }
]
```

### `POST /api/vehicles`
**Request**:
```json
{
  "nickname": "My Baleno",
  "make": "Maruti Suzuki",
  "model": "Baleno Alpha",
  "year": 2023,
  "type": "car",
  "registrationNumber": "KA 03 MG 7820",
  "vin": "MA3FNE81S00998822",
  "fuelType": "Petrol",
  "odometer": 18450,
  "color": "Nexa Blue"
}
```

### `POST /api/vehicles/ocr-rc` (Multipart / Form-Data)
*Extracts RC details using OCR for the smart onboarding review modal.*
**Payload**: `rcDocument` (File: image or PDF)
**Response (200 OK)**:
```json
{
  "registrationNumber": "KA 03 MG 7820",
  "make": "Maruti Suzuki",
  "model": "Baleno Alpha",
  "year": 2023,
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "odometer": 18450,
  "color": "Nexa Blue",
  "vin": "MA3FNE81S00998822",
  "chassisNumber": "MBH12345ABCD6789",
  "expiryDate": "2038-07-21",
  "confidenceScore": 0.94
}
```

---

## 4. Documents Endpoints (`/api/vehicles/{vehicleId}/documents`)

### `GET /api/vehicles/{vehicleId}/documents`
**Response (200 OK)**:
```json
[
  {
    "id": "doc-101",
    "type": "INSURANCE",
    "name": "Comprehensive Insurance",
    "documentNumber": "POL-ICICI-9920194",
    "provider": "ICICI Lombard",
    "issueDate": "2025-09-24",
    "expiryDate": "2026-09-24",
    "fileUrl": "https://storage.cloud.com/...",
    "fileSize": "2.1 MB"
  }
]
```

### `POST /api/vehicles/{vehicleId}/documents`
**Request**:
```json
{
  "type": "PUC",
  "name": "Pollution Under Control (PUC)",
  "documentNumber": "PUC-MH-2026-88102",
  "provider": "Authorized Emission Center",
  "issueDate": "2026-03-01",
  "expiryDate": "2026-09-30",
  "cost": 150
}
```

---

## 5. Service & Maintenance Endpoints

### `GET /api/vehicles/{vehicleId}/services`
```json
[
  {
    "id": "srv-1",
    "date": "2026-08-12",
    "odometer": 32450,
    "serviceType": "Major Scheduled Service",
    "provider": "Apex Honda Authorized Center",
    "cost": 4800,
    "notes": "Synthetic oil flush, spark plug check.",
    "invoiceId": "INV-2026-904"
  }
]
```

### `POST /api/vehicles/{vehicleId}/services`
*Backend note: Automatically update vehicle odometer if `odometer` > current vehicle odometer.*

---

## 6. Fuel & Expense Endpoints

### `POST /api/vehicles/{vehicleId}/fuel`
**Request**:
```json
{
  "date": "2026-09-02",
  "odometer": 32450,
  "litres": 34.5,
  "amount": 3622,
  "fuelType": "Petrol",
  "station": "IOCL BKC"
}
```

### `POST /api/vehicles/{vehicleId}/expenses`
**Request**:
```json
{
  "date": "2026-09-02",
  "category": "Accessories",
  "amount": 1850,
  "description": "3D all-weather floor mats"
}
```

---

## 7. AI & OCR Endpoints (`/api/ai`)

### `POST /api/ai/ask`
**Request**:
```json
{
  "vehicleId": "veh-1",
  "question": "What is wheel alignment and when should I do it?"
}
```
**Response**:
```json
{
  "answer": "Wheel alignment adjusts the angles of your tyres according to manufacturer specs...",
  "source": "Gemini Automotive Model",
  "disclaimer": "AutoCare provides ownership guidance, not mechanical fault diagnosis."
}
```

### `POST /api/ai/explain-invoice` (Multipart / Form-Data)
**Payload**: `invoiceFile` (File: image or PDF)
**Response**:
```json
{
  "invoiceNumber": "INV-2026-904",
  "provider": "Apex Honda Authorized Workshop",
  "date": "2026-08-12",
  "totalAmount": 4800,
  "items": [
    {
      "name": "Engine Oil 0W-20 Full Synthetic (3.6L)",
      "cost": 2150,
      "explanation": "Primary lubricant for the engine cylinders and pistons. Prevents overheating and friction."
    }
  ],
  "plainEnglishSummary": "This was a routine 30,000 km service bill focused on synthetic oil and filter replacement."
}
```
