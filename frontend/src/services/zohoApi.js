import { api, authHeader } from './api.js';

export function fetchPeopleEmployees(token) {
  return api.get('/api/zoho/people/employees', { headers: authHeader(token) });
}

export function fetchCrmLeads(token) {
  return api.get('/api/zoho/crm/leads', { headers: authHeader(token) });
}

export function fetchDeskTickets(token) {
  return api.get('/api/zoho/desk/tickets', { headers: authHeader(token) });
}

export function fetchBooksInvoices(token) {
  return api.get('/api/zoho/books/invoices', { headers: authHeader(token) });
}

export function fetchAuthorizedApps(token) {
  return api.get('/api/portal/applications', { headers: authHeader(token) });
}

export function fetchZohoStatus(token) {
  return api.get('/api/zoho/status', { headers: authHeader(token) });
}
