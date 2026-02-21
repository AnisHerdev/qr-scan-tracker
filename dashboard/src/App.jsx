import { useState, useEffect } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from './firebase';
import { QrCode, Activity, MapPin } from 'lucide-react';
import './index.css';

function App() {
  const [totalScans, setTotalScans] = useState(0);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
