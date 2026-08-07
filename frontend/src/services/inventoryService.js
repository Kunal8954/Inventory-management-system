import { api } from './api';

export const fetchInventory = async () => {
	try {
		return await api.get('/inventory');
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch inventory');
	}
};

export const fetchLowStockAlerts = async () => {
	try {
		return await api.get('/inventory/low-stock');
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch low stock alerts');
	}
};

export const fetchTransactions = async (filters = {}) => {
	try {
		const params = new URLSearchParams();
		Object.entries(filters || {}).forEach(([k, v]) => {
			if (v !== undefined && v !== null && v !== '') params.append(k, v);
		});
		const path = params.toString() ? `/inventory/transactions?${params.toString()}` : '/inventory/transactions';
		return await api.get(path);
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch transactions');
	}
};

export const createStockIn = async (data) => {
	try {
		return await api.post('/inventory/in', data);
	} catch (error) {
		throw new Error(error.message || 'Failed to create stock in');
	}
};

export const createStockOut = async (data) => {
	try {
		return await api.post('/inventory/out', data);
	} catch (error) {
		throw new Error(error.message || 'Failed to create stock out');
	}
};

export const createAdjustment = async (data) => {
	try {
		return await api.post('/inventory/adjust', data);
	} catch (error) {
		throw new Error(error.message || 'Failed to create adjustment');
	}
};

export const fetchInventoryStats = async () => {
	try {
		return await api.get('/inventory/stats');
	} catch (error) {
		throw new Error(error.message || 'Failed to fetch inventory stats');
	}
};

export const exportInventoryToCSV = (data, filename = 'inventory.csv') => {
	const headers = ['Product', 'SKU', 'Category', 'Quantity', 'Reserved', 'Available', 'Status'];
	const csvContent = [
		headers.join(','),
		...data.map((item) =>
			[
				item.productName,
				item.sku,
				item.category,
				item.quantity,
				item.reservedQuantity,
				item.availableQuantity,
				item.status,
			].join(',')
		),
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
};