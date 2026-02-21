import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    medical_notes_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 15 },
        { duration: '20s', target: 25 },
        { duration: '10s', target: 0 },
      ],
    },
  },
};

export default function () {
  // Test 1: List medical notes
  const listRes = http.get(`${API_BASE}/medical-notes?page=1&limit=20`, {
    headers: headers(),
  });

  check(listRes, {
    'medical notes list status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403,
    'medical notes response time': (r) => r.timings.duration < 800,
  });

  // Test 2: Get single note
  const singleRes = http.get(`${API_BASE}/medical-notes/1`, {
    headers: headers(),
  });

  check(singleRes, {
    'medical note detail status': (r) => 
      r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
  });

  randomSleep(0.5, 1.5);
}
