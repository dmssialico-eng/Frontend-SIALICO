/**
 * Production environment configuration.
 * Swapped in automatically by Angular CLI during `ng build --configuration production`.
 *
 * IMPORTANT: Update apiUrl to the production server URL before deploying.
 * The current value still points to localhost and will not work in production.
 */
export const environment = {
  production: true,
  /** TODO: Replace with the production backend URL before deploying. */
  apiUrl: 'http://127.0.0.1:8000/api'
};
