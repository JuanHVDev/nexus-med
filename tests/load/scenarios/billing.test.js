import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    billing_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 },
      ],
    },
  },
};

export default function () {
  // Test 1: List invoices
  const listRes = http.get(`${API_BASE}/invoices?page=1&limit=20`, {
    headers: headers(),
  });

  check(listRes, {
    'invoices list status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
    'invoices response time': (r) => r.timings.duration < 800,
  });

  // Test 2: Get single invoice
  const singleRes = http.get(`${API_BASE}/invoices/1`, {
    headers: headers(),
  });

  check(singleRes, {
    'invoice detail status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
  });

  // Test 3: List services
  const servicesRes = http.get(`${API_BASE}/services`, {
    headers: headers(),
  });

  check(servicesRes, {
    'services list status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  randomSleep(0.5, 2);
}
