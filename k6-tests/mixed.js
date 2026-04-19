import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2MzgxOTAsImV4cCI6MTc3NjYzOTA5MH0.uilVncCy7hPNAHGBB5nPnpPXDyLZmMzwm6EmAm46OeY',
    },
  };

  group('Read Incidents', function () {
    const res = http.get('http://localhost:3000/api/v1/incidents', params);
    check(res, { 'GET status is 200': (r) => r.status === 200 });
  });

  sleep(2); // المستخدم يقرأ ثم يقرر التبليغ

  // نسبة 20% فقط من المستخدمين يقومون بالتبليغ بعد القراءة
  if (Math.random() < 0.2) {
    group('Submit Report', function () {
      const payload = JSON.stringify({
        latitude: 31.9 + (Math.random() * 0.1),
        longitude: 35.3 + (Math.random() * 0.1),
        description: "Mixed test report",
        categoryId: "123e4567-e89b-12d3-a456-426614174000"
      });
      const res = http.post('http://localhost:3000/api/v1/reports', payload, params);
      check(res, { 'POST status 201 or 429': (r) => r.status === 201 || r.status === 429 });
    });
  }

  sleep(5);
}