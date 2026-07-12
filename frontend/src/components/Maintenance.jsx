import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Maintenance() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceType, setServiceType] = useState('Oil & Filter Change');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('OPEN');
  const [selectedRow, setSelectedRow] = useState(null);

  // Lists loaded from API
  const [vehicles, setVehicles] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehiclesAndLogs = () => {
    setLoading(true);
    Promise.all([
      api.getVehicles(),
      api.getMaintenance()
    ]).then(([vehiclesData, logsData]) => {
      // Handle array or DRF object
      const vList = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.results || [];
      const lList = Array.isArray(logsData) ? logsData : logsData.results || [];
      
      setVehicles(vList);
      setServiceLogs(lList);
      
      if (vList.length > 0) {
        setSelectedVehicle(vList[0].id);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchVehiclesAndLogs();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedVehicle || !cost) {
      alert('Please fill in all fields.');
      return;
    }

    const payload = {
      vehicle_id: parseInt(selectedVehicle),
      service_type: serviceType,
      cost: parseFloat(cost),
      date: date,
      status: status
    };

    api.createMaintenance(payload)
      .then(() => {
        alert('Service log entry successfully saved.');
        setCost('');
        fetchVehiclesAndLogs();
      })
      .catch(err => alert(err.detail || 'Failed to save maintenance log.'));
  };

  const handleCloseMaintenance = (id) => {
    if (confirm('Close this maintenance log? This will set the vehicle back to Available.')) {
      api.closeMaintenance(id)
        .then(() => {
          alert('Maintenance log CLOSED.');
          fetchVehiclesAndLogs();
        })
        .catch(err => alert(err.detail || 'Failed to close log.'));
    }
  };

  const handleRowClick = (index) => {
    setSelectedRow(index);
  };

  return (
    <div className="flex-1 space-y-6 relative pb-[80px]">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-1">Maintenance Management</h2>
        <p className="font-body-md text-sm text-on-surface-variant">Log records, manage inspections, and audit downtime configurations.</p>
      </div>

      <div className="grid grid-cols-12 gap-stack-md">
        {/* Left Column: Log Service Record */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-stack-md">
          <section className="bg-surface-raised border border-border-subtle rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-2xl">history_edu</span>
              <h2 className="font-headline-sm text-lg font-bold text-on-surface m-0">Log Service Record</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Vehicle</label>
                <div className="relative">
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none appearance-none outline-none"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Service Type</label>
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none appearance-none outline-none"
                  >
                    <option>Oil & Filter Change</option>
                    <option>Brake Inspection</option>
                    <option>Tire Rotation/Replacement</option>
                    <option>Engine Diagnostic</option>
                    <option>Transmission Service</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Status</label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="radio"
                      name="status"
                      value="CLOSED"
                      checked={status === 'CLOSED'}
                      onChange={() => setStatus('CLOSED')}
                      className="sr-only peer"
                    />
                    <div className="w-full py-3 text-center rounded-lg border border-border-subtle bg-surface-container peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary cursor-pointer transition-all font-semibold text-sm">
                      Closed
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      name="status"
                      value="OPEN"
                      checked={status === 'OPEN'}
                      onChange={() => setStatus('OPEN')}
                      className="sr-only peer"
                    />
                    <div className="w-full py-3 text-center rounded-lg border border-border-subtle bg-surface-container peer-checked:bg-warning/20 peer-checked:border-warning peer-checked:text-warning cursor-pointer transition-all font-semibold text-sm">
                      Open (In Shop)
                    </div>
                  </label>
                </div>
              </div>

              <button className="w-full py-4 bg-primary hover:brightness-110 text-on-primary font-extrabold rounded-lg active:scale-[0.99] transition-all border-none cursor-pointer mt-4" type="submit">
                Save Service Entry
              </button>
            </form>
          </section>

          {/* Status Logic Diagram */}
          <section className="bg-surface-container-low border border-border-subtle border-dashed rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-info text-sm">info</span>
              <h3 className="font-label-md text-xs font-bold text-on-surface uppercase tracking-widest m-0">Logic: Operational State</h3>
            </div>
            <div className="flex flex-col items-center justify-between gap-6 py-2">
              <div className="flex items-center justify-center gap-8 w-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-success/20 border border-success flex items-center justify-center">
                    <span className="material-symbols-outlined text-success text-2xl font-bold">check_circle</span>
                  </div>
                  <span className="text-[11px] font-bold text-success uppercase">Available</span>
                </div>
                <div className="flex-1 h-[1px] bg-border-subtle relative flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl absolute bg-surface-container-low px-2">swap_horiz</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-danger/20 border border-danger flex items-center justify-center">
                    <span className="material-symbols-outlined text-danger text-2xl font-bold">construction</span>
                  </div>
                  <span className="text-[11px] font-bold text-danger uppercase">In Shop</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant text-center px-4 italic leading-relaxed m-0">
                "Note: Vehicles toggled to <span className="text-danger font-bold">In Shop</span> are automatically off-boarded from the dispatch queue and trip planning algorithms."
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Service Log Table */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden">
          <section className="bg-surface-raised border border-border-subtle rounded-xl flex flex-col h-full shadow-sm">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-container-low/50">
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-on-surface m-0">Service Log</h2>
                <p className="text-body-md text-sm text-on-surface-variant m-0">Fleet-wide maintenance history</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-surface-container border border-border-subtle rounded-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors font-semibold text-xs text-on-surface cursor-pointer" onClick={fetchVehiclesAndLogs}>
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[580px]">
              {loading ? (
                <div className="flex justify-center p-12">
                  <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-raised z-10 border-b border-border-subtle">
                    <tr>
                      <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Date</th>
                      <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Vehicle</th>
                      <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Service Type</th>
                      <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Cost</th>
                      <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest font-bold">Status</th>
                      <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-widest text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {serviceLogs.map((log, index) => {
                      const isClosed = log.status === 'CLOSED';
                      const vehicleReg = log.vehicle_details ? log.vehicle_details.registration_number : log.vehicle;

                      return (
                        <tr
                          key={log.id || index}
                          onClick={() => handleRowClick(index)}
                          className={`hover:bg-surface-container-high transition-colors cursor-pointer group ${selectedRow === index ? 'bg-surface-container-high' : ''}`}
                        >
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface font-semibold">{log.date}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${!isClosed ? 'bg-danger animate-pulse' : 'bg-success'}`}></div>
                              <span className="font-body-md text-sm text-on-surface">{vehicleReg}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface font-medium">{log.service_type}</td>
                          <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">
                            ₹{parseFloat(log.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                isClosed
                                  ? 'bg-success/20 text-success'
                                  : 'bg-warning/20 text-warning'
                              }`}
                            >
                              {log.status === 'CLOSED' ? 'Completed' : 'Open (In Shop)'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isClosed ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCloseMaintenance(log.id); }}
                                className="bg-success text-on-success font-bold text-xs px-2.5 py-1 rounded hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer"
                              >
                                Close Log
                              </button>
                            ) : (
                              <span className="text-xs text-on-surface-variant font-bold italic opacity-60">CLOSED</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => {
            const vIndex = prompt("Enter Vehicle Database ID:");
            const type = prompt("Enter Service Type (e.g. Engine Diagnostic):");
            const amt = prompt("Enter Cost Amount ($):");
            if (vIndex && type && amt) {
              api.createMaintenance({
                vehicle_id: parseInt(vIndex),
                service_type: type,
                cost: parseFloat(amt),
                date: new Date().toISOString().split('T')[0],
                status: 'OPEN'
              }).then(() => {
                alert(`Reported diagnostic alert for vehicle #${vIndex}!`);
                fetchVehiclesAndLogs();
              }).catch(err => alert(err.detail || 'Failed to submit service alert.'));
            }
          }}
          className="bg-primary hover:scale-110 active:scale-95 text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform cursor-pointer border-none"
          title="Quick Report Issue"
        >
          <span className="material-symbols-outlined text-3xl">build</span>
        </button>
      </div>
    </div>
  );
}
