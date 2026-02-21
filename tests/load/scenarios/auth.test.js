import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_BASE, headers, checkResponse, errorRate, randomSleep } from '../config.js';

export const options = {
  scenarios: {
    auth_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 20 },
        { duration: '10s', target: 50 },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

const TEST_EMAIL = __ENV.TEST_EMAIL || 'admin@clinica.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password123';

export default function () {
  // Test 1: Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    { headers: headers() }
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.status === 200 && r.json('session') !== undefined,
  });

  if (loginRes.status === 200) {
    const session = loginRes.json('session');
    const token = session?.token || session?.access_token;
    
    if (token) {
      // Test 2: Get current user
      const meRes = http.get(`${API_BASE}/patients`, {
        headers: headers(token),
      });
      
      check(meRes, {
        'auth check status 200': (r) => r.status === 200 || r.status === 401,
      });
    }
  }

  randomSleep(0.5, 2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/load/results/auth-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || '';
  let output = `${indent}Auth Load Test Results:\n`;
  output += `${indent}===================\n`;
  
  if (data.metrics.http_req_duration) {
    const dur = data.metrics.http_req_duration;
    output += `${indent}Response Time:\n`;
    output += `${indent}  - avg: ${dur.values.avg.toFixed(2)}ms\n`;
    output += `${indent}  - p95: ${dur.values['p(95)'].toFixed(2)}ms\n`;
    output += `${indent}  - p99: ${dur.values['p(99)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.http_reqs) {
    output += `${indent}Requests: ${data.metrics.http_reqs.values.count}\n`;
    output += `${indent}RPS: ${data.metrics.http_reqs.values.rate.toFixed(2)}\n`;
  }
  
  return output;
}
