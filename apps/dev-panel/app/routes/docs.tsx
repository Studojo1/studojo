import { Link } from "react-router";
import type { Route } from "./+types/docs";

const DOCS = [
  { slug: "architecture-overview", title: "Architecture Overview" },
  { slug: "api-conventions", title: "API Conventions" },
  { slug: "authentication", title: "Authentication" },
  { slug: "code-organization", title: "Code Organization" },
  { slug: "database-patterns", title: "Database Patterns" },
  { slug: "deployment", title: "Deployment" },
  { slug: "messaging-patterns", title: "Messaging Patterns" },
  { slug: "service-development", title: "Service Development" },
  { slug: "worker-patterns", title: "Worker Patterns" },
];

export default function Docs({}: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Documentation</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ul className="space-y-2">
            {DOCS.map((doc) => (
              <li key={doc.slug}>
                <Link
                  to={`/docs/${doc.slug}`}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

