/**
 * API Client wrapper for RightsTrack.
 * Wraps every fetch call with consistent error parsing.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' },
        loading: false,
      };
    }

    return { data, error: null, loading: false };
  } catch (err) {
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to connect to the server.' },
      loading: false,
    };
  }
}
