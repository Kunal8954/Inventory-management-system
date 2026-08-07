const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('authToken');

function clearAuth() {
	localStorage.removeItem('authToken');
	localStorage.removeItem('user');
}

function handleUnauthorized() {
	clearAuth();
	// Use hard redirect to ensure we leave protected routes
	window.location.assign('/login');
}

async function request(path, { method = 'GET', body = null, auth = true, headers = {} } = {}) {
	const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
	const opts = { method, headers: { ...headers } };

	if (auth) {
		const token = getToken();
		if (token) {
			opts.headers['Authorization'] = `Bearer ${token}`;
		}
	}

	if (body !== null && !(body instanceof FormData)) {
		opts.headers['Content-Type'] = 'application/json';
		opts.body = JSON.stringify(body);
	} else if (body instanceof FormData) {
		opts.body = body;
	}

	let res;
	try {
		res = await fetch(url, opts);
	} catch (err) {
		const e = new Error('Network error: ' + (err.message || err));
		e.isNetworkError = true;
		throw e;
	}

	if (res.status === 401) {
		handleUnauthorized();
		const e = new Error('Unauthorized');
		e.status = 401;
		throw e;
	}

	const text = await res.text();
	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch (err) {
		data = text;
	}

	if (!res.ok) {
		const message = (data && data.message) || data || res.statusText || 'Request failed';
		const e = new Error(message);
		e.status = res.status;
		e.response = data;
		throw e;
	}

	return data;
}

export const api = {
	request,
	get: (path, opts = {}) => request(path, { ...opts, method: 'GET' }),
	post: (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body }),
	put: (path, body, opts = {}) => request(path, { ...opts, method: 'PUT', body }),
	del: (path, opts = {}) => request(path, { ...opts, method: 'DELETE' }),
};

export default api;