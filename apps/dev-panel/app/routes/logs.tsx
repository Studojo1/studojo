import { useState } from "react";
import type { Route } from "./+types/logs";
import { queryLogs } from "~/lib/api";

export default function Logs({}: Route.ComponentProps) {
  const [service, setService] = useState("");
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await queryLogs(service || undefined, query || undefined);
      setLogs(result.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Logs</h1>
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., frontend"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Query</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search query"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Search"}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs found. Enter a search query above.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-2 p-2 bg-gray-50 rounded">
                  <span className="text-gray-500">{new Date(log.timestamp).toISOString()}</span>
                  <span className="ml-2 text-blue-600">[{log.service}]</span>
                  <span className="ml-2 text-gray-700">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

