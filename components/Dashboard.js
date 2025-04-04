import { useState } from 'react';

// const CircularProgress = ({ score, label }) => {
//   const radius = 70;
//   const circumference = 2 * Math.PI * radius;
//   const progress = score / 100 * circumference;
//   const color = score <= 30 ? 'red' : score <= 75 ? 'yellow' : 'green';

//   return (
//     <div className="text-center">
//       <svg width="120" height="120" className="mx-auto sm:w-160 sm:h-160">
//         <circle
//           className="stroke-gray-200 dark:stroke-gray-700"
//           cx="60"
//           cy="60"
//           r={radius - 10}
//           fill="none"
//           strokeWidth="10"
//         />
//         <circle
//           className={`stroke-${color}-500`}
//           cx="60"
//           cy="60"
//           r={radius - 10}
//           fill="none"
//           strokeWidth="10"
//           strokeDasharray={circumference}
//           strokeDashoffset={circumference - progress}
//           transform="rotate(-90 60 60)"
//         />
//         <text x="50%" y="50%" className="fill-current text-lg sm:text-xl font-bold" dominantBaseline="middle" textAnchor="middle">
//           {Math.round(score)}%
//         </text>
//       </svg>
//       <p className="mt-2 text-xs sm:text-sm dark:text-white">{label}</p>
//     </div>
//   );
// };

const CircularProgress = ({ score, label }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = score / 100 * circumference;
    const color = score <= 30 ? 'red' : score <= 75 ? 'yellow' : 'green';
    console.log(color)
    return (
      <div className="text-center">
        <svg width="160" height="160" className="mx-auto">
          <circle
            className="stroke-gray-200 dark:stroke-gray-700"
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="10"
          />
          <circle            
            cx="80"
            cy="80"
            r={radius}
            stroke = {color}
            fill="none"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 80 80)"
          />
          <text x="50%" y="50%" className="fill-current text-xl font-bold" dominantBaseline="middle" textAnchor="middle">
            {Math.round(score)}%
          </text>
        </svg>
        <p className="mt-2 text-sm">{label}</p>
      </div>
    );
  };

export default function Dashboard({ results, timestamps, onTimestampChange }) {
  const [selectedUrl, setSelectedUrl] = useState(null);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full md:w-80 p-4 bg-white dark:bg-gray-800 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 dark:text-white">URLs</h2>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedUrl === result.url ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
            onClick={() => setSelectedUrl(result.url)}
          >
            <p className="dark:text-white text-sm sm:text-base break-all">{result.url}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-4">
          <select
            className="w-full sm:w-auto p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
            onChange={(e) => onTimestampChange(e.target.value)}
          >
            {timestamps.map(ts => (
              <option key={ts} value={ts}>{new Date(ts).toLocaleString()}</option>
            ))}
          </select>
        </div>

        {selectedUrl && results.find(r => r.url === selectedUrl) ? (
          (() => {
            const data = results.find(r => r.url === selectedUrl);
            return (
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white break-all">{selectedUrl}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  <CircularProgress score={data.performance} label="Performance" />
                  <CircularProgress score={data.accessibility} label="Accessibility" />
                  <CircularProgress score={data.bestPractices} label="Best Practices" />
                  <CircularProgress score={data.seo} label="SEO" />
                </div>
                <div className="dark:text-white text-sm sm:text-base">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Performance Metrics</h3>
                  <p>FCP: {data.metrics.fcp}</p>
                  <p>LCP: {data.metrics.lcp}</p>
                  <p>TBT: {data.metrics.tbt}</p>
                  <p>CLS: {data.metrics.cls}</p>
                  <p>Speed Index: {data.metrics.speedIndex}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <p className="dark:text-white text-center">Select a URL to view performance metrics</p>
        )}
      </div>
    </div>
  );
}