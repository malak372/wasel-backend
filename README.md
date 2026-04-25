# 🚦 Wasel Palestine - Smart Mobility API

## 📌 Overview

Wasel Palestine is a robust backend API system designed to provide structured, reliable, and real-time mobility intelligence across Palestine.

The system aggregates live data from:

* Road checkpoints
* Traffic incidents
* Crowdsourced citizen reports

It exposes this data via **RESTful APIs** and **GraphQL**, enabling efficient, scalable, and flexible data consumption for client applications.

---

## 🔗 Project Links
- 🌐 **Production API URL:**  
  https://wasel-backend-production.up.railway.app

- ⚡ **GraphQL Endpoint:**  
  https://wasel-backend-production.up.railway.app/graphql

- 📄 **API Documentation (Apidog):**  
  https://7vfs7s7iln.apidog.io

- 🗄️ **Database API (Supabase REST):**  
  https://napdfeypvbclkpamievv.supabase.co/rest/v1/

- 📊 **Performance Testing (k6 Report):**  
  https://github.com/malak372/wasel-backend/wiki/K6-Testing

- 📚 **Full Documentation (Wiki):**  
  https://github.com/malak372/wasel-backend/wiki
---

## 🛠️ Tech Stack

* **Backend Framework:** NestJS
* **Database:** PostgreSQL (Supabase)
* **ORM:** Prisma
* **API Types:** REST + GraphQL
* **Authentication:** JWT (Access & Refresh Tokens)
* **Testing:** k6 (Performance Testing)
* **Containerization:** Docker
* **Documentation:** Apidog + GitHub Wiki

---

## 🏗️ Architecture

The system follows a combination of **Modular** and **Layered Architecture** to ensure scalability, maintainability, and clear separation of concerns.

### 🧩 Modular Design
The system is divided into independent modules based on features:

- **Auth**
- **Incidents**
- **Citizen Reports**
- **Routes**
- **Alerts**
- **Checkpoints**

Each module is responsible for a specific domain and can be developed, tested, and maintained independently.

---

### 🏗️ Layered Architecture
Inside each module, we apply a layered structure:

- **Controller Layer:** Handles incoming HTTP requests and routes them to the appropriate services  
- **Service Layer:** Contains business logic and core system functionality  
- **Data Access Layer:** Uses Prisma ORM to interact with the database (Supabase PostgreSQL)  
- **Integration Layer:** Handles communication with external APIs (Routing API, Weather API), including timeout, retry, caching, and logging  

---

### 📌 Summary
- **Modular Architecture →** Organizes the system into independent features  
- **Layered Architecture →** Organizes the internal structure of each module  

---

## 🚀 Core Features

1. **Road Incidents & Checkpoints**
   Real-time tracking with status history and updates.

2. **Crowdsourced Reporting**
   Citizens can submit reports with a **voting system** to ensure credibility.

3. **Smart Route Estimation**
   Intelligent route calculation avoiding risky checkpoints and incidents.

4. **Alerts & Notifications**
   Subscription-based alerts for real-time road conditions.

---

## 🔐 Authentication & Security

* **JWT-based Authentication** (Access + Refresh Tokens)
* **Role-Based Access Control (RBAC):**

  * Admin
  * Moderator
  * Citizen
* Secure environment configuration using `.env`

---

## 📄 API Documentation & Testing (Apidog)

All endpoints are documented and tested using **Apidog**.

### Documentation Structure

Each endpoint includes:

* Method (GET, POST, PATCH, DELETE)
* URL using environment variables
* Headers
* Request body
* Response examples (success & error)

Endpoints are grouped into:

* Auth
* Reports
* Incidents
* Checkpoints
* Routes
* Alerts

---

## 🔑 Authentication Flow (How to Get Tokens)

To access protected endpoints, authentication tokens must be generated first.

### Steps

1. Run the backend server:

```bash
npm run start:dev
```

2. Open Apidog (or browser/Postman)

3. Send request to:

```
POST {{baseUrl}}/api/v1/auth/login
```

4. Click **Send**

5. You will receive:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

## 🌍 Environment Variables in Apidog

Inside Apidog, we define:

* `baseUrl = http://localhost:3000`
* `accessToken`
* `refreshToken`

### How We Use Them

1. Copy tokens from login response
2. Paste them into environment variables
3. Use in requests:

```
Authorization: Bearer {{accessToken}}
```

This allows all protected endpoints to work seamlessly.

---

## 🌟 GraphQL Implementation (Bonus)

We implemented **GraphQL** to optimize data fetching and prevent over-fetching.

* **Endpoint:** `/graphql`
* **Resolvers:** Incidents, Checkpoints, Reports
* **Purpose:** Read-only queries for dashboards and advanced filtering

GraphQL enables:

* Fetching multiple resources in a single request
* Flexible and efficient data retrieval

---

## 🚀 How to Run the Project

### 1. Backend API (NestJS)

```bash
# Install dependencies
npm install

# Setup environment variables (.env)
# DATABASE_URL, JWT_ACCESS_SECRET, etc.

# Run the server
npm run start:dev
```

---

## ⚡ Accessing GraphQL Playground

1. Ensure server is running
2. Open:

```
http://localhost:3000/graphql
```

3. Run queries from the Wiki

---

​## Performance Testing (k6)
​We conducted load tests to ensure system stability:
​Scenarios: Mixed Load, Read/Write Heavy, Spike, and Soak testing.
​Results: p95 latency and error rates are documented in the [Wiki Performance Page].
Link: https://github.com/malak372/wasel-backend/wiki/K6-Testing

​##🐳 Docker Setup
​To run the entire stack using Docker:
docker compose down
docker compose build --no-cache
docker compose up


---

# Configure environment variables (.env)
DATABASE_URL=your_database_url
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=https://router.project-osrm.org

```

---

## 👥 Team

* Malak
*Rahaf
*Eman
*Yamama

---


