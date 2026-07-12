import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Dashboard({ onViewChange }) {
  const [vehicleType, setVehicleType] = useState('All Types');
  const [status, setStatus] = useState('All Statuses');
  const [region, setRegion] = useState('West India');
  const [stats, setStats] = useState({
    active_vehicles: 142,
    available_vehicles: 28,
    vehicles_in_maintenance: 9,
    active_trips: 84,
    pending_trips: 15,
    drivers_on_duty: 118,
    fleet_utilization_pct: 92.4
  });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats and trips on mount
    Promise.all([
      api.getDashboardAnalytics(),
      api.getTrips()
    ]).then(([analyticsData, tripsData]) => {
      setStats(analyticsData);
      setTrips(tripsData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const baseTrips = [
    { id: 1, trip_code: "TR001", vehicle: "VAN-05", driver: "Alex", status: "On Trip", eta: "45 min", type: "Cargo Van", region: "Maharashtra" },
    { id: 2, trip_code: "TR002", vehicle: "TRK-12", driver: "John", status: "Completed", eta: "—", type: "Semi-Truck", region: "Gujarat" },
    { id: 3, trip_code: "TR003", vehicle: "MINI-08", driver: "Priya", status: "Dispatched", eta: "1h 10m", type: "Box Truck", region: "Delhi" },
    { id: 4, trip_code: "TR006", vehicle: "—", driver: "—", status: "Draft", eta: "Awaiting vehicle", type: "Semi-Truck", region: "Maharashtra" }
  ];

  const recentFilteredTrips = baseTrips.filter(trip => {
    const typeMatch = vehicleType === 'All' || trip.type.toLowerCase().includes(vehicleType.toLowerCase().replace('-truck', ''));
    const statusMatch = status === 'All' || trip.status.toLowerCase() === status.toLowerCase() || (status === 'DISPATCHED' && trip.status === 'Dispatched');
    return typeMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="bg-surface-container border border-border-subtle rounded px-4 py-2 font-body-md text-sm text-on-surface min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="All">Vehicle Type: All</option>
            <option value="Semi-Truck">Semi-Truck</option>
            <option value="Box Truck">Box Truck</option>
            <option value="Cargo Van">Cargo Van</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-surface-container border border-border-subtle rounded px-4 py-2 font-body-md text-sm text-on-surface min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="All">Status: All</option>
            <option value="DISPATCHED">In Transit</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DRAFT">Draft</option>
          </select>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-surface-container border border-border-subtle rounded px-4 py-2 font-body-md text-sm text-on-surface min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="All">Region: All</option>
            <option value="West India">West India</option>
            <option value="North India">North India</option>
            <option value="South India">South India</option>
            <option value="East India">East India</option>
          </select>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-stack-md">
        {/* Active Vehicles */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Active Vehicles</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.active_vehicles || 53}</h3>
        </div>

        {/* Available Vehicles */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-success flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Available Vehicles</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.available_vehicles || 42}</h3>
        </div>

        {/* Vehicles In Maintenance */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-warning flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Vehicles In Maintenance</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">
            {String(stats.vehicles_in_maintenance || 5).padStart(2, '0')}
          </h3>
        </div>

        {/* Active Trips */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Active Trips</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.active_trips || 18}</h3>
        </div>

        {/* Pending Trips */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Pending Trips</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">
            {String(stats.pending_trips || 9).padStart(2, '0')}
          </h3>
        </div>

        {/* Drivers On Duty */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Drivers On Duty</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.drivers_on_duty || 26}</h3>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-success flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Fleet Utilization</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.fleet_utilization_pct || 81}%</h3>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
        {/* Left Side: Tables */}
        <div className="lg:col-span-2 space-y-stack-lg">


          {/* Recent Trips Table */}
          <div className="bg-surface-raised rounded-lg border border-border-subtle shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface m-0 uppercase tracking-wider">Recent Trips</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-border-subtle">
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Trip</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Vehicle</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Driver</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Status</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentFilteredTrips.length > 0 ? (
                    recentFilteredTrips.map((trip) => {
                      const isCompleted = trip.status === 'Completed';
                      const isDraft = trip.status === 'Draft';
                      
                      let badgeClass = 'bg-primary text-on-primary'; // On Trip / Dispatched
                      if (isCompleted) {
                        badgeClass = 'bg-success text-on-success';
                      } else if (isDraft) {
                        badgeClass = 'bg-surface-variant text-on-surface-variant';
                      }

                      return (
                        <tr key={trip.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-6 py-4 font-body-md text-sm font-semibold text-on-surface">{trip.trip_code}</td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant font-medium">{trip.vehicle}</td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant font-medium">{trip.driver}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded font-bold text-xs ${badgeClass}`}>
                              {trip.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant font-semibold">{trip.eta}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant opacity-75">
                        No recent trips match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Vehicle Status Sidebar Widget */}
        <div className="space-y-stack-lg">
          <div className="bg-surface-raised p-6 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="font-headline-sm text-base font-bold text-on-surface m-0 mb-6 uppercase tracking-wider">Vehicle Status</h2>
              <div className="space-y-5">
                {/* Available */}
                <div>
                  <div className="flex justify-between font-label-md text-xs font-semibold mb-2">
                    <span className="text-on-surface">Available</span>
                    <span className="text-success font-bold">{stats.available_vehicles || 42}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>
                
                {/* On Trip */}
                <div>
                  <div className="flex justify-between font-label-md text-xs font-semibold mb-2">
                    <span className="text-on-surface">On Trip</span>
                    <span className="text-info font-bold">{stats.active_vehicles || 53}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-info rounded-full" style={{ width: '53%' }} />
                  </div>
                </div>

                {/* In Shop */}
                <div>
                  <div className="flex justify-between font-label-md text-xs font-semibold mb-2">
                    <span className="text-on-surface">In Shop</span>
                    <span className="text-warning font-bold">{stats.vehicles_in_maintenance || 5}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: '10%' }} />
                  </div>
                </div>

                {/* Retired */}
                <div>
                  <div className="flex justify-between font-label-md text-xs font-semibold mb-2">
                    <span className="text-on-surface">Retired</span>
                    <span className="text-danger font-bold">2</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-danger rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
