# CampusFind — Pre-Demonstration Testing Checklist

This checklist contains all verification procedures, automated tests, and manual scenarios to execute prior to the Web Technology IA3 college demonstration.

---

## 🤖 1. Automated Test Execution

Run the backend integration test suite:

```bash
cd backend
npm test
```

### Automated Assertions Verified:
- [x] **Health check**: `GET /api/health` reports status 200 and `{ connected: true }`.
- [x] **Email validation**: Rejects invalid email patterns.
- [x] **Password validation**: Rejects passwords with fewer than 8 characters.
- [x] **Registration**: Successful registration returns 201, safe user object, and JWT token without password hash.
- [x] **Duplicate prevention**: Attempting to register an existing email returns 409 Conflict.
- [x] **Login invalid credentials**: Incorrect password returns 401 Unauthorized.
- [x] **Login valid credentials**: Valid credentials return 200, user profile, and token.
- [x] **Protected endpoints**: Missing authorization token returns 401 Unauthorized.
- [x] **Session check**: `GET /api/auth/me` with Bearer token returns authenticated student profile.
- [x] **Lost item creation**: Saves record with status `open` and initial `statusHistory` entry.
- [x] **Search & filters**: `GET /api/lost?q=...` performs safe regex search against MongoDB.
- [x] **Ownership security**: User B attempting to edit or delete User A's report is blocked with 403 Forbidden.
- [x] **Owner update**: Legitimate creator can update item metadata.
- [x] **Status lifecycle**: Changing status to `resolved` or `returned` appends an audit record to `statusHistory`.
- [x] **Found item creation**: Saves finder contact information safely.
- [x] **Personal dashboard**: `GET /api/users/me/reports` returns both lost and found records for the active student.
- [x] **Live statistics**: `GET /api/dashboard/stats` calculates counts dynamically from MongoDB collections.
- [x] **Report deletion**: Owner can delete reports; clean database and Cloudinary cleanup.

---

## 🧪 2. Frontend Code Quality & Build Checks

From the project root:

```bash
# 1. Lint check
cd frontend
npm run lint

# 2. Production build check
npm run build
```

- [x] ESLint completes with 0 errors and 0 warnings.
- [x] Vite produces production bundles in `frontend/dist/` without compilation warnings.

---

## 📋 3. Manual UI / UX Walkthrough Checklist

### Navigation & Identity
- [ ] **Branding**: Verify brand name is **CampusFind** with green and white theme. No "Folio", "Journal", or blog branding remains.
- [ ] **Desktop Navbar**: Check links to Home, Lost Items, Found Items, Report Lost, Report Found.
- [ ] **Mobile Drawer**: Check hamburger menu opens and closes smoothly on mobile viewport (< 1024px).
- [ ] **Footer**: Displays campus lost-and-found quick links and campus safety handover advice.

### Authentication Scenarios
- [ ] **Register Student**:
  - Open `/register`.
  - Try submitting with mismatched passwords &rarr; Verify error message appears.
  - Submit with valid details &rarr; Confirm account is created and user is logged in.
- [ ] **Log Out**:
  - Click "Log out" button &rarr; Verify token is removed from `localStorage` and user returns to public mode.
- [ ] **Log In**:
  - Open `/login`.
  - Enter wrong password &rarr; Verify error alert.
  - Enter correct password &rarr; Redirects to dashboard or intended route.

### Lost Items Workflow
- [ ] **Create Lost Report**:
  - Navigate to `/report-lost`. If logged out, verify automatic redirect to `/login`.
  - Fill in item name, category, location, date, and description.
  - Attach an image file &rarr; Verify preview appears with file size.
  - Click "Publish Lost Item Report" &rarr; Confirm redirect to detail page.
- [ ] **View Lost Report**:
  - Verify photo, category badge, date, location, and reporter name appear correctly.
  - Check the "Report Timeline" section.
- [ ] **Edit Report (Owner)**:
  - Click "Edit Report" &rarr; Change item name or description &rarr; Save &rarr; Confirm immediate update.
- [ ] **Mark as Resolved (Owner)**:
  - Click "Mark as Resolved" &rarr; Verify badge turns green and timeline logs status change.
- [ ] **Delete Report (Owner)**:
  - Click "Delete" &rarr; Confirmation modal opens &rarr; Confirm &rarr; Report removed from list.

### Found Items Workflow
- [ ] **Create Found Report**:
  - Navigate to `/report-found`.
  - Enter details, location found, and finder's contact email/phone.
  - Submit &rarr; Confirm redirect to found item detail page.
- [ ] **View Found Report**:
  - Verify finder contact section displays safely with contact links.
- [ ] **Mark as Returned (Owner)**:
  - Click "Mark as Returned to Owner" &rarr; Verify status update.

### Search, Filter & Pagination
- [ ] **Keyword Search**: Type keyword in search box &rarr; Only matching items are displayed.
- [ ] **Category Filter**: Select "Electronics" &rarr; Only electronics appear.
- [ ] **Location Filter**: Type location name &rarr; Matching items appear.
- [ ] **Reset Filters**: Click "Reset Filters" &rarr; Returns to full list.
- [ ] **Empty State**: Search for a nonexistent item (e.g. `xyz12345`) &rarr; Confirm friendly "No reports found" placeholder appears with a "Clear Filters" button.

### Student Dashboard ("My Reports")
- [ ] Open `/my-reports`.
- [ ] Verify summary metrics (My Lost, My Found, Reclaimed, Active).
- [ ] Switch between "My Lost Reports" and "My Found Reports" tabs.
- [ ] Test inline status toggles directly from the dashboard card.

### Deep Linking & 404
- [ ] Refresh the browser on `/lost-items/:id` &rarr; Page reloads seamlessly without 404.
- [ ] Navigate to an invalid URL like `/some-random-route` &rarr; 404 "Looks like this page is lost!" screen appears with a button to return to Home.
