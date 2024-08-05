import { routes } from "@constants/routes";
import { RouteOptions } from "@type/app";

export function route(name: string, options?: RouteOptions): string {
  const { params, version = 'v1', type = 'api' } = options || {};

  const getRoute = (path: any, nameParts: string[]): string => {
    for (const part of nameParts) {
      if (!path[part]) throw new Error(`Route ${name} not found`);
      path = path[part];
    }
    return path;
  };

  const nameParts = name.split('.');
  let routePath = getRoute(routes[type][version], nameParts);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      routePath = routePath.replace(`:${key}`, String(value));
    }
  }

  return routePath;
}
