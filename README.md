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

### 3. Initialize Firestore Document
In your Firebase Console, navigate to Firestore Database and create a document:
- Collection: `stats`
- Document ID: `qr_scans`
- Field: `scans` (Type: Number, Value: `0`)

Your `firestore.rules` (already configured in this repo) will lock this down so external users can *only* increment the `scans` field by exactly 1, protecting you from abuse.

### 4. Running the Dashboard Locally
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
