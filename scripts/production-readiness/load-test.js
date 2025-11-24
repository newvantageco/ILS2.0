/**
 * Load Testing Script using k6
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 *
 * Usage:
 *   k6 run load-test.js
 *   k6 run --vus 100 --duration 5m load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const apiCallDuration = new Trend('api_call_duration');
const totalRequests = new Counter('total_requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 50 },  // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },  // Stay at 50 users for 5 minutes

    // Stress test
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes

    // Spike test
    { duration: '1m', target: 200 }, // Spike to 200 users
    { duration: '3m', target: 200 }, // Stay at 200 for 3 minutes

    // Ramp-down
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],

  thresholds: {
    // HTTP errors should be less than 1%
    'errors': ['rate<0.01'],

    // 95% of requests should be below 500ms, 99% below 1000ms
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],

    // Health check should always be fast
    'health_check_duration': ['p(95)<200'],

    // API calls should be reasonable
    'api_call_duration': ['p(95)<1000'],
  },
};

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);

  // Verify server is up
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'server is up': (r) => r.status === 200,
  });

  return { baseUrl: BASE_URL };
}

/**
 * Main test function - runs for each virtual user
 */
export default function (data) {
  // Health check test
  group('Health Checks', function () {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/health`);
    healthCheckDuration.add(Date.now() - start);

    totalRequests.add(1);

    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check has status field': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status !== undefined;
        } catch (e) {
          return false;
        }
      },
      'health check response time < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
  });

  sleep(1);

  // Monitoring endpoints
  group('Monitoring Endpoints', function () {
    const start = Date.now();
    const res = http.get(`${data.baseUrl}/api/monitoring/health`);
    apiCallDuration.add(Date.now() - start);

    totalRequests.add(1);

    const success = check(res, {
      'monitoring health status is 200': (r) => r.status === 200,
      'monitoring response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  });

  sleep(1);

  // Public endpoints (no auth required)
  group('Public Endpoints', function () {
    const endpoints = [
      '/',
      '/api/health',
    ];

    endpoints.forEach((endpoint) => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}${endpoint}`);
      apiCallDuration.add(Date.now() - start);

      totalRequests.add(1);

      const success = check(res, {
        [`${endpoint} status is 200`]: (r) => r.status === 200,
        [`${endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
      });

      errorRate.add(!success);

      sleep(0.5);
    });
  });

  sleep(2);

  // Protected endpoints (should return 401)
  group('Protected Endpoints', function () {
    const endpoints = [
      '/api/patients',
      '/api/orders',
    ];

    endpoints.forEach((endpoint) => {
      const start = Date.now();
      const res = http.get(`${data.baseUrl}${endpoint}`);
      apiCallDuration.add(Date.now() - start);

      totalRequests.add(1);

      const success = check(res, {
        [`${endpoint} requires auth (401)`]: (r) => r.status === 401,
        [`${endpoint} response time < 500ms`]: (r) => r.timings.duration < 500,
      });

      errorRate.add(!success);

      sleep(0.5);
    });
  });

  sleep(3);
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log('Load test completed');

  // Final health check
  const res = http.get(`${data.baseUrl}/api/health`);
  check(res, {
    'server still up after test': (r) => r.status === 200,
  });
}

/**
 * Handle test summary
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

/**
 * Simple text summary (fallback if k6 doesn't provide one)
 */
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const colors = options.enableColors || false;

  let summary = '\n' + indent + '=====================================\n';
  summary += indent + '📊 LOAD TEST SUMMARY\n';
  summary += indent + '=====================================\n\n';

  // VUs
  summary += indent + `Virtual Users: ${data.metrics.vus?.values.value || 0}\n`;

  // Requests
  const reqDuration = data.metrics.http_req_duration;
  if (reqDuration) {
    summary += indent + `\nHTTP Request Duration:\n`;
    summary += indent + `  Min:    ${reqDuration.values.min.toFixed(2)}ms\n`;
    summary += indent + `  Avg:    ${reqDuration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  Med:    ${reqDuration.values.med.toFixed(2)}ms\n`;
    summary += indent + `  P95:    ${reqDuration.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `  P99:    ${reqDuration.values['p(99)'].toFixed(2)}ms\n`;
    summary += indent + `  Max:    ${reqDuration.values.max.toFixed(2)}ms\n`;
  }

  // Error rate
  const errors = data.metrics.errors;
  if (errors) {
    const errorPercent = (errors.values.rate * 100).toFixed(2);
    summary += indent + `\nError Rate: ${errorPercent}%\n`;
  }

  // Requests per second
  const reqRate = data.metrics.http_reqs;
  if (reqRate) {
    summary += indent + `\nRequests Per Second: ${reqRate.values.rate.toFixed(2)}\n`;
  }

  summary += indent + '\n=====================================\n';

  return summary;
}
