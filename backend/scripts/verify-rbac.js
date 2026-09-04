/* Lightweight RBAC + route smoke test. Requires a reachable MONGO_URI. */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const axios = require('axios');
const { createApp } = require('../src/app');
const { connectToMongo } = require('../src/config/db');
const { seedIfNeeded } = require('../src/seed/seed');

const results = { passed: [], failed: [] };

function assert(name, cond, extra) {
  if (cond) results.passed.push(name);
  else results.failed.push(extra ? `${name} (${extra})` : name);
}

async function main() {
  await connectToMongo();
  await seedIfNeeded();

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  async function login(username, password) {
    const res = await axios.post(`${base}/api/auth/login`, { username, password }, { validateStatus: () => true });
    return res;
  }

  const users = [
    ['admin', 'Admin@12345'],
    ['hr', 'Hr@12345'],
    ['sales', 'Sales@12345'],
    ['support', 'Support@12345'],
    ['finance', 'Finance@12345'],
  ];

  const tokens = {};
  for (const [username, password] of users) {
    const res = await login(username, password);
    assert(`${username} login`, res.status === 200 && res.data.token, `status=${res.status}`);
    assert(`${username} services present`, Array.isArray(res.data.user?.services), `services=${JSON.stringify(res.data.user?.services)}`);
    tokens[username] = res.data.token;
  }

  const noAuth = await axios.get(`${base}/api/zoho/people/employees`, { validateStatus: () => true });
  assert('missing JWT → 401', noAuth.status === 401);

  const badJwt = await axios.get(`${base}/api/zoho/people/employees`, {
    headers: { Authorization: 'Bearer not-a-token' },
    validateStatus: () => true,
  });
  assert('invalid JWT → 401', badJwt.status === 401);

  async function hit(username, url) {
    return axios.get(`${base}${url}`, {
      headers: { Authorization: `Bearer ${tokens[username]}` },
      validateStatus: () => true,
    });
  }

  const hrCrm = await hit('hr', '/api/zoho/crm/leads');
  const hrDesk = await hit('hr', '/api/zoho/desk/tickets');
  const hrBooks = await hit('hr', '/api/zoho/books/invoices');
  const hrPeople = await hit('hr', '/api/zoho/people/employees');
  assert('HR → CRM 403', hrCrm.status === 403);
  assert('HR → Desk 403', hrDesk.status === 403);
  assert('HR → Books 403', hrBooks.status === 403);
  assert('HR → People not 403', hrPeople.status !== 403, `status=${hrPeople.status}`);

  const salesPeople = await hit('sales', '/api/zoho/people/employees');
  const salesCrm = await hit('sales', '/api/zoho/crm/leads');
  assert('Sales → People 403', salesPeople.status === 403);
  assert('Sales → CRM not 403', salesCrm.status !== 403, `status=${salesCrm.status}`);

  const supportDesk = await hit('support', '/api/zoho/desk/tickets');
  const supportBooks = await hit('support', '/api/zoho/books/invoices');
  assert('Support → Desk not 403', supportDesk.status !== 403 && supportDesk.status !== 401, `status=${supportDesk.status}`);
  assert('Support → Books 403', supportBooks.status === 403);
  assert('Support Desk mock source', supportDesk.status === 200 && supportDesk.data.source === 'mock', `status=${supportDesk.status}`);

  const financeBooks = await hit('finance', '/api/zoho/books/invoices');
  const financeCrm = await hit('finance', '/api/zoho/crm/leads');
  assert('Finance → Books not 403', financeBooks.status !== 403, `status=${financeBooks.status}`);
  assert('Finance → CRM 403', financeCrm.status === 403);

  const adminPeople = await hit('admin', '/api/zoho/people/employees');
  const adminCrm = await hit('admin', '/api/zoho/crm/leads');
  const adminDesk = await hit('admin', '/api/zoho/desk/tickets');
  const adminBooks = await hit('admin', '/api/zoho/books/invoices');
  const adminUsers = await hit('admin', '/api/admin/users');
  assert('Admin → People not 403', adminPeople.status !== 403);
  assert('Admin → CRM not 403', adminCrm.status !== 403);
  assert('Admin → Desk 200 mock', adminDesk.status === 200 && adminDesk.data.source === 'mock');
  assert('Admin → Books not 403', adminBooks.status !== 403);
  assert('Admin → users 200', adminUsers.status === 200);

  const hrAdmin = await hit('hr', '/api/admin/users');
  assert('HR → Admin 403', hrAdmin.status === 403);

  const proxyGone = await axios.post(`${base}/api/zoho/proxy`, { service: 'crm', request: { method: 'GET', path: '/Leads' } }, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    validateStatus: () => true,
  });
  assert('generic Zoho proxy removed', proxyGone.status === 404);

  const hrLogin = await login('hr', 'Hr@12345');
  assert('HR services are People only', Array.isArray(hrLogin.data.user?.services) && hrLogin.data.user.services.join(',') === 'people', `services=${(hrLogin.data.user?.services || []).join(',')}`);
  const salesLogin = await login('sales', 'Sales@12345');
  assert('Sales services are CRM only', Array.isArray(salesLogin.data.user?.services) && salesLogin.data.user.services.join(',') === 'crm', `services=${(salesLogin.data.user?.services || []).join(',')}`);

  server.close();
  await require('mongoose').disconnect();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(results, null, 2));
  if (results.failed.length) process.exit(1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('VERIFY_FAILED', err.message);
  process.exit(1);
});
