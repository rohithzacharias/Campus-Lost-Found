# CampusFind — React + Vite Frontend

This directory contains the single-page React application for **CampusFind — Campus Lost & Found Portal**.

## Tech Stack
- React 19
- Vite
- Tailwind CSS
- Redux Toolkit
- Axios
- React Router v7

## Environment Configuration
Create a `.env` file in this directory:
```dotenv
VITE_API_URL=http://localhost:5000
```
For production, set `VITE_API_URL` to your deployed backend origin (e.g. `https://campusfind-backend.onrender.com`).

## Scripts
- `npm run dev`: Start local development server with Hot Module Replacement (HMR).
- `npm run build`: Compile and minify production bundles to `dist/`.
- `npm run lint`: Run ESLint checks.
- `npm run preview`: Preview the production build locally.
