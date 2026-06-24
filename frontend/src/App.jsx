import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, LogIn, User, ShieldAlert, LogOut, Wallet, ShoppingBag, MessageSquare, Check, Users } from 'lucide-react';
import Home from './pages/Home.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BecomeSupplier from './pages/BecomeSupplier.jsx';

// Create Auth Context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (jwtToken) => {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      } else {
        logout();
      }
    } catch (e) {
      console.error(e);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const refreshBalance = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (e) {
      console.error('Failed to refresh balance:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshBalance, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function Navigation() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand">
        CYBER<span>2</span>
      </Link>
      
      <nav className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <ShoppingBag size={18} />
          Marketplace
        </Link>
        <Link to="/become-supplier" className={`nav-link ${location.pathname === '/become-supplier' ? 'active' : ''}`}>
          <Users size={18} />
          Become Supplier
        </Link>
        {user && (
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <Wallet size={18} />
            My Dashboard
          </Link>
        )}
        {user && user.role === 'admin' && (
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            <ShieldAlert size={18} />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="nav-auth">
        {user ? (
          <div className="flex align-center gap-4">
            <div className="flex align-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Wallet size={16} className="color-accent" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Balance:</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(user.balance).toFixed(2)}</span>
            </div>
            <div className="flex align-center gap-2">
              <User size={16} className="color-accent" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{user.name}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-outline btn-sm">
              <LogIn size={16} /> Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (adminOnly && user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [user, loading, navigate, adminOnly]);

  if (loading) return <div className="text-center" style={{ padding: '5rem' }}><div className="pulse">LOADING CYBER2...</div></div>;
  if (!user || (adminOnly && user.role !== 'admin')) return null;

  return children;
}

function LiveChat() {
  const { user, token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default name/email if user is logged in
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user ? user.id : null,
          name,
          email,
          message
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Ticket submitted! We will email you back shortly.');
        setMessage('');
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (e) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating bubble button */}
      <div className="floating-chat-bubble" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>×</span> : <MessageSquare size={22} />}
      </div>

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span className="chat-title">
              <MessageSquare size={16} className="color-accent" />
              CYBER2 Live Chat
            </span>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chat-body">
            <div className="chat-welcome-box">
              🤖 Welcome to CYBER2 Support! Need quick answers? Connect with our team instantly:
            </div>

            <div className="chat-social-buttons">
              <a href="https://t.me/cyber2_resell" target="_blank" rel="noreferrer" className="chat-social-btn tg-btn">
                Telegram
              </a>
              <a href="https://wa.me/8801700000000" target="_blank" rel="noreferrer" className="chat-social-btn wa-btn">
                WhatsApp
              </a>
            </div>

            <div className="chat-divider">Or Leave a Message</div>

            {success ? (
              <div className="alert alert-success" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', marginTop: '1rem' }}>
                <Check size={16} />
                <span>{success}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {error && (
                  <div className="alert alert-danger" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}>
                    <span>{error}</span>
                  </div>
                )}
                
                <input
                  type="text"
                  placeholder="Your Name"
                  className="form-control"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!!user} // prefilled and locked for registered users
                />
                
                <input
                  type="email"
                  placeholder="Your Email"
                  className="form-control"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!!user}
                />

                <textarea
                  placeholder="Type your question here..."
                  className="form-control"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', height: '80px', resize: 'none' }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />

                <button type="submit" className="btn btn-primary btn-sm btn-block" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <div className="ambient-glow-1"></div>
          <div className="ambient-glow-2"></div>
          
          <Navigation />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/listings/:slug" element={<ListingDetail />} />
              <Route path="/become-supplier" element={<BecomeSupplier />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <Admin />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <p>© {new Date().getFullYear()} CYBER2 Store. All rights reserved.</p>
          </footer>
          
          {/* Floating Live Chat Widget */}
          <LiveChat />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
