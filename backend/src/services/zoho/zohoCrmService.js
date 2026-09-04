const { env } = require('../../config/env');
const { zohoApiRequest } = require('./zohoHttp');

function leadName(lead) {
  if (lead.Full_Name) return lead.Full_Name;
  return [lead.First_Name, lead.Last_Name].filter(Boolean).join(' ').trim() || '—';
}

function mapLead(lead) {
  return {
    leadId: String(lead.id || ''),
    name: leadName(lead),
    company: lead.Company || '',
    email: lead.Email || '',
    phone: lead.Phone || lead.Mobile || '',
    status: lead.Lead_Status || '',
    createdTime: lead.Created_Time || '',
  };
}

async function listLeads() {
  const response = await zohoApiRequest({
    baseUrl: env.ZOHO_CRM_API_BASE_URL,
    method: 'GET',
    path: '/Leads',
    query: { per_page: 50 },
  });

  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return {
    source: 'live',
    leads: rows.map(mapLead),
  };
}

module.exports = { listLeads };
