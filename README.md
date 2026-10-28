# CampusFind — Campus Lost & Found Portal

**CampusFind** is a modern, responsive, full-stack MERN (MongoDB, Express.js, React, Node.js) web application engineered to solve the problem of misplaced belongings in a university or college campus environment.

Students, faculty, and campus staff can report lost belongings, post discovered items, search and filter through real-time database listings, securely contact finders, and manage their report lifecycles from an authenticated student dashboard.

---

## 🌟 Key Features

1. **Dual Directory System**:
   - **Lost Items Directory**: Real-time listings of misplaced belongings with category filters, location search, and status indicators.
   - **Found Items Directory**: Listings of belongings discovered across campus facilities with safe contact information for the finder.

2. **Interactive Search & Filtering**:
   - Real-time MongoDB backend queries with sanitized regex search (prevents injection / ReDoS).
   - Filter by item categories: *Electronics, ID Cards, Bags, Keys, Books, Clothing, Accessories, Other*.
   - Filter by campus location: *Library, Lecture Halls, Cafeteria, Labs, Gym, etc.*
   - Filter by lifecycle status: *Open, Matched, Resolved, Returned*.
   - Server-side pagination with bounded limits.

3. **Secure Student Authentication & Ownership Authorization**:
   - Student account registration and login with bcrypt password hashing (cost factor 10).
   - Signed JSON Web Tokens (JWT) with configurable expiration (7 days).
   - Passwords marked `{ select: false }` to prevent accidental disclosure.
   - Backend ownership enforcement: Only the student who submitted a report can edit, change status, or delete that report. Non-owners are rejected with HTTP 403 Forbidden.

4. **Resilient Dual Image Storage Engine**:
   - Primary: Direct memory streaming via Multer and Cloudinary API (`campusfind/lost` and `campusfind/found` folders).
   - Automated Fallback: If Cloudinary credentials are missing or return authorization errors (e.g. HTTP 403), the engine automatically falls back to secure local disk storage in `backend/uploads/` served statically over Express.
   - Client-side and server-side file type verification (JPEG, PNG, WebP) and 5MB size limit.
   - Automated cleanup of images when reports are deleted or photos are replaced.

5. **1-Click Found Reporting & Two-Way Matching Lifecycle**:
   - When viewing any lost report, any student or finder can click **"I Found This Item!"** to open a fast reporting modal pre-filled with the item's details.
   - Directory cards include direct **"I Found This"** buttons for immediate submission without navigating across multiple pages.
   - The **Report Found** page features an intelligent dropdown selector that searches open lost items and auto-completes the entire form in one click.
   - Submitting a matched report automatically links both items via `matchedLostItemId` and transitions the lost item's status to `matched`, showing an alert banner with the finder's contact details to the owner.

6. **Effortless Contact Details & Location Persistence**:
   - Automatically synchronizes student name and email from the active authentication session.
   - Remembers the student's phone number in browser storage (`localStorage`) so it never has to be typed again.
   - Quick-suggestion location chips and 1-click status presets (*In my possession*, *Security Desk*, *Department Office*, *Library Reception*).

7. **Live Dashboard & Analytics**:
   - Aggregated metrics computed dynamically from MongoDB:
     - Active lost items
     - Active found items
     - Belongings reclaimed
     - Total campus reports processed
   - Student "My Reports" dashboard with tabs, status toggles, edit dialogs, and deletion confirmation modals.

8. **Campus Visual Identity**:
   - Modern emerald green and crisp white campus theme.
   - Fully responsive for mobile phones, tablets, and desktop displays.
   - Empty states, loading spinners, and error alerts.
   - Zero obsolete blog code or dependencies.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Redux Toolkit, Axios, React Router v7 |
| **Backend** | Node.js, Express.js 5, Multer (Memory Storage), CORS, Dotenv |
| **Database** | MongoDB with Mongoose ODM (Atlas & Local) |
| **Authentication** | JWT (jsonwebtoken), bcrypt password hashing |
| **Image Storage** | Cloudinary API (streaming uploader) |
| **Deployment Targets** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## 📁 Repository Structure

```text
Campus-Lost-And-Found/
├── .gitignore
├── README.md
├── DATABASE_SCHEMA.md
├── API_DOCUMENTATION.md
├── DEPLOYMENT.md
├── TESTING_CHECKLIST.md
├── VIVA_GUIDE.md
│
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── index.js                      # Express application entry & CORS
│   ├── package.json
│   ├── test.js                       # Automated integration test suite
│   ├── config/
│   │   ├── dbConnect.js              # MongoDB connection handler
│   │   └── cloudinaryConfig.js       # Cloudinary SDK setup
│   ├── controllers/
│   │   ├── authController.js         # Student registration & login
│   │   ├── lostItemController.js     # Lost items CRUD & status lifecycle
│   │   ├── foundItemController.js    # Found items CRUD & contact info
│   │   ├── reportController.js       # User personal reports dashboard
│   │   └── dashboardController.js    # Live aggregated campus stats
│   ├── middleware/
│   │   ├── auth.js                   # Bearer token verification
│   │   ├── uploadMiddleware.js       # Multer 5MB image filter
│   │   └── errorHandler.js           # Centralized HTTP error handler
│   ├── models/
│   │   ├── User.js                   # Student user Mongoose schema
│   │   ├── LostItem.js               # Lost items schema with timeline
│   │   └── FoundItem.js              # Found items schema with contact info
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth/*
│   │   ├── lostItemRoutes.js         # /api/lost/*
│   │   ├── foundItemRoutes.js        # /api/found/*
│   │   ├── reportRoutes.js           # /api/users/*
│   │   └── dashboardRoutes.js        # /api/dashboard/*
│   └── utils/
│       ├── generateToken.js          # JWT sign and verify helpers
│       └── uploadImage.js            # Cloudinary stream uploader & deleter
│
└── frontend/
    ├── .env.example
    ├── .gitignore
    ├── index.html                    # CampusFind title & meta
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    ├── vercel.json                   # Vercel SPA route rewrite
    ├── public/
    │   └── favicon.svg               # Emerald search pin SVG icon
    └── src/
        ├── App.jsx                   # React Router route registry
        ├── index.css                 # Base Tailwind styles & transitions
        ├── main.jsx                  # React DOM root & Redux Provider
        ├── components/
        │   ├── ConfirmationDialog.jsx # Reusable delete/confirm modal
        │   ├── EmptyState.jsx        # Friendly zero-items placeholder
        │   ├── FilterPanel.jsx       # Category, location & keyword toolbar
        │   ├── Footer.jsx            # Campus safety tips & navigation
        │   ├── ImageUploader.jsx     # Drag/drop picker with preview & cleanup
        │   ├── ItemCard.jsx          # Directory item card with badges
        │   ├── LoadingState.jsx      # Spinner & loading message
        │   ├── Navbar.jsx            # Responsive header & student session
        │   ├── ProtectedRoute.jsx    # Client-side route guard
        │   └── StatusBadge.jsx       # Color-coded status badge
        ├── pages/
        │   ├── AuthPage.jsx          # Register and Log In forms
        │   ├── FoundItemDetailPage.jsx # Found item details & finder contact
        │   ├── FoundItemsPage.jsx    # Found directory with pagination
        │   ├── HomePage.jsx          # Landing page with live statistics
        │   ├── LostItemDetailPage.jsx  # Lost item details & owner controls
        │   ├── LostItemsPage.jsx     # Lost directory with pagination
        │   ├── MyReportsPage.jsx     # Authenticated student report dashboard
        │   ├── NotFoundPage.jsx      # 404 page
        │   ├── ReportFoundPage.jsx   # Found item creation form
        │   └── ReportLostPage.jsx    # Lost item creation form
        └── utils/
            ├── api.js                # Axios instance with interceptors
            ├── store.js              # Redux Toolkit store
            └── userSlice.js          # Auth state slice with localStorage
```

---

## ⚙️ Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/campusfind`) or MongoDB Atlas URI
- **Cloudinary Account**: Free tier cloud name, API key, and API secret

---

## 🚀 Local Setup & Installation

### 1. Clone or Open the Repository
```bash
cd Campus-Lost-And-Found
```

### 2. Configure Backend Environment
Navigate to `backend/` and create `.env` (or copy from `.env.example`):
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your values:
```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/campusfind
JWT_SECRET=super_secret_jwt_key_campusfind_2026_at_least_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Configure Frontend Environment
In a separate terminal, navigate to `frontend/` and create `.env`:
```bash
cd frontend
cp .env.example .env
```
Ensure `frontend/.env` contains:
```dotenv
VITE_API_URL=http://localhost:5000
```

### 4. Install Dependencies
```bash
# In backend/
cd backend
npm install

# In frontend/
cd ../frontend
npm install
```

### 5. Run the Automated Backend Tests
Verify that all database connections, registration, ownership checks, and status workflows pass:
```bash
cd backend
npm test
```

### 6. Start Development Servers
Start backend (Terminal 1):
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

Start frontend (Terminal 2):
```bash
cd frontend
npm run dev
# Vite will serve at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🔒 Security Measures

1. **Authentication**: JWT signature and expiration verified on every protected request.
2. **Password Security**: Bcrypt with 10 salt rounds. Plaintext passwords are never saved; password hashes are omitted by default via `{ select: false }`.
3. **Regex Search Sanitization**: All user-supplied text in query filters is escaped before being converted to MongoDB regular expressions, avoiding Denial of Service (ReDoS).
4. **Ownership Verification**: Edit, status update, and delete controllers explicitly compare `item.reportedBy` with `req.user._id`.
5. **CORS Configuration**: Restricts browser requests to configured local and deployed domains (`allowedOrigins`).
6. **File Upload Hardening**: Multer limits upload size to 5MB and validates both MIME types and file extensions for JPEG, PNG, and WebP. Cloudinary credentials remain strictly on the backend.

---

## 📜 License & Acknowledgments

Built for the Web Technology IA3 Demonstration.
&copy; 2026 CampusFind Team. All rights reserved.
