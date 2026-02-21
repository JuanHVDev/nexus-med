import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_BASE, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    patients_crud: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 15 },
        { duration: '20s', target: 30 },
        { duration: '10s', target: 0 },
      ],
    },
  },
};

const CLINIC_ID = __ENV.CLINIC_ID || 'test-clinic-id';

export default function () {
  // Para testing sin auth, usamos endpoints públicos o saltamos
  // Este test simula acceso a listados de pacientes
  
  // Test 1: List patients
  const listRes = http.get(`${API_BASE}/patients?page=1&limit=20`, {
    headers: headers(),
  });

  check(listRes, {
    'patients list status': (r) => r.status === 200 || r.status === 401 || r.status === 403,
    'patients list response time': (r) => r.timings.duration < 1000,
  });

  // Test 2: Search patients
  const searchRes = http.get(`${API_BASE}/patients?search=juan`, {
    headers: headers(),
  });

  check(searchRes, {
    'patients search status': (r) => r.status === 200 || r.status === 401 || r.status === 403,
  });

  // Test 3: Get single patient (if we have an ID)
  const singleRes = http.get(`${API_BASE}/patients/1`, {
    headers: headers(),
  });

  check(singleRes, {
    'patient detail status': (r) => r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
  });

  randomSleep(0.3, 1.5);
}
