import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [results, setResults] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  // const [darkMode, setDarkMode] = useState(false); // Dark mode state

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setProgress({ progress: 0, total: 0, current: 0, message: 'Starting...' });
    setError(null);

    const eventSource = new EventSource(`/api/analyze?sitemapUrl=${encodeURIComponent(sitemapUrl)}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        setError(data.message);
        setProgress(null);
        eventSource.close();
      } else if (data.progress === 100) {
        setProgress(data);
        setTimeout(() => {
          setProgress(null);
          fetchTimestamps();
          handleTimestampChange(data.timestamp);
        }, 1000);
        eventSource.close();
      } else {
        setProgress(data);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Please contact administrator.');
      setProgress(null);
      eventSource.close();
    };
  };

  const handleTimestampChange = async (timestamp) => {
    try {
      const response = await axios.get(`/api/results?timestamp=${timestamp}`);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  // const toggleDarkMode = () => {
  //   setDarkMode(!darkMode);
  //   document.documentElement.classList.toggle('dark');
  // };

  return (
    // <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold dark:text-white">SiteBlaze</h1>
          {/* <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {darkMode ? '☀️' : '🌙'}
          </button> */}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error} Contact: 
            <a href="mailto:selvasudar3@gmail.com" className="underline"> selvasudar3@gmail.com</a> or 
            <a href="https://linkedin.com/in/selvakumarduraipandian" target="_blank" className="underline"> LinkedIn</a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="Enter sitemap URL"
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
            disabled={progress !== null}
          />
          <button
            type="submit"
            disabled={progress !== null}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            Analyze
          </button>
        </form>

        {progress && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow w-full sm:w-3/4 md:w-1/2 mx-auto">
            <p className="dark:text-white">{progress.message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2 dark:text-white">
              Progress: {progress.current}/{progress.total} ({Math.round(progress.progress)}%)
            </p>
          </div>
        )}

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