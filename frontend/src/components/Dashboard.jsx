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

  const filteredTrips = trips.filter(trip => {
    // If backend returns relation sub-objects, get name/model safely
    const tripVehicleModel = trip.vehicle_details ? trip.vehicle_details.name_model : trip.vehicle;
    const typeMatch = vehicleType === 'All Types' || (tripVehicleModel && tripVehicleModel.toLowerCase().includes(vehicleType.toLowerCase().replace('-truck', '')));
    const statusMatch = status === 'All Statuses' || trip.status === status || (status === 'Active' && trip.status === 'DISPATCHED') || (status === 'In Transit' && trip.status === 'DISPATCHED');
    return typeMatch && statusMatch;
  });

  const recentFilteredTrips = filteredTrips.slice(0, 4); // Limit to recent 4 rows for dashboard layout

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
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Vehicle Type</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="bg-surface-container border border-border-subtle rounded px-4 py-2 font-body-md text-sm text-on-surface min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option>All Types</option>
              <option>Semi-Truck</option>
              <option>Box Truck</option>
              <option>Cargo Van</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-surface-container border border-border-subtle rounded px-4 py-2 font-body-md text-sm text-on-surface min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option>All Statuses</option>
              <option value="DISPATCHED">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DRAFT">Draft / Pending</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Region</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-surface-container border border-border-subtle rounded px-4 py-2 font-body-md text-sm text-on-surface min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option>West India</option>
              <option>North India</option>
              <option>South India</option>
              <option>East India</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button className="bg-surface-container border border-border-subtle hover:bg-surface-container-high px-4 py-2 rounded flex items-center gap-2 text-on-surface font-label-md text-sm transition-all" onClick={() => alert('Advanced Filters loaded.')}>
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Advanced Filters
          </button>
          <button className="bg-surface-container border border-border-subtle hover:bg-surface-container-high px-4 py-2 rounded flex items-center gap-2 text-on-surface font-label-md text-sm transition-all" onClick={() => alert('Exporting PDF summary...')}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-stack-md">
        {/* Active Vehicles */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Active Vehicles</span>
            <span className="material-symbols-outlined text-info">local_shipping</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.active_vehicles}</h3>
            <p className="font-label-sm text-[11px] text-success mt-1 flex items-center gap-1 m-0">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12% vs last month
            </p>
          </div>
        </div>

        {/* Available Vehicles */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Available</span>
            <span className="material-symbols-outlined text-success">check_circle</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.available_vehicles}</h3>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-1 m-0">Ready for dispatch</p>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onViewChange('maintenance')}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">In Maintenance</span>
            <span className="material-symbols-outlined text-danger">build</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.vehicles_in_maintenance}</h3>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-1 m-0">3 scheduled today</p>
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onViewChange('trips')}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Active Trips</span>
            <span className="material-symbols-outlined text-primary">route</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.active_trips}</h3>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-1 m-0">12 Delayed</p>
          </div>
        </div>

        {/* Pending Trips */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onViewChange('trips')}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Pending</span>
            <span className="material-symbols-outlined text-warning">pending_actions</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.pending_trips}</h3>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-1 m-0">Next 24 hours</p>
          </div>
        </div>

        {/* Drivers On Duty */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onViewChange('drivers')}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Drivers On Duty</span>
            <span className="material-symbols-outlined text-secondary">group</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.drivers_on_duty}</h3>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-1 m-0">86% capacity</p>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-surface-raised p-4 rounded-lg border border-border-subtle shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onViewChange('analytics')}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Utilization</span>
            <span className="material-symbols-outlined text-tertiary">speed</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface m-0">{stats.fleet_utilization_pct}%</h3>
            <div className="w-full bg-surface-container rounded-full h-1 mt-2">
              <div className="bg-primary h-1 rounded-full animate-[pulse_1.5s_infinite]" style={{ width: `${stats.fleet_utilization_pct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
        {/* Left Side: Tables */}
        <div className="lg:col-span-2 space-y-stack-lg">
          {/* Vehicle Status Visualization */}
          <div className="bg-surface-raised p-6 rounded-lg border border-border-subtle shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-on-surface m-0">Fleet Status Breakdown</h2>
                <p className="font-body-md text-sm text-on-surface-variant opacity-70 m-0">Global distribution across 179 vehicles</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-success"></span>
                  <span className="font-label-sm text-xs font-semibold">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
                  <span className="font-label-sm text-xs font-semibold">On Trip</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-danger"></span>
                  <span className="font-label-sm text-xs font-semibold">In Shop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-surface-variant"></span>
                  <span className="font-label-sm text-xs font-semibold">Retired</span>
                </div>
              </div>
            </div>
            <div className="relative h-10 w-full flex rounded-full overflow-hidden mb-4 border border-border-subtle">
              <div className="h-full bg-success group relative cursor-pointer" style={{ width: '25%' }} title="25% Available">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs">25%</div>
              </div>
              <div className="h-full bg-secondary-container group relative cursor-pointer" style={{ width: '60%' }} title="60% On Trip">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs">60%</div>
              </div>
              <div className="h-full bg-danger group relative cursor-pointer" style={{ width: '10%' }} title="10% In Shop">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs">10%</div>
              </div>
              <div className="h-full bg-surface-variant group relative cursor-pointer" style={{ width: '5%' }} title="5% Retired">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs">5%</div>
              </div>
            </div>
            <div className="flex justify-between font-label-sm text-xs text-on-surface-variant font-semibold">
              <span>Low Efficiency</span>
              <span className="text-center">Optimal Deployment Range</span>
              <span>Full Capacity</span>
            </div>
          </div>

          {/* Recent Trips Table */}
          <div className="bg-surface-raised rounded-lg border border-border-subtle shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface m-0">Recent Trips</h2>
              <button
                className="text-primary font-label-md text-sm font-semibold hover:underline bg-transparent border-none outline-none cursor-pointer"
                onClick={() => onViewChange('trips')}
              >
                View All Trips
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-border-subtle">
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Trip ID</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Vehicle</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Driver</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider text-right font-bold">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentFilteredTrips.length > 0 ? (
                    recentFilteredTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4 font-body-md text-sm text-primary font-semibold">{trip.trip_code || `TRP-${trip.id}`}</td>
                        <td className="px-6 py-4 font-body-md text-sm text-on-surface">{trip.vehicle_details ? trip.vehicle_details.name_model : trip.vehicle}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center font-bold text-[10px]">
                              {(trip.driver_details ? trip.driver_details.name : trip.driver)?.split(' ').map(n=>n[0]).join('') || 'DR'}
                            </span>
                            <span className="font-body-md text-sm text-on-surface">
                              {trip.driver_details ? trip.driver_details.name : trip.driver}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase ${
                              trip.status === 'DISPATCHED' || trip.status === 'In Transit'
                                ? 'bg-info/20 text-info border-info/30'
                                : trip.status === 'COMPLETED' || trip.status === 'Completed'
                                ? 'bg-success/20 text-success border-success/30'
                                : trip.status === 'Delayed'
                                ? 'bg-danger/20 text-danger border-danger/30'
                                : 'bg-warning/20 text-warning border-warning/30'
                            }`}
                          >
                            {trip.status === 'DISPATCHED' ? 'In Transit' : trip.status === 'COMPLETED' ? 'Completed' : trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-body-md text-sm text-on-surface text-right">{trip.eta || (trip.status === 'COMPLETED' ? '—' : '18:00 PM')}</td>
                      </tr>
                    ))
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

        {/* Right Side: Sidebar Widgets */}
        <div className="space-y-stack-lg">
          {/* Fleet Live Map Widget */}
          <div className="bg-surface-raised rounded-lg border border-border-subtle shadow-sm overflow-hidden h-[300px] relative group">
            <div className="absolute inset-0 bg-surface-container-low flex items-center justify-center">
              <div
                className="w-full h-full grayscale-[0.8] opacity-50 contrast-125 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBBGW_sdLMjj67Jak_1hESmiZjobrc9gHVY90t4CrIWgOBZI5e-Vi_a9m-1fqxfPQWb1oV6pmPO82jNOsoY6A7eekIUodKn4tDLzdGYKQkw79wG6layswIORW2J0wugzsZRA8IFdGWWqkBNwi_WgtHfVKtPmrbZz1f1dO_jKThnPpR9VVKMTXcFvakXeUXn0mDqZz-3Y6wp_84opImSQKMyYKsrGqI48J70mDkbKsWuv03NbhUduOt85w')"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            </div>
            <div className="absolute inset-0 flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <span className="bg-primary/95 text-on-primary px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-xl">
                  Live Fleet Map
                </span>
                <button
                  className="bg-surface/80 backdrop-blur p-2 rounded-lg border border-border-subtle hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                  onClick={() => alert('Entering fullscreen live map...')}
                >
                  <span className="material-symbols-outlined text-[20px] block">fullscreen</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-subtle flex-1 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border border-background bg-info" title="In Transit"></div>
                    <div className="w-6 h-6 rounded-full border border-background bg-success" title="Available"></div>
                    <div className="w-6 h-6 rounded-full border border-background bg-warning" title="Pending"></div>
                  </div>
                  <span className="font-label-md text-xs text-on-surface font-bold">142 Active Units</span>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Service Alerts */}
          <div className="bg-surface-raised p-6 rounded-lg border border-border-subtle shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-sm text-base font-bold text-on-surface m-0">Service Alerts</h2>
              <span className="bg-danger/25 text-danger px-2.5 py-0.5 rounded text-[10px] font-bold border border-danger/30">
                3 CRITICAL
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-3 bg-surface-container-low rounded-lg border-l-4 border-danger cursor-pointer hover:bg-surface-container-high transition-colors" onClick={() => onViewChange('maintenance')}>
                <span className="material-symbols-outlined text-danger">report</span>
                <div>
                  <p className="font-label-md text-sm text-on-surface font-bold m-0">Brake System Failure</p>
                  <p className="font-body-md text-xs text-on-surface-variant opacity-75 m-0">Unit #205 • Immediate inspection</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 bg-surface-container-low rounded-lg border-l-4 border-warning cursor-pointer hover:bg-surface-container-high transition-colors" onClick={() => onViewChange('maintenance')}>
                <span className="material-symbols-outlined text-warning">oil_barrel</span>
                <div>
                  <p className="font-label-md text-sm text-on-surface font-bold m-0">Oil Change Overdue</p>
                  <p className="font-body-md text-xs text-on-surface-variant opacity-75 m-0">Unit #442 • Scheduled 2 days ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 bg-surface-container-low rounded-lg border-l-4 border-info cursor-pointer hover:bg-surface-container-high transition-colors" onClick={() => onViewChange('maintenance')}>
                <span className="material-symbols-outlined text-info">calendar_month</span>
                <div>
                  <p className="font-label-md text-sm text-on-surface font-bold m-0">Annual Inspection</p>
                  <p className="font-body-md text-xs text-on-surface-variant opacity-75 m-0">Fleet-wide (North Region) • Starts tomorrow</p>
                </div>
              </div>
            </div>
            <button
              className="w-full mt-4 py-2.5 border border-border-subtle rounded font-label-md text-sm text-on-surface font-semibold hover:bg-surface-container-high transition-all bg-transparent cursor-pointer"
              onClick={() => onViewChange('maintenance')}
            >
              View Maintenance Hub
            </button>
          </div>

          {/* Driver Performance Widget */}
          <div className="bg-surface-raised p-6 rounded-lg border border-border-subtle shadow-sm relative overflow-hidden">
            <h2 className="font-headline-sm text-base font-bold text-on-surface mb-4 m-0">Top Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer hover:opacity-95" onClick={() => onViewChange('drivers')}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                    MT
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-semibold m-0">Marcus Thorne</p>
                    <p className="font-label-sm text-xs text-on-surface-variant m-0">98.2 Safety Score</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary">military_tech</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:opacity-95" onClick={() => onViewChange('drivers')}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                    SJ
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-semibold m-0">Sarah Jenkins</p>
                    <p className="font-label-sm text-xs text-on-surface-variant m-0">96.5 Efficiency</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-success">eco</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
