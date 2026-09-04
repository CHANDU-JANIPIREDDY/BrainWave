const { env } = require('../../config/env');
const { zohoApiRequest } = require('./zohoHttp');

function pick(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') return record[key];
  }
  return '';
}

function mapEmployee(recordId, record) {
  const first = pick(record, ['FirstName', 'First_Name', 'firstname']);
  const last = pick(record, ['LastName', 'Last_Name', 'lastname']);
  const full = pick(record, ['EmployeeName', 'Full_Name', 'Name']) || [first, last].filter(Boolean).join(' ').trim();

  return {
    employeeId: String(pick(record, ['EmployeeID', 'EmployeeId', 'Employee_ID', 'EmpID']) || recordId || ''),
    name: full || '—',
    email: pick(record, ['EmailID', 'Email_ID', 'Email', 'Work_Email', 'EMPLOYEEMAILALIAS']),
    department: pick(record, ['Department', 'DepartmentName', 'Department_Name']),
    designation: pick(record, ['Designation', 'DesignationName', 'Job_Title']),
    status: pick(record, ['Employeestatus', 'EmployeeStatus', 'Employee_Status', 'Status']) || '—',
  };
}

function flattenPeopleResult(raw) {
  const result = raw?.response?.result ?? raw?.result ?? raw?.data ?? [];
  const employees = [];

  if (!Array.isArray(result)) return employees;

  for (const item of result) {
    if (!item || typeof item !== 'object') continue;

    const keys = Object.keys(item);
    if (keys.length === 1 && Array.isArray(item[keys[0]])) {
      const rec = item[keys[0]][0] || {};
      employees.push(mapEmployee(keys[0], rec));
      continue;
    }

    employees.push(mapEmployee(item.recordId || item.id || item.pkId, item));
  }

  return employees;
}

async function listEmployees() {
  const response = await zohoApiRequest({
    baseUrl: env.ZOHO_PEOPLE_API_BASE_URL,
    method: 'GET',
    path: '/forms/employee/getRecords',
    query: { sIndex: 1, limit: 50 },
  });

  return {
    source: 'live',
    employees: flattenPeopleResult(response.data),
  };
}

module.exports = { listEmployees };
