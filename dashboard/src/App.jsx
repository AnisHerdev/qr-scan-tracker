import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from './firebase';
import { QrCode, Activity, MapPin, Plus } from 'lucide-react';
import './index.css';

function App() {
  const [totalScans, setTotalScans] = useState(0);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for location creation
  const [newLocationId, setNewLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if configuration is set by validating projectId exists
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setError("Firebase is not configured. Please add your credentials to the .env file.");
      setLoading(false);
      return;
    }

    try {
      const locationsRef = collection(db, 'locations');

      // Setup realtime listener for the entire locations collection
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

        // Sort locations by scan count (highest first)
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
  }, []);

  // Listen to Auth State
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error("Login mapping error:", err);
      setError("Invalid admin credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    const formattedId = newLocationId.trim().toLowerCase().replace(/\s+/g, '_');

    if (!formattedId) return;

    // Check if location already exists to avoid overwriting scans to 0
    if (locations.find(loc => loc.id === formattedId)) {
      alert("This location already exists!");
      return;
    }

    setIsSubmitting(true);
    try {
      const locationRef = doc(db, 'locations', formattedId);
      // Initialize the new location with 0 scans
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="floating-icon">Event QR Analytics</h1>
        <p>Real-time Engagement Monitoring</p>
      </div>

      <div className="metric-card">
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

      {!loading && !error && !user && (
        <div className="auth-container">
          <div className="auth-header">
            <Lock size={20} color="#94a3b8" />
            <h3>Admin Access Required</h3>
            <p>Login to pre-initialize new locations</p>
          </div>
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin Email"
              className="location-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="location-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="add-button" disabled={isLoggingIn}>
              <LogIn size={18} />
              {isLoggingIn ? 'Logging in...' : 'Login Securely'}
            </button>
          </form>
        </div>
      )}

      {!loading && !error && user && (
        <div className="admin-panel">
          <div className="admin-header">
            <span className="admin-badge">Admin Authenticated</span>
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={16} /> Logout
            </button>
          </div>
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
