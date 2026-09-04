const express = require('express');
const { requireAuthJWT } = require('../middlewares/requireAuthJWT');
const { requireZohoService } = require('../middlewares/requireZohoService');
const {
  zohoIntegrationStatus,
  zohoConnect,
  listPeopleEmployees,
  listCrmLeads,
  listDeskTickets,
  listBooksInvoices,
} = require('../controllers/zohoController');

const zohoRoutes = express.Router();

zohoRoutes.use(requireAuthJWT());

zohoRoutes.get('/status', zohoIntegrationStatus);
zohoRoutes.post('/connect', zohoConnect);

zohoRoutes.get('/people/employees', requireZohoService('people'), listPeopleEmployees);
zohoRoutes.get('/crm/leads', requireZohoService('crm'), listCrmLeads);
zohoRoutes.get('/desk/tickets', requireZohoService('desk'), listDeskTickets);
zohoRoutes.get('/books/invoices', requireZohoService('books'), listBooksInvoices);

module.exports = { zohoRoutes };
