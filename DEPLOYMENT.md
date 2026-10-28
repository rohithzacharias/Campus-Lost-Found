# CampusFind — Production Deployment Guide

This guide provides instructions for deploying CampusFind to production:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas
- **Image Hosting**: Cloudinary

---

## Part 1: MongoDB Atlas Configuration

1. **Create an Atlas Account & Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or register.
   - Create a free shared M0 cluster in your preferred region.

2. **Create a Database User**:
   - Under **Security** &rarr; **Database Access**, click **Add New Database User**.
   - Select **Password Authentication**.
   - Create a username (e.g., `campusfind_app`) and generate a strong password.
   - In **Database User Privileges**, select `Read and write to any database`.
   - Save the user credentials.

3. **Configure Network Access**:
   - Under **Security** &rarr; **Network Access**, click **Add IP Address**.
   - For Render cloud deployment (where outbound IPs are dynamic):
     - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
     - *Security note*: Ensure you use a strong database username and password, as Atlas enforces authentication on all connections.

4. **Obtain Connection String**:
   - Under **Deployments** &rarr; **Database**, click **Connect** on your cluster.
   - Choose **Drivers** &rarr; **Node.js**.
   - Copy the URI, replacing `<password>` with your database user password and specifying the database name as `/campusfind`:
     ```text
     mongodb+srv://campusfind_app:<password>@cluster0.abcde.mongodb.net/campusfind?retryWrites=true&w=majority
     ```

---

## Part 2: Backend Deployment on Render

1. **Create a Web Service on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repository containing CampusFind.

2. **Configure Service Details**:
   - **Name**: `campusfind-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: Choose the region closest to your MongoDB Atlas cluster.
   - **Branch**: `main` (or your active branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Configure Environment Variables**:
   In Render's **Environment** tab, add the following key-value pairs:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production environment flag |
   | `PORT` | `5000` (or leave default) | Render sets its own port automatically |
   | `MONGODB_URI` | `mongodb+srv://.../campusfind` | Your MongoDB Atlas connection URI |
   | `JWT_SECRET` | *32+ random characters* | Cryptographic signing secret |
   | `JWT_EXPIRES_IN`| `7d` | Session duration |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Your deployed Vercel domain |
   | `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary account name |
   | `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | `your_api_secret` | Cloudinary API secret |

4. **Deploy & Verify**:
   - Click **Create Web Service**.
   - Once deployed, visit `https://campusfind-backend.onrender.com/api/health` in your browser.
   - You should receive:
     ```json
     {
       "success": true,
       "status": "healthy",
       "database": {
         "connected": true,
         "readyState": 1,
         "name": "campusfind"
       }
     }
     ```

---

## Part 3: Frontend Deployment on Vercel

1. **Import Project to Vercel**:
   - Log in to [Vercel](https://vercel.com).
   - Click **Add New...** &rarr; **Project**.
   - Select your GitHub repository.

2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Configure Environment Variables**:
   Under **Environment Variables**, add:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://campusfind-backend.onrender.com` | Base origin of your deployed Render backend |

4. **Verify SPA Routing (`vercel.json`)**:
   CampusFind includes `frontend/vercel.json` with SPA rewrite rules:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   This guarantees that navigating directly or refreshing deep URLs like `/lost-items/:id` or `/found-items/:id` loads the React application without a 404 error.

5. **Deploy**:
   - Click **Deploy**.
   - After build completes, copy your Vercel deployment URL (e.g., `https://campusfind-portal.vercel.app`).
   - Return to Render and update the `FRONTEND_URL` environment variable with your Vercel production domain to allow CORS requests.

---

## Part 4: Post-Deployment Smoke Test

Verify the live application:
1. Visit the deployed Vercel site.
2. Confirm the Live Statistics Bar displays 0 counts initially without throwing errors.
3. Click **Register** and create a new student account.
4. Verify you are automatically logged in and your name appears in the top-right navbar.
5. Create a **Lost Item Report** with a photo. Confirm that Cloudinary serves the image thumbnail.
6. Create a **Found Item Report**.
7. Navigate to **My Reports** and test marking an item as **Resolved** or **Returned**.
8. Refresh the browser on `/lost-items/:id` to confirm deep linking works.
9. Click **Log Out** and confirm the session is terminated.
