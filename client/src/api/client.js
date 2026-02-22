const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const request = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (_error) {
    throw new Error(
      'Cannot reach API server. Check backend is running and CORS/origin settings are correct.'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : {};

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  health: () => request('/health')
};

export const ledgerApi = {
  listEntries: (token, { month, status } = {}) => {
    const params = new URLSearchParams();
    if (month) {
      params.set('month', month);
    }
    if (status && status !== 'all') {
      params.set('status', status);
    }

    const query = params.toString();
    return request(`/ledger${query ? `?${query}` : ''}`, {
      token
    });
  },
  getSummary: (token, month) =>
    request(`/ledger/summary${month ? `?month=${month}` : ''}`, {
      token
    }),
  getRecommendations: (token, limit = 8) =>
    request(`/ledger/recommendations?limit=${limit}`, {
      token
    }),
  listShortcuts: (token) =>
    request('/ledger/shortcuts', {
      token
    }),
  createShortcut: (token, payload) =>
    request('/ledger/shortcuts', {
      method: 'POST',
      token,
      body: payload
    }),
  updateShortcut: (token, id, payload) =>
    request(`/ledger/shortcuts/${id}`, {
      method: 'PATCH',
      token,
      body: payload
    }),
  deleteShortcut: (token, id) =>
    request(`/ledger/shortcuts/${id}`, {
      method: 'DELETE',
      token
    }),
  useShortcut: (token, id, payload = {}) =>
    request(`/ledger/shortcuts/${id}/use`, {
      method: 'POST',
      token,
      body: payload
    }),
  listAutomations: (token) =>
    request('/ledger/automations', {
      token
    }),
  createAutomation: (token, payload) =>
    request('/ledger/automations', {
      method: 'POST',
      token,
      body: payload
    }),
  updateAutomation: (token, id, payload) =>
    request(`/ledger/automations/${id}`, {
      method: 'PATCH',
      token,
      body: payload
    }),
  runAutomations: (token) =>
    request('/ledger/automations/run-due', {
      method: 'POST',
      token
    }),
  createEntry: (token, payload) =>
    request('/ledger', {
      method: 'POST',
      token,
      body: payload
    }),
  editEntry: (token, id, payload) =>
    request(`/ledger/${id}`, {
      method: 'PATCH',
      token,
      body: payload
    }),
  decideEntry: (token, id, payload) =>
    request(`/ledger/${id}/decision`, {
      method: 'PATCH',
      token,
      body: payload
    }),
  createCorrection: (token, id, payload) =>
    request(`/ledger/${id}/corrections`, {
      method: 'POST',
      token,
      body: payload
    })
};
