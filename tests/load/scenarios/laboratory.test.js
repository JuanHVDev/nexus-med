import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    lab_orders_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 15 },
        { duration: '10s', target: 0 },
      ],
    },
  },
};

export default function () {
  // Test 1: List lab orders
  const listRes = http.get(`${API_BASE}/lab-orders?page=1&limit=20`, {
    headers: headers(),
  });

  check(listRes, {
    'lab orders list status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
    'lab orders response time': (r) => r.timings.duration < 800,
  });

  // Test 2: Get single lab order
  const singleRes = http.get(`${API_BASE}/lab-orders/1`, {
    headers: headers(),
  });

  check(singleRes, {
    'lab order detail status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
  });

  // Test 3: Imaging orders list
  const imagingRes = http.get(`${API_BASE}/imaging-orders?page=1&limit=20`, {
    headers: headers(),
  });

  check(imagingRes, {
    'imaging orders list status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
  });

  randomSleep(0.5, 2);
}
