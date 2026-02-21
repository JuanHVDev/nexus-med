import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    appointments_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '30s', target: 40 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const today = new Date().toISOString().split('T')[0];

  // Test 1: List appointments
  const listRes = http.get(`${API_BASE}/appointments`, {
    headers: headers(),
  });

  check(listRes, {
    'appointments list status': (r) => r.status === 200 || r.status === 401 || r.status === 403,
    'appointments list time': (r) => r.timings.duration < 800,
  });

  // Test 2: Calendar view
  const calendarRes = http.get(
    `${API_BASE}/appointments/calendar?start=${today}&end=${today}`,
    { headers: headers() }
  );

  check(calendarRes, {
    'calendar status': (r) => r.status === 200 || r.status === 401 || r.status === 403,
  });

  // Test 3: Get single appointment
  const singleRes = http.get(`${API_BASE}/appointments/1`, {
    headers: headers(),
  });

  check(singleRes, {
    'appointment detail status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
  });

  randomSleep(0.5, 2);
}
