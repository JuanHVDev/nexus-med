import http from 'http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DURATION = parseInt(process.env.DURATION) || 30;
const USERS = parseInt(process.env.USERS) || 10;
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clinica.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

console.log(`
========================================
  Load Test - HC Gestor
========================================
  URL: ${BASE_URL}
  Duration: ${DURATION}s
  Concurrent Users: ${USERS}
  Test Email: ${TEST_EMAIL}
========================================
`);

const endpoints = [
  '/api/patients',
  '/api/appointments',
  '/api/medical-notes',
  '/api/invoices',
  '/api/lab-orders',
  '/api/reports/patients',
  '/api/reports/appointments',
  '/api/reports/financial',
];

let authCookie = null;

function makeRequest(path, cookie) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookie || '',
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({ 
          status: res.statusCode, 
          duration,
          cookie: res.headers['set-cookie']
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({ status: 0, duration: 0, error: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, duration: 0, error: 'timeout' });
    });
    
    req.end();
  });
}

function login(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/sign-in/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 15000,
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookie = res.headers['set-cookie'];
        resolve({ status: res.statusCode, cookie });
      });
    });
    
    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });
    
    req.write(postData);
    req.end();
  });
}

let totalRequests = 0;
let totalErrors = 0;
const responseTimes = [];
const statusCodes = {};

async function runUser() {
  let userCookie = authCookie;
  let reauthCount = 0;
  const endTime = Date.now() + (DURATION * 1000);
  
  while (Date.now() < endTime) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const result = await makeRequest(endpoint, userCookie);
    
    totalRequests++;
    if (result.status >= 400) totalErrors++;
    if (result.duration > 0) {
      responseTimes.push(result.duration);
    }
    statusCodes[result.status] = (statusCodes[result.status] || 0) + 1;
    
    if (result.status === 401 && reauthCount < 2) {
      const loginResult = await login(TEST_EMAIL, TEST_PASSWORD);
      if (loginResult.cookie) {
        userCookie = loginResult.cookie;
        reauthCount++;
      }
    }
    
    await new Promise(r => setTimeout(r, Math.random() * 300 + 50));
  }
}

async function start() {
  console.log('Authenticating...\n');
  
  const loginResult = await login(TEST_EMAIL, TEST_PASSWORD);
  
  if (loginResult.cookie) {
    authCookie = loginResult.cookie;
    console.log('Authenticated successfully!\n');
  } else {
    console.log('Warning: Could not authenticate.\n');
  }
  
  console.log('Starting load test...\n');
  
  const startTime = Date.now();
  
  const users = Array(USERS).fill(null).map(() => runUser());
  
  await Promise.all(users);
  
  const actualDuration = (Date.now() - startTime) / 1000;
  
  responseTimes.sort((a, b) => a - b);
  
  const validTimes = responseTimes.filter(t => t > 0);
  const p50 = validTimes[Math.floor(validTimes.length * 0.5)] || 0;
  const p95 = validTimes[Math.floor(validTimes.length * 0.95)] || 0;
  const p99 = validTimes[Math.floor(validTimes.length * 0.99)] || 0;
  const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length || 0;
  
  let statusMsg = '\nStatus Codes:\n';
  for (const [code, count] of Object.entries(statusCodes)) {
    statusMsg += `  ${code}: ${count}\n`;
  }
  
  console.log(`
========================================
  RESULTS
========================================
  Total Requests: ${totalRequests}
  Duration: ${actualDuration.toFixed(2)}s
  RPS: ${(totalRequests / actualDuration).toFixed(2)}
  
  Response Times:
    - Avg: ${avg.toFixed(2)}ms
    - p50: ${p50}ms
    - p95: ${p95}ms
    - p99: ${p99}ms
  
  Errors: ${totalErrors}
  Error Rate: ${totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0}%
${statusMsg}
========================================
`);
  
  process.exit(0);
}

start();
