// API Client for TransitOps
// Respects details in TransitOps_API_Schema_Doc.md

const API_BASE = 'http://localhost:8000'; // Default local Django backend

// Helper to get JWT tokens from localStorage
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// In-Memory fallback database for robust local previewing when the backend is offline
const mockDb = {
  currentUser: null,
  lockoutAttempts: 5,
  lockoutTime: null,
  
  vehicles: [
    { id: 1, registration_number: "GJ01AB4521", name_model: "Tata Prima 5530.S", type: "Semi-Truck", max_load_capacity_kg: "20411.00", odometer: "142403.0", acquisition_cost: "3542000.00", region: "Maharashtra", status: "AVAILABLE" },
    { id: 2, registration_number: "GJ01XY7812", name_model: "Ashok Leyland 5525", type: "Semi-Truck", max_load_capacity_kg: "20184.00", odometer: "89211.0", acquisition_cost: "3620000.00", region: "Gujarat", status: "IN_TRANSIT" },
    { id: 3, registration_number: "MH12PQ3456", name_model: "Mahindra Cruzio", type: "Cargo Van", max_load_capacity_kg: "2267.00", odometer: "34500.0", acquisition_cost: "1280000.00", region: "Delhi", status: "IN_SHOP" },
    { id: 4, registration_number: "DL03CD9012", name_model: "BharatBenz 1917R", type: "Box Truck", max_load_capacity_kg: "8845.00", odometer: "112090.0", acquisition_cost: "2450000.00", region: "Karnataka", status: "AVAILABLE" },
    { id: 5, registration_number: "KA05LM4455", name_model: "Eicher Pro 6055", type: "Semi-Truck", max_load_capacity_kg: "20411.00", odometer: "56122.0", acquisition_cost: "3780000.00", region: "Tamil Nadu", status: "RETIRED" }
  ],
  
  drivers: [
    { id: 1, name: "Amit Sharma", license_number: "DL-992011A", license_category: "Heavy Truck", license_expiry_date: "2026-10-12", is_license_valid: true, contact_number: "+91 98765-43210", safety_score: 98, status: "AVAILABLE", trip_completion_rate: "98%" },
    { id: 2, name: "Rajesh Patel", license_number: "DL-881290B", license_category: "Light Cargo", license_expiry_date: "2024-01-02", is_license_valid: false, contact_number: "+91 98765-88120", safety_score: 72, status: "OFF_DUTY", trip_completion_rate: "81%" },
    { id: 3, name: "Sunita Deshmukh", license_number: "DL-112233C", license_category: "Hazmat", license_expiry_date: "2027-03-15", is_license_valid: true, contact_number: "+91 98765-33110", safety_score: 92, status: "ON_TRIP", trip_completion_rate: "95%" },
    { id: 4, name: "Gurpreet Singh", license_number: "DL-440021D", license_category: "Heavy Truck", license_expiry_date: "2024-11-19", is_license_valid: false, contact_number: "+91 98765-00440", safety_score: 45, status: "SUSPENDED", trip_completion_rate: "50%" },
    { id: 5, name: "Karthik Raja", license_number: "DL-229988K", license_category: "Cold Chain", license_expiry_date: "2027-07-08", is_license_valid: true, contact_number: "+91 98765-22880", safety_score: 89, status: "AVAILABLE", trip_completion_rate: "93%" }
  ],
  
  trips: [
    { id: 1, trip_code: "TRP-8842", source: "Mumbai", destination: "Pune", vehicle_details: { name_model: "Tata Prima" }, driver_details: { name: "Sam Rivera" }, status: "DISPATCHED", cargo_weight_kg: "4000.00", planned_distance_km: "150.00", end_odometer: null, fuel_consumed_liters: null, revenue: null, eta: "14:20 (Today)" },
    { id: 2, trip_code: "TRP-8850", source: "Delhi", destination: "Jaipur", vehicle_details: { name_model: "BharatBenz" }, driver_details: { name: "Lia Chen" }, status: "DRAFT", cargo_weight_kg: "3500.00", planned_distance_km: "270.00", end_odometer: null, fuel_consumed_liters: null, revenue: null, eta: "18:45 (Today)" },
    { id: 3, trip_code: "TRP-8851", source: "Bengaluru", destination: "Chennai", vehicle_details: { name_model: "Eicher Pro" }, driver_details: { name: "John Doe" }, status: "COMPLETED", cargo_weight_kg: "1200.00", planned_distance_km: "350.00", end_odometer: "74850.0", fuel_consumed_liters: "120.00", revenue: "45000.00", eta: "Arrived" },
    { id: 4, trip_code: "TRP-8839", source: "Ahmedabad", destination: "Vadodara", vehicle_details: { name_model: "Mahindra Cruzio" }, driver_details: { name: "Riley Smith" }, status: "DISPATCHED", cargo_weight_kg: "3200.00", planned_distance_km: "110.00", end_odometer: null, fuel_consumed_liters: null, revenue: null, eta: "Wait +2h", delayed: true }
  ],
  
  maintenanceLogs: [
    { id: 1, vehicle_details: { registration_number: "GJ01AB4521" }, service_type: "Engine Diagnostic", cost: "12400.00", date: "2023-10-24", status: "OPEN" },
    { id: 2, vehicle_details: { registration_number: "MH12PQ3456" }, service_type: "Oil & Filter Change", cost: "2500.00", date: "2023-10-22", status: "CLOSED" },
    { id: 3, vehicle_details: { registration_number: "DL03CD9012" }, service_type: "Tire Rotation", cost: "6500.00", date: "2023-10-19", status: "CLOSED" },
    { id: 4, vehicle_details: { registration_number: "KA05LM4455" }, service_type: "Transmission Service", cost: "18900.00", date: "2023-10-15", status: "CLOSED" },
    { id: 5, vehicle_details: { registration_number: "GJ01XY7812" }, service_type: "Brake Inspection", cost: "3100.00", date: "2023-10-12", status: "OPEN" }
  ],
  
  fuelLogs: [
    { id: 1, vehicle_details: { name_model: "Tata Prima 5530.S" }, date: "2023-10-24", liters: "420.50", cost: "37845.00", status: "Verified" },
    { id: 2, vehicle_details: { name_model: "BharatBenz 1917R" }, date: "2023-10-23", liters: "385.20", cost: "34668.00", status: "Verified" },
    { id: 3, vehicle_details: { name_model: "Mahindra Cruzio" }, date: "2023-10-23", liters: "210.00", cost: "18900.00", status: "Pending" }
  ],
  
  expenses: [
    { id: 1, trip_id: 1, trip_code: "#TP-9402", vehicle: "GJ01AB4521", toll: 1200.00, maint: 0.00, other: 800.00, status: "Paid" },
    { id: 2, trip_id: 2, trip_code: "#TP-9388", vehicle: "DL03CD9012", toll: 2450.00, maint: 12400.00, other: 600.00, status: "In Review" },
    { id: 3, trip_id: 3, trip_code: "#TP-9382", vehicle: "MH12PQ3456", toll: 1800.00, maint: 0.00, other: 500.00, status: "Paid" }
  ],

  settings: {
    currency: "INR",
    distance_unit: "km",
    autoNotify: true,
    strictDispatch: true,
    restrictHours: false,
    debugMode: false
  }
};

// Main request wrapper with absolute HTTP request and memory mock fallback
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (res.status === 401 && localStorage.getItem('refresh_token')) {
      // Attempt to refresh
      const refreshed = await request('/api/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: localStorage.getItem('refresh_token') }),
      });
      if (refreshed && refreshed.access) {
        localStorage.setItem('access_token', refreshed.access);
        return request(path, options);
      }
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw {
        status: res.status,
        error: errBody.error || 'SERVER_ERROR',
        detail: errBody.detail || 'Server encountered an issue.',
        field: errBody.field || null,
      };
    }

    return await res.json();
  } catch (err) {
    if (err.status) throw err; // Re-throw structured API errors
    
    // Connection refused / DNS errors lead to mock fallback execution
    console.warn(`[TransitOps API Client] Connection to ${url} failed. Running Mock DB Fallback.`);
    return mockHandler(path, options);
  }
}

// Mock handler supporting full stateful CRUD for seamless testing
function mockHandler(path, options) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  // -- 1. Auth Endpoints --
  if (path === '/api/auth/login/') {
    const validUsers = {
      'k.raven@transitops.com': { name: 'Raven K.', role: 'FLEET_MANAGER' },
      'm.thorne@transitops.com': { name: 'Marcus Thorne', role: 'FLEET_MANAGER' },
      's.jenkins@transitops.com': { name: 'Sarah Jenkins', role: 'DISPATCHER' },
      'j.lee@transitops.com': { name: 'Jordan Lee', role: 'SAFETY_OFFICER' },
      'finance@transitops.com': { name: 'Finance Analyst', role: 'FINANCIAL_ANALYST' }
    };
    
    const userMatch = validUsers[body.email.toLowerCase()];
    if (userMatch && body.password === 'password123') {
      const user = { id: 1, ...userMatch };
      localStorage.setItem('access_token', 'mock_access_token');
      localStorage.setItem('refresh_token', 'mock_refresh_token');
      mockDb.currentUser = user;
      return { access: 'mock_access_token', refresh: 'mock_refresh_token', user };
    } else {
      mockDb.lockoutAttempts -= 1;
      if (mockDb.lockoutAttempts <= 0) {
        throw { status: 403, error: 'LOCKED', detail: 'Account locked. Try again in 15 minutes.' };
      }
      throw { status: 400, error: 'INVALID_CREDENTIALS', detail: 'Invalid credentials. Please verify your information.' };
    }
  }
  
  if (path === '/api/auth/logout/') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    mockDb.currentUser = null;
    return { detail: 'Logged out successfully.' };
  }

  if (path === '/api/auth/me/') {
    if (!localStorage.getItem('access_token')) {
      throw { status: 401, error: 'UNAUTHORIZED', detail: 'No auth credentials.' };
    }
    return mockDb.currentUser || { id: 1, name: 'Raven K.', role: 'FLEET_MANAGER' };
  }

  // -- 2. Vehicles Endpoints --
  if (path.startsWith('/api/vehicles/')) {
    if (path === '/api/vehicles/available/') {
      return mockDb.vehicles.filter(v => v.status === 'AVAILABLE');
    }
    if (path === '/api/vehicles/') {
      if (method === 'POST') {
        const exists = mockDb.vehicles.some(v => v.registration_number === body.registration_number);
        if (exists) {
          throw { status: 400, error: 'DUPLICATE_REGISTRATION', detail: 'registration_number already exists', field: 'registration_number' };
        }
        const newVehicle = {
          id: mockDb.vehicles.length + 1,
          ...body,
          odometer: body.odometer || '0.0',
          status: body.status || 'AVAILABLE'
        };
        mockDb.vehicles.push(newVehicle);
        return newVehicle;
      }
      return mockDb.vehicles;
    }
    const matchId = path.match(/\/api\/vehicles\/(\d+)\//);
    if (matchId) {
      const vId = parseInt(matchId[1]);
      const vIndex = mockDb.vehicles.findIndex(v => v.id === vId);
      if (vIndex === -1) throw { status: 404, detail: 'Not found.' };
      
      if (path.endsWith('/retire/')) {
        mockDb.vehicles[vIndex].status = 'RETIRED';
        return mockDb.vehicles[vIndex];
      }
      
      if (method === 'PATCH') {
        mockDb.vehicles[vIndex] = { ...mockDb.vehicles[vIndex], ...body };
      }
      return mockDb.vehicles[vIndex];
    }
  }

  // -- 3. Driver Endpoints --
  if (path.startsWith('/api/drivers/')) {
    if (path === '/api/drivers/available/') {
      return mockDb.drivers.filter(d => d.status === 'AVAILABLE' && d.is_license_valid);
    }
    if (path === '/api/drivers/') {
      if (method === 'POST') {
        const exists = mockDb.drivers.some(d => d.license_number === body.license_number);
        if (exists) {
          throw { status: 400, error: 'DUPLICATE_LICENSE', detail: 'license_number already exists', field: 'license_number' };
        }
        const newDriver = {
          id: mockDb.drivers.length + 1,
          ...body,
          is_license_valid: new Date(body.license_expiry_date) >= new Date(),
          safety_score: parseInt(body.safety_score) || 100,
          status: body.status || 'AVAILABLE',
          trip_completion_rate: '100%'
        };
        mockDb.drivers.push(newDriver);
        return newDriver;
      }
      return mockDb.drivers;
    }
    const matchId = path.match(/\/api\/drivers\/(\d+)\//);
    if (matchId) {
      const dId = parseInt(matchId[1]);
      const dIndex = mockDb.drivers.findIndex(d => d.id === dId);
      if (dIndex === -1) throw { status: 404, detail: 'Not found.' };
      
      if (path.endsWith('/safety-score/')) {
        mockDb.drivers[dIndex].safety_score = body.safety_score;
        if (body.status) mockDb.drivers[dIndex].status = body.status;
        return mockDb.drivers[dIndex];
      }
      
      if (method === 'PATCH') {
        mockDb.drivers[dIndex] = { 
          ...mockDb.drivers[dIndex], 
          ...body,
          is_license_valid: body.license_expiry_date ? new Date(body.license_expiry_date) >= new Date() : mockDb.drivers[dIndex].is_license_valid 
        };
      }
      return mockDb.drivers[dIndex];
    }
  }

  // -- 4. Trip Endpoints & Business Validation Rules --
  if (path.startsWith('/api/trips/')) {
    if (path === '/api/trips/') {
      if (method === 'POST') {
        const newTrip = {
          id: mockDb.trips.length + 1,
          trip_code: `TRP-${1000 + mockDb.trips.length}`,
          source: body.source,
          destination: body.destination,
          cargo_weight_kg: body.cargo_weight_kg,
          planned_distance_km: body.planned_distance_km,
          status: 'DRAFT',
          vehicle: body.vehicle_id ? mockDb.vehicles.find(v => v.id === body.vehicle_id) : null,
          driver: body.driver_id ? mockDb.drivers.find(d => d.id === body.driver_id) : null,
          vehicle_details: body.vehicle_id ? { name_model: mockDb.vehicles.find(v => v.id === body.vehicle_id).name_model } : null,
          driver_details: body.driver_id ? { name: mockDb.drivers.find(d => d.id === body.driver_id).name } : null
        };
        mockDb.trips.push(newTrip);
        return newTrip;
      }
      return mockDb.trips;
    }
    const matchId = path.match(/\/api\/trips\/(\d+)\//);
    if (matchId) {
      const tId = parseInt(matchId[1]);
      const tIndex = mockDb.trips.findIndex(t => t.id === tId);
      if (tIndex === -1) throw { status: 404, detail: 'Not found.' };
      
      if (path.endsWith('/assign/')) {
        const vObj = mockDb.vehicles.find(v => v.id === body.vehicle_id);
        const dObj = mockDb.drivers.find(d => d.id === body.driver_id);
        mockDb.trips[tIndex].vehicle = vObj || null;
        mockDb.trips[tIndex].driver = dObj || null;
        mockDb.trips[tIndex].vehicle_details = vObj ? { name_model: vObj.name_model } : null;
        mockDb.trips[tIndex].driver_details = dObj ? { name: dObj.name } : null;
        return mockDb.trips[tIndex];
      }

      if (path.endsWith('/dispatch/')) {
        const trip = mockDb.trips[tIndex];
        const vehicle = trip.vehicle || mockDb.vehicles[0]; // fallback matching wireframe
        const driver = trip.driver || mockDb.drivers[0]; 
        
        // Execute dispatch validation rules contract in order
        if (vehicle.status !== 'AVAILABLE') {
          throw { status: 400, error: 'VEHICLE_UNAVAILABLE', detail: 'Vehicle is not available', field: 'vehicle_id' };
        }
        if (driver.status !== 'AVAILABLE') {
          throw { status: 400, error: 'DRIVER_UNAVAILABLE', detail: 'Driver is not available', field: 'driver_id' };
        }
        if (driver.status === 'SUSPENDED') {
          throw { status: 400, error: 'DRIVER_SUSPENDED', detail: 'Driver is suspended', field: 'driver_id' };
        }
        if (!driver.is_license_valid) {
          throw { status: 400, error: 'LICENSE_EXPIRED', detail: "Driver's license has expired", field: 'driver_id' };
        }
        if (parseFloat(trip.cargo_weight_kg) > parseFloat(vehicle.max_load_capacity_kg)) {
          const diff = parseFloat(trip.cargo_weight_kg) - parseFloat(vehicle.max_load_capacity_kg);
          throw { status: 400, error: 'CAPACITY_EXCEEDED', detail: `Capacity exceeded by ${diff} kg — dispatch blocked`, field: 'cargo_weight_kg' };
        }
        
        // Success: mutate statuses
        mockDb.trips[tIndex].status = 'DISPATCHED';
        vehicle.status = 'ON_TRIP';
        driver.status = 'ON_TRIP';
        return mockDb.trips[tIndex];
      }

      if (path.endsWith('/complete/')) {
        const trip = mockDb.trips[tIndex];
        mockDb.trips[tIndex].status = 'COMPLETED';
        mockDb.trips[tIndex].end_odometer = body.end_odometer;
        mockDb.trips[tIndex].fuel_consumed_liters = body.fuel_consumed_liters;
        mockDb.trips[tIndex].revenue = body.revenue;
        
        if (trip.vehicle) {
          trip.vehicle.status = 'AVAILABLE';
          trip.vehicle.odometer = body.end_odometer;
        }
        if (trip.driver) trip.driver.status = 'AVAILABLE';

        // Auto-create FuelLog entry
        mockDb.fuelLogs.push({
          id: mockDb.fuelLogs.length + 1,
          vehicle_details: { name_model: trip.vehicle ? trip.vehicle.name_model : 'V-102 (Peterbilt)' },
          date: new Date().toISOString().split('T')[0],
          liters: body.fuel_consumed_liters,
          cost: parseFloat(body.fuel_consumed_liters) * 2.15, // mock rate
          status: 'Verified'
        });
        
        return mockDb.trips[tIndex];
      }

      if (path.endsWith('/cancel/')) {
        const trip = mockDb.trips[tIndex];
        mockDb.trips[tIndex].status = 'CANCELLED';
        if (trip.vehicle) trip.vehicle.status = 'AVAILABLE';
        if (trip.driver) trip.driver.status = 'AVAILABLE';
        return mockDb.trips[tIndex];
      }
    }
  }

  // -- 5. Maintenance Endpoints --
  if (path.startsWith('/api/maintenance/')) {
    if (path === '/api/maintenance/') {
      if (method === 'POST') {
        const vehicle = mockDb.vehicles.find(v => v.id === body.vehicle_id);
        if (vehicle) {
          vehicle.status = 'IN_SHOP';
        }
        const newLog = {
          id: mockDb.maintenanceLogs.length + 1,
          vehicle_details: { registration_number: vehicle ? vehicle.registration_number : 'FL-102' },
          service_type: body.service_type,
          cost: body.cost,
          date: body.date,
          status: 'OPEN'
        };
        mockDb.maintenanceLogs.push(newLog);
        return newLog;
      }
      return mockDb.maintenanceLogs;
    }
    const matchClose = path.match(/\/api\/maintenance\/(\d+)\/close\//);
    if (matchClose) {
      const mId = parseInt(matchClose[1]);
      const mIndex = mockDb.maintenanceLogs.findIndex(m => m.id === mId);
      if (mIndex !== -1) {
        mockDb.maintenanceLogs[mIndex].status = 'CLOSED';
        const vReg = mockDb.maintenanceLogs[mIndex].vehicle_details.registration_number;
        const vehicle = mockDb.vehicles.find(v => v.registration_number === vReg);
        if (vehicle && vehicle.status !== 'RETIRED') {
          vehicle.status = 'AVAILABLE';
        }
        return mockDb.maintenanceLogs[mIndex];
      }
    }
  }

  // -- 6. Fuel & Expense Endpoints --
  if (path.startsWith('/api/fuel-logs/')) {
    if (method === 'POST') {
      const newLog = {
        id: mockDb.fuelLogs.length + 1,
        vehicle_details: { name_model: body.vehicle },
        date: body.date || new Date().toISOString().split('T')[0],
        liters: body.liters,
        cost: body.cost,
        status: 'Pending'
      };
      mockDb.fuelLogs.push(newLog);
      return newLog;
    }
    return mockDb.fuelLogs;
  }

  if (path.startsWith('/api/expenses/')) {
    if (method === 'POST') {
      const newExp = {
        id: mockDb.expenses.length + 1,
        trip_code: body.trip_code,
        vehicle: body.vehicle,
        toll: body.toll,
        maint: body.maint,
        other: body.other,
        status: body.status || 'Paid'
      };
      mockDb.expenses.push(newExp);
      return newExp;
    }
    return mockDb.expenses;
  }

  // -- 7. Analytics Endpoints --
  if (path === '/api/analytics/dashboard/') {
    const active = mockDb.vehicles.filter(v => v.status === 'ON_TRIP').length + 84;
    const avail = mockDb.vehicles.filter(v => v.status === 'AVAILABLE').length + 24;
    const shop = mockDb.vehicles.filter(v => v.status === 'IN_SHOP').length + 6;
    return {
      active_vehicles: active,
      available_vehicles: avail,
      vehicles_in_maintenance: shop,
      active_trips: active,
      pending_trips: 15,
      drivers_on_duty: mockDb.drivers.filter(d => d.status === 'ON_TRIP' || d.status === 'AVAILABLE').length + 110,
      fleet_utilization_pct: 92.8
    };
  }

  if (path === '/api/analytics/top-costliest-vehicles/') {
    return [
      { label: 'Truck ID: #9921 (Volvo FH)', cost: '₹12,400', pct: 95 },
      { label: 'Truck ID: #1042 (Scania R)', cost: '₹10,150', pct: 78 },
      { label: 'Truck ID: #5512 (Kenworth)', cost: '₹8,900', pct: 65 },
      { label: 'Truck ID: #0293 (Peterbilt)', cost: '₹6,200', pct: 45 }
    ];
  }

  // -- 8. Settings Endpoints --
  if (path === '/api/settings/') {
    if (method === 'PATCH') {
      mockDb.settings = { ...mockDb.settings, ...body };
    }
    return mockDb.settings;
  }

  if (path === '/api/settings/rbac-matrix/') {
    return [
      { role: 'Fleet Manager', fleet: 'full', drivers: 'full', trips: '—', maint: 'full', fuel: '—', analytics: 'view' },
      { role: 'Dispatcher', fleet: 'view', drivers: '—', trips: 'full', maint: '—', fuel: '—', analytics: '—' },
      { role: 'Safety Officer', fleet: '—', drivers: 'full', trips: 'view', maint: '—', fuel: '—', analytics: '—' },
      { role: 'Financial Analyst', fleet: 'view', drivers: '—', trips: '—', maint: '—', fuel: 'full', analytics: 'full' }
    ];
  }

  return {};
}

// Exported Service methods
export const api = {
  // Auth
  login: (email, password, role) => request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  }),
  logout: () => request('/api/auth/logout/', { method: 'POST' }),
  getMe: () => request('/api/auth/me/'),

  // Vehicles
  getVehicles: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request(`/api/vehicles/${q ? '?' + q : ''}`);
  },
  getAvailableVehicles: () => request('/api/vehicles/available/'),
  createVehicle: (data) => request('/api/vehicles/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  retireVehicle: (id) => request(`/api/vehicles/${id}/retire/`, { method: 'PATCH' }),

  // Drivers
  getDrivers: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request(`/api/drivers/${q ? '?' + q : ''}`);
  },
  getAvailableDrivers: () => request('/api/drivers/available/'),
  createDriver: (data) => request('/api/drivers/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSafetyScore: (id, score, status) => request(`/api/drivers/${id}/safety-score/`, {
    method: 'PATCH',
    body: JSON.stringify({ safety_score: score, status }),
  }),
  updateDriver: (id, data) => request(`/api/drivers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Trips
  getTrips: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request(`/api/trips/${q ? '?' + q : ''}`);
  },
  createTrip: (data) => request('/api/trips/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  assignTrip: (id, data) => request(`/api/trips/${id}/assign/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  dispatchTrip: (id) => request(`/api/trips/${id}/dispatch/`, { method: 'POST' }),
  completeTrip: (id, data) => request(`/api/trips/${id}/complete/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  cancelTrip: (id) => request(`/api/trips/${id}/cancel/`, { method: 'POST' }),

  // Maintenance
  getMaintenance: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request(`/api/maintenance/${q ? '?' + q : ''}`);
  },
  createMaintenance: (data) => request('/api/maintenance/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  closeMaintenance: (id) => request(`/api/maintenance/${id}/close/`, { method: 'PATCH' }),

  // Fuel & Expenses
  getFuelLogs: () => request('/api/fuel-logs/'),
  createFuelLog: (data) => request('/api/fuel-logs/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getExpenses: () => request('/api/expenses/'),
  createExpense: (data) => request('/api/expenses/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Analytics
  getDashboardAnalytics: () => request('/api/analytics/dashboard/'),
  getCostliestVehicles: () => request('/api/analytics/top-costliest-vehicles/'),

  // Settings
  getSettings: () => request('/api/settings/'),
  updateSettings: (data) => request('/api/settings/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getRbacMatrix: () => request('/api/settings/rbac-matrix/')
};
