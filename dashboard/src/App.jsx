import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from './firebase';
import { QrCode, Activity } from 'lucide-react';
import './index.css';

function App() {
  const [scans, setScans] = useState(0);
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
      const statsRef = doc(db, 'stats', 'qr_scans');

      // Setup realtime listener
      const unsubscribe = onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
          setScans(docSnap.data().scans || 0);
          setError(null);
        } else {
          // Document doesn't exist yet, we'll wait for the first scan to create it
          // OR it might need to be created manually by the admin first depending on rules
          setScans(0);
        }
        setLoading(false);
      }, (err) => {
        console.error("Error listening to stats:", err);
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
          <div className="scan-count">{scans.toLocaleString()}</div>
        )}
        <div className="scan-label">
          <QrCode size={24} color="#3b82f6" />
          Total Scans
        </div>
      </div>

      <div className="status-indicator">
        <div className="pulse"></div>
        <Activity size={16} />
        Live Connection Active
      </div>

      {error && (
        <div className="error-message">
          <strong>Setup Required:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default App;
