const { env } = require('../config/env');
const { writeAudit } = require('../utils/audit');
const { sendError, sendSuccess, publicZohoError } = require('../utils/httpErrors');
const rbacService = require('../services/rbac/rbacService');
const { getZohoAccessToken } = require('../services/zoho/zohoOAuth');
const { listEmployees } = require('../services/zoho/zohoPeopleService');
const { listLeads } = require('../services/zoho/zohoCrmService');
const { listTickets } = require('../services/zoho/zohoDeskService');
const { listInvoices } = require('../services/zoho/zohoBooksService');

async function zohoIntegrationStatus(_req, res) {
  return sendSuccess(res, {
    connected: Boolean(env.ZOHO_REFRESH_TOKEN && env.ZOHO_CLIENT_ID && !/your_refresh_token_here/i.test(env.ZOHO_REFRESH_TOKEN || '')),
    deskMode: env.ZOHO_DESK_MOCK_MODE ? 'mock' : 'live',
  });
}

async function handleServiceRead(req, res, { service, action, runner }) {
  const userId = req.auth?.userId;
  try {
    const payload = await runner();
    await writeAudit({
      userId,
      action,
      resource: 'ZohoService',
      resourceId: service,
      status: 'success',
      request: { service, source: payload.source || 'live' },
      message: `Accessed ${service}`,
    });
    return sendSuccess(res, payload);
  } catch (error) {
    const { status, message } = publicZohoError(error);
    await writeAudit({
      userId,
      action,
      resource: 'ZohoService',
      resourceId: service,
      status: 'failed',
      request: { service },
      message,
    });
    return sendError(res, status, message);
  }
}

async function listPeopleEmployees(req, res) {
  return handleServiceRead(req, res, {
    service: 'people',
    action: 'zoho:people:employees',
    runner: listEmployees,
  });
}

async function listCrmLeads(req, res) {
  return handleServiceRead(req, res, {
    service: 'crm',
    action: 'zoho:crm:leads',
    runner: listLeads,
  });
}

async function listDeskTickets(req, res) {
  return handleServiceRead(req, res, {
    service: 'desk',
    action: 'zoho:desk:tickets',
    runner: listTickets,
  });
}

async function listBooksInvoices(req, res) {
  return handleServiceRead(req, res, {
    service: 'books',
    action: 'zoho:books:invoices',
    runner: listInvoices,
  });
}

async function zohoConnect(req, res) {
  const userId = req.auth?.userId;
  const { service } = req.body || {};
  const serviceKey = String(service || '').toLowerCase();
  const permissionCode = rbacService.getPermissionForService(serviceKey);
  if (!permissionCode) return sendError(res, 400, 'Invalid Zoho service');

  const permissionCodes = await rbacService.getUserPermissions(userId);
  if (!permissionCodes.includes(permissionCode)) {
    await writeAudit({
      userId,
      action: 'zoho:connect',
      resource: 'ZohoService',
      resourceId: serviceKey,
      status: 'forbidden',
      request: { service: serviceKey },
      message: 'Forbidden Zoho service access',
    });
    return sendError(res, 403, `You do not have permission to access this Zoho service`);
  }

  try {
    await getZohoAccessToken();
    await writeAudit({
      userId,
      action: 'zoho:connect',
      resource: 'ZohoService',
      resourceId: serviceKey,
      status: 'success',
      request: { service: serviceKey },
      message: 'Zoho access token generated successfully',
    });
    return sendSuccess(res, { connected: true });
  } catch (error) {
    const { status, message } = publicZohoError(error);
    await writeAudit({
      userId,
      action: 'zoho:connect',
      resource: 'ZohoService',
      resourceId: serviceKey,
      status: 'failed',
      request: { service: serviceKey },
      message,
    });
    return sendError(res, status, message);
  }
}

module.exports = {
  zohoIntegrationStatus,
  zohoConnect,
  listPeopleEmployees,
  listCrmLeads,
  listDeskTickets,
  listBooksInvoices,
};
