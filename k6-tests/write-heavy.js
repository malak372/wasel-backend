import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 30 }, 
    { duration: '30s', target: 30 }, 
    { duration: '10s', target: 0 },  
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], 
    http_req_failed: ['rate<0.05'],    
  },
};

export default function () {
  const url = 'http://localhost:3000/api/v1/reports';

  const payload = JSON.stringify({
    latitude: 31.9466,
    longitude: 35.3027,
    description: "Performance testing with k6",
    categoryId: "123e4567-e89b-12d3-a456-426614174000"
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2Mzc0MjEsImV4cCI6MTc3NjYzODMyMX0.BcI2mjC0z9JHRWfN1TnehMPvBb-NKgFy8N8lNhcMt68',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201 || r.status === 200,
  });

  sleep(1);
}