# TransitOps 🚛
> **Smart Transport & Fleet Operations Platform**

TransitOps is a modern, enterprise-grade fleet and transport operations management system. It enables logistics managers, dispatchers, safety officers, and financial analysts to coordinate transport assets, audit driver compliance, track fuel intake, manage incidental expenses, and utilize AI-powered matching algorithms for optimal load dispatches.

---

## 🌟 Key Features

### 1. AI-Powered Smart Dispatch Recommendation
*   **Intelligent Optimization:** Automatically ranks and suggests the top 3 vehicle-driver combinations for any trip based on capacity suitability, driver safety scores, and proximity.
*   **Capacity Guard:** Applies hard filters to block any dispatch that exceeds the vehicle's maximum load limits, preventing overload hazards.
*   **Capacity Fit Penalization:** Scores vehicle matches based on load efficiency (penalizes utilizing heavy 30T semi-trucks for small 1T cargoes) to minimize fleet fuel wastage.
*   **Deduplication:** Ensures recommendations are unique by vehicle, offering distinct fleet alternatives rather than repeating the same vehicle.
*   **One-Click Selection:** Click `"Use This Match"` to automatically assign selections into the dispatcher trip form.

### 2. Fleet & Driver Management
*   **Interactive Register:** Track odometer values, location regions, acquisition costs, and maintenance statuses.
*   **Compliance Checker:** Validates driver licenses automatically. Prevents dispatching trips to drivers with expired licenses or suspended credentials.

### 3. Expense & Fuel Logging
*   **Interactive Date Picker:** Filter fuel consumption logs and incidental expenses using interactive calendar date selectors.
*   **Real-Time Metrics:** Recomputes total fuel spending, maintenance overheads, incidentals, and fleet grand totals dynamically in a sticky footer summary.
*   **Secure Serialization:** Strictly maps inputs to backend models with structured serializer validation.

### 4. Enterprise RBAC & Security
*   **Role-Based Access:** Strict REST API controls restrict actions to relevant roles:
    *   *Managers & Safety Officers:* Full CRUD operations on vehicle and driver profiles.
    *   *Dispatchers:* Create and assign trips, query available assets.
    *   *Financial Analysts:* Write-only limits to financial logs, read-only on logistics tables.
*   **Security Lockout:** Rate-limits authentication endpoints, locking out invalid login attempts temporarily to block brute-force vectors.

---

## 🛣️ API Endpoints Reference

### 🔐 Authentication
*   `POST /api/auth/login/` - Authenticate user and receive JWT access & refresh tokens.
*   `POST /api/auth/logout/` - Blacklist refresh token and log out the user.
*   `POST /api/auth/refresh/` - Refresh expired access tokens using the refresh token.
*   `GET /api/auth/me/` - Retrieve authenticated profile details.

### 🚛 Vehicles
*   `GET /api/vehicles/` - Fetch all vehicles (filtered by status/region).
*   `POST /api/vehicles/` - Register a new fleet vehicle.
*   `GET /api/vehicles/available/` - List all vehicles with `AVAILABLE` status.

### 👤 Drivers
*   `GET /api/drivers/` - Fetch all drivers (filtered by status).
*   `POST /api/drivers/` - Register a new driver profile.
*   `GET /api/drivers/available/` - List available drivers with active (non-expired) licenses.

### 🗺️ Trips & AI Dispatch
*   `GET /api/trips/` - Fetch logistics trip records.
*   `POST /api/trips/` - Create a new trip (Draft status).
*   `POST /api/trips/recommend/` - AI dispatch recommendations endpoint. Evaluates and scores available pairs for a specific cargo weight.
*   `PATCH /api/trips/<id>/assign/` - Assign vehicle & driver to a trip.
*   `POST /api/trips/<id>/dispatch/` - Transition trip to `DISPATCHED` status (locks vehicle & driver status to `ON_TRIP`).
*   `POST /api/trips/<id>/complete/` - Log trip completion, odometer, revenue, and auto-create a verified Fuel Log.
*   `POST /api/trips/<id>/cancel/` - Cancel trip and release vehicle/driver to `AVAILABLE`.

### 🔧 Maintenance
*   `GET /api/maintenance/` - Fetch fleet maintenance records.
*   `POST /api/maintenance/` - Log a new maintenance case (places vehicle `IN_SHOP`).
*   `PATCH /api/maintenance/<id>/close/` - Close maintenance log (returns vehicle to `AVAILABLE`).

### 💰 Fuel & Incidentals
*   `GET /api/fuel-logs/` - Fetch fuel log entries.
*   `POST /api/fuel-logs/` - Log fuel intake (requires vehicle primary key ID).
*   `GET /api/expenses/` - Fetch incidental expense items.
*   `POST /api/expenses/` - Register incidental spending (tolls, maintenance linked, others).

### 📊 Analytics
*   `GET /api/analytics/dashboard/` - Retrieve fleet high-level KPI summaries.
*   `GET /api/analytics/top-costliest-vehicles/` - List vehicles with the highest cost-per-kilometer metrics.
*   `GET /api/analytics/export/csv/?report=<reportType>` - Export CSV reports (`fuel`, `cost`, `roi`, `utilization`).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Backend API** | Python, Django, Django REST Framework (DRF) |
| **Database Options** | PostgreSQL (Production) / SQLite3 (Local fallback) |
| **Authentication** | Django SimpleJWT (JSON Web Tokens) |
| **Frontend UI** | React.js, Vite, HTML5, Vanilla Custom CSS |
| **Icons & Fonts** | Google Material Symbols, Outfit, Inter |

---

## 🚀 Getting Started

### 📋 Prerequisites
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)
*   [PostgreSQL](https://www.postgresql.org/downloads/) (Optional: default fallback uses SQLite3)

### 🔧 Installation

#### 1. Backend Setup
1. Open terminal inside the `backend` folder:
   ```bash
   cd transitops/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Database Configuration:**
   *   *By default, the application runs on SQLite3.*
   *   To upgrade to **PostgreSQL**, open the `backend/.env` file, uncomment the PostgreSQL config lines, and set your local credentials:
       ```env
       DB_NAME=transitops
       DB_USER=postgres
       DB_PASSWORD=your_password
       DB_HOST=127.0.0.1
       DB_PORT=5432
       ```
   *   Make sure to create the database in PostgreSQL before migrating:
       ```sql
       CREATE DATABASE transitops;
       ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Seed the database with realistic Indian fleet assets, users, and drivers:
   ```bash
   python seed.py
   ```

#### 2. Frontend Setup
1. Open a new terminal inside the `frontend` folder:
   ```bash
   cd transitops/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

### 1. Start the Django Server
From the `backend` folder:
```bash
# Ensure your virtual environment is active!
python manage.py runserver
```
The backend API will run on **`http://localhost:8000`**.

### 2. Start the Vite Dev Server
From the `frontend` folder:
```bash
npm run dev
```
The React frontend dashboard will run on **`http://localhost:5173`**.

---

## 🔑 Operational Credentials & Roles

| Role | Email Address | Password | Operational Access Scope |
| :--- | :--- | :--- | :--- |
| **Fleet Manager** | `k.raven@transitops.com` | `password123` | Full admin dashboards, driver & vehicle registration. |
| **Dispatcher** | `s.jenkins@transitops.com` | `password123` | Trip creation, AI dispatches, and active route assignments. |
| **Safety Officer** | `j.lee@transitops.com` | `password123` | Driver compliance checks, safety logs auditing. |
| **Financial Analyst** | `finance@transitops.com` | `password123` | Incidentals tracking, fuel audits, CSV reports export. |

---

## 🧪 Automated Testing
A comprehensive test suite checks the AI recommendation engine, RBAC permission policies, and API endpoints.

To execute tests:
```bash
cd transitops/backend
# Ensure virtual environment is active
python manage.py test
```
