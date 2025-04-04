import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [results, setResults] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [sitemapUrls, setSitemapUrls] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSitemap, setSelectedSitemap] = useState(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/results');
      setSitemapUrls(response.data.sitemapUrls || []);
      setTimestamps(response.data.timestamps || []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setError('Failed to load saved results. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!sitemapUrl || !sitemapUrl.trim()) {
      setError('Please enter a valid sitemap URL');
      return;
    }
    
    setProgress({ progress: 0, total: 0, current: 0, message: 'Starting...' });
    setError(null);
    setResults([]);

    const eventSource = new EventSource(`/api/analyze?sitemapUrl=${encodeURIComponent(sitemapUrl)}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.message);
          setProgress(null);
          eventSource.close();
        } else if (data.progress === 100) {
          setProgress(data);
          setTimeout(() => {
            setProgress(null);
            fetchMetadata();
            setSelectedSitemap(data.sitemapUrl);
            if (data.timestamp) {
              handleTimestampChange(data.timestamp);
            }
          }, 1000);
          eventSource.close();
        } else {
          setProgress(data);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        setError('Error processing server response');
        setProgress(null);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setError('Connection lost. Please check your network and try again.');
      setProgress(null);
      eventSource.close();
    };
  };

  const handleTimestampChange = async (timestamp) => {
    if (!selectedSitemap) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/results?timestamp=${timestamp}&sitemapUrl=${encodeURIComponent(selectedSitemap)}`);
      setResults(response.data || []);
      setSelectedTimestamp(timestamp);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load results for this timestamp');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSitemapChange = (sitemap) => {
    setSelectedSitemap(sitemap);
    setResults([]); // Clear results until a timestamp is selected
    setSelectedTimestamp(null);
    setError(null);
  };

  const handleDelete = async (sitemap, timestamp) => {
    if (!window.confirm('Are you sure you want to delete this result?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.delete(`/api/results?sitemapUrl=${encodeURIComponent(sitemap)}&timestamp=${timestamp}`);
      setResults([]);
      setSelectedSitemap(null);
      setSelectedTimestamp(null);
      fetchMetadata(); // Refresh metadata after deletion
    } catch (error) {
      console.error('Error deleting result:', error);
      setError('Failed to delete result. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">SiteBlaze</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500 border border-red-600 text-white rounded">
            {error} {error.includes('contact') && (
              <>
                Contact: 
                <a href="mailto:selvasudar3@gmail.com" className="underline"> selvasudar3@gmail.com</a> or 
                <a href="https://linkedin.com/in/selvakumarduraipandian" target="_blank" rel="noopener noreferrer" className="underline"> LinkedIn</a>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
            className="flex-1 p-2 border rounded text-white bg-gray-800"
            disabled={progress !== null}
          />
          <button
            type="submit"
            disabled={progress !== null || !sitemapUrl.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Analyze
          </button>
        </form>

        {progress && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow w-full sm:w-3/4 md:w-1/2 mx-auto text-gray-800">
            <p className="font-medium">{progress.message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2">
              Progress: {progress.current}/{progress.total} ({Math.round(progress.progress)}%)
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="p-4 text-center">
            <p>Loading...</p>
          </div>
        ) : sitemapUrls.length > 0 ? (
          <Dashboard
            results={results}
            timestamps={timestamps}
            sitemapUrls={sitemapUrls}
            onTimestampChange={handleTimestampChange}
            onSitemapChange={handleSitemapChange}
            selectedSitemap={selectedSitemap}
            selectedTimestamp={selectedTimestamp}
            onDelete={handleDelete}
          />
        ) : (
          <div className="p-4 text-center bg-gray-800 rounded-lg">
            <p>No analysis results found. Analyze a sitemap to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
} 