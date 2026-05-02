# QR Scan Tracker

## Overview
A lightweight, reliable QR-based analytics system designed for high concurrency and real-time tracking. It captures QR code scans using a lightning-fast vanilla HTML/JS redirector and visualizes engagement metrics on a premium React dashboard. This system is optimized for the Firebase free tier while maintaining high performance and security.

The project is split into two primary components:
1. **Redirector (`public/`)**: A minimal, CDN-driven script that atomically increments scan counts in Firestore before instantly forwarding users to their destination.
2. **Admin Dashboard (`dashboard/`)**: A sleek, themeable glassmorphism UI that provides real-time traffic distribution charts and location management.

## The Motivation: Data-Driven Outreach
This project was born out of a simple question: **"Are we placing our posters in the right spots?"**

While serving in a university student club, I noticed that our outreach efforts often relied on guesswork—pinning flyers where we *think* people might look. To solve this and transition from intuition to insight, I conceptualized and built this QR Tracking System. By assigning unique identifiers to physical locations across campus (such as the library, canteen, and various academic blocks), the system turns every scan into a tangible data point.

The goal was to empower organizers with real-time analytics to answer three critical questions:
- **Where is the "Heat"?**: Which specific location is generating the most engagement?
- **Trend Analysis**: How does scan activity vary across different deployment zones?
- **Engagement Strategy**: Which spots consistently deliver the highest foot traffic for our events?

The result is a tool that moves outreach beyond guesswork and into the realm of data-driven strategy.

## Key Features
- **Atomic Tracking**: Uses Firestore `increment()` to handle concurrent scans without data loss.
- **Real-time Analytics**: Live updates on the dashboard as scans happen, powered by Firestore snapshots.
- **Multi-Location Support**: Track different physical locations using simple URL query parameters.
- **Secure Admin Access**: Google Authentication ensures only authorized users can manage locations and view data.
- **Minimal Redirection Latency**: The redirector uses native JS and Firebase CDN to ensure a near-instant user experience.
- **Modern UI/UX**: Dark and light mode support with fluid animations and responsive charts.

## Technology Stack
- **Frontend**: React 19, Vite, Vanilla CSS (Custom Properties)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Provider)
- **Hosting**: Firebase Hosting (Multi-target configuration)
- **Icons & Charts**: Lucide React, Recharts

## Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase Project with Firestore and Hosting enabled

### Installation
1. Clone the repository
2. Install dashboard dependencies:
   ```powershell
   cd dashboard
   npm install
   ```

### Configuration
1. **Dashboard**: Create a `dashboard/.env` file based on `.env.example` and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
2. **Redirector**: Update the `firebaseConfig` and `TARGET_URL` in `public/index.html` to match your project settings.

## Running the Project Locally

### Start Dashboard
```powershell
cd dashboard
npm run dev
```
The dashboard will be available at `http://localhost:5173`. You will need to sign in with a Google account to access the data.

### Test Redirector
You can serve the `public` directory using any local server (or use `firebase serve`) to test the redirection logic.

## Usage

### 1. Initialize Locations
Open the dashboard and use the "Deploy new marker..." form to create tracking IDs (e.g., `main_gate`, `hall_a`).

### 2. Generate QR Links
Append the `?loc=` parameter to your deployed URL. 
- **Base QR**: `https://your-domain.web.app/?loc=main_gate`
- **Library QR**: `https://your-domain.web.app/?loc=library`
- **Cafeteria QR**: `https://your-domain.web.app/?loc=cafeteria`

### 3. Monitor Scans
The dashboard will automatically update the "Global Activity" count and "Traffic Distribution" chart as users scan your codes.

## Project Structure
- `dashboard/` — React + Vite source code for the admin interface.
- `public/` — Static assets and the high-speed redirection entry point.
- `firebase.json` — Deployment and hosting configuration for multi-site targets.
- `firestore.rules` — Security rules to protect scan data and limit write access.

## Deployment
Build the dashboard and deploy the entire project:
```powershell
cd dashboard
npm run build
cd ..
firebase deploy
```
