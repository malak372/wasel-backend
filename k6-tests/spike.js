import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // قفزة مفاجئة وعنيفة إلى 100 مستخدم خلال 10 ثواني
    { duration: '30s', target: 100 }, // البقاء على الذروة قليلاً
    { duration: '10s', target: 0 },   // هبوط سريع
  ],
};

export default function () {
  const url = 'http://localhost:3000/api/v1/incidents';
  const params = {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYTRjMjYxYi0zNTQ0LTQ3YjUtYTk2Ny05N2I4MTMwMzYwZWYiLCJlbWFpbCI6InlhbWFtYXNhd2FsaGFAZ21haWwuY29tIiwicm9sZSI6ImNpdGl6ZW4iLCJpYXQiOjE3NzY2NDAwMjUsImV4cCI6MTc3NjY0MDkyNX0.2x8WxdCqGSxNQeo31yIJFvCIjdBS7jqL4X6KaLaYVao',
    },
  };

  const res = http.get(url, params);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}