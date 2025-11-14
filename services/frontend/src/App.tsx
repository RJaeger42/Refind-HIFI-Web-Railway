import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Listing {
  id: number;
  product: string;
  price: number;
  condition?: string;
  url: string;
  site_source: string;
  description?: string;
  location?: string;
  scraped_at: string;
}

interface Stats {
  total_listings: number;
  total_sites: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  last_scrape: string;
}

interface Filters {
  minPrice: string;
  maxPrice: string;
  search: string;
  site: string;
}

function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sites, setSites] = useState<string[]>([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    minPrice: '',
    maxPrice: '',
    search: '',
    site: ''
  });

  // Fetch listings
  useEffect(() => {
    fetchListings();
    fetchStats();
    fetchSites();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.search) params.append('search', filters.search);
      if (filters.site) params.append('site', filters.site);

      const response = await fetch(`${API_URL}/listings?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      setListings(data.data || data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/sites`);
      const data = await response.json();
      setSites(data);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      search: '',
      site: ''
    });
  };

  const triggerScrape = async (container: 'heavy' | 'light' | 'all') => {
    setScraping(true);
    setScrapeMessage(null);

    try {
      const response = await fetch(`${API_URL}/scrape/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container }),
      });

      const data = await response.json();

      if (response.ok) {
        setScrapeMessage(`✓ Scraping ${container} started successfully`);
        // Refresh stats after 5 seconds
        setTimeout(() => {
          fetchStats();
          fetchListings();
        }, 5000);
      } else {
        setScrapeMessage(`✗ Error: ${data.error || 'Failed to trigger scraping'}`);
      }
    } catch (err) {
      setScrapeMessage(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setScraping(false);
      setTimeout(() => setScrapeMessage(null), 10000);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Hi-Fi Deals Aggregator</h1>
        {stats && (
          <div className="stats">
            <span>{stats.total_listings} listings</span>
            <span>{stats.total_sites} sites</span>
            <span>Avg: ${parseFloat(stats.avg_price.toString()).toFixed(2)}</span>
          </div>
        )}
        <div className="scrape-controls">
          <button
            onClick={() => triggerScrape('all')}
            disabled={scraping}
            className="scrape-btn"
          >
            {scraping ? 'Running...' : 'Run All Scrapers'}
          </button>
          <button
            onClick={() => triggerScrape('light')}
            disabled={scraping}
            className="scrape-btn scrape-btn-light"
          >
            Light
          </button>
          <button
            onClick={() => triggerScrape('heavy')}
            disabled={scraping}
            className="scrape-btn scrape-btn-heavy"
          >
            Heavy
          </button>
        </div>
        {scrapeMessage && (
          <div className={`scrape-message ${scrapeMessage.startsWith('✓') ? 'success' : 'error'}`}>
            {scrapeMessage}
          </div>
        )}
      </header>

      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />

        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
        />

        <select
          value={filters.site}
          onChange={(e) => handleFilterChange('site', e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map(site => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>

        <button onClick={clearFilters}>Clear Filters</button>
      </div>

      <main className="content">
        {loading && <div className="loading">Loading...</div>}

        {error && <div className="error">Error: {error}</div>}

        {!loading && !error && listings.length === 0 && (
          <div className="empty">No listings found</div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="listings-grid">
            {listings.map(listing => (
              <div key={listing.id} className="listing-card">
                <h3>{listing.product}</h3>
                <div className="price">${parseFloat(listing.price.toString()).toFixed(2)}</div>
                {listing.condition && <div className="condition">{listing.condition}</div>}
                <div className="meta">
                  <span className="site">{listing.site_source}</span>
                  <span className="date">
                    {new Date(listing.scraped_at).toLocaleDateString()}
                  </span>
                </div>
                {listing.location && <div className="location">{listing.location}</div>}
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-link"
                >
                  View Deal →
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
