import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // تصاعد بطيء
    { duration: '8m', target: 10 },  // استقرار لفترة طويلة (8 دقائق)
    { duration: '1m', target: 0 },   // هبوط بطيء
  ],
};

export default function () {
  const url = 'http://localhost:3000/api/v1/incidents';
  const params = {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2MzgxOTAsImV4cCI6MTc3NjYzOTA5MH0.uilVncCy7hPNAHGBB5nPnpPXDyLZmMzwm6EmAm46OeY',
    },
  };

  const res = http.get(url, params);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(2);
} 