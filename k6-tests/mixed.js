import http from 'k6/http';
import { check, sleep, group } from 'k6';

/**
 * @file mixed-load-test.js
 * @description Mixed load test simulating realistic user behavior.
 * Users first browse the incidents list (Read) and then a subset of them 
 * proceeds to submit a report (Write).
 */

/**
 * Test configuration (k6 options):
 * - Ramp-up: 0 to 30 VUs over 30 seconds.
 * - Sustained Load: Stay at 30 VUs for 1 minute.
 * - Ramp-down: 30 to 0 VUs over 30 seconds.
 * @type {Object}
 */
export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 0 },
  ],
};

/**
 * Main execution function for each Virtual User (VU).
 * Simulates a flow: Fetching incidents -> Thinking -> Probabilistic Reporting.
 */
export default function () {
  /**
   * Request configuration including authentication and content type.
   * @type {Object}
   */
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2MzgxOTAsImV4cCI6MTc3NjYzOTA5MH0.uilVncCy7hPNAHGBB5nPnpPXDyLZmMzwm6EmAm46OeY',
    },
  };

  // --- Step 1: Browse Incidents List ---
  group('Read Incidents', function () {
    /** @type {Object} Response object for the GET incidents request */
    const res = http.get('http://localhost:3000/api/v1/incidents', params);
    
    check(res, { 
      'GET status is 200': (r) => r.status === 200 
    });
  });

  /** Simulate "Think Time" - User reading the list before deciding to report */
  sleep(2); 

  // --- Step 2: Submit a New Report (Probabilistic) ---
  /** * Probabilistic logic: Only 20% of users who browse incidents 
   * will actually submit a new report.
   */
  if (Math.random() < 0.2) {
    group('Submit Report', function () {
      /**
       * Report payload with randomized coordinates within a specific range 
       * to simulate realistic geographic data points.
       * @type {string}
       */
      const payload = JSON.stringify({
        latitude: 31.9 + (Math.random() * 0.1),
        longitude: 35.3 + (Math.random() * 0.1),
        description: "Mixed test report",
        categoryId: "123e4567-e89b-12d3-a456-426614174000"
      });

      /** @type {Object} Response object for the POST report request */
      const res = http.post('http://localhost:3000/api/v1/reports', payload, params);
      
      /** * Check for 201 (Created) or 429 (Too Many Requests). 
       * 429 is expected behavior if the Rate Limiter is triggered.
       */
      check(res, { 
        'POST status 201 or 429': (r) => r.status === 201 || r.status === 429 
      });
    });
  }

  /** Buffer time before the user initiates the next iteration */
  sleep(5);
}