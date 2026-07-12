import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Dashboard({ onViewChange }) {
  const [vehicleType, setVehicleType] = useState('All Types');
  const [status, setStatus] = useState('All Statuses');
  const [region, setRegion] = useState('West India');
  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardAnalytics().catch(err => {
        console.error("Dashboard Analytics failed:", err);
        return null;
      }),
      api.getTrips().catch(err => {
        console.error("Trips failed:", err);
        return [];
      })
    ]).then(([analyticsData, tripsData]) => {
      setStats(analyticsData);
      setTrips(tripsData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Use real trips from DB for the recent trips table
  const recentTrips = trips.slice(0, 5);

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
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats?.active_vehicles ?? 0}</h3>
        </div>

        {/* Available Vehicles */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-success flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Available Vehicles</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats?.available_vehicles ?? 0}</h3>
        </div>

        {/* Vehicles In Maintenance */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-warning flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Vehicles In Maintenance</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">
            {String(stats?.vehicles_in_maintenance ?? 0).padStart(2, '0')}
          </h3>
        </div>

        {/* Active Trips */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Active Trips</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats?.active_trips ?? 0}</h3>
        </div>

        {/* Pending Trips */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Pending Trips</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">
            {String(stats?.pending_trips ?? 0).padStart(2, '0')}
          </h3>
        </div>

        {/* Drivers On Duty */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-primary flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Drivers On Duty</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats?.drivers_on_duty ?? 0}</h3>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-surface-raised p-4 rounded border border-border-subtle border-l-4 border-l-success flex flex-col justify-center min-h-[90px]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-2">Fleet Utilization</span>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats?.fleet_utilization_pct ?? 0}%</h3>
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
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Route</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Vehicle / Driver</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentTrips.length > 0 ? (
                    recentTrips.map((trip) => {
                      const statusMap = {
                        DISPATCHED: { label: 'In Transit', cls: 'bg-primary text-on-primary' },
                        COMPLETED: { label: 'Completed', cls: 'bg-success text-on-success' },
                        CANCELLED: { label: 'Cancelled', cls: 'bg-surface-variant text-on-surface-variant' },
                        DRAFT: { label: 'Draft', cls: 'bg-warning/20 text-warning' },
                      };
                      const badge = statusMap[trip.status] || { label: trip.status, cls: 'bg-surface-variant text-on-surface-variant' };
                      const vName = trip.vehicle_details?.registration_number || '—';
                      const dName = trip.driver_details?.name || '—';

                      return (
                        <tr key={trip.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-6 py-4 font-body-md text-sm font-semibold text-on-surface">{trip.trip_code || `TR${String(trip.id).padStart(3, '0')}`}</td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant font-medium">{trip.source} → {trip.destination}</td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant font-medium">{vName} / {dName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded font-bold text-xs ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-on-surface-variant opacity-75">
                        No recent trips found.
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
                    <span className="text-success font-bold">{stats?.available_vehicles ?? 0}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full transition-all" style={{ width: `${stats && (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance) > 0 ? Math.round((stats.available_vehicles / (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance)) * 100) : 0}%` }} />
                  </div>
                </div>
                
                {/* On Trip */}
                <div>
                  <div className="flex justify-between font-label-md text-xs font-semibold mb-2">
                    <span className="text-on-surface">On Trip</span>
                    <span className="text-info font-bold">{stats?.active_vehicles ?? 0}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-info rounded-full transition-all" style={{ width: `${stats && (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance) > 0 ? Math.round((stats.active_vehicles / (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance)) * 100) : 0}%` }} />
                  </div>
                </div>

                {/* In Shop */}
                <div>
                  <div className="flex justify-between font-label-md text-xs font-semibold mb-2">
                    <span className="text-on-surface">In Shop</span>
                    <span className="text-warning font-bold">{stats?.vehicles_in_maintenance ?? 0}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${stats && (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance) > 0 ? Math.round((stats.vehicles_in_maintenance / (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance)) * 100) : 0}%` }} />
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
