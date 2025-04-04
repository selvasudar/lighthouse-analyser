import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [results, setResults] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);

  useEffect(() => {
    fetchTimestamps();
  }, []);

  const fetchTimestamps = async () => {
    try {
      const response = await axios.get('/api/results');
      setTimestamps(response.data.timestamps);
      if (response.data.timestamps.length > 0) {
        handleTimestampChange(response.data.timestamps[0]);
      }
    } catch (error) {
      console.error('Error fetching timestamps:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/analyze', { sitemapUrl });
      await fetchTimestamps();
      handleTimestampChange(response.data.timestamp);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze sitemap');
    }
    setLoading(false);
  };

  const handleTimestampChange = async (timestamp) => {
    try {
      const response = await axios.get(`/api/results?timestamp=${timestamp}`);
      setResults(response.data);
      setSelectedTimestamp(timestamp);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Lighthouse Performance Analyzer</h1>
        <form onSubmit={handleSubmit} className="mb-6 flex gap-4">
          <input
            type="text"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="Enter sitemap URL"
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
        {results.length > 0 && (
          <Dashboard
            results={results}
            timestamps={timestamps}
            onTimestampChange={handleTimestampChange}
          />
        )}
      </div>
    </div>
  );
}