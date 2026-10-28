# CampusFind — REST API Documentation

Base URL for all endpoints: `/api`

Example full URL in development: `http://localhost:5000/api`

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register Student Account
- **Endpoint**: `POST /api/auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@campus.edu",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```
- **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Student account registered successfully",
  "user": {
    "_id": "67200e6a8e80931122aefc01",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "createdAt": "2026-10-28T15:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (short password, missing field, mismatched passwords).
  - `409 Conflict`: Email already registered.

---

### 1.2 Student Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "jane@campus.edu",
  "password": "Password123!"
}
```
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "67200e6a8e80931122aefc01",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "createdAt": "2026-10-28T15:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials.

---

### 1.3 Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth**: Public / Client State Reset
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.4 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Bearer Token required (`Authorization: Bearer <token>`)
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "user": {
    "_id": "67200e6a8e80931122aefc01",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "createdAt": "2026-10-28T15:00:00.000Z",
    "updatedAt": "2026-10-28T15:00:00.000Z"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing, expired, or invalid Bearer token.

---

## 2. Lost Items Endpoints (`/api/lost`)

### 2.1 Browse Lost Items
- **Endpoint**: `GET /api/lost`
- **Auth**: Public
- **Query Parameters**:
  - `q` (string): Search term in `itemName`, `description`, and `distinguishingFeatures`.
  - `category` (string): Filter by category (*Electronics, ID Cards, Bags, Keys, Books, Clothing, Accessories, Other*).
  - `location` (string): Filter by campus location.
  - `status` (string): Filter by status (*open, matched, resolved*).
  - `page` (integer, default `1`): Pagination page.
  - `limit` (integer, default `12`, max `50`): Results per page.
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "items": [
    {
      "_id": "672010...",
      "itemName": "Blue Hydroflask 32oz",
      "category": "Other",
      "description": "Navy blue bottle with sticker on lid",
      "distinguishingFeatures": "Small dent near bottom rim",
      "imageUrl": "https://res.cloudinary.com/...",
      "lastSeenLocation": "Library 2nd Floor",
      "lastSeenDate": "2026-10-28T10:00:00.000Z",
      "status": "open",
      "reportedBy": {
        "_id": "67200e...",
        "name": "Jane Doe",
        "email": "jane@campus.edu"
      },
      "createdAt": "2026-10-28T10:30:00.000Z"
    }
  ],
  "totalItems": 1,
  "totalPages": 1,
  "currentPage": 1,
  "limit": 12
}
```

---

### 2.2 Create Lost Item Report
- **Endpoint**: `POST /api/lost`
- **Auth**: Bearer Token required
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `itemName` (string, required)
  - `category` (string, required)
  - `description` (string, required)
  - `lastSeenLocation` (string, required)
  - `lastSeenDate` (ISO Date string, required)
  - `distinguishingFeatures` (string, optional)
  - `image` (binary file, JPEG/PNG/WebP, max 5MB, optional)
- **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Lost item report submitted successfully",
  "item": { /* created item object */ }
}
```

---

### 2.3 Get Single Lost Item Details
- **Endpoint**: `GET /api/lost/:id`
- **Auth**: Public
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "item": {
    "_id": "672010...",
    "itemName": "Blue Hydroflask 32oz",
    "category": "Other",
    "description": "...",
    "reportedBy": {
      "_id": "67200e...",
      "name": "Jane Doe",
      "email": "jane@campus.edu"
    },
    "statusHistory": [
      {
        "status": "open",
        "changedBy": { "_id": "67200e...", "name": "Jane Doe" },
        "changedAt": "2026-10-28T10:30:00.000Z"
      }
    ]
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid ObjectId format.
  - `404 Not Found`: Report not found.

---

### 2.4 Update Lost Item Report
- **Endpoint**: `PUT /api/lost/:id`
- **Auth**: Bearer Token required (**Owner Only**)
- **Content-Type**: `multipart/form-data`
- **Fields**: Any editable field + optional replacement `image` file.
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Lost item report updated successfully",
  "item": { /* updated item object */ }
}
```
- **Error Responses**:
  - `403 Forbidden`: Authenticated user is not the creator of this report.

---

### 2.5 Update Lost Item Status
- **Endpoint**: `PATCH /api/lost/:id/status`
- **Auth**: Bearer Token required (**Owner Only**)
- **Request Body**:
```json
{
  "status": "resolved"
}
```
- Allowed values: `"open"`, `"matched"`, `"resolved"`.
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Lost item report marked as 'resolved'",
  "item": { /* updated item object */ }
}
```

---

### 2.6 Delete Lost Item Report
- **Endpoint**: `DELETE /api/lost/:id`
- **Auth**: Bearer Token required (**Owner Only**)
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Lost item report deleted successfully"
}
```

---

## 3. Found Items Endpoints (`/api/found`)

### 3.1 Browse Found Items
- **Endpoint**: `GET /api/found`
- **Auth**: Public
- **Query Parameters**: Same as Lost Items (`q`, `category`, `location`, `status`, `page`, `limit`).
- Allowed status values: `"open"`, `"matched"`, `"returned"`.

---

### 3.2 Create Found Item Report
- **Endpoint**: `POST /api/found`
- **Auth**: Bearer Token required
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `itemName` (string, required)
  - `category` (string, required)
  - `description` (string, required)
  - `foundLocation` (string, required)
  - `foundDate` (ISO Date string, required)
  - `contactName` (string, required)
  - `contactEmail` (string, optional)
  - `contactPhone` (string, optional)
  - *(At least one of contactEmail or contactPhone is required)*
  - `distinguishingFeatures` (string, optional)
  - `matchedLostItemId` (ObjectId string, optional): Links this found report to an existing lost report. Automatically transitions the corresponding lost item's status to `"matched"`.
  - `image` (binary file, JPEG/PNG/WebP, max 5MB, optional): Resiliently uploaded to Cloudinary or stored locally in `backend/uploads/` on fallback.
- **Success Response** (`201 Created`).

---

### 3.3 Get Single Found Item
- **Endpoint**: `GET /api/found/:id`
- **Auth**: Public
- **Success Response** (`200 OK`).

---

### 3.4 Update Found Item
- **Endpoint**: `PUT /api/found/:id`
- **Auth**: Bearer Token required (**Owner Only**).

---

### 3.5 Update Found Item Status
- **Endpoint**: `PATCH /api/found/:id/status`
- **Auth**: Bearer Token required (**Owner Only**).
- Allowed status values: `"open"`, `"matched"`, `"returned"`.

---

### 3.6 Delete Found Item Report
- **Endpoint**: `DELETE /api/found/:id`
- **Auth**: Bearer Token required (**Owner Only**).

---

## 4. Student Reports Dashboard (`/api/users`)

### 4.1 Get Authenticated Student's Reports
- **Endpoint**: `GET /api/users/me/reports`
- **Auth**: Bearer Token required
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "myLostItems": [ /* array of student's lost items */ ],
  "myFoundItems": [ /* array of student's found items */ ],
  "summary": {
    "totalLost": 2,
    "totalFound": 1,
    "totalReports": 3
  }
}
```

---

## 5. Live Dashboard Statistics (`/api/dashboard`)

### 5.1 Get Campus Aggregate Statistics
- **Endpoint**: `GET /api/dashboard/stats`
- **Auth**: Public (Optional Bearer token includes student's personal report count)
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "stats": {
    "activeLost": 14,
    "matchedLost": 3,
    "resolvedLost": 28,
    "totalLost": 45,
    "activeFound": 18,
    "matchedFound": 4,
    "returnedFound": 32,
    "totalFound": 54,
    "totalReclaimed": 60,
    "totalProcessed": 99,
    "userReportCount": 0
  },
  "recentLost": [ /* latest 4 lost items */ ],
  "recentFound": [ /* latest 4 found items */ ]
}
```

---

## 6. System Health Check (`/api/health`)

- **Endpoint**: `GET /api/health`
- **Auth**: Public
- **Success Response** (`200 OK` when DB connected, `503 Service Unavailable` when degraded):
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-10-28T15:20:00.000Z",
  "database": {
    "connected": true,
    "readyState": 1,
    "name": "campusfind"
  },
  "uptime": 128.4
}
```
