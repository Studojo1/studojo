import { useState } from "react";
import type { Route } from "./+types/metrics";
import { queryMetrics } from "~/lib/api";

export default function Metrics({}: Route.ComponentProps) {
  const [service, setService] = useState("");
  const [metric, setMetric] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const result = await queryMetrics(service || undefined, metric || undefined);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Metrics</h1>
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., frontend"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Metric</label>
              <input
                type="text"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                placeholder="e.g., cpu_usage"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleQuery}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Query"}
              </button>
            </div>
          </div>
        </div>
        {data && (
          <div className="bg-white shadow rounded-lg p-6">
            <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

