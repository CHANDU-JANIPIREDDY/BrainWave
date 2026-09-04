const { env } = require('../../config/env');
const { zohoApiRequest } = require('./zohoHttp');
const { AppError } = require('../../utils/httpErrors');
const { redactValue } = require('./zohoSafeLog');

function configuredBooksOrgId() {
  return String(env.ZOHO_BOOKS_ORG_ID || env.ZOHO_BOOKS_ORGANIZATION_ID || '').trim();
}

function isActiveOrg(org) {
  const status = String(org?.status || org?.organization_status || '').toLowerCase();
  return !status || status === 'active';
}

async function fetchBooksOrganizations() {
  const response = await zohoApiRequest({
    baseUrl: env.ZOHO_BOOKS_API_BASE_URL,
    method: 'GET',
    path: '/organizations',
  });

  // eslint-disable-next-line no-console
  console.log('[Zoho Books organizations] sanitized JSON:', JSON.stringify(redactValue(response.data)));

  return Array.isArray(response.data?.organizations) ? response.data.organizations : [];
}

async function resolveBooksOrganizationId() {
  const configured = configuredBooksOrgId();
  const orgs = await fetchBooksOrganizations();

  if (configured) {
    // eslint-disable-next-line no-console
    console.log('[Zoho Books] using configured organization_id from environment');
    return configured;
  }

  const active = orgs.filter(isActiveOrg);
  const chosen = active[0] || orgs[0];
  if (chosen?.organization_id) {
    // eslint-disable-next-line no-console
    console.log('[Zoho Books] using organization_id from organizations list', String(chosen.organization_id));
    return String(chosen.organization_id);
  }

  throw new AppError('No Zoho Books organization was found for this account.', 400);
}

function mapInvoice(invoice) {
  const amount = invoice.total ?? invoice.balance ?? invoice.sub_total;
  const currency = invoice.currency_code || invoice.currency_symbol || '';
  return {
    invoiceId: String(invoice.invoice_number || invoice.invoice_id || ''),
    customer: invoice.customer_name || '',
    amount: amount === undefined || amount === null ? '' : `${currency} ${amount}`.trim(),
    status: invoice.status || '',
    date: invoice.date || invoice.created_time || '',
  };
}

async function listInvoices() {
  const organizationId = await resolveBooksOrganizationId();
  const response = await zohoApiRequest({
    baseUrl: env.ZOHO_BOOKS_API_BASE_URL,
    method: 'GET',
    path: '/invoices',
    query: { organization_id: organizationId, per_page: 50 },
  });

  const rows = Array.isArray(response.data?.invoices) ? response.data.invoices : [];
  return {
    source: 'live',
    organizationId,
    invoices: rows.map(mapInvoice),
  };
}

module.exports = { listInvoices };
