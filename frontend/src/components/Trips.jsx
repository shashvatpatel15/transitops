import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Trips({ user }) {
  const [source, setSource] = useState('Gandhinagar Depot');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [weight, setWeight] = useState(700);
  const [distance, setDistance] = useState(38);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [activeStep, setActiveStep] = useState('draft');
  const [loading, setLoading] = useState(true);

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [trips, setTrips] = useState([]);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [activeTripForCompletion, setActiveTripForCompletion] = useState(null);
  const [endOdometer, setEndOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [tripRevenue, setTripRevenue] = useState('');

  const fetchDropdownsAndTrips = () => {
    setLoading(true);
    const params = {};
    if (searchTerm) params.search = searchTerm;

    const isDispatcher = user?.role === 'DISPATCHER';
    const promises = [api.getTrips(params)];
    
    if (isDispatcher) {
      promises.push(api.getAvailableVehicles());
      promises.push(api.getAvailableDrivers());
    }

    Promise.all(promises)
      .then((results) => {
        const tripsData = results[0];
        setTrips(tripsData);

        if (isDispatcher) {
          const vehiclesData = results[1] || [];
          const driversData = results[2] || [];
          setAvailableVehicles(vehiclesData);
          setAvailableDrivers(driversData);
          if (vehiclesData.length > 0) setSelectedVehicle(vehiclesData[0].id);
          if (driversData.length > 0) setSelectedDriver(driversData[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDropdownsAndTrips();
  }, [searchTerm]);

  const selectedVehicleObj = availableVehicles.find(v => v.id === parseInt(selectedVehicle));
  const vehicleCapacity = selectedVehicleObj ? parseFloat(selectedVehicleObj.max_load_capacity_kg) : 0;
  const capacityExceeded = selectedVehicleObj && weight > vehicleCapacity;
  const overBy = capacityExceeded ? weight - vehicleCapacity : 0;

  const handleDispatch = async (e) => {
    e.preventDefault();
    setValidationError(null);
    if (!destination) { alert('Please enter a destination.'); return; }

    try {
      const draftTrip = await api.createTrip({
        source, destination,
        cargo_weight_kg: parseFloat(weight),
        planned_distance_km: parseFloat(distance)
      });
      if (selectedVehicle && selectedDriver) {
        await api.assignTrip(draftTrip.id, {
          vehicle_id: parseInt(selectedVehicle),
          driver_id: parseInt(selectedDriver)
        });
      }
      await api.dispatchTrip(draftTrip.id);
      setActiveStep('dispatched');
      alert('Trip dispatched successfully!');
      setDestination('');
      fetchDropdownsAndTrips();
    } catch (err) {
      if (err.error) {
        setValidationError(err);
      } else {
        alert(err.detail || 'Dispatch validation failed.');
      }
    }
  };

  const handleCancelTrip = (id) => {
    if (confirm('Cancel this dispatch? This will release the vehicle and driver.')) {
      api.cancelTrip(id)
        .then(() => { alert('Trip cancelled.'); setActiveStep('cancelled'); fetchDropdownsAndTrips(); })
        .catch(err => alert(err.detail || 'Failed to cancel trip.'));
    }
  };

  const handleOpenCompleteModal = (trip) => {
    setActiveTripForCompletion(trip);
    const startOdom = parseFloat(trip.vehicle?.odometer || 0);
    setEndOdometer(Math.round(startOdom + parseFloat(trip.planned_distance_km)));
    setFuelConsumed(Math.round(parseFloat(trip.planned_distance_km) * 0.35));
    setTripRevenue(Math.round(parseFloat(trip.planned_distance_km) * 3));
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!endOdometer || !fuelConsumed || !tripRevenue) {
      alert('All completion fields are required!');
      return;
    }
    api.completeTrip(activeTripForCompletion.id, {
      end_odometer: parseFloat(endOdometer),
      fuel_consumed_liters: parseFloat(fuelConsumed),
      revenue: parseFloat(tripRevenue)
    }).then(() => {
      alert('Trip logged as COMPLETED. Vehicle & Driver set Available.');
      setShowCompleteModal(false);
      setActiveStep('completed');
      fetchDropdownsAndTrips();
    }).catch(err => alert(err.detail || 'Failed to complete trip.'));
  };

  const steps = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
  const stepColors = {
    Draft: activeStep === 'draft' ? 'bg-success' : 'bg-on-surface-variant/30',
    Dispatched: activeStep === 'dispatched' ? 'bg-primary' : 'bg-on-surface-variant/30',
    Completed: activeStep === 'completed' ? 'bg-primary' : 'bg-on-surface-variant/30',
    Cancelled: activeStep === 'cancelled' ? 'bg-primary' : 'bg-on-surface-variant/30',
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DISPATCHED': return { label: 'Dispatched', cls: 'bg-primary text-on-primary' };
      case 'COMPLETED': return { label: 'Completed', cls: 'bg-success text-on-success' };
      case 'CANCELLED': return { label: 'Cancelled', cls: 'bg-danger text-white' };
      default: return { label: 'Draft', cls: 'bg-on-surface-variant/30 text-on-surface' };
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ───── LEFT COLUMN: Lifecycle + Create Form ───── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Trip Lifecycle Stepper */}
          <div className="bento-card p-6 rounded-xl">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider m-0 mb-5">Trip Lifecycle</h3>
            <div className="flex items-center gap-0">
              {steps.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-4 h-4 rounded-full ${stepColors[step]} transition-all`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      step.toLowerCase() === activeStep ? 'text-primary' : 'text-on-surface-variant/50'
                    }`}>{step}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-[2px] bg-on-surface-variant/20 mx-1 mt-[-14px]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Create Trip Form (Dispatcher only) */}
          {user?.role === 'DISPATCHER' && (
            <div className="bento-card p-6 rounded-xl">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider m-0 mb-5">Create Trip</h3>

              <form onSubmit={handleDispatch} className="space-y-4">
                {/* Source */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Source</label>
                  <input
                    type="text" value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Destination</label>
                  <input
                    type="text" placeholder="e.g. Ahmedabad Hub" value={destination} onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Vehicle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Vehicle (Available Only)</label>
                  <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                    {availableVehicles.length > 0 ? (
                      availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} – {parseFloat(v.max_load_capacity_kg).toLocaleString()} kg capacity
                        </option>
                      ))
                    ) : (
                      <option value="">No Vehicles Available</option>
                    )}
                  </select>
                </div>

                {/* Driver */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Driver (Available Only)</label>
                  <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                    {availableDrivers.length > 0 ? (
                      availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))
                    ) : (
                      <option value="">No Drivers Available</option>
                    )}
                  </select>
                </div>

                {/* Cargo Weight */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Cargo Weight (Kg)</label>
                  <input
                    type="number" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Planned Distance */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Planned Distance (Km)</label>
                  <input
                    type="number" value={distance} onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Capacity Warning */}
                {capacityExceeded && (
                  <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 space-y-1">
                    <p className="text-sm text-danger font-semibold m-0">Vehicle Capacity: {vehicleCapacity.toLocaleString()} kg</p>
                    <p className="text-sm text-danger font-semibold m-0">Cargo Weight: {weight.toLocaleString()} kg</p>
                    <p className="text-sm text-danger font-bold m-0 flex items-center gap-1">
                      <span className="text-danger">✕</span>
                      Capacity exceeded by {overBy.toLocaleString()} kg → dispatch blocked
                    </p>
                  </div>
                )}

                {/* Backend validation error */}
                {validationError && (
                  <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
                    <p className="text-xs text-danger font-bold uppercase m-0">Rule Blocked: {validationError.error}</p>
                    <p className="text-xs text-on-surface m-0 mt-1">{validationError.detail}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={capacityExceeded}
                    className={`flex-1 py-3 font-bold rounded-lg text-sm transition-all border-none cursor-pointer ${
                      capacityExceeded
                        ? 'bg-on-surface-variant/20 text-on-surface-variant/50 cursor-not-allowed'
                        : 'bg-primary text-on-primary hover:brightness-110 active:scale-[0.98]'
                    }`}
                  >
                    {capacityExceeded ? 'Dispatch (Disabled)' : 'Dispatch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDestination(''); setValidationError(null); }}
                    className="px-6 py-3 bg-danger/10 text-danger font-bold rounded-lg text-sm hover:bg-danger/20 transition-all border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ───── RIGHT COLUMN: Live Board ───── */}
        <div className="lg:col-span-7">
          <div className="bento-card p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-border-subtle/30 pb-3">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider m-0">Live Board</h3>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface-container border border-border-subtle rounded-lg py-1.5 pl-8 pr-3 text-on-surface focus:ring-1 focus:ring-primary outline-none text-xs w-48 font-semibold"
                  placeholder="Search trips..."
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.length > 0 ? trips.map((trip) => {
                  const badge = getStatusBadge(trip.status);
                  const tripVehicle = trip.vehicle_details?.registration_number || trip.vehicle_details?.name_model || '—';
                  const tripDriver = trip.driver_details?.name || '—';
                  const isDispatched = trip.status === 'DISPATCHED';

                  return (
                    <div key={trip.id} className="bg-surface-container/50 border border-border-subtle rounded-lg p-4 hover:bg-surface-container transition-colors">
                      {/* Top row: Trip code + Vehicle/Driver */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-base font-bold text-on-surface">{trip.trip_code || `TR${String(trip.id).padStart(3, '0')}`}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-on-surface">{tripVehicle}</span>
                          <span className="text-on-surface-variant/50 mx-1">/</span>
                          <span className="text-sm font-semibold text-on-surface-variant">{tripDriver.split(' ')[0]?.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Route */}
                      <p className="text-sm text-on-surface-variant font-medium m-0 mb-3">
                        {trip.source} → {trip.destination}
                      </p>

                      {/* Status + ETA/Action row */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>

                        <div className="text-right">
                          {isDispatched && user?.role === 'DISPATCHER' ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenCompleteModal(trip)}
                                className="px-3 py-1.5 bg-success text-on-success rounded text-xs font-bold hover:brightness-110 transition-all cursor-pointer border-none">
                                Complete
                              </button>
                              <button onClick={() => handleCancelTrip(trip.id)}
                                className="px-3 py-1.5 border border-danger/30 text-danger hover:bg-danger/10 rounded text-xs font-bold transition-all cursor-pointer bg-transparent">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-semibold italic">
                              {trip.status === 'DRAFT' ? 'Awaiting driver' :
                               trip.status === 'CANCELLED' ? 'Vehicle went to shop' :
                               trip.eta || '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-on-surface-variant/50">
                    <p className="text-sm font-medium">No trips found.</p>
                  </div>
                )}

                {/* Footer note */}
                <p className="text-[11px] text-on-surface-variant/60 font-medium m-0 pt-2 border-t border-border-subtle/50 mt-4">
                  On Complete: odometer → Fuel log → expenses → Vehicle &amp; Driver Available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── Complete Trip Modal ───── */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface m-0">Complete Dispatch</h3>
              <button onClick={() => setShowCompleteModal(false)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer">
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  End Odometer Reading (km)
                </label>
                <input type="number" required value={endOdometer} onChange={(e) => setEndOdometer(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Fuel Consumed (Liters)
                </label>
                <input type="number" step="0.1" required value={fuelConsumed} onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Revenue Generated (₹)
                </label>
                <input type="number" step="0.01" required value={tripRevenue} onChange={(e) => setTripRevenue(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-3 border border-border-subtle rounded-lg font-bold text-sm text-on-surface hover:bg-surface-variant transition-all cursor-pointer bg-transparent">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-3 bg-success text-on-success font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none">
                  Save &amp; Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
