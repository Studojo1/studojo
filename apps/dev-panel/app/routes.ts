import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("api/auth/check-role", "routes/api.auth.check-role.tsx"),
  route("services", "routes/services.tsx"),
  route("logs", "routes/logs.tsx"),
  route("metrics", "routes/metrics.tsx"),
  route("ci-cd", "routes/ci-cd.tsx"),
  route("docs", "routes/docs.tsx"),
  route("docs/*", "routes/docs.$slug.tsx"),
] satisfies RouteConfig;

