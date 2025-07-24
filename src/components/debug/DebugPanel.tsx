'use client';

import { useState, useEffect } from 'react';

interface DebugLog {
  timestamp: string;
  message: string;
  data?: any;
}

export function DebugPanel() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load logs from localStorage
    const loadLogs = () => {
      const storedLogs = JSON.parse(localStorage.getItem('debug-logs') || '[]');
      setLogs(storedLogs);
    };

    loadLogs();
    
    // Update logs every second
    const interval = setInterval(loadLogs, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('debug-logs');
    setLogs([]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        Debug ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-green-400 p-4 rounded-lg max-w-lg max-h-96 overflow-auto text-xs font-mono z-50 border border-green-400">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold">Debug Logs ({logs.length})</h3>
        <div className="space-x-2">
          <button
            onClick={clearLogs}
            className="bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
          >
            Hide
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        {logs.slice(-20).map((log, index) => (
          <div key={index} className="border-b border-gray-700 pb-1">
            <div className="text-yellow-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
            <div className="text-green-400">{log.message}</div>
            {log.data && (
              <div className="text-blue-400 pl-2">
                {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}