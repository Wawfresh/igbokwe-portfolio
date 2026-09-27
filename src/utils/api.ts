export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiFetch<T>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is an object and not FormData, stringify it
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
    });
  } catch (err: any) {
    if (err?.message === 'Failed to fetch' || err?.message?.includes('fetch')) {
      throw new Error('Connection to the server failed. Please check your network and try again.');
    }
    throw err;
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg || typeof errorMsg !== 'string') {
      if (response.status === 401) {
        errorMsg = 'Session expired. Please sign in again.';
      } else if (response.status === 404) {
        errorMsg = 'The requested resource was not found.';
      } else if (response.status === 413) {
        errorMsg = 'Payload too large (maximum limit is 50 MB).';
      } else {
        errorMsg = `Server request failed (Status ${response.status}). Please try again.`;
      }
    }
    if (typeof errorMsg === 'string' && (errorMsg.includes('<!doctype') || errorMsg.includes('<html'))) {
      errorMsg = 'The server returned an unexpected response format. Please try again.';
    }
    throw new Error(errorMsg);
  }

  return data as T;
}

export function formatCustomDate(dateString?: string): string {
  if (!dateString) return 'Public Record';
  try {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
