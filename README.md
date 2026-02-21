# QR Scan Tracker System

A lightweight, reliable QR-based analytics system designed for high concurrency on the free tier. It accurately tracks QR code scans using a lightning-fast vanilla HTML/JS redirect and displays real-time engagement metrics on a premium React + Vite dashboard.

## Overview
- **Redirect (`public/index.html`)**: When users scan the QR code, they land here. It uses the Firebase Web SDK via CDN to atomically increment a Firestore counter (`FieldValue.increment(1)`) and instantly redirect them to your event page.
- **Admin Dashboard (`dashboard/`)**: A sleek, dark-mode glassmorphism UI built with React and Vite. It listens to the Firestore document in real-time to show live scan counts. It is compiled and deployed to `/admin` using Firebase Hosting rewrites.

## Setup Instructions

### 1. Firebase Project Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database** and **Firebase Hosting**.
3. Register a Web App in the console to get your Firebase config keys.

### 2. Configure Environment Variables
Copy the `.env.example` file to create your own `.env` file in the `dashboard` directory:
```bash
cp dashboard/.env.example dashboard/.env
```
Open `dashboard/.env` and paste your Firebase API keys.

Also, open `public/index.html` and replace the `firebaseConfig` object variables and the `TARGET_URL` (the page users should be routed to after counting the scan).

### 3. Initialize Location Trackers
To prevent abuse, external users scanning QR codes **cannot** create new locations in the database. They can only increment locations that already exist.

**To create your locations:**
Simply run the dashboard locally (see the next step), and use the built-in **"Add Location"** form to create your tracking points (e.g., `main_gate`, `library`, `cafeteria`).

### 4. Generating the QR Codes
When generating QR Codes, just append the `?loc=` query parameter to your base URL:
- Base QR: `https://your-domain.web.app/?loc=main_gate`
- Library QR: `https://your-domain.web.app/?loc=library`
- Cafeteria QR: `https://your-domain.web.app/?loc=cafeteria`

The redirect script will safely increment the respective document in Firestore, and the dashboard will aggregate them all into a Global Total automatically!

### 5. Running the Dashboard Locally
```bash
cd dashboard
npm install
npm run dev
```
Visit http://localhost:5173 to view your dashboard.

### 5. Deployment
Deploy both the redirect page and the built dashboard to Firebase Hosting.
```bash
# Build the dashboard into the public/admin directory
cd dashboard
npm run build

# Deploy via Firebase CLI from the root directory
cd ..
firebase deploy
```
