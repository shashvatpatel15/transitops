# TransitOps — Backend API & DB Schema Documentation
**Stack:** Django + Django REST Framework, PostgreSQL, SimpleJWT
**Purpose:** Contract between backend (You + Shashwat) and frontend (Mann + Hilag). Frontend builds UI against these exact shapes — do not change field names once shared without updating this doc.

---

## 0. Roles (RBAC)

Single login, role determines access. Role is stored on the user profile, assigned by seed/admin (no self-signup with role selection).

| Role | Fleet (Vehicles) | Drivers | Trips | Maintenance | Fuel & Expenses | Analytics |
|---|---|---|---|---|---|---|
| **Fleet Manager** | full | full | read-only | full | read-only | view |
| **Dispatcher** | view | – | full | – | – | – |
| **Safety Officer** | – | full | view | – | – | – |
| **Financial Analyst** | view | – | read-only | read-only | full | full |

> **Permission Note (Analytics/Dashboard Integration):** To prevent dashboard/analytics views from failing or showing empty data, read-only (`GET`) access is allowed for:
> - **Fleet Manager**: Read-only access to Trips and Fuel & Expenses.
> - **Financial Analyst**: Read-only access to Trips and Maintenance.
> This matches the data requirements for front-end dashboards and calculated metrics.

> Assumption: Maintenance is Fleet Manager-only (they own vehicle lifecycle). Fuel & Expenses is Financial Analyst-only for writes. Flag if you want Dispatcher to log fuel at trip completion instead — that's a reasonable alternate design.

---

## 1. Data Model (Django models)

### User / Profile
```python
class Profile(models.Model):
    ROLE_CHOICES = [
        ("FLEET_MANAGER", "Fleet Manager"),
        ("DISPATCHER", "Dispatcher"),
        ("SAFETY_OFFICER", "Safety Officer"),
        ("FINANCIAL_ANALYST", "Financial Analyst"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
```

### Vehicle
```python
class Vehicle(models.Model):
    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("ON_TRIP", "On Trip"),
        ("IN_SHOP", "In Shop"),
        ("RETIRED", "Retired"),
    ]
    registration_number = models.CharField(max_length=20, unique=True)
    name_model = models.CharField(max_length=100)
    type = models.CharField(max_length=50)  # Van, Truck, Mini, Bus...
    max_load_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    odometer = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2)
    region = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AVAILABLE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Driver
```python
class Driver(models.Model):
    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("ON_TRIP", "On Trip"),
        ("OFF_DUTY", "Off Duty"),
        ("SUSPENDED", "Suspended"),
    ]
    name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=30, unique=True)
    license_category = models.CharField(max_length=20)  # LMV, HMV...
    license_expiry_date = models.DateField()
    contact_number = models.CharField(max_length=15)
    safety_score = models.PositiveSmallIntegerField(default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AVAILABLE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_license_valid(self):
        return self.license_expiry_date >= timezone.now().date()
```

### Trip
```python
class Trip(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("DISPATCHED", "Dispatched"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]
    trip_code = models.CharField(max_length=10, unique=True)  # auto: TR001, TR002...
    source = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name="trips")
    driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL, related_name="trips")
    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    planned_distance_km = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    start_odometer = models.DecimalField(max_digits=10, decimal_places=1, null=True, blank=True)
    end_odometer = models.DecimalField(max_digits=10, decimal_places=1, null=True, blank=True)
    fuel_consumed_liters = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # needed for ROI, not in original spec — added
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### MaintenanceLog
```python
class MaintenanceLog(models.Model):
    STATUS_CHOICES = [("OPEN", "Open"), ("CLOSED", "Closed")]
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="maintenance_logs")
    service_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="OPEN")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
```

### FuelLog
```python
class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="fuel_logs")
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="fuel_logs")
    date = models.DateField()
    liters = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Expense
```python
class Expense(models.Model):
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    toll = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maintenance_linked = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # pulled from MaintenanceLog cost
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        return self.toll + self.other + self.maintenance_linked
```

---

## 2. Auth Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/api/auth/login/` | any | body: `{email, password}` → `{access, refresh, user: {id, name, role}}`. Locks account 15 min after 5 failed attempts → `403 {"detail": "Account locked. Try again in 15 minutes."}` |
| POST | `/api/auth/refresh/` | any | body: `{refresh}` → `{access}`. Returns `401 Unauthorized` if the user ID inside the token does not exist in the database (e.g. after a database reset/reseed). |
| POST | `/api/auth/logout/` | authenticated | blacklists refresh token |
| GET | `/api/auth/me/` | authenticated | returns current user profile + role, used by frontend to decide nav/permissions |

**Auth header:** `Authorization: Bearer <access_token>` on every protected request.

---

## 3. Vehicle Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/vehicles/` | all (read) | query params: `?status=&type=&region=&search=` (search hits registration_number). Paginated (DRF default `?page=`) |
| GET | `/api/vehicles/available/` | all (read) | returns only `status=AVAILABLE` — dedicated endpoint so dispatch dropdown never has to filter client-side. **Retired/In Shop vehicles never appear here.** |
| POST | `/api/vehicles/` | Fleet Manager | validates `registration_number` uniqueness → `400 {"registration_number": ["already exists"]}` |
| GET | `/api/vehicles/{id}/` | all (read) | includes nested recent trips/maintenance summary if convenient |
| PATCH | `/api/vehicles/{id}/` | Fleet Manager | edit details |
| PATCH | `/api/vehicles/{id}/retire/` | Fleet Manager | sets status → RETIRED (terminal; blocks trip/maintenance assignment) |

**Vehicle response shape:**
```json
{
  "id": 1,
  "registration_number": "GJ01AB4521",
  "name_model": "VAN-05",
  "type": "Van",
  "max_load_capacity_kg": "500.00",
  "odometer": "74000.0",
  "acquisition_cost": "620000.00",
  "region": "Gandhinagar",
  "status": "AVAILABLE"
}
```

---

## 4. Driver Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/drivers/` | all (read) | query: `?status=&search=` |
| GET | `/api/drivers/available/` | all (read) | `status=AVAILABLE` AND `is_license_valid=True` — dedicated endpoint, same reasoning as vehicles |
| POST | `/api/drivers/` | Fleet Manager | validates `license_number` uniqueness |
| GET | `/api/drivers/{id}/` | all (read) | include computed `is_license_valid`, `trip_completion_rate` |
| PATCH | `/api/drivers/{id}/` | Fleet Manager | edit profile |
| PATCH | `/api/drivers/{id}/safety-score/` | Safety Officer | body `{safety_score}`, also allows setting `status=SUSPENDED` |

**Driver response shape:**
```json
{
  "id": 1,
  "name": "Alex",
  "license_number": "DL-88213",
  "license_category": "LMV",
  "license_expiry_date": "2028-12-01",
  "is_license_valid": true,
  "contact_number": "98765xxxxx",
  "safety_score": 96,
  "status": "AVAILABLE",
  "trip_completion_rate": "96%"
}
```

---

## 5. Trip Endpoints — this is the core validation surface, spend the most care here

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/trips/` | all (read) | query: `?status=` |
| POST | `/api/trips/` | Dispatcher | creates `DRAFT` trip. `vehicle`/`driver` optional at creation (matches wireframe — TR004/TR006 exist unassigned). Auto-generates `trip_code`. Required: `source, destination, cargo_weight_kg, planned_distance_km` |
| PATCH | `/api/trips/{id}/assign/` | Dispatcher | body `{vehicle_id, driver_id}` — assigns to a still-Draft trip, does NOT dispatch |
| POST | `/api/trips/{id}/dispatch/` | Dispatcher | **runs all business rules below**, then sets trip→DISPATCHED, vehicle→ON_TRIP, driver→ON_TRIP |
| POST | `/api/trips/{id}/complete/` | Dispatcher | body `{end_odometer, fuel_consumed_liters, revenue}`. Sets trip→COMPLETED, vehicle→AVAILABLE, driver→AVAILABLE. Auto-creates a `FuelLog` row from the fuel_consumed_liters passed in |
| POST | `/api/trips/{id}/cancel/` | Dispatcher | only allowed if status=DISPATCHED. Reverts vehicle/driver → AVAILABLE |
| GET | `/api/trips/{id}/` | all (read) | full detail incl. nested vehicle/driver objects |

### Dispatch validation rules (enforced server-side, in this order, first failure wins)

```
1. vehicle.status == AVAILABLE          → else 400 "Vehicle is not available"
2. driver.status == AVAILABLE           → else 400 "Driver is not available"
3. driver.status != SUSPENDED           → else 400 "Driver is suspended"
4. driver.is_license_valid              → else 400 "Driver's license has expired"
5. cargo_weight_kg <= vehicle.max_load_capacity_kg
                                         → else 400 "Capacity exceeded by {diff} kg — dispatch blocked"
```

Return validation errors as a single structured object so frontend can render inline, e.g.:
```json
{
  "error": "CAPACITY_EXCEEDED",
  "detail": "Capacity exceeded by 200 kg — dispatch blocked",
  "field": "cargo_weight_kg"
}
```
Use a distinct `error` code per rule (`VEHICLE_UNAVAILABLE`, `DRIVER_UNAVAILABLE`, `DRIVER_SUSPENDED`, `LICENSE_EXPIRED`, `CAPACITY_EXCEEDED`) — this lets frontend show the exact inline message from the mockup without string-matching.

---

## 6. Maintenance Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/maintenance/` | Fleet Manager | query: `?status=&vehicle=` |
| POST | `/api/maintenance/` | Fleet Manager | creating with implicit `status=OPEN` → **side effect: vehicle.status = IN_SHOP** immediately (removes from `/vehicles/available/`) |
| PATCH | `/api/maintenance/{id}/close/` | Fleet Manager | sets `status=CLOSED`, `closed_at=now()` → **side effect: vehicle.status = AVAILABLE, unless vehicle.status == RETIRED** |

---

## 7. Fuel & Expense Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/fuel-logs/` | Financial Analyst | query: `?vehicle=` |
| POST | `/api/fuel-logs/` | Financial Analyst | manual entry (in addition to auto-created ones from trip completion) |
| GET | `/api/expenses/` | Financial Analyst | query: `?vehicle=&trip=` |
| POST | `/api/expenses/` | Financial Analyst | `maintenance_linked` should be pre-filled by frontend by calling maintenance endpoint for that vehicle, or backend can auto-sum open+closed maintenance cost for the vehicle in the given date range — **decide which tonight, recommend backend auto-sum to avoid double entry** |
| GET | `/api/vehicles/{id}/operational-cost/` | Financial Analyst | returns `{fuel_total, maintenance_total, operational_cost}` — auto-computed, not stored |

---

## 8. Reports & Analytics Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/analytics/dashboard/` | all (read) | `{active_vehicles, available_vehicles, vehicles_in_maintenance, active_trips, pending_trips, drivers_on_duty, fleet_utilization_pct}` |
| GET | `/api/analytics/fuel-efficiency/` | Financial Analyst | per-vehicle `distance/fuel` (km/l) |
| GET | `/api/analytics/vehicle-roi/` | Financial Analyst | `ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost`, per vehicle |
| GET | `/api/analytics/top-costliest-vehicles/` | Financial Analyst | ranked by operational cost |
| GET | `/api/analytics/export/csv/` | Financial Analyst | query `?report=fuel|cost|roi|utilization` → returns CSV file |

---

## 9. Settings Endpoints

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/settings/` | Fleet Manager | `{currency, distance_unit}` |
| PATCH | `/api/settings/` | Fleet Manager | update org-wide settings |
| GET | `/api/settings/rbac-matrix/` | all (read) | static reference of the table in Section 0, purely for the Settings screen display |

---

## 10. Standard conventions (apply everywhere)

- **Pagination:** DRF default — `{count, next, previous, results: [...]}`
- **Errors:** always `{"error": "CODE", "detail": "human message", "field": "field_name" | null}`
- **Dates:** ISO 8601 (`YYYY-MM-DD`), datetimes with timezone (`YYYY-MM-DDTHH:MM:SSZ`)
- **Money fields:** always returned as strings (DecimalField serialization) to avoid float rounding on frontend — Mann/Hilag should parse as needed for display, not do math on them client-side
- **IDs in URLs:** integer PK, not trip_code (trip_code is display-only)

---

## 11. Build order for tomorrow (backend)

1. Models + migrations + seed data matching the wireframe (Van-05/Alex/TR001 etc.) — first commit
2. Auth (login/refresh/me + lockout) — unblocks frontend to build login screen against real API immediately
3. Vehicle + Driver CRUD (simplest, no cross-entity rules)
4. Trip create/assign (still simple)
5. Trip dispatch/complete/cancel (the validation-heavy core — budget the most time here)
6. Maintenance create/close (state-transition side effects)
7. Fuel/Expense + Analytics (can be built in parallel by whoever finishes their piece first — these are read-heavy and don't block other work)
8. RBAC permission classes applied globally last-pass, once all endpoints exist — but write the permission scaffolding (custom DRF permission classes per role) early so nobody forgets to apply it like last time

---

## Open decisions — confirm before locking this doc

1. Does Financial Analyst manually enter fuel logs, or should Dispatcher log fuel at trip completion (currently modeled as auto-created on `/trips/{id}/complete/`, plus manual entry allowed separately)?
2. `Expense.maintenance_linked` — auto-summed by backend or manually entered by Financial Analyst?
3. Is there any admin/signup flow needed, or are all 4 users seeded directly via Django admin/fixtures before the demo? (Recommend: seed fixtures — saves build time, and login screen doesn't need a signup form.)
