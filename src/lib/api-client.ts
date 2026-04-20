import { useAppStore } from './store';

/**
 * API fetch wrapper that automatically adds the Authorization header
 * and handles 401 responses by logging out the user.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAppStore.getState().token;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    useAppStore.getState().logout();
    window.location.href = '/';
  }

  return response;
}
