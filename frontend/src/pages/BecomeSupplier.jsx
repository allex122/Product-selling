import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App.jsx';
import { User, Mail, ShieldCheck, HelpCircle, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function BecomeSupplier() {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [accountsType, setAccountsType] = useState('Gmail');
  const [capacity, setCapacity] = useState('100-500 per day');
  const [message, setMessage] = useState('');
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    const ticketMessage = `
[SUPPLIER APPLICATION]
Telegram Handle: ${telegram}
Accounts to Supply: ${accountsType}
Daily Supply Capacity: ${capacity}
Message/Details: ${message}
    `.trim();

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user ? user.id : null,
          name,
          email,
          message: ticketMessage
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Your supplier application has been submitted! Our onboarding manager will contact you on Telegram or Email.');
        setTelegram('');
        setMessage('');
      } else {
        setError(data.message || 'Failed to submit application');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <section className="text-center" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Become a Supplier on <span className="color-accent">CYBER2</span>
        </h2>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
          Sell your bulk verified accounts automatically. We purchase high-quality social media profiles, email lists, and digital assets.
        </p>
      </section>

      {success ? (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '1rem', marginInline: 'auto' }} />
          <h3>Application Submitted Successfully!</h3>
          <p style={{ margin: '1rem 0 2rem', color: 'var(--text-secondary)' }}>{success}</p>
          <a href="/" className="btn btn-primary btn-sm">Return to Marketplace</a>
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Supplier Terms / Benefits */}
          <div>
            <h3 style={{ textTransform: 'uppercase', marginBottom: '1.5rem' }}>Why partner with us?</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon" style={{ flexShrink: 0 }}><ShieldCheck size={20} /></div>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>Automated Sales</h4>
                <p style={{ fontSize: '0.9rem' }}>Our platform exposes your inventory to thousands of bulk buyers via API partners, ensuring instant sales.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon" style={{ flexShrink: 0 }}><Send size={20} /></div>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>Fast Payments</h4>
                <p style={{ fontSize: '0.9rem' }}>Get compensated weekly using Crypto (USDT), bKash, or Nagad without delays once stock is verified.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon" style={{ flexShrink: 0 }}><HelpCircle size={20} /></div>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>Transparent Logs</h4>
                <p style={{ fontSize: '0.9rem' }}>Real-time stock tracking and purchase alerts are logged so you always know what sold and what's remaining.</p>
              </div>
            </div>
            
            <div className="alert alert-danger" style={{ marginTop: '2rem', fontSize: '0.85rem' }}>
              <span>⚠️ <strong>Note:</strong> We strictly verify account parameters (phone, profile, aged status) before opening supplier lines. Fake or spam accounts will result in supplier ban.</span>
            </div>
          </div>

          {/* Registration Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', textTransform: 'uppercase' }}>Supplier Application</h3>
            
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telegram Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="@telegram_handle"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Supply Type</label>
                <select
                  className="form-control"
                  style={{ background: 'var(--bg-surface)' }}
                  value={accountsType}
                  onChange={(e) => setAccountsType(e.target.value)}
                >
                  <option value="Gmail">Gmail / Yahoo / Outlook</option>
                  <option value="Facebook">Facebook (Aged, USA, Ads)</option>
                  <option value="Instagram">Instagram / TikTok / Threads</option>
                  <option value="Google Voice">Google Voice / WhatsApp / Telegram</option>
                  <option value="Other">Other Services</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Daily Delivery Capacity</label>
                <select
                  className="form-control"
                  style={{ background: 'var(--bg-surface)' }}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                >
                  <option value="Under 100 per day">Under 100 per day</option>
                  <option value="100-500 per day">100-500 per day</option>
                  <option value="500-2000 per day">500-2000 per day</option>
                  <option value="2000+ per day">2000+ per day</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Additional Message / Inventory details</label>
                <textarea
                  className="form-control"
                  style={{ height: '90px', resize: 'none' }}
                  placeholder="Describe your stock origin, pricing, or verification methods..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <MessageSquare size={16} />
                {loading ? 'Submitting...' : 'Submit Vendor Application'}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
