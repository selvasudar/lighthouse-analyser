import { useState, useEffect } from 'react';

const CircularProgress = ({ score, label }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100 * circumference;
  const color = score <= 49 ? '#EF4444' : score <= 89 ? '#F59E0B' : '#10B981';

  return (
    <div className="text-center">
      <svg width="100" height="100" className="mx-auto">
        <circle
          stroke="#374151"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
        />
        <circle
          stroke={color}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 50 50)"
          strokeLinecap="round"
        />
        <text x="50%" y="50%" className="fill-current text-lg font-bold" dominantBaseline="middle" textAnchor="middle">
          {Math.round(score)}
        </text>
      </svg>
      <p className="mt-2 text-sm font-medium">{label}</p>
    </div>
  );
};

export default function Dashboard({ results, timestamps, sitemapUrls, onTimestampChange, onSitemapChange, selectedSitemap, selectedTimestamp, onDelete }) {
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [filteredUrls, setFilteredUrls] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('url');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    // Reset selected URL when results change
    setSelectedUrl(null);
    
    // Apply filtering and sorting to results
    let filtered = [...results];
    
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort the results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'url') {
        comparison = a.url.localeCompare(b.url);
      } else if (sortBy === 'performance') {
        comparison = (a.performance || 0) - (b.performance || 0);
      } else if (sortBy === 'accessibility') {
        comparison = (a.accessibility || 0) - (b.accessibility || 0);
      } else if (sortBy === 'seo') {
        comparison = (a.seo || 0) - (b.seo || 0);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredUrls(filtered);
  }, [results, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const selectedResult = selectedUrl ? results.find(r => r.url === selectedUrl) : null;

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-gray-800 rounded-lg overflow-hidden">
      <div className="w-full md:w-80 p-4 bg-gray-900 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-4">Analysis Results</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
            <select
              className="w-full p-2 border rounded bg-gray-800 text-white"
              value={selectedSitemap || ''}
              onChange={(e) => onSitemapChange(e.target.value)}
            >
              <option value="">Select Sitemap</option>
              {sitemapUrls.map((url, index) => (
                <option key={index} value={url}>{url}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
            <select
              className="w-full p-2 border rounded bg-gray-800 text-white"
              value={selectedTimestamp || ''}
              onChange={(e) => onTimestampChange(e.target.value)}
              disabled={!selectedSitemap}
            >
              <option value="">Select Timestamp</option>
              {timestamps.map(ts => (
                <option key={ts} value={ts}>{new Date(ts).toLocaleString()}</option>
              ))}
            </select>
          </div>
          
          {selectedSitemap && selectedTimestamp && (
            <button
              className="w-full px-4 py-2 mb-4 bg-red-500 text-white rounded hover:bg-red-600 transition"
              onClick={() => onDelete(selectedSitemap, selectedTimestamp)}
            >
              Delete Analysis
            </button>
          )}
        </div>
        
        {filteredUrls.length > 0 && (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search URLs..."
                className="w-full p-2 border rounded bg-gray-800 text-white"
              />
            </div>
            
            <div className="mb-2 flex text-sm">
              <button 
                className={`flex-1 p-1 ${sortBy === 'url' ? 'font-bold' : ''}`}
                onClick={() => toggleSort('url')}
              >
                URL {sortBy === 'url' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                className={`w-10 text-center ${sortBy === 'performance' ? 'font-bold' : ''}`}
                onClick={() => toggleSort('performance')}
                title="Performance"
              >
                P {sortBy === 'performance' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUrls.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer rounded ${
                    selectedUrl === result.url 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedUrl(result.url)}
                >
                  <div className="flex items-center">
                    <div className="flex-1 text-sm break-all pr-2">{result.url.replace(/^https?:\/\//, '')}</div>
                    {result.performance !== undefined && (
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          result.performance <= 49 ? 'bg-red-500' : 
                          result.performance <= 89 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                      >
                        {Math.round(result.performance)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {filteredUrls.length === 0 && selectedTimestamp && (
          <p className="text-center text-gray-400">No URLs found</p>
        )}
      </div>

      <div className="flex-1 p-4 bg-gray-800">
        {selectedResult ? (
          <div className="bg-gray-900 p-4 rounded-lg shadow">
            <h1 className="text-xl font-bold mb-4 break-all">{selectedUrl}</h1>
            
            {selectedResult.error ? (
              <div className="p-4 bg-red-500 rounded text-white">
                Analysis failed for this URL
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <CircularProgress score={selectedResult.performance} label="Performance" />
                  <CircularProgress score={selectedResult.accessibility} label="Accessibility" />
                  <CircularProgress score={selectedResult.bestPractices} label="Best Practices" />
                  <CircularProgress score={selectedResult.seo} label="SEO" />
                </div>
                
                <div className="bg-gray-800 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">First Contentful Paint</p>
                      <p className="text-lg">{selectedResult.metrics.fcp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Largest Contentful Paint</p>
                      <p className="text-lg">{selectedResult.metrics.lcp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Blocking Time</p>
                      <p className="text-lg">{selectedResult.metrics.tbt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Cumulative Layout Shift</p>
                      <p className="text-lg">{selectedResult.metrics.cls}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Speed Index</p>
                      <p className="text-lg">{selectedResult.metrics.speedIndex}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-center">Select a URL to view performance metrics</p>
          </div>
        )}
      </div>
    </div>
  );
}