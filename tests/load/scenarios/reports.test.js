import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    reports_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 8 },
        { duration: '20s', target: 15 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'],
  },
};

const today = new Date().toISOString().split('T')[0];
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
const lastMonthStr = lastMonth.toISOString().split('T')[0];

export default function () {
  // Test 1: Patients report
  const patientsRes = http.get(
    `${API_BASE}/reports/patients?startDate=${lastMonthStr}&endDate=${today}`,
    { headers: headers() }
  );

  check(patientsRes, {
    'patients report status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
    'patients report time': (r) => r.timings.duration < 2000,
  });

  // Test 2: Appointments report
  const appointmentsRes = http.get(
    `${API_BASE}/reports/appointments?startDate=${lastMonthStr}&endDate=${today}`,
    { headers: headers() }
  );

  check(appointmentsRes, {
    'appointments report status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // Test 3: Financial report
  const financialRes = http.get(
    `${API_BASE}/reports/financial?startDate=${lastMonthStr}&endDate=${today}`,
    { headers: headers() }
  );

  check(financialRes, {
    'financial report status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  // Test 4: Medical report
  const medicalRes = http.get(
    `${API_BASE}/reports/medical?startDate=${lastMonthStr}&endDate=${today}`,
    { headers: headers() }
  );

  check(medicalRes, {
    'medical report status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  randomSleep(1, 3);
}
