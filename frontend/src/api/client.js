const API = import.meta.env.VITE_API_URL || '/api';
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const logout = () => localStorage.removeItem('token');
export async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...(options.headers || {}) }, body: options.body ? JSON.stringify(options.body) : undefined });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error API');
  if (res.status === 204) return null;
  return res.json();
}
