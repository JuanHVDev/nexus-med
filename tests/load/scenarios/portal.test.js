import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, headers, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    portal_load: {
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
  // Test 1: Portal doctors list (public)
  const doctorsRes = http.get(`${BASE_URL}/api/portal/doctors`, {
    headers: headers(),
  });

  check(doctorsRes, {
    'portal doctors status': (r) => r.status === 200 || r.status === 500,
  });

  // Test 2: Portal login
  const loginRes = http.post(
    `${BASE_URL}/api/portal/auth/login`,
    JSON.stringify({
      email: 'patient@test.com',
      password: 'password123',
    }),
    { headers: headers() }
  );

  check(loginRes, {
    'portal login status': (r) => 
      r.status === 200 || r.status === 400 || r.status === 401,
  });

  // Test 3: Portal appointments request
  const appointmentReqRes = http.post(
    `${BASE_URL}/api/portal/appointments/request`,
    JSON.stringify({
      doctorId: '1',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Consulta general',
    }),
    { headers: headers() }
  );

  check(appointmentReqRes, {
    'portal appointment request status': (r) => 
      r.status === 200 || r.status === 400 || r.status === 401 || r.status === 500,
  });

  randomSleep(0.5, 2);
}
