import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App.jsx';
import { ShoppingCart, ArrowLeft, ShieldAlert, CheckCircle, Copy, Check } from 'lucide-react';

export default function ListingDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token, refreshBalance } = useContext(AuthContext);
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/listings/${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          setListing(data.data);
        } else {
          setError(data.message || 'Product not found');
        }
      } catch (e) {
        setError('Server error fetching product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '8rem 0' }}>
        <div className="pulse" style={{ color: 'var(--accent)', fontWeight: 600 }}>DECRYPTING PRODUCT CODE...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="card text-center" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '3rem auto' }}>
        <ShieldAlert size={48} className="color-accent" style={{ marginBottom: '1rem', marginInline: 'auto' }} />
        <h3>Product Not Found</h3>
        <p style={{ margin: '1rem 0' }}>{error || 'The requested product listing does not exist.'}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">
          <ArrowLeft size={16} /> Back to Marketplace
        </button>
      </div>
    );
  }

  const userBalance = user ? parseFloat(user.balance) : 0;
  const totalPrice = parseFloat(listing.price) * quantity;
  const hasSufficientBalance = userBalance >= totalPrice;

  const handlePurchaseClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    setBuying(true);
    setShowConfirmModal(false);
    setError('');
    
    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad_id: listing.id,
          quantity: parseInt(quantity),
          listing_slug: listing.slug
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setPurchaseSuccessData(data.data);
        refreshBalance(); // Update user balance
      } else {
        setError(data.message || 'Purchase failed');
      }
    } catch (e) {
      setError('Connection error. Please try again.');
    } finally {
      setBuying(false);
    }
  };

  const copyToClipboard = () => {
    if (!purchaseSuccessData) return;
    const txt = purchaseSuccessData.accounts.join('\n');
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} className="btn btn-outline btn-sm" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Marketplace
      </button>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ gap: '2.5rem' }}>
        {/* Left Side: Listing details */}
        <div>
          <span className="card-tag">{listing.subcategory ? listing.subcategory.title : (listing.category ? listing.category.title : 'Account')}</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.75rem', marginBottom: '1.5rem' }}>{listing.title}</h2>
          
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Description</h4>
          <div 
            className="card-description-full" 
            style={{ 
              color: 'var(--text-secondary)', 
              lineHeight: 1.6, 
              background: 'rgba(255,255,255,0.01)', 
              padding: '1.25rem', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.03)',
              maxHeight: '350px',
              overflowY: 'auto',
              fontSize: '0.95rem'
            }}
            dangerouslySetInnerHTML={{ __html: listing.description || 'No description provided.' }}
          />
        </div>

        {/* Right Side: Buy Card */}
        <div>
          <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Stock Status</span>
              <span className={`badge ${listing.available_stock > 0 ? 'badge-approved' : 'badge-rejected'}`} style={{ fontSize: '0.85rem' }}>
                {listing.available_stock > 0 ? `${listing.available_stock} Available` : 'Out of Stock'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Price per account:</span>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                <span style={{ color: 'var(--accent)', fontSize: '1.25rem', marginRight: '0.15rem' }}>$</span>
                {parseFloat(listing.price).toFixed(2)}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Purchase Quantity</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max={listing.available_stock}
                disabled={listing.available_stock === 0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(listing.available_stock, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-bold">Total Order Cost:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            {user ? (
              !hasSufficientBalance ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="alert alert-danger" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
                    <ShieldAlert size={16} />
                    <span>Insufficient Wallet Balance (Wallet: ${userBalance.toFixed(2)})</span>
                  </div>
                  <Link to="/dashboard" className="btn btn-secondary btn-block">
                    Add Balance
                  </Link>
                </div>
              ) : null
            ) : (
              <div className="alert alert-danger" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', marginBottom: '1.5rem' }}>
                <ShieldAlert size={16} />
                <span>You must be logged in to buy accounts.</span>
              </div>
            )}

            <button
              onClick={handlePurchaseClick}
              disabled={buying || listing.available_stock === 0 || (user && !hasSufficientBalance)}
              className="btn btn-primary btn-block"
            >
              <ShoppingCart size={18} />
              {buying ? 'Processing...' : 'Buy Accounts Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem', textTransform: 'uppercase' }}>Confirm Your Transaction</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You are about to purchase <strong>{quantity}x</strong> accounts of <strong>{listing.title}</strong>. 
              The total cost of <strong>${totalPrice.toFixed(2)}</strong> will be deducted from your wallet balance.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Wallet Balance:</span>
                <span className="font-bold">${userBalance.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontWeight: 600 }}>
                <span>Order Cost:</span>
                <span>-${totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Remaining Balance:</span>
                <span className="font-bold">${(userBalance - totalPrice).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={confirmPurchase} className="btn btn-primary flex-1">
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal showing Credentials */}
      {purchaseSuccessData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="text-center" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
              <h3 style={{ textTransform: 'uppercase' }}>Purchase Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Deducted ${purchaseSuccessData.amount} from your wallet. Accounts delivered below:
              </p>
            </div>

            <div className="accounts-box">
              {purchaseSuccessData.accounts.join('\n')}
            </div>

            <div className="flex gap-4" style={{ marginBottom: '1rem' }}>
              <button onClick={copyToClipboard} className="btn btn-secondary flex-1">
                {copied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            
            <p className="text-muted text-center" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              ⚠️ Make sure to save these credentials immediately. You can also view them anytime in your Dashboard's Order History.
            </p>

            <button
              onClick={() => {
                setPurchaseSuccessData(null);
                navigate('/dashboard');
              }}
              className="btn btn-primary btn-block"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
