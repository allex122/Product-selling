import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Eye, Layers, LayoutGrid, ChevronDown, ShieldAlert, Check } from 'lucide-react';
import { AuthContext } from '../App.jsx';

const getSocialIcon = (item) => {
  const title = item.title?.toLowerCase() || '';
  const slug = item.slug?.toLowerCase() || '';
  const subcat = item.subcategory?.title?.toLowerCase() || '';
  const cat = item.category?.title?.toLowerCase() || '';

  if (title.includes('facebook') || slug.includes('facebook') || subcat.includes('facebook') || cat.includes('facebook')) {
    return <span className="service-icon fb">f</span>;
  }
  if (title.includes('instagram') || slug.includes('instagram') || subcat.includes('instagram') || cat.includes('instagram')) {
    return <span className="service-icon ig">📸</span>;
  }
  if (title.includes('gmail') || slug.includes('gmail') || subcat.includes('gmail') || cat.includes('gmail') || title.includes('email') || title.includes('mail') || title.includes('yahoo') || title.includes('outlook') || title.includes('protonmail') || title.includes('aol')) {
    return <span className="service-icon mail">✉️</span>;
  }
  if (title.includes('youtube') || slug.includes('youtube') || subcat.includes('youtube') || cat.includes('youtube')) {
    return <span className="service-icon yt">▶️</span>;
  }
  if (title.includes('telegram') || slug.includes('telegram') || subcat.includes('telegram') || cat.includes('telegram')) {
    return <span className="service-icon tg">✈️</span>;
  }
  if (title.includes('twitter') || title.includes('x accounts') || slug.includes('twitter') || slug.includes('twitter-x')) {
    return <span className="service-icon tw">𝕏</span>;
  }
  if (title.includes('tiktok') || slug.includes('tiktok')) {
    return <span className="service-icon tk">🎵</span>;
  }
  if (title.includes('voice') || slug.includes('voice')) {
    return <span className="service-icon gv">📞</span>;
  }
  if (title.includes('linkedin') || slug.includes('linkedin')) {
    return <span className="service-icon ln">in</span>;
  }
  if (title.includes('whatsapp') || slug.includes('whatsapp')) {
    return <span className="service-icon wa">💬</span>;
  }
  if (title.includes('discord') || slug.includes('discord')) {
    return <span className="service-icon dc">👾</span>;
  }
  
  return <span className="service-icon generic">👤</span>;
};

export default function Home() {
  const { token, refreshBalance } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [listings, setListings] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [smmServices, setSmmServices] = useState({});
  const [activeTabType, setActiveTabType] = useState('accounts');
  const [selectedSmmService, setSelectedSmmService] = useState(null);
  const [smmLink, setSmmLink] = useState('');
  const [smmQty, setSmmQty] = useState('');
  const [smmError, setSmmError] = useState('');
  const [smmSuccess, setSmmSuccess] = useState('');
  const [smmSubmitting, setSmmSubmitting] = useState(false);
  const navigate = useNavigate();

  const toggleGroupExpand = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Sort categories: Facebook first, Instagram second, then alphabetical
          const sortedCats = data.data.sort((a, b) => {
            const cleanA = a.title.toLowerCase();
            const cleanB = b.title.toLowerCase();
            const isFbA = cleanA.includes('facebook');
            const isFbB = cleanB.includes('facebook');
            const isIgA = cleanA.includes('instagram');
            const isIgB = cleanB.includes('instagram');

            if (isFbA && !isFbB) return -1;
            if (!isFbA && isFbB) return 1;
            if (isIgA && !isIgB) return -1;
            if (!isIgA && isIgB) return 1;
            return cleanA.localeCompare(cleanB);
          });
          setCategories(sortedCats);
          // Load all listings initially, no default category selection
        }
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      }
    };
    fetchCats();
  }, []);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.category-dropdown-container')) {
        setCatDropdownOpen(false);
      }
    };
    if (catDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [catDropdownOpen]);

  // Fetch SMM services list on mount
  useEffect(() => {
    const fetchSmmServices = async () => {
      try {
        const res = await fetch('/api/smm/services');
        const data = await res.json();
        if (data.success) {
          setSmmServices(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch SMM services:', e);
      }
    };
    fetchSmmServices();
  }, []);

  const handleSmmOrderSubmit = async (e) => {
    e.preventDefault();
    setSmmError('');
    setSmmSuccess('');
    setSmmSubmitting(true);

    if (!token) {
      setSmmError('Please login to place SMM orders.');
      setSmmSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/smm/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedSmmService.id,
          link: smmLink,
          quantity: parseInt(smmQty)
        })
      });

      const data = await res.json();
      if (data.success) {
        setSmmSuccess(`Order placed successfully! Order ID: #${data.orderId}`);
        setSmmLink('');
        setSmmQty('');
        if (refreshBalance) refreshBalance();
      } else {
        setSmmError(data.message || 'Failed to place SMM order.');
      }
    } catch (err) {
      setSmmError('Connection error. Please try again.');
    } finally {
      setSmmSubmitting(false);
    }
  };

  // Fetch Listings when category or search changes
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let url = '/api/listings?per_page=100'; // Load more items to show lists nicely
        if (selectedCat) {
          url += `&category_id=${selectedCat.id}`;
        }
        if (searchText) {
          url += `&search=${encodeURIComponent(searchText)}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setListings(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch listings:', e);
      } finally {
        setLoading(false);
      }
    };

    // Delay fetching for search typing (debounce)
    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedCat, searchText]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  // Group listings by subcategory
  const groupedListings = {};
  listings.forEach(listing => {
    const subcatTitle = listing.subcategory?.title || listing.category?.title || 'General';
    if (!groupedListings[subcatTitle]) {
      groupedListings[subcatTitle] = [];
    }
    groupedListings[subcatTitle].push(listing);
  });

  return (
    <div>
      {/* Hero section */}
      <section className="hero">
        <h1 className="hero-title">CYBER2 Marketplace</h1>
        <p className="hero-subtitle">
          Instantly buy verified, premium bulk accounts. Fully automated and secured.
        </p>

        {/* Dropdown and Search Bar Container */}
        <div className="search-filter-wrapper">
          {/* Select a Category Dropdown */}
          <div className="category-dropdown-container">
            <button 
              type="button" 
              className="category-dropdown-btn"
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LayoutGrid size={18} />
                <span>{selectedCat ? selectedCat.title : 'Select a Category'}</span>
              </span>
              <ChevronDown size={18} style={{ transform: catDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {catDropdownOpen && (
              <div className="category-dropdown-menu">
                <div className="category-dropdown-search-box">
                  <input
                    type="text"
                    className="category-dropdown-search-input"
                    placeholder="Search category..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="category-dropdown-list">
                  <div 
                    className={`category-dropdown-item ${selectedCat === null ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCat(null);
                      setCatDropdownOpen(false);
                      setCatSearch('');
                    }}
                  >
                    <Layers size={16} />
                    <span>All Categories</span>
                  </div>
                  {categories
                    .filter(cat => cat.title.toLowerCase().includes(catSearch.toLowerCase()))
                    .map(cat => (
                      <div 
                        key={cat.id}
                        className={`category-dropdown-item ${selectedCat && selectedCat.id === cat.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCat(cat);
                          setCatDropdownOpen(false);
                          setCatSearch('');
                        }}
                      >
                        {cat.image ? (
                          <img src={cat.image} alt={cat.title} className="category-dropdown-item-img" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <ShoppingBag size={16} />
                        )}
                        <span>{cat.title}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Cyber Search Bar */}
          <form onSubmit={handleSearchSubmit} className="search-container" style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search for Facebook, Gmail, Telegram accounts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="submit" className="search-icon-btn">
              <Search size={20} />
            </button>
          </form>
        </div>
      </section>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2.5rem 0 1.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTabType('accounts')} 
          className={`btn ${activeTabType === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: '240px', borderRadius: '12px', height: '50px' }}
        >
          <ShoppingBag size={18} />
          Accounts Marketplace
        </button>
        <button 
          onClick={() => setActiveTabType('smm')} 
          className={`btn ${activeTabType === 'smm' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: '240px', borderRadius: '12px', height: '50px' }}
        >
          <Layers size={18} />
          Social SMM Services
        </button>
      </div>

      {activeTabType === 'accounts' ? (
        <>
          {/* Category Horizontal Marquee Pills Selector */}
          <div className="category-marquee-container">
            <div className="category-marquee-track">
              {/* First Group */}
              <div className="category-marquee-group">
                <div
                  className={`category-pill ${selectedCat === null ? 'active' : ''}`}
                  onClick={() => setSelectedCat(null)}
                >
                  <Layers size={16} />
                  All Services
                </div>
                {categories.map((cat) => (
                  <div
                    key={`cat1-${cat.id}`}
                    className={`category-pill ${selectedCat && selectedCat.id === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCat(cat)}
                  >
                    {cat.image ? (
                      <img src={cat.image} alt={cat.title} className="category-pill-img" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <ShoppingBag size={16} />
                    )}
                    {cat.title}
                  </div>
                ))}
              </div>

              {/* Second Group */}
              <div className="category-marquee-group" aria-hidden="true">
                <div
                  className={`category-pill ${selectedCat === null ? 'active' : ''}`}
                  onClick={() => setSelectedCat(null)}
                >
                  <Layers size={16} />
                  All Services
                </div>
                {categories.map((cat) => (
                  <div
                    key={`cat2-${cat.id}`}
                    className={`category-pill ${selectedCat && selectedCat.id === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCat(cat)}
                  >
                    {cat.image ? (
                      <img src={cat.image} alt={cat.title} className="category-pill-img" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <ShoppingBag size={16} />
                    )}
                    {cat.title}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Listing Title */}
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag className="color-accent" size={20} />
            {selectedCat ? `${selectedCat.title} Listings` : 'All Available Listings'}
            {searchText && ` matching "${searchText}"`}
          </h3>

          {loading ? (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <div className="pulse" style={{ color: 'var(--accent)', fontWeight: 600 }}>RETRIEVING ENCRYPTED STOCK...</div>
            </div>
          ) : listings.length === 0 ? (
            <div className="card text-center" style={{ padding: '4rem 2rem' }}>
              <p style={{ fontSize: '1.1rem' }}>No active accounts found in this category.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Try clearing the search or choosing another category.</p>
            </div>
          ) : (
            <div className="listings-list-container">
              {Object.entries(groupedListings)
                .sort(([nameA], [nameB]) => {
                  const cleanA = nameA.toLowerCase();
                  const cleanB = nameB.toLowerCase();
                  const isFbA = cleanA.includes('facebook');
                  const isFbB = cleanB.includes('facebook');
                  const isIgA = cleanA.includes('instagram');
                  const isIgB = cleanB.includes('instagram');

                  if (isFbA && !isFbB) return -1;
                  if (!isFbA && isFbB) return 1;
                  if (isIgA && !isIgB) return -1;
                  if (!isIgA && isIgB) return 1;
                  return cleanA.localeCompare(cleanB);
                })
                .map(([subcatName, items]) => {
                const isExpanded = !!expandedGroups[subcatName];
                const displayItems = isExpanded ? items : items.slice(0, 6);

                return (
                  <div key={subcatName} className="subcategory-group">
                    <div className="subcategory-header">
                      <span>{selectedCat && selectedCat.title !== subcatName ? `${selectedCat.title} - ` : ''}{subcatName}</span>
                      <div className="subcategory-header-labels">
                        <span className="subcategory-header-label-stock">In Stock</span>
                        <span className="subcategory-header-label-price">Price</span>
                        <div className="subcategory-header-placeholder"></div>
                      </div>
                    </div>
                    
                    {displayItems.map((item) => (
                      <div key={item.id} className="listing-row">
                        <div className="listing-row-info">
                          {getSocialIcon(item)}
                          <span className="listing-row-title" title={item.title}>
                            {item.title}
                          </span>
                        </div>
                        
                        <div className={`listing-row-stock ${item.available_stock === 0 ? 'out' : ''}`}>
                          {item.available_stock > 0 ? `${item.available_stock} pcs.` : 'Out of stock'}
                        </div>
                        
                        <div className="listing-row-price-block">
                          <div className="listing-row-price-label">Price per pc</div>
                          <div className="listing-row-price">
                            <span>from $</span>{parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="listing-row-action">
                          <button
                            onClick={() => navigate(`/listings/${item.slug}`)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.45rem 1.25rem', minWidth: '85px' }}
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}

                    {items.length > 6 && (
                      <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(15, 17, 26, 0.4)', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => toggleGroupExpand(subcatName)}
                          className="btn btn-primary btn-sm"
                          style={{ 
                            width: '100%', 
                            maxWidth: '200px', 
                            background: 'rgba(255, 59, 48, 0.08)', 
                            border: '1px solid rgba(255, 59, 48, 0.25)', 
                            color: 'var(--text-primary)',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.05em'
                          }}
                        >
                          {isExpanded ? 'view less' : 'view more'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="smm-services-container">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers className="color-accent" size={20} />
            Social SMM Services
          </h3>

          {Object.keys(smmServices).length === 0 ? (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <div className="pulse" style={{ color: 'var(--accent)', fontWeight: 600 }}>RETRIEVING SMM SERVICES...</div>
            </div>
          ) : (
            <div className="listings-list-container">
              {Object.entries(smmServices)
                .sort(([nameA], [nameB]) => {
                  const cleanA = nameA.toLowerCase();
                  const cleanB = nameB.toLowerCase();
                  const isFbA = cleanA.includes('facebook');
                  const isFbB = cleanB.includes('facebook');
                  const isIgA = cleanA.includes('instagram');
                  const isIgB = cleanB.includes('instagram');

                  if (isFbA && !isFbB) return -1;
                  if (!isFbA && isFbB) return 1;
                  if (isIgA && !isIgB) return -1;
                  if (!isIgA && isIgB) return 1;
                  return cleanA.localeCompare(cleanB);
                })
                .map(([catName, services]) => {
                  const isExpanded = !!expandedGroups[catName];
                  const displayServices = isExpanded ? services : services.slice(0, 5);

                  return (
                    <div key={catName} className="subcategory-group">
                      <div className="subcategory-header">
                        <span>{catName}</span>
                        <div className="subcategory-header-labels">
                          <span className="subcategory-header-label-stock smm-limit">Min / Max Limit</span>
                          <span className="subcategory-header-label-price smm-price">Rate per 1000</span>
                          <div className="subcategory-header-placeholder"></div>
                        </div>
                      </div>

                      {displayServices.map((service) => (
                        <div key={service.id} className="listing-row">
                          <div className="listing-row-info">
                            {getSocialIcon({ title: service.name })}
                            <span className="listing-row-title" title={service.name}>
                              {service.name}
                            </span>
                          </div>

                          <div className="listing-row-stock smm-limit">
                            {service.min} - {service.max}
                          </div>

                          <div className="listing-row-price-block smm-price">
                            <div className="listing-row-price-label">Price per 1k</div>
                            <div className="listing-row-price">
                              <span>$</span>{parseFloat(service.rate).toFixed(3)}
                            </div>
                          </div>

                          <div className="listing-row-action">
                            <button
                              onClick={() => setSelectedSmmService(service)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.45rem 1.25rem', minWidth: '85px' }}
                            >
                              Order
                            </button>
                          </div>
                        </div>
                      ))}

                      {services.length > 5 && (
                        <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(15, 17, 26, 0.4)', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)' }}>
                          <button
                            onClick={() => toggleGroupExpand(catName)}
                            className="btn btn-primary btn-sm"
                            style={{ 
                              width: '100%', 
                              maxWidth: '200px', 
                              background: 'rgba(255, 59, 48, 0.08)', 
                              border: '1px solid rgba(255, 59, 48, 0.25)', 
                              color: 'var(--text-primary)',
                              textTransform: 'uppercase',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.05em'
                            }}
                          >
                            {isExpanded ? 'view less' : 'view more'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* SMM Order Modal */}
      {selectedSmmService && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <button onClick={() => { setSelectedSmmService(null); setSmmError(''); setSmmSuccess(''); }} className="modal-close">×</button>
            <h3 style={{ marginBottom: '0.5rem', textTransform: 'uppercase' }}>Place SMM Order</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Service: <strong>{selectedSmmService.name}</strong>
            </p>

            {smmError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                <ShieldAlert size={18} />
                <span>{smmError}</span>
              </div>
            )}

            {smmSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <Check size={18} style={{ color: 'var(--success)' }} />
                <span>{smmSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSmmOrderSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <span className="stat-label" style={{ fontSize: '0.75rem' }}>Rate per 1000</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>${parseFloat(selectedSmmService.rate).toFixed(3)}</div>
                </div>
                <div>
                  <span className="stat-label" style={{ fontSize: '0.75rem' }}>Limits (Min - Max)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedSmmService.min} - {selectedSmmService.max}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target URL Link</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://instagram.com/p/..."
                  value={smmLink}
                  onChange={(e) => setSmmLink(e.target.value)}
                  required
                  disabled={smmSubmitting || smmSuccess}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder={`Min ${selectedSmmService.min}, Max ${selectedSmmService.max}`}
                  value={smmQty}
                  onChange={(e) => setSmmQty(e.target.value)}
                  required
                  min={selectedSmmService.min}
                  max={selectedSmmService.max}
                  disabled={smmSubmitting || smmSuccess}
                />
              </div>

              {smmQty && !isNaN(parseInt(smmQty)) && (
                <div className="form-group" style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(52, 199, 89, 0.15)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>Total Est. Cost:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                      ${((selectedSmmService.rate / 1000) * parseInt(smmQty)).toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4" style={{ marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setSelectedSmmService(null); setSmmError(''); setSmmSuccess(''); }} 
                  className="btn btn-secondary flex-1"
                  disabled={smmSubmitting}
                >
                  Cancel
                </button>
                {!smmSuccess && (
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1"
                    disabled={smmSubmitting}
                  >
                    {smmSubmitting ? 'Processing...' : 'Confirm Order'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
