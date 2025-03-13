'use client';

import { useState, useEffect } from 'react';

interface ApiResponse {
  message: string;
  timestamp: string;
}

export default function ApiTest() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/system');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">API Test</h2>
      
      <button 
        onClick={fetchData}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Test API'}
      </button>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {data && (
        <div className="p-3 bg-green-100 rounded">
          <div className="font-semibold text-gray-600">{data.message}</div>
          <div className="text-sm text-gray-600">Timestamp: {data.timestamp}</div>
        </div>
      )}
    </div>
  );
} 