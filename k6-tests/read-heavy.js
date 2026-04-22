import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * @file read-heavy-incidents.js
 * @description Performance test focusing on high-frequency data retrieval (READ).
 * This script simulates multiple users concurrently fetching the incidents list
 * to verify database query performance and API response times.
 */

/**
 * Test configuration and performance requirements (k6 options):
 * - Load Profile: Ramps up to 50 Virtual Users (VUs) to test concurrent read capacity.
 * - SLO Thresholds: Ensures 95% of requests are under 500ms and failure rate is below 1%.
 * @type {Object}
 */
export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Rapidly ramp up to 50 concurrent users
    { duration: '30s', target: 50 }, // Maintain steady high-load state
    { duration: '10s', target: 0 },  // Gracefully scale down to 0
  ],
  thresholds: {
    /** 95% of requests must complete within 500ms to pass the performance criteria */
    http_req_duration: ['p(95)<500'], 
    /** The test fails if more than 1% of the total requests result in an error */
    http_req_failed: ['rate<0.01'],   
  },
};

/**
 * Main function executed by each Virtual User (VU) in a loop.
 * Performs a GET request to the incidents endpoint.
 */
export default function () {
  /** @type {string} Target API endpoint for fetching incidents */
  const url = 'http://localhost:3000/api/v1/incidents';

  /**
   * Request parameters including mandatory authentication and content headers.
   * @type {Object}
   */
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2Mzc0MjEsImV4cCI6MTc3NjYzODMyMX0.BcI2mjC0z9JHRWfN1TnehMPvBb-NKgFy8N8lNhcMt68', 
    },
  };

  /** @type {Object} Response object received from the server */
  const res = http.get(url, params);

  /**
   * Validation: Verify that the server responds with a 200 OK status code.
   */
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  /** * Simulate a 1-second "think time" between reads to prevent 
   * unrealistic request flooding from a single user.
   */
  sleep(1); 
}