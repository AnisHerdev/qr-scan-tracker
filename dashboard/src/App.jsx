import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth, googleProvider } from './firebase';
import { QrCode, Activity, MapPin, Plus, LogOut, Sun, Moon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './index.css';

// Recharts colors
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

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

  // Theme State
  const [theme, setTheme] = useState('light');

  // Sync theme with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="status-loader">
          <div className="spinner"></div>
          Authenticating...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Completely lock down dashboard)
  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2>QR Analytics Dashboard</h2>
            <p>Sign in to monitor real-time engagement</p>
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
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Authenticated State (Full Dashboard UI)

  // Format data for Recharts
  const chartData = locations
    .filter(loc => loc.scans > 0)
    .map(loc => ({
      name: loc.id.replace(/_/g, ' '),
      value: loc.scans
    }));

  return (
    <div className="app-wrapper">
      {/* Top Header */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '8px' }}>
            <Activity size={24} color="white" />
          </div>
          <h1>QR Analytics</h1>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="user-info">
            <span className="user-name">{user.displayName || 'Admin User'}</span>
            <span className="user-role">{user.email}</span>
          </div>

          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="profile-pic" />
          ) : (
            <div className="profile-pic" style={{ background: 'var(--accent-primary)' }}></div>
          )}

          <button onClick={handleLogout} className="icon-btn" aria-label="Logout" style={{ color: '#ef4444' }}>
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main 2-Column Grid */}
      <div className="dashboard-grid">

        {/* Left Column: Sidebar Locations List */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Tracked Locations</h2>
            <MapPin size={20} color="var(--text-secondary)" />
          </div>

          <div className="locations-list">
            {loading ? (
              <div className="status-loader"><div className="spinner"></div></div>
            ) : locations.length > 0 ? (
              locations.map((loc, index) => (
                <div key={loc.id} className="location-item">
                  <div className="location-info">
                    <span className="location-name">{loc.id.replace(/_/g, ' ')}</span>
                    <span className="location-subtext">Route id: {loc.id}</span>
                  </div>
                  <div className="location-score">
                    {loc.scans.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                No active locations found.
              </div>
            )}
          </div>

          {/* Location Creation Form at Bottom of Sidebar */}
          <form className="add-location-form" onSubmit={handleAddLocation}>
            <input
              type="text"
              className="location-input"
              value={newLocationId}
              onChange={(e) => setNewLocationId(e.target.value)}
              placeholder="Deploy new marker..."
              disabled={isSubmitting}
              required
            />
            <button
              type="submit"
              className="add-button"
              disabled={isSubmitting || !newLocationId.trim()}
              title="Add Location"
            >
              <Plus size={20} />
            </button>
          </form>
        </aside>

        {/* Right Column: Analytics & Visualization */}
        <main className="main-content">
          <div className="cards-row">
            {/* Total Scans Card */}
            <div className="highlight-card card-scans">
              <div className="card-header">
                <h3 className="card-title">Global Activity</h3>
                <div className="card-icon"><Activity size={20} color="#be185d" /></div>
              </div>
              <div>
                <p className="card-value">{totalScans.toLocaleString()}</p>
                <p className="card-subtitle">Total Valid Scans Recorded</p>
              </div>
            </div>

            {/* Active Nodes Card */}
            <div className="highlight-card card-activity">
              <div className="card-header">
                <h3 className="card-title">Active Nodes</h3>
                <div className="card-icon"><QrCode size={20} color="#047857" /></div>
              </div>
              <div>
                <p className="card-value">{locations.length}</p>
                <p className="card-subtitle">Active Deployed Locations</p>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="chart-section">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Traffic Distribution</h3>
                <span className="chart-subtitle">Relative performance of all deployment zones</span>
              </div>
            </div>

            <div className="pie-chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="90%" height={325}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '2px solid',
                        boxShadow: 'var(--shadow-md)',
                        background: 'var(--bg-secondary)',
                        padding: '10px',
                        fontSize: '14px'
                      }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: '600' }}
                      labelStyle={{ color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '4px' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    {/* <Legend verticalAlign="bottom" height={36} /> */}
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="var(--bg-secondary)"
                      strokeWidth={2}
                      label={({ name }) => name}
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>Awaiting scan data to generate visuals...</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
