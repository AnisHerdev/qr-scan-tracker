import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth, googleProvider } from './firebase';
import { QrCode, Activity, MapPin, Plus, LogOut, Lock } from 'lucide-react';
import './index.css';

function App() {
  const [totalScans, setTotalScans] = useState(0);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // New state for location creation
  const [newLocationId, setNewLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

  // Handle Firebase Auth 
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setError("Firebase is not configured. Please add your credentials to the .env file.");
      setLoading(false);
      setAuthLoading(false);
      return;
    }

    // Listen to Auth State - this persists across page reloads
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore ONLY if user is authenticated
  useEffect(() => {
    if (!user) {
      // Clear data if logged out
      setLocations([]);
      setTotalScans(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const locationsRef = collection(db, 'locations');

      const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
        let total = 0;
        const locationsData = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          total += (data.scans || 0);
          locationsData.push({
            id: doc.id,
            scans: data.scans || 0,
            lastScanned: data.lastScanned
          });
        });

        locationsData.sort((a, b) => b.scans - a.scans);

        setTotalScans(total);
        setLocations(locationsData);
        setError(null);
        setLoading(false);
      }, (err) => {
        console.error("Error listening to locations:", err);
        setError("Missing permissions or connection error. Check your Firebase Rules.");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Initialization error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      // This uses a popup so the current page doesn't unload
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login popup error:", err);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    const formattedId = newLocationId.trim().toLowerCase().replace(/\s+/g, '_');

    if (!formattedId) return;

    if (locations.find(loc => loc.id === formattedId)) {
      alert("This location already exists!");
      return;
    }

    setIsSubmitting(true);
    try {
      const locationRef = doc(db, 'locations', formattedId);
      await setDoc(locationRef, {
        scans: 0,
        lastScanned: null
      });
      setNewLocationId('');
    } catch (err) {
      console.error("Error adding location:", err);
      alert("Failed to add location. Check your permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State (Checking Authentication Status)
  if (authLoading) {
    return (
      <div className="dashboard-container">
        <div className="status-indicator">
          <div className="pulse"></div>
          Authenticating...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Completely lock down dashboard)
  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="floating-icon">Event QR Analytics</h1>
          <p>Restricted Dashboard</p>
        </div>

        <div className="auth-container">
          <div className="auth-header">
            <Lock size={20} color="#94a3b8" />
            <h3>Authentication Required</h3>
            <p>Connect your Google account to proceed</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="google-btn"
            disabled={isLoggingIn}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isLoggingIn ? 'Redirecting...' : 'Sign in with Google'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    );
  }

  // 3. Authenticated State (Full Dashboard)
  // Check if current user is allowed to ADD locations
  // (Optional email validation. If an email is supplied, check against it)
  const isAdmin = !adminEmail || user.email === adminEmail;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="floating-icon">Event QR Analytics</h1>
        <p>Real-time Engagement Monitoring</p>
      </div>

      <div className="admin-header">
        <span className="admin-badge">
          {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
          {user.displayName || user.email}
        </span>
        <button onClick={handleLogout} className="logout-button">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="metric-card" style={{ marginTop: '2rem' }}>
        {loading ? (
          <div className="scan-count" style={{ opacity: 0.5 }}>...</div>
        ) : (
          <div className="scan-count">{totalScans.toLocaleString()}</div>
        )}
        <div className="scan-label">
          <QrCode size={24} color="#3b82f6" />
          Global Total Scans
        </div>
      </div>

      <div className="status-indicator">
        <div className="pulse"></div>
        <Activity size={16} />
        Live Connection Active
      </div>

      {!loading && !error && isAdmin && (
        <form className="add-location-form" onSubmit={handleAddLocation}>
          <input
            type="text"
            className="location-input"
            value={newLocationId}
            onChange={(e) => setNewLocationId(e.target.value)}
            placeholder="e.g. main gate, library"
            disabled={isSubmitting}
            required
          />
          <button
            type="submit"
            className="add-button"
            disabled={isSubmitting || !newLocationId.trim()}
          >
            <Plus size={18} />
            {isSubmitting ? 'Adding...' : 'Add Location'}
          </button>
        </form>
      )}

      {/* Warning message if a non-admin validly logs in but can't add data */}
      {!isAdmin && (
        <div className="info-message" style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          Viewing as guest. Contact the administrator to manage location markers.
        </div>
      )}

      {!loading && locations.length > 0 && (
        <div className="locations-wrapper">
          <h3 className="locations-title">Scans by Location</h3>
          <div className="locations-list">
            {locations.map((loc) => (
              <div key={loc.id} className="location-item">
                <div className="location-info">
                  <MapPin size={18} color="#a78bfa" />
                  <span className="location-name">{loc.id.replace(/_/g, ' ')}</span>
                </div>
                <div className="location-score">
                  {loc.scans.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Setup Required:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default App;
