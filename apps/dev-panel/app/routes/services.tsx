import { useLoaderData } from "react-router";
import type { Route } from "./+types/services";
import { getServices } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const services = await getServices();
    return { services };
  } catch (error) {
    console.error("Failed to load services:", error);
    return { services: [] };
  }
}

export default function Services({ loaderData }: Route.ComponentProps) {
  const { services } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Services</h1>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {services.map((service) => (
              <li key={service.name}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-3 ${service.status === "healthy" ? "bg-green-400" : "bg-red-400"}`}></div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {service.ready_replicas}/{service.replicas} ready
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Version: {service.version}</p>
                    <p className="text-sm text-gray-500">Status: {service.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

