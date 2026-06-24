import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App.jsx';
import { Wallet, ShoppingBag, PlusCircle, History, Landmark, CheckCircle2, Copy, Check, Eye } from 'lucide-react';

export default function Dashboard() {
  const { user, token, refreshBalance } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'deposit'
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  
  // Deposit Form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bkash'); // bkash, nagad, crypto
  const [txId, setTxId] = useState('');
  const [paymentSettings, setPaymentSettings] = useState({});
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View Accounts Modal
  const [selectedAccounts, setSelectedAccounts] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(false);

  // Fetch orders and deposits
  const fetchData = async () => {
    try {
      // Fetch orders
      const ordersRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.data);
      }

      // Fetch deposits
      const depositsRes = await fetch('/api/deposits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const depositsData = await depositsRes.json();
      if (depositsData.success) {
        setDeposits(depositsData.data);
      }

      // Fetch payment instructions/settings
      const settingsRes = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        setPaymentSettings(settingsData.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  const syncSmmOrders = async () => {
    try {
      await fetch('/api/smm/orders/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to sync SMM orders:', e);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (token) {
        if (activeTab === 'orders') {
          await syncSmmOrders();
        }
        await fetchData();
        if (refreshBalance) {
          refreshBalance();
        }
      }
    };
    loadDashboardData();
  }, [token, activeTab]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    if (parseFloat(depositAmount) <= 0 || isNaN(parseFloat(depositAmount))) {
      setFormError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          payment_method: depositMethod,
          transaction_id: txId
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFormSuccess('Deposit request submitted! Please wait for admin approval.');
        setDepositAmount('');
        setTxId('');
        fetchData();
      } else {
        setFormError(data.message || 'Deposit request failed');
      }
    } catch (err) {
      setFormError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccountsToClipboard = (accountsArray) => {
    navigator.clipboard.writeText(accountsArray.join('\n'));
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  return (
    <div className="dashboard-grid">
      {/* Sidebar Info */}
      <div className="sidebar">
        <h3 className="sidebar-title">My Account</h3>
        <div style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.25rem' }}>{user.name}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</p>
        </div>

        <div className="sidebar-title">Navigation</div>
        <div className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <History size={18} />
            Order History
          </button>
          <button 
            onClick={() => setActiveTab('deposit')} 
            className={`sidebar-btn ${activeTab === 'deposit' ? 'active' : ''}`}
          >
            <PlusCircle size={18} />
            Deposit Wallet
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div>
        {/* Wallet Balance Card */}
        <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(15, 17, 26, 0.7) 100%)', border: '1px solid var(--border-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px' }}>
              <Wallet size={24} />
            </div>
            <div>
              <span className="stat-label" style={{ fontSize: '0.85rem' }}>Wallet Balance</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>${parseFloat(user.balance).toFixed(2)}</h2>
            </div>
          </div>
          <button onClick={() => setActiveTab('deposit')} className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> Add Funds
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'orders' ? (
          <div>
            <h3>Your Order History</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              View and download your purchased social media and digital accounts.
            </p>

            {orders.length === 0 ? (
              <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                <ShoppingBag size={36} className="color-accent" style={{ marginBottom: '1rem', marginInline: 'auto' }} />
                <h4>No Orders Yet</h4>
                <p style={{ margin: '0.5rem 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Browse our marketplace to purchase verified accounts.
                </p>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary btn-sm">
                  Go to Marketplace
                </button>
              </div>
            ) : (
              <div className="table-container">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Listing / Service Details</th>
                        <th>Qty</th>
                        <th>Cost</th>
                        <th>Purchased At</th>
                        <th>Link / Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>#{order.id}</td>
                          <td>
                            <span className={`badge ${order.order_type === 'smm' ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '0.65rem' }}>
                              {order.order_type === 'smm' ? 'SMM' : 'Account'}
                            </span>
                          </td>
                          <td>
                            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{order.listing_title}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {order.listing_id}</span>
                          </td>
                          <td>{order.quantity}</td>
                          <td className="font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(order.price_paid).toFixed(2)}</td>
                          <td>{new Date(order.purchased_at).toLocaleDateString()}</td>
                          <td>
                            {order.order_type === 'smm' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <a 
                                  href={order.link} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="color-accent" 
                                  style={{ fontSize: '0.8rem', textDecoration: 'underline', fontWeight: 600 }}
                                >
                                  View Link
                                </a>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Status: <strong style={{ color: order.status === 'Completed' ? 'var(--success)' : 'var(--warning)' }}>{order.status}</strong>
                                </span>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setSelectedAccounts(order)} 
                                className="btn btn-outline btn-sm"
                              >
                                <Eye size={12} /> View accounts
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
        ) : (
          <div>
            <h3>Deposit Money to Wallet</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Submit a manual deposit request. Once verified by admin, your balance will be credited.
            </p>

            {formSuccess && (
              <div className="alert alert-success">
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="alert alert-danger">
                <ShieldAlert size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2" style={{ gap: '2rem', alignItems: 'start' }}>
              {/* Left Column: Form */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <form onSubmit={handleDepositSubmit}>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <div className="deposit-options">
                      <div 
                        className={`deposit-option ${depositMethod === 'bkash' ? 'active' : ''}`}
                        onClick={() => setDepositMethod('bkash')}
                      >
                        <div className="deposit-option-icon font-bold" style={{ fontSize: '0.9rem' }}>bK</div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>bKash</span>
                      </div>
                      
                      <div 
                        className={`deposit-option ${depositMethod === 'nagad' ? 'active' : ''}`}
                        onClick={() => setDepositMethod('nagad')}
                      >
                        <div className="deposit-option-icon font-bold" style={{ fontSize: '0.9rem' }}>Ng</div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nagad</span>
                      </div>

                      <div 
                        className={`deposit-option ${depositMethod === 'crypto' ? 'active' : ''}`}
                        onClick={() => setDepositMethod('crypto')}
                      >
                        <div className="deposit-option-icon font-bold" style={{ fontSize: '0.9rem' }}>CR</div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Crypto</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deposit Amount (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Calculated rate: 1 USD = 120 BDT (approximation)
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transaction ID (TxID)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter the transaction TXID ref"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                    {submitting ? 'Submitting request...' : 'Confirm and Submit'}
                  </button>
                </form>
              </div>

              {/* Right Column: Instructions */}
              <div className="deposit-instructions">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  <Landmark size={18} className="color-accent" />
                  Manual Instructions
                </h4>
                
                {depositMethod === 'bkash' && (
                  <div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {paymentSettings.payment_bkash || 'bKash Personal: 017XXXXXXXX'}
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>How to pay:</p>
                    <ol>
                      <li>Go to your bKash app or dial *247#.</li>
                      <li>Choose **Send Money** to the number above.</li>
                      <li>Enter amount (equivalent in BDT).</li>
                      <li>Copy the Transaction ID (TxID) from confirmation SMS and paste it in the form.</li>
                    </ol>
                  </div>
                )}

                {depositMethod === 'nagad' && (
                  <div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {paymentSettings.payment_nagad || 'Nagad Personal: 019XXXXXXXX'}
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>How to pay:</p>
                    <ol>
                      <li>Open your Nagad mobile wallet.</li>
                      <li>Select **Send Money** and enter the number above.</li>
                      <li>Send the equivalent BDT amount.</li>
                      <li>Provide your transaction TxID inside the form to proceed.</li>
                    </ol>
                  </div>
                )}

                {depositMethod === 'crypto' && (
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                      {paymentSettings.payment_crypto || 'USDT (TRC20): Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>How to pay:</p>
                    <ol>
                      <li>Send USDT (on TRC-20 protocol only) to the wallet address listed above.</li>
                      <li>Ensure you send the exact USD value.</li>
                      <li>Once the network completes the block validation, copy the TX hash/id and submit it above.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Deposits History List */}
            <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Deposit History</h3>
            {deposits.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No deposit requests made yet.</p>
            ) : (
              <div className="table-container" style={{ marginTop: '0.5rem' }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Transaction ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((dep) => (
                        <tr key={dep.id}>
                          <td>{new Date(dep.created_at).toLocaleDateString()}</td>
                          <td className="font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(dep.amount).toFixed(2)}</td>
                          <td style={{ textTransform: 'uppercase' }}>{dep.payment_method}</td>
                          <td style={{ fontFamily: 'monospace' }}>{dep.transaction_id}</td>
                          <td>
                            <span className={`badge badge-${dep.status}`}>
                              {dep.status}
                            </span>
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

      {/* View accounts modal */}
      {selectedAccounts && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button onClick={() => setSelectedAccounts(null)} className="modal-close">×</button>
            <h3 style={{ marginBottom: '0.5rem', textTransform: 'uppercase' }}>Delivery Credentials</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Order #{selectedAccounts.id} - {selectedAccounts.listing_title} ({selectedAccounts.quantity}x)
            </p>

            <div className="accounts-box">
              {Array.isArray(selectedAccounts.accounts_data) ? selectedAccounts.accounts_data.join('\n') : ''}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => copyAccountsToClipboard(selectedAccounts.accounts_data)} 
                className="btn btn-secondary flex-1"
              >
                {copiedIndex ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                {copiedIndex ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button onClick={() => setSelectedAccounts(null)} className="btn btn-primary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
