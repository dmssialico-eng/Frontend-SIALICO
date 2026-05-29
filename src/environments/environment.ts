/**
 * Development environment configuration.
 * Angular replaces this file with environment.prod.ts during a production build
 * (configured via fileReplacements in angular.json).
 *
 * Before deploying to production, update environment.prod.ts with the correct
 * apiUrl pointing to the live backend server.
 */
export const environment = {
  production: false,
  /** Base URL for all API calls; points to the local Django dev server. */
  apiUrl: 'http://127.0.0.1:8000/api'
};
