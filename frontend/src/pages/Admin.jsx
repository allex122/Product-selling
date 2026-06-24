import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App.jsx';
import { 
  ShieldAlert, Users, TrendingUp, DollarSign, Wallet, 
  Settings, Check, X, Shield, PlusCircle, MinusCircle, Eye, MessageSquare 
} from 'lucide-react';

export default function Admin() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'deposits', 'users', 'orders', 'settings', 'support'
  const [stats, setStats] = useState({});
  const [deposits, setDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [settings, setSettings] = useState({
    accsbulk_api_key: '',
    markup_percent: '',
    wow_smm_api_key: '',
    smm_markup_percent: '',
    payment_bkash: '',
    payment_nagad: '',
    payment_crypto: ''
  });

  // Action status/alerts
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // User Balance adjustment state
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustAction, setAdjustAction] = useState('add'); // 'add', 'deduct', 'set'

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch pending & all deposits
      const depositsRes = await fetch('/api/admin/deposits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const depositsData = await depositsRes.json();
      if (depositsData.success) setDeposits(depositsData.data);

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.data);

      // Fetch all resell orders
      const ordersRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) setOrders(ordersData.data);

      // Fetch current settings
      const settingsRes = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsData.success) setSettings(settingsData.data);

      // Fetch support tickets
      const supportRes = await fetch('/api/admin/support', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const supportData = await supportRes.json();
      if (supportData.success) setTickets(supportData.data);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, activeTab]);

  const handleResolveTicket = async (id) => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/admin/support/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Ticket marked as resolved successfully');
        fetchAdminData();
      } else {
        setError(data.message || 'Failed to resolve ticket');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  const handleApproveDeposit = async (id) => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Deposit request approved successfully');
        fetchAdminData();
      } else {
        setError(data.message || 'Approval failed');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  const handleRejectDeposit = async (id) => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Deposit request rejected');
        fetchAdminData();
      } else {
        setError(data.message || 'Rejection failed');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Settings updated successfully');
        fetchAdminData();
      } else {
        setError(data.message || 'Settings update failed');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  const handleBalanceAdjust = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!selectedUser || !adjustAmount || isNaN(parseFloat(adjustAmount))) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(adjustAmount),
          action: adjustAction
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Balance updated for user ${selectedUser.name}`);
        setSelectedUser(null);
        setAdjustAmount('');
        fetchAdminData();
      } else {
        setError(data.message || 'Failed to update balance');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Sidebar Controls */}
      <div className="sidebar">
        <h3 className="sidebar-title">CYBER2 Command</h3>
        <div style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} className="color-accent" />
          <span style={{ fontWeight: 'bold' }}>SYSTEM ROOT</span>
        </div>

        <div className="sidebar-title">Controls</div>
        <div className="sidebar-menu">
          <button onClick={() => setActiveTab('stats')} className={`sidebar-btn ${activeTab === 'stats' ? 'active' : ''}`}>
            <TrendingUp size={18} />
            Stats Overview
          </button>
          <button onClick={() => setActiveTab('deposits')} className={`sidebar-btn ${activeTab === 'deposits' ? 'active' : ''}`}>
            <Wallet size={18} />
            User Deposits
            {deposits.filter(d => d.status === 'pending').length > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                {deposits.filter(d => d.status === 'pending').length} New
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('orders')} className={`sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`}>
            <DollarSign size={18} />
            Store Orders
          </button>
          <button onClick={() => setActiveTab('users')} className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}>
            <Users size={18} />
            Users Management
          </button>
          <button onClick={() => setActiveTab('support')} className={`sidebar-btn ${activeTab === 'support' ? 'active' : ''}`}>
            <MessageSquare size={18} />
            Support Tickets
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}>
            <Settings size={18} />
            Store Settings
          </button>
        </div>
      </div>

      {/* Admin Content Panels */}
      <div>
        {message && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <Check size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Stats */}
        {activeTab === 'stats' && (
          <div>
            <h3>CYBER2 Financial & Core Status</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Real-time analytics for earnings, user registers, and API wallet health.
            </p>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><Users size={20} /></div>
                <div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-value">{stats.total_users || 0}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><DollarSign size={20} /></div>
                <div>
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">{stats.total_orders || 0}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ color: 'var(--success)', background: 'rgba(52, 199, 89, 0.08)' }}><TrendingUp size={20} /></div>
                <div>
                  <div className="stat-label">Revenue Collected</div>
                  <div className="stat-value">${stats.revenue || '0.00'}</div>
                </div>
              </div>

              <div className="stat-card" style={{ border: '1px solid rgba(52, 199, 89, 0.3)' }}>
                <div className="stat-icon" style={{ color: 'var(--success)', background: 'rgba(52, 199, 89, 0.08)' }}><DollarSign size={20} /></div>
                <div>
                  <div className="stat-label">Store Net Profit</div>
                  <div className="stat-value" style={{ color: 'var(--success)' }}>${stats.profit || '0.00'}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <h4 style={{ textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                AccsBulk API Provider Health
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div className="stat-label">Provider Connection Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: stats.provider_status === 'Connected' ? 'var(--success)' : 'var(--accent)' }}></div>
                    <span className="font-bold">{stats.provider_status || 'Disconnected'}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div className="stat-label">Your Balance on AccsBulk API</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <span className="font-bold" style={{ fontSize: '1.5rem' }}>
                      {stats.provider_balance !== 'N/A' ? `$${parseFloat(stats.provider_balance).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Make sure to deposit funds to your accsbulk.com panel to cover customer orders.
                  </span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem', marginTop: '1.5rem' }}>
              <h4 style={{ textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                WOW SMM Panel API Provider Health
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div className="stat-label">SMM Provider Connection Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: stats.smm_status === 'Connected' ? 'var(--success)' : 'var(--accent)' }}></div>
                    <span className="font-bold">{stats.smm_status || 'Disconnected'}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div className="stat-label">Your Balance on WOW SMM Panel</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <span className="font-bold" style={{ fontSize: '1.5rem' }}>
                      {stats.smm_balance !== 'N/A' && stats.smm_balance !== undefined ? `$${parseFloat(stats.smm_balance).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Make sure to deposit funds to your wowsmmpanel.com panel to cover SMM orders.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Deposits Approval */}
        {activeTab === 'deposits' && (
          <div>
            <h3>Pending Deposit Approvals</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Verify transaction IDs from users (bKash, Nagad, and Crypto) and approve credits.
            </p>

            {deposits.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No deposit requests on record.</p>
            ) : (
              <div className="table-container">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>TxID Reference</th>
                        <th>Request Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((dep) => (
                        <tr key={dep.id}>
                          <td>
                            <div className="font-bold">{dep.user_name}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dep.user_email}</span>
                          </td>
                          <td className="font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(dep.amount).toFixed(2)}</td>
                          <td style={{ textTransform: 'uppercase' }}>{dep.payment_method}</td>
                          <td style={{ fontFamily: 'monospace' }}>{dep.transaction_id}</td>
                          <td>{new Date(dep.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge badge-${dep.status}`}>
                              {dep.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {dep.status === 'pending' ? (
                              <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => handleApproveDeposit(dep.id)} 
                                  className="btn btn-primary btn-sm"
                                  style={{ background: 'var(--success)', boxShadow: 'none', padding: '0.25rem 0.5rem' }}
                                  title="Approve & Credit Balance"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => handleRejectDeposit(dep.id)} 
                                  className="btn btn-outline btn-sm"
                                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)', padding: '0.25rem 0.5rem' }}
                                  title="Reject"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Store Orders */}
        {activeTab === 'orders' && (
          <div>
            <h3>All Store Orders</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Orders successfully fulfilled via API, along with markup margin profit earned.
            </p>

            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders found.</p>
            ) : (
              <div className="table-container">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>User Email</th>
                        <th>Service / Listing</th>
                        <th>Qty</th>
                        <th>Price Paid</th>
                        <th>Margin (Profit)</th>
                        <th>Date</th>
                        <th>SMM Link / Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td>#{ord.id}</td>
                          <td>
                            <span className={`badge ${ord.order_type === 'smm' ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '0.65rem' }}>
                              {ord.order_type === 'smm' ? 'SMM' : 'Account'}
                            </span>
                          </td>
                          <td>{ord.user_email}</td>
                          <td className="font-bold">{ord.listing_title}</td>
                          <td>{ord.quantity}</td>
                          <td className="font-bold">${parseFloat(ord.price_paid).toFixed(2)}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>+${parseFloat(ord.margin_earned).toFixed(2)}</td>
                          <td>{new Date(ord.purchased_at).toLocaleDateString()}</td>
                          <td>
                            {ord.order_type === 'smm' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <a href={ord.link} target="_blank" rel="noreferrer" className="color-accent" style={{ fontSize: '0.8rem', textDecoration: 'underline' }}>
                                  View Link
                                </a>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {ord.status}</span>
                              </div>
                            ) : (
                              <button onClick={() => setSelectedOrder(ord)} className="btn btn-outline btn-sm">
                                <Eye size={12} /> Accounts
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: User Management */}
        {activeTab === 'users' && (
          <div>
            <h3>Registered Customers</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              View customer profiles and adjust wallet balances manually for credits/refunds.
            </p>

            <div className="table-container">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Current Balance</th>
                      <th>Joined Date</th>
                      <th style={{ textAlign: 'right' }}>Wallet Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td className="font-bold">{u.name} {u.role === 'admin' && <span className="badge badge-approved" style={{ fontSize: '0.65rem', marginLeft: '0.25rem' }}>Admin</span>}</td>
                        <td>{u.email}</td>
                        <td className="font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(u.balance).toFixed(2)}</td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedUser(u)} 
                            className="btn btn-outline btn-sm"
                            disabled={u.role === 'admin'}
                          >
                            Adjust Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Adjust Balance Dialog */}
            {selectedUser && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3 style={{ marginBottom: '1rem', textTransform: 'uppercase' }}>Manual Balance Adjustment</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Adjusting balance for: <strong>{selectedUser.name}</strong> ({selectedUser.email})<br />
                    Current Balance: <strong>${selectedUser.balance.toFixed(2)}</strong>
                  </p>

                  <form onSubmit={handleBalanceAdjust}>
                    <div className="form-group">
                      <label className="form-label">Action</label>
                      <select 
                        className="form-control" 
                        value={adjustAction} 
                        onChange={(e) => setAdjustAction(e.target.value)}
                        style={{ background: 'var(--bg-surface)' }}
                      >
                        <option value="add">Add Balance (+)</option>
                        <option value="deduct">Deduct Balance (-)</option>
                        <option value="set">Set Fixed Balance (=)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Amount (USD)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        placeholder="0.00"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-4" style={{ marginTop: '1.5rem' }}>
                      <button type="button" onClick={() => setSelectedUser(null)} className="btn btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary flex-1">
                        Save Adjustments
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Store Settings */}
        {activeTab === 'settings' && (
          <div>
            <h3>Store Configurations</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Set up API connection keys, price markups, and configure manual payment instructions.
            </p>

            <div className="card" style={{ padding: '2rem' }}>
              <form onSubmit={handleSettingsSubmit}>
                <h4 style={{ textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent)' }}>AccsBulk Connection</h4>
                <div className="form-group">
                  <label className="form-label">AccsBulk API Connection Key</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.accsbulk_api_key}
                    onChange={(e) => setSettings({ ...settings, accsbulk_api_key: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="form-label">Profit Markup Margin (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.markup_percent}
                    onChange={(e) => setSettings({ ...settings, markup_percent: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Prices imported from the provider will be increased by this percentage in the public storefront. E.g. $10.00 with 15% markup becomes $11.50.
                  </span>
                </div>

                <h4 style={{ textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent)', marginTop: '2rem' }}>WOW SMM Panel Connection</h4>
                <div className="form-group">
                  <label className="form-label">WOW SMM API Connection Key</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.wow_smm_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, wow_smm_api_key: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="form-label">SMM Profit Markup Margin (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.smm_markup_percent || ''}
                    onChange={(e) => setSettings({ ...settings, smm_markup_percent: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    SMM services prices imported from wowsmmpanel.com will be increased by this percentage.
                  </span>
                </div>

                <h4 style={{ textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent)' }}>Payment Method Instructions</h4>
                <div className="form-group">
                  <label className="form-label">bKash Instructions Header</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.payment_bkash}
                    onChange={(e) => setSettings({ ...settings, payment_bkash: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nagad Instructions Header</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.payment_nagad}
                    onChange={(e) => setSettings({ ...settings, payment_nagad: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Crypto Instructions Header</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.payment_crypto}
                    onChange={(e) => setSettings({ ...settings, payment_crypto: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Settings & Update Store
                </button>
              </form>
            </div>
          </div>
        )}
        
        {/* Tab 6: Support Tickets */}
        {activeTab === 'support' && (
          <div>
            <h3>Customer Support Tickets</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Handle messages and vendor supply applications submitted via Live Chat and Supplier Registration.
            </p>

            {tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No support requests on record.</p>
            ) : (
              <div className="table-container">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Sender</th>
                        <th>Message Content</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div className="font-bold">{t.name}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</span>
                          </td>
                          <td>
                            <div style={{ 
                              whiteSpace: 'pre-wrap', 
                              fontSize: '0.85rem', 
                              maxHeight: '120px', 
                              overflowY: 'auto', 
                              background: 'rgba(0,0,0,0.15)', 
                              padding: '0.5rem 0.75rem', 
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.02)',
                              width: '320px',
                              lineHeight: 1.4,
                              color: 'var(--text-secondary)'
                            }}>
                              {t.message}
                            </div>
                          </td>
                          <td>{new Date(t.created_at).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${t.status === 'open' ? 'badge-pending' : 'badge-approved'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {t.status === 'open' ? (
                              <button 
                                onClick={() => handleResolveTicket(t.id)} 
                                className="btn btn-primary btn-sm"
                                style={{ background: 'var(--success)', boxShadow: 'none' }}
                              >
                                Resolve
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Accounts view modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button onClick={() => setSelectedOrder(null)} className="modal-close">×</button>
            <h3 style={{ marginBottom: '0.5rem', textTransform: 'uppercase' }}>Accounts Delivered</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Order #{selectedOrder.id} - {selectedOrder.listing_title} ({selectedOrder.quantity}x)
            </p>

            <div className="accounts-box" style={{ background: '#050507' }}>
              {selectedOrder.accounts_data.join('\n')}
            </div>

            <button onClick={() => setSelectedOrder(null)} className="btn btn-primary btn-block">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
