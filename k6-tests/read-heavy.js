import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 users
    { duration: '30s', target: 50 }, // Stay at 50 users
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  const url = 'http://localhost:3000/api/v1/incidents';

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2Mzc0MjEsImV4cCI6MTc3NjYzODMyMX0.BcI2mjC0z9JHRWfN1TnehMPvBb-NKgFy8N8lNhcMt68', 
    },
  };

  const res = http.get(url, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1); 
}