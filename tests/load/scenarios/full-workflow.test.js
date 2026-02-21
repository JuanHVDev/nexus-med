import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    full_workflow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '60s', target: 50 },
        { duration: '30s', target: 75 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.03'],
  },
};

const TEST_EMAIL = __ENV.TEST_EMAIL || 'admin@clinica.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password123';

let authToken = null;

export default function () {
  // 1. Login (solo una vez al inicio del contexto)
  if (!authToken) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/sign-in/email`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers: headers() }
    );

    if (loginRes.status === 200) {
      const session = loginRes.json('session');
      authToken = session?.token || session?.access_token;
    }
  }

  const reqHeaders = headers(authToken);

  // 2. Dashboard - Patients list
  const patientsRes = http.get(`${API_BASE}/patients?page=1&limit=10`, {
    headers: reqHeaders,
  });
  check(patientsRes, {
    'get patients': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // 3. Dashboard - Appointments
  const appointmentsRes = http.get(`${API_BASE}/appointments`, {
    headers: reqHeaders,
  });
  check(appointmentsRes, {
    'get appointments': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // 4. Calendar
  const today = new Date().toISOString().split('T')[0];
  const calendarRes = http.get(
    `${API_BASE}/appointments/calendar?start=${today}&end=${today}`,
    { headers: reqHeaders }
  );
  check(calendarRes, {
    'get calendar': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // 5. Medical notes
  const notesRes = http.get(`${API_BASE}/medical-notes?page=1&limit=10`, {
    headers: reqHeaders,
  });
  check(notesRes, {
    'get medical notes': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // 6. Invoices
  const invoicesRes = http.get(`${API_BASE}/invoices?page=1&limit=10`, {
    headers: reqHeaders,
  });
  check(invoicesRes, {
    'get invoices': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // 7. Lab orders
  const labRes = http.get(`${API_BASE}/lab-orders?page=1&limit=10`, {
    headers: reqHeaders,
  });
  check(labRes, {
    'get lab orders': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // 8. Reports (simplified)
  const reportRes = http.get(
    `${API_BASE}/reports/patients?startDate=2024-01-01&endDate=${today}`,
    { headers: reqHeaders }
  );
  check(reportRes, {
    'get report': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  randomSleep(0.5, 2);
}

export function handleSummary(data) {
  return {
    'stdout': `Full Workflow Load Test Results
================================
Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
RPS: ${data.metrics.http_reqs?.values?.rate?.toFixed(2) || 0}
Avg Response: ${data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0}ms
p95 Response: ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms
p99 Response: ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0}ms
Errors: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
`,
    'tests/load/results/full-workflow-summary.json': JSON.stringify(data, null, 2),
  };
}
