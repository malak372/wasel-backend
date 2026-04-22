import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * @file write-heavy-reports.js
 * @description Performance test focusing on high-volume data creation (WRITE).
 * This script simulates multiple users submitting reports simultaneously to
 * evaluate the server's ability to process POST requests and database writes.
 */

/**
 * Test configuration and performance requirements (k6 options):
 * - Load Profile: Ramps up to 30 Virtual Users (VUs) to test concurrent writing capacity.
 * - SLO Thresholds: Ensures 95% of requests are under 1000ms and failure rate is below 5%.
 * @type {Object}
 */
export const options = {
  stages: [
    { duration: '10s', target: 30 }, // Ramp up to 30 concurrent users
    { duration: '30s', target: 30 }, // Maintain steady write pressure
    { duration: '10s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    /** 95% of requests must complete within 1000ms to pass performance criteria */
    http_req_duration: ['p(95)<1000'], 
    /** The test fails if more than 5% of total requests result in an error */
    http_req_failed: ['rate<0.05'],    
  },
};

/**
 * Main function executed by each Virtual User (VU).
 * Performs a POST request to create a new incident report.
 */
export default function () {
  /** @type {string} Target API endpoint for report submissions */
  const url = 'http://localhost:3000/api/v1/reports';

  /**
   * Data payload representing a new report.
   * @type {string}
   */
  const payload = JSON.stringify({
    latitude: 31.9466,
    longitude: 35.3027,
    description: "Performance testing with k6",
    categoryId: "123e4567-e89b-12d3-a456-426614174000"
  });

  /**
   * Request headers including Authentication and Content-Type.
   * @type {Object}
   */
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2Mzc0MjEsImV4cCI6MTc3NjYzODMyMX0.BcI2mjC0z9JHRWfN1TnehMPvBb-NKgFy8N8lNhcMt68',
    },
  };

  /** @type {Object} Server response for the POST request */
  const res = http.post(url, payload, params);

  /**
   * Validation: Verify if the report was successfully created (201) 
   * or accepted (200).
   */
  check(res, {
    'status is 201': (r) => r.status === 201 || r.status === 200,
  });

  /** * Simulate a 1-second delay between iterations to represent 
   * the time a real user takes between submissions.
   */
  sleep(1);
}