import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
  scenarios: {
    // Escenario ligero: 10 usuarios, 30 segundos
    light: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Escenario medio: 50 usuarios, 1 minuto
    medium: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 25 },
        { duration: '30s', target: 50 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Escenario alto: 200 usuarios, 2 minutos
    high: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '60s', target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
    // Escenario de estrés: 500 usuarios, 3 minutos
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '60s', target: 400 },
        { duration: '60s', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>50'],
  },
};

export const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

export { BASE_URL, API_BASE };

export function headers(authToken = null) {
  const h = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    h['Authorization'] = `Bearer ${authToken}`;
  }
  return h;
}

export function checkResponse(res, endpoint) {
  const success = check(res, {
    [`${endpoint} status 200`]: (r) => r.status === 200,
    [`${endpoint} response time`]: (r) => r.timings.duration < 1000,
  });
  
  if (!success) {
    errorRate.add(1);
  }
  
  return success;
}

export function randomSleep(min = 0.5, max = 2) {
  sleep(Math.random() * (max - min) + min);
}
