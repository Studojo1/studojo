import { useState } from "react";
import type { Route } from "./+types/ci-cd";
import { getCICDStatus, getDeployments } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const deployments = await getDeployments();
    return { deployments };
  } catch (error) {
    console.error("Failed to load deployments:", error);
    return { deployments: [] };
  }
}

export default function CICD({ loaderData }: Route.ComponentProps) {
  const { deployments } = loaderData;
  const [selectedService, setSelectedService] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">CI/CD Status</h1>
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Service</label>
          <input
            type="text"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="Service name"
          />
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deployments
                .filter((d) => !selectedService || d.service.includes(selectedService))
                .map((deployment, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deployment.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deployment.version}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        deployment.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {deployment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(deployment.deployed_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deployment.deployed_by || "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

