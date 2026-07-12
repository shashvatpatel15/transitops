import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Trips({ user }) {
  const [source, setSource] = useState('Mumbai Hub, MH');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [weight, setWeight] = useState(4500);
  const [distance, setDistance] = useState(340);
  
  // Validation / UI States
  const [validationError, setValidationError] = useState(null);
  const [activeStep, setActiveStep] = useState('draft'); // draft, dispatched, completed, cancelled
  const [loading, setLoading] = useState(true);

  // Loaded dropdown states
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
    Promise.all([
      api.getAvailableVehicles(),
      api.getAvailableDrivers(),
      api.getTrips()
    ]).then(([vehiclesData, driversData, tripsData]) => {
      setAvailableVehicles(vehiclesData);
      setAvailableDrivers(driversData);
      setTrips(tripsData);
      
      // Pre-select first options if available
      if (vehiclesData.length > 0) setSelectedVehicle(vehiclesData[0].id);
      if (driversData.length > 0) setSelectedDriver(driversData[0].id);
      
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDropdownsAndTrips();
  }, []);

  // Client-side quick capacity checking (before backend submit)
  const selectedVehicleObj = availableVehicles.find(v => v.id === parseInt(selectedVehicle));
  const capacityWarning = selectedVehicleObj && weight > parseFloat(selectedVehicleObj.max_load_capacity_kg);

  const handleDispatch = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!destination) {
      alert('Please enter a destination.');
      return;
    }

    try {
      // Step 1: Create a Draft trip
      const draftTrip = await api.createTrip({
        source,
        destination,
        cargo_weight_kg: parseFloat(weight),
        planned_distance_km: parseFloat(distance)
      });

      // Step 2: Assign driver and vehicle to the draft trip
      if (selectedVehicle && selectedDriver) {
        await api.assignTrip(draftTrip.id, {
          vehicle_id: parseInt(selectedVehicle),
          driver_id: parseInt(selectedDriver)
        });
      }

      // Step 3: Trigger Dispatch API containing the rules engine
      await api.dispatchTrip(draftTrip.id);
      
      setActiveStep('dispatched');
      alert(`Trip dispatched successfully!`);
      
      // Refresh list & reset form fields
      setDestination('');
      fetchDropdownsAndTrips();
    } catch (err) {
      console.error('Dispatch error:', err);
      // Map DRF contract code to exact warning
      if (err.error) {
        setValidationError(err);
      } else {
        alert(err.detail || 'Dispatch validation failed.');
      }
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!destination) {
      alert('Destination required to save draft.');
      return;
    }
    try {
      const draftTrip = await api.createTrip({
        source,
        destination,
        cargo_weight_kg: parseFloat(weight),
        planned_distance_km: parseFloat(distance)
      });
      if (selectedVehicle && selectedDriver) {
        await api.assignTrip(draftTrip.id, {
          vehicle_id: parseInt(selectedVehicle),
          driver_id: parseInt(selectedDriver)
        });
      }
      setActiveStep('draft');
      alert('Draft trip saved.');
      fetchDropdownsAndTrips();
    } catch (err) {
      alert(err.detail || 'Failed to save draft.');
    }
  };

  const handleCancelTrip = (id) => {
    if (confirm('Cancel this dispatch? This will release the vehicle and driver.')) {
      api.cancelTrip(id)
        .then(() => {
          alert('Trip cancelled.');
          setActiveStep('cancelled');
          fetchDropdownsAndTrips();
        })
        .catch(err => alert(err.detail || 'Failed to cancel trip.'));
    }
  };

  const handleOpenCompleteModal = (trip) => {
    setActiveTripForCompletion(trip);
    // Suggest end odometer based on planned distance
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
      alert('Trip logged as COMPLETED. Vehicle status is reset to Available.');
      setShowCompleteModal(false);
      setActiveStep('completed');
      fetchDropdownsAndTrips();
    }).catch(err => alert(err.detail || 'Failed to complete trip.'));
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-1">Trip Dispatcher</h2>
        <p className="font-body-md text-sm text-on-surface-variant">Real-time routing, cargo constraints, and fleet dispatching.</p>
      </div>

      {/* Stepper */}
      <section className="bg-surface-raised border border-border-subtle p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-surface-variant z-0"></div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-background font-bold ${activeStep === 'draft' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-base">edit_note</span>
            </div>
            <span className={`font-label-sm text-xs uppercase font-semibold ${activeStep === 'draft' ? 'text-primary' : 'text-on-surface-variant'}`}>Draft</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-background font-bold ${activeStep === 'dispatched' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-base">send</span>
            </div>
            <span className={`font-label-sm text-xs uppercase font-semibold ${activeStep === 'dispatched' ? 'text-primary' : 'text-on-surface-variant'}`}>Dispatched</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-background font-bold ${activeStep === 'completed' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-base">check_circle</span>
            </div>
            <span className={`font-label-sm text-xs uppercase font-semibold ${activeStep === 'completed' ? 'text-primary' : 'text-on-surface-variant'}`}>Completed</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-background font-bold ${activeStep === 'cancelled' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-base">cancel</span>
            </div>
            <span className={`font-label-sm text-xs uppercase font-semibold ${activeStep === 'cancelled' ? 'text-primary' : 'text-on-surface-variant'}`}>Cancelled</span>
          </div>
        </div>
      </section>

      {/* Main Split Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Create Trip Form */}
        {user?.role === 'DISPATCHER' && (
          <div className="col-span-12 lg:col-span-5 xl:col-span-4">
            <div className="bg-surface-raised border border-border-subtle rounded-xl shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
              <h2 className="font-headline-sm text-base font-bold text-on-surface m-0">Create Trip</h2>
              <span className="font-label-sm text-[10px] text-on-surface-variant px-2 py-1 bg-surface-variant rounded font-semibold uppercase">
                New Dispatch Form
              </span>
            </div>
            
            <form onSubmit={handleDispatch} className="p-6 space-y-5">
              {validationError && (
                <div className="bg-danger/10 border border-danger/25 p-3 rounded-lg flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-danger text-sm mt-0.5">report</span>
                  <div>
                    <p className="font-label-sm text-xs text-danger font-bold uppercase m-0">
                      Rule Blocked: {validationError.error}
                    </p>
                    <p className="font-body-md text-xs text-on-surface m-0 mt-0.5">{validationError.detail}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-2">Source Location</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">location_on</span>
                    <input
                      className="w-full bg-surface-container border border-border-subtle rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-2">Destination</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">flag</span>
                    <input
                      className="w-full bg-surface-container border border-border-subtle rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Enter arrival port"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-2">Vehicle (Available)</label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    {availableVehicles.length > 0 ? (
                      availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name_model} ({parseFloat(v.max_load_capacity_kg).toLocaleString()}kg)</option>
                      ))
                    ) : (
                      <option value="">No Vehicles Available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-2">Driver (Available)</label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    {availableDrivers.length > 0 ? (
                      availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</option>
                      ))
                    ) : (
                      <option value="">No Drivers Available</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-2">Cargo Weight (kg)</label>
                  <input
                    className={`w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 ${capacityWarning ? 'border-danger/50 text-danger bg-danger/5 focus:ring-danger' : 'border-border-subtle text-on-surface focus:ring-primary'}`}
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                  />
                  {capacityWarning && (
                    <p className="mt-2 text-[10px] font-semibold text-danger flex items-center gap-1 m-0">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      Exceeds capacity of {parseFloat(selectedVehicleObj.max_load_capacity_kg).toLocaleString()}kg
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-2">Planned Distance (km)</label>
                  <input
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex-1 py-3 border border-border-subtle rounded-lg font-bold text-sm text-on-surface hover:bg-surface-variant transition-all bg-transparent cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 font-bold rounded-lg text-sm transition-all border-none bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] cursor-pointer"
                >
                  Dispatch Trip
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Right: Live Board */}
        <div className={user?.role === 'DISPATCHER' ? "col-span-12 lg:col-span-7 xl:col-span-8" : "col-span-12"}>
          <div className="bg-surface-raised border border-border-subtle rounded-xl shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-headline-sm text-base font-bold text-on-surface m-0">Live Board</h2>
                <span className="bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-success/30">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping"></span>
                  LIVE
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 text-on-surface-variant hover:bg-surface-variant rounded transition-all bg-transparent border-none cursor-pointer"
                  onClick={() => alert('Filtering options')}
                >
                  <span className="material-symbols-outlined block">filter_list</span>
                </button>
                <button
                  className="p-2 text-on-surface-variant hover:bg-surface-variant rounded transition-all bg-transparent border-none cursor-pointer"
                  onClick={fetchDropdownsAndTrips}
                >
                  <span className="material-symbols-outlined block">refresh</span>
                </button>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto max-h-[480px]">
              {loading ? (
                <div className="flex justify-center p-12">
                  <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-surface-container-low z-10 border-b border-border-subtle">
                    <tr>
                      <th className="text-left font-label-sm text-xs text-on-surface-variant uppercase px-4 py-3 font-bold">Trip ID</th>
                      <th className="text-left font-label-sm text-xs text-on-surface-variant uppercase px-4 py-3 font-bold">Route</th>
                      <th className="text-left font-label-sm text-xs text-on-surface-variant uppercase px-4 py-3 font-bold">Vehicle / Driver</th>
                      <th className="text-left font-label-sm text-xs text-on-surface-variant uppercase px-4 py-3 font-bold">Status</th>
                      <th className="text-right font-label-sm text-xs text-on-surface-variant uppercase px-4 py-3 font-bold">Actions / ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {trips.map((trip) => {
                      const isDispatched = trip.status === 'DISPATCHED' || trip.status === 'In Transit';
                      const tripVehicle = trip.vehicle_details ? trip.vehicle_details.name_model : trip.vehicle;
                      const tripDriver = trip.driver_details ? trip.driver_details.name : trip.driver;

                      return (
                        <tr key={trip.id} className={`hover:bg-surface-container transition-colors group ${trip.delayed ? 'border-danger/20 border-l-2' : ''}`}>
                          <td className="px-4 py-4">
                            <span className="font-label-md text-sm text-on-surface font-semibold">{trip.trip_code || `TRP-${trip.id}`}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-on-surface">
                              <span>{trip.source}</span>
                              <span className="material-symbols-outlined text-[16px] text-primary">arrow_right_alt</span>
                              <span>{trip.destination}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-on-surface font-medium">{tripVehicle || 'Unassigned'}</span>
                              <span className="text-xs text-on-surface-variant font-semibold">{tripDriver || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isDispatched
                                ? 'bg-info/20 text-info border-info/30'
                                : trip.status === 'COMPLETED' || trip.status === 'Completed'
                                ? 'bg-success/20 text-success border-success/30'
                                : trip.status === 'CANCELLED' || trip.status === 'Cancelled'
                                ? 'bg-muted/20 text-muted border-outline-variant/30'
                                : 'bg-warning/20 text-warning border-warning/30'
                            }`}>
                              {trip.status === 'DISPATCHED' ? 'In Transit' : trip.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isDispatched ? (
                              user?.role === 'DISPATCHER' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenCompleteModal(trip)}
                                    className="px-2.5 py-1.5 bg-success text-on-success rounded font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleCancelTrip(trip.id)}
                                    className="px-2.5 py-1.5 border border-danger/30 text-danger hover:bg-danger/10 rounded font-bold text-xs transition-all cursor-pointer bg-transparent"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-on-surface-variant font-bold italic opacity-60">In Transit</span>
                              )
                            ) : (
                              <span className="text-sm text-on-surface">
                                {trip.eta || '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface m-0">Complete Dispatch</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  End Odometer Reading (km)
                </label>
                <input
                  type="number"
                  required
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Fuel Consumed (Liters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Revenue Generated (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={tripRevenue}
                  onChange={(e) => setTripRevenue(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-3 border border-border-subtle rounded-lg font-bold text-sm text-on-surface hover:bg-surface-variant transition-all cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-success text-on-success font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                >
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
