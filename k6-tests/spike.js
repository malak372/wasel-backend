import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * @file spike-test.js
 * @description Spike test to verify system resilience during sudden traffic surges.
 * This script simulates an extreme and rapid increase in users to observe 
 * how the system handles immediate stress and recovers afterward.
 */

/**
 * Test configuration (k6 options):
 * - Ramp-up: Aggressive surge to 100 VUs in only 10 seconds.
 * - Peak Load: Maintain 100 VUs for 30 seconds to test maximum capacity.
 * - Ramp-down: Rapid scale down to 0 VUs in 10 seconds.
 * @type {Object}
 */
export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Sudden surge to 100 users
    { duration: '30s', target: 100 }, // Stay at peak load
    { duration: '10s', target: 0 },   // Rapid recovery/scale down
  ],
};

/**
 * Main execution function for each Virtual User (VU).
 * Simulates rapid requests to the incidents endpoint during the spike.
 */
export default function () {
  /** @type {string} Target API endpoint for fetching incidents */
  const url = 'http://localhost:3000/api/v1/incidents';

  /**
   * Request configuration including security authorization.
   * @type {Object}
   */
  const params = {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2NDAwMjUsImV4cCI6MTc3NjY0MDkyNX0.2x8WxdCqGSxNQeo31yIJFvCIjdBS7jqL4X6KaLaYVao',
    },
  };

  /** @type {Object} Execution of the GET request */
  const res = http.get(url, params);

  /**
   * Validation: Ensure the server remains responsive (Status 200) during the surge.
   */
  check(res, { 
    'status is 200': (r) => r.status === 200 
  });

  /** * Brief pause to simulate user interaction and manage request 
   * frequency per user.
   */
  sleep(1);
}