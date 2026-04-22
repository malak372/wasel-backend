import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * @file soak-test.js
 * @description Reliability and stability test (Soak Test).
 * This script runs a consistent load over an extended period to identify 
 * memory leaks, resource exhaustion, or performance degradation over time.
 */

/**
 * Test configuration (k6 options):
 * - Ramp-up: Slowly increase to 10 VUs over 1 minute.
 * - Steady State: Maintain 10 VUs for 8 minutes to monitor long-term stability.
 * - Ramp-down: Slowly decrease to 0 VUs over 1 minute.
 * @type {Object}
 */
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Gradual ramp-up
    { duration: '8m', target: 10 },  // Extended steady load (8 minutes)
    { duration: '1m', target: 0 },   // Gradual ramp-down
  ],
};

/**
 * Main execution function for each Virtual User (VU).
 * Periodically fetches incidents to ensure the server handles persistent connections.
 */
export default function () {
  /** @type {string} Target API endpoint */
  const url = 'http://localhost:3000/api/v1/incidents';

  /**
   * Request configuration with authorization token.
   * @type {Object}
   */
  const params = {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2MzgxOTAsImV4cCI6MTc3NjYzOTA5MH0.uilVncCy7hPNAHGBB5nPnpPXDyLZmMzwm6EmAm46OeY',
    },
  };

  /** @type {Object} Execution of the GET request */
  const res = http.get(url, params);

  /**
   * Validation: Verify the server maintains a 200 OK status throughout the duration.
   */
  check(res, { 
    'status is 200': (r) => r.status === 200 
  });

  /** * Simulate a 2-second delay between requests to represent 
   * moderate, sustained user activity.
   */
  sleep(2);
}