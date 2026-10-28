# CampusFind — College Viva Examination Guide

This guide is designed to help you confidently answer examiner questions about the architecture, security, code choices, and deployment of **CampusFind** during your Web Technology IA3 viva.

---

## 1. Project Overview & Architecture

### Q: What is CampusFind and what problem does it solve?
> **Answer**: CampusFind is a full-stack MERN web portal that solves the common problem of misplaced student belongings on a university campus. Rather than relying on scattered WhatsApp or Telegram groups, CampusFind provides a centralized, authenticated platform with separate directories for lost and found items, real-time search, category and location filters, image uploads, and an owner-controlled status lifecycle (open, matched, resolved/returned).

### Q: What is the MERN stack and how is each part used here?
> **Answer**:
> - **M (MongoDB)**: NoSQL document database storing collections for `users`, `lostitems`, and `founditems`.
> - **E (Express.js)**: Minimalist Node.js backend framework handling HTTP routing, REST API controllers, file parsing via Multer, and authentication middleware.
> - **R (React 19)**: Frontend component-based library using Vite for lightning-fast bundling, React Router for client-side navigation, and Redux Toolkit for global user session state.
> - **N (Node.js)**: JavaScript runtime environment executing the backend server code asynchronously on the V8 engine.

---

## 2. Authentication & Security

### Q: How does authentication work in this application?
> **Answer**:
> 1. When a student registers or logs in, the backend verifies their email and password.
> 2. Passwords are never stored in plaintext; they are hashed using **bcrypt** with 10 salt rounds.
> 3. Upon successful credential verification, the backend issues a cryptographically signed **JSON Web Token (JWT)** using `jsonwebtoken` signed with a server-side `JWT_SECRET` and a 7-day expiration.
> 4. The client saves this token in `localStorage` and Redux state.
> 5. For protected actions (like reporting an item or viewing dashboard reports), the client includes the token in the `Authorization: Bearer <token>` HTTP header.
> 6. The `verifyUser` middleware intercepts the request, verifies the signature and expiration, retrieves the user from MongoDB (excluding password via `select('-password')`), and attaches `req.user`.

### Q: Why is password hashing important, and what is a "salt"?
> **Answer**: Storing plaintext passwords is a catastrophic security vulnerability. If the database is compromised, all user passwords would be exposed. Hashing is a one-way mathematical function. A "salt" is random cryptographic data appended to the password before hashing; it prevents attackers from using precomputed "rainbow tables" to crack common passwords.

### Q: How do you enforce authorization and prevent students from deleting someone else's reports?
> **Answer**: Authorization is enforced strictly on the **server**, never relying solely on frontend UI buttons.
> In our controllers (`lostItemController.js` and `foundItemController.js`):
> ```javascript
> if (item.reportedBy.toString() !== req.user._id.toString()) {
>   return res.status(403).json({
>     success: false,
>     message: 'Unauthorized: You can only modify your own reports'
>   });
> }
> ```
> If a malicious user attempts to forge a `PUT`, `PATCH`, or `DELETE` request with another report's ID, the backend compares the authenticated token's user ID with the database record's `reportedBy` field and rejects the request with HTTP 403 Forbidden.

### Q: How did you protect search inputs against NoSQL injection or ReDoS?
> **Answer**: When querying MongoDB using regular expressions for keywords or locations, user-supplied text can contain special characters (like `*`, `+`, `(`) that could crash the regex engine (Regular Expression Denial of Service). We wrote an `escapeRegex(text)` helper function that escapes all regex metacharacters with backslashes before constructing the query.

---

## 3. Database & Schemas

### Q: Why did you create separate schemas for LostItem and FoundItem instead of one shared collection?
> **Answer**:
> While lost and found belongings share general attributes (item name, category, description), their business logic and privacy requirements differ significantly:
> - **Lost Items** require `lastSeenLocation`, `lastSeenDate`, and have a lifecycle of `open` &rarr; `matched` &rarr; `resolved`.
> - **Found Items** require `foundLocation`, `foundDate`, and crucial finder contact details (`contactName`, `contactEmail`, `contactPhone`), with a lifecycle of `open` &rarr; `matched` &rarr; `returned`.
> Keeping them in separate collections ensures clean schema validation, prevents optional field confusion, and allows independent scaling and indexing.

### Q: What indexes did you define in Mongoose and why?
> **Answer**:
> - `{ email: 1 }` with `{ unique: true }` on User to prevent duplicate accounts.
> - `{ status: 1, category: 1, createdAt: -1 }` on both Lost and Found collections to optimize fast directory filtering and chronological sorting.
> - `{ reportedBy: 1, createdAt: -1 }` to make the student's "My Reports" dashboard load instantly.
> - Text search indexes on `itemName`, `description`, and locations.

---

## 4. Image Upload & Cloudinary

### Q: How does image uploading work without saving files permanently on the server?
> **Answer**:
> Platforms like Render have **ephemeral filesystems**—any files saved to local disk are wiped whenever the container restarts or re-deploys.
> In our application:
> 1. We configure Multer with `multer.memoryStorage()`. The uploaded image is stored briefly in RAM as a Buffer.
> 2. We validate the file size (maximum 5MB) and MIME type (JPEG, PNG, WebP).
> 3. We stream the buffer directly to Cloudinary using a Node.js readable stream and Cloudinary's `upload_stream` API into specific folders (`campusfind/lost` or `campusfind/found`).
> 4. Cloudinary returns a secure URL and a `public_id`.
> 5. We store only the URL and `public_id` in MongoDB.
> 6. When an item is deleted or replaced, we call `cloudinary.uploader.destroy(public_id)` to keep cloud storage clean.

### Q: What happens if Cloudinary is unavailable or credentials fail?
> **Answer**:
> We built a **Resilient Storage Fallback** in `backend/utils/uploadImage.js`:
> 1. The upload helper attempts to stream the image to Cloudinary first.
> 2. If Cloudinary returns an authorization error (e.g., HTTP 403) or network timeout, the helper catches the exception and automatically writes the file buffer to `backend/uploads/` with a sanitized unique filename.
> 3. The server then constructs a static URL (`/uploads/<filename>`) served by Express middleware `app.use('/uploads', express.static(...))`.
> 4. This guarantees that user report submissions never crash or fail due to external API hiccups.

---

## 5. Frontend & State Management

### Q: What is Redux Toolkit and how is it used here?
> **Answer**: Redux Toolkit (RTK) is the official, opinionated toolset for efficient Redux development. We use an `auth` slice (`userSlice.js`) that maintains the current student's login state (`user`, `token`, `isAuthenticated`). It synchronizes state with `localStorage` so student sessions persist across browser refreshes and tab reloads.

### Q: How does client-side routing work, and what is `ProtectedRoute`?
> **Answer**:
> Using React Router v7:
> - Public routes (`/`, `/lost-items`, `/found-items`, `/login`, `/register`) are accessible to anyone.
> - Sensitive action routes (`/report-lost`, `/report-found`, `/my-reports`) are wrapped in a `<ProtectedRoute>` component.
> - If an unauthenticated user attempts to visit `/report-lost`, `ProtectedRoute` intercepts the request and redirects them to `/login`, preserving the intended destination in `location.state.from` so they can be smoothly redirected back after logging in.

### Q: What are Axios Interceptors and why are they used?
> **Answer**:
> In `frontend/src/utils/api.js`:
> - **Request Interceptor**: Automatically reads the JWT from `localStorage` and injects `Authorization: Bearer <token>` into the headers of outgoing requests.
> - **Response Interceptor**: Intercepts HTTP 401 Unauthorized responses (such as when a token expires after 7 days) and automatically triggers the `logout` action to clear stale credentials and protect the user.

### Q: How does the 1-click "I Found This Item!" matching feature work?
> **Answer**:
> Finding a lost item often suffers from user drop-off if the finder has to re-type all item details from scratch. We resolved this through three unified touchpoints:
> 1. **On Lost Item Detail Page**: A prominent banner and action button open a pre-filled modal where item name, category, and description are automatically carried over.
> 2. **On Directory Cards**: Direct "I Found This" buttons navigate straight into the reporting modal.
> 3. **On Report Found Page**: A dynamic dropdown queries open lost items; selecting one auto-completes the entire form.
> When submitted, `matchedLostItemId` is saved to the found item, and the backend automatically updates the lost item's status to `matched`, showing an alert banner to the lost item owner with the finder's contact details.

### Q: How did you optimize contact details entry for finders?
> **Answer**:
> 1. Contact Name and Email are auto-populated from the logged-in student's Redux authentication profile.
> 2. Phone numbers are stored in browser `localStorage` (`campusfind_phone`) on input, so returning students never have to re-enter their phone number.
> 3. 1-click status presets allow finders to specify handover locations (*In my possession*, *Security Desk*, *Department Office*, *Library Reception*) without manual typing.

---

## 6. Deployment & Production

### Q: How are the frontend and backend deployed?
> **Answer**:
> - **Frontend (Vercel)**: Built with `npm run build` using Vite. Output in `dist/`. We included a `vercel.json` file configuring SPA rewrites so that nested routes like `/lost-items/:id` do not trigger a 404 on refresh.
> - **Backend (Render)**: Deployed as a Node Web Service running `npm start`. It connects to MongoDB Atlas using `MONGODB_URI` and configures CORS to allow requests from the deployed Vercel domain.
> - **Database (MongoDB Atlas)**: Cloud-hosted M0 MongoDB cluster with password authentication and configured IP network access.
> - **Secrets**: Sensitive keys (`JWT_SECRET`, `CLOUDINARY_API_SECRET`, `MONGODB_URI`) are strictly stored in environment variables and are never committed to version control.
