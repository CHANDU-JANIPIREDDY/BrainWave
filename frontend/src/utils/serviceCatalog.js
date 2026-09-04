export const SERVICE_CATALOG = {
  people: {
    service: 'people',
    label: 'Zoho People',
    description: 'Employee Management',
    detail: 'Directory, departments, and employee records.',
  },
  crm: {
    service: 'crm',
    label: 'Zoho CRM',
    description: 'Sales & Leads',
    detail: 'Leads, companies, and pipeline status.',
  },
  desk: {
    service: 'desk',
    label: 'Zoho Desk',
    description: 'Customer Support',
    detail: 'Tickets, priority, and customer follow-up.',
  },
  books: {
    service: 'books',
    label: 'Zoho Books',
    description: 'Finance & Invoices',
    detail: 'Invoices, customers, and payment status.',
  },
};

export function catalogFor(service, app = {}) {
  const preset = SERVICE_CATALOG[service] || {};
  return {
    service,
    label: app.displayName || preset.label || service,
    description: preset.description || app.description || `Service: ${service}`,
    detail: preset.detail || app.description || '',
    path: app.path,
  };
}
