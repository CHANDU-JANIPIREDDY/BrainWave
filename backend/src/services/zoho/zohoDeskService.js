const { env } = require('../../config/env');
const { zohoApiRequest } = require('./zohoHttp');
const { AppError } = require('../../utils/httpErrors');

const MOCK_TICKETS = [
  {
    ticketId: 'TKT-1001',
    subject: 'Laptop not connecting to office Wi-Fi',
    customer: 'Anita Sharma',
    status: 'Open',
    priority: 'High',
    assignee: 'Support Agent',
    createdTime: '2026-09-01T09:15:00+05:30',
  },
  {
    ticketId: 'TKT-1002',
    subject: 'Need access to the sales shared drive',
    customer: 'Rahul Mehta',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Support Agent',
    createdTime: '2026-09-02T11:40:00+05:30',
  },
  {
    ticketId: 'TKT-1003',
    subject: 'Payroll portal password reset',
    customer: 'Priya Nair',
    status: 'Open',
    priority: 'Low',
    assignee: 'Unassigned',
    createdTime: '2026-09-03T08:05:00+05:30',
  },
  {
    ticketId: 'TKT-1004',
    subject: 'Email signature not updating after name change',
    customer: 'Vikram Joshi',
    status: 'On Hold',
    priority: 'Medium',
    assignee: 'Support Agent',
    createdTime: '2026-09-03T14:22:00+05:30',
  },
  {
    ticketId: 'TKT-1005',
    subject: 'Monitor flicker after Windows update',
    customer: 'Sneha Iyer',
    status: 'Closed',
    priority: 'High',
    assignee: 'Support Agent',
    createdTime: '2026-08-28T16:50:00+05:30',
  },
];

function mapTicket(ticket) {
  const contact = ticket.contact || {};
  const assignee = ticket.assignee || {};
  const customer =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.email ||
    ticket.email ||
    '—';

  return {
    ticketId: String(ticket.ticketNumber || ticket.id || ''),
    subject: ticket.subject || '',
    customer,
    status: ticket.status || '',
    priority: ticket.priority || '',
    assignee: assignee.firstName ? `${assignee.firstName} ${assignee.lastName || ''}`.trim() : assignee.name || 'Unassigned',
    createdTime: ticket.createdTime || '',
  };
}

async function resolveDeskOrgId() {
  if (env.ZOHO_DESK_ORG_ID) return env.ZOHO_DESK_ORG_ID;

  const orgs = await zohoApiRequest({
    baseUrl: env.ZOHO_DESK_API_BASE_URL,
    method: 'GET',
    path: '/organizations',
  });

  const list = Array.isArray(orgs.data?.data) ? orgs.data.data : Array.isArray(orgs.data) ? orgs.data : [];
  if (list.length === 1 && (list[0].id || list[0].organizationId)) {
    return String(list[0].id || list[0].organizationId);
  }
  if (list.length === 0) {
    throw new AppError('No Zoho Desk organization was found for this account.', 400);
  }
  throw new AppError('Multiple Zoho Desk organizations found. Set ZOHO_DESK_ORG_ID in the backend environment.', 400);
}

async function listTickets() {
  if (env.ZOHO_DESK_MOCK_MODE) {
    return {
      source: 'mock',
      mode: 'demo',
      tickets: MOCK_TICKETS,
    };
  }

  const orgId = await resolveDeskOrgId();
  const response = await zohoApiRequest({
    baseUrl: env.ZOHO_DESK_API_BASE_URL,
    method: 'GET',
    path: '/tickets',
    query: { limit: 50 },
    headers: { orgId },
  });

  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return {
    source: 'live',
    mode: 'live',
    tickets: rows.map(mapTicket),
  };
}

module.exports = { listTickets };
