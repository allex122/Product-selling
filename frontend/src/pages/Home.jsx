import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Eye, Layers, LayoutGrid, ChevronDown } from 'lucide-react';

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
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [listings, setListings] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem', width: '100%', maxWidth: '800px', margin: '1.5rem auto 0', position: 'relative' }}>
          {/* Select a Category Dropdown */}
          <div className="category-dropdown-container">
            <button 
              type="button" 
              className="category-dropdown-btn"
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            >
              <LayoutGrid size={18} />
              <span>{selectedCat ? selectedCat.title : 'Select a Category'}</span>
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
          <form onSubmit={handleSearchSubmit} className="search-container" style={{ margin: 0, flex: 1, minWidth: '280px' }}>
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

          {/* Second Group (Duplicated for infinite seamless scrolling) */}
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
    </div>
  );
}
