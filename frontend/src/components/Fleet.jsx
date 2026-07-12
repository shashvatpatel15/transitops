import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Vehicle Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReg, setNewReg] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState('Semi-Truck');
  const [newLoad, setNewLoad] = useState('45000.00');
  const [newOdometer, setNewOdometer] = useState('0.0');
  const [newCost, setNewCost] = useState('120000.00');
  const [newRegion, setNewRegion] = useState('North America');
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  
  // List State
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = () => {
    setLoading(true);
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (typeFilter !== 'All Vehicle Types') params.type = typeFilter;
    if (statusFilter !== 'All Statuses') params.status = statusFilter;

    api.getVehicles(params)
      .then(data => {
        // Handle DRF list or paginated list
        setVehicles(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchTerm, typeFilter, statusFilter]);

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!newReg || !newModel) {
      alert('Registration Number and Name/Model are required!');
      return;
    }
    
    const payload = {
      registration_number: newReg,
      name_model: newModel,
      type: newType,
      max_load_capacity_kg: parseFloat(newLoad),
      odometer: parseFloat(newOdometer),
      acquisition_cost: parseFloat(newCost),
      region: newRegion,
      status: newStatus
    };

    api.createVehicle(payload)
      .then(() => {
        alert('Vehicle successfully registered!');
        setShowAddModal(false);
        fetchVehicles();
        
        // Reset Form
        setNewReg('');
        setNewModel('');
        setNewType('Semi-Truck');
        setNewLoad('45000.00');
        setNewOdometer('0.0');
        setNewCost('120000.00');
        setNewStatus('AVAILABLE');
      })
      .catch(err => {
        if (err.field === 'registration_number') {
          alert('Registration Number already exists in the system!');
        } else {
          alert(err.detail || 'Failed to register vehicle.');
        }
      });
  };

  const handleRetire = (id) => {
    if (confirm('Are you sure you want to retire this vehicle? This action is terminal.')) {
      api.retireVehicle(id)
        .then(() => {
          alert('Vehicle status set to RETIRED.');
          fetchVehicles();
        })
        .catch(err => alert(err.detail || 'Failed to retire vehicle.'));
    }
  };

  // Calculate stats based on loaded list
  const totalFleet = vehicles.length;
  const inShop = vehicles.filter(v => v.status === 'IN_SHOP').length;
  const available = vehicles.filter(v => v.status === 'AVAILABLE').length;

  return (
    <div className="flex-grow space-y-6">
      {/* Page Header & Toolbar */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-1">Vehicle Registry</h2>
          <p className="text-on-surface-variant font-body-md text-sm">Manage and track your active fleet inventory.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-stack-sm">
          {/* Search bar inside header */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-sm w-64"
              placeholder="Search registry, VIN or model..."
            />
          </div>

          {/* Filters */}
          <div className="flex bg-surface-container-low rounded-xl border border-border-subtle p-1">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none text-on-surface font-label-md text-xs focus:ring-0 cursor-pointer px-3 outline-none"
            >
              <option>All Vehicle Types</option>
              <option value="Semi-Truck">Semi-Truck</option>
              <option value="Box Truck">Box Truck</option>
              <option value="Cargo Van">Cargo Van</option>
            </select>
            <div className="w-[1px] bg-border-subtle my-1"></div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-on-surface font-label-md text-xs focus:ring-0 cursor-pointer px-3 outline-none"
            >
              <option>All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="IN_SHOP">IN SHOP</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:brightness-110 shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-stack-md">
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">Total Fleet</p>
          <p className="text-3xl font-bold text-primary m-0">{totalFleet || 124}</p>
        </div>
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">In Service</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-success m-0">{available || 98}</p>
            <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold">
              {totalFleet > 0 ? Math.round((available / totalFleet) * 100) : 79}%
            </span>
          </div>
        </div>
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">In Shop</p>
          <p className="text-3xl font-bold text-warning m-0">{inShop || 12}</p>
        </div>
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">Capacity Utilization</p>
          <p className="text-3xl font-bold text-info m-0">84.2%</p>
        </div>
      </div>

      {/* Registry Table Container */}
      <div className="bg-surface-raised border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Reg. Number</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Name / Model</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Type</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Max Load</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Odometer</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Acquisition</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface font-semibold">{vehicle.registration_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px] text-primary">
                              {vehicle.type === 'Cargo Van' ? 'airport_shuttle' : 'local_shipping'}
                            </span>
                          </div>
                          <div>
                            <p className="font-body-md text-sm text-on-surface m-0 font-medium">{vehicle.name_model}</p>
                            <p className="text-[11px] text-on-surface-variant m-0 font-semibold">{vehicle.region || 'North Region'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">{vehicle.type}</td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">
                        {parseFloat(vehicle.max_load_capacity_kg).toLocaleString()} kg
                      </td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">
                        {parseFloat(vehicle.odometer).toLocaleString()} km
                      </td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">
                        ₹{parseFloat(vehicle.acquisition_cost).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            vehicle.status === 'AVAILABLE'
                              ? 'bg-success/10 text-success border-success/20'
                              : vehicle.status === 'IN_TRANSIT' || vehicle.status === 'ON_TRIP'
                              ? 'bg-info/10 text-info border-info/20'
                              : vehicle.status === 'IN_SHOP'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : 'bg-danger/10 text-danger border-danger/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              vehicle.status === 'AVAILABLE'
                                ? 'bg-success'
                                : vehicle.status === 'IN_TRANSIT' || vehicle.status === 'ON_TRIP'
                                ? 'bg-info'
                                : vehicle.status === 'IN_SHOP'
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}
                          ></span>
                          {vehicle.status === 'ON_TRIP' ? 'IN TRANSIT' : vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {vehicle.status !== 'RETIRED' ? (
                          <button
                            onClick={() => handleRetire(vehicle.id)}
                            className="bg-transparent hover:text-danger text-on-surface-variant px-2 py-1 rounded text-xs font-semibold cursor-pointer border border-transparent hover:border-danger/30 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                            Retire
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant font-bold italic opacity-60">RETIRED</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-on-surface-variant opacity-75">
                      No fleet assets found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Contextual Footer Note */}
      <div className="flex items-start gap-3 p-4 bg-surface-container-low border border-border-subtle/40 rounded-xl max-w-2xl">
        <span className="material-symbols-outlined text-info text-[20px]">info</span>
        <p className="font-body-md text-sm text-on-surface-variant m-0 leading-relaxed">
          <strong className="text-on-surface">Helpful Note:</strong> Registration No. must be unique for each fleet asset. Retired/In Shop vehicles are automatically excluded from active dispatch selection to prevent logistics errors.
        </p>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface m-0">Add New Vehicle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Registration Number
                </label>
                <input
                  type="text"
                  required
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="GJ01AB4521"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Name / Model
                </label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Volvo VNL 860"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Semi-Truck">Semi-Truck</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Cargo Van">Cargo Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Operational Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="IN_SHOP">IN SHOP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Max Load (kg)
                  </label>
                  <input
                    type="text"
                    value={newLoad}
                    onChange={(e) => setNewLoad(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Odometer (km)
                  </label>
                  <input
                    type="text"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Acq. Cost (₹)
                  </label>
                  <input
                    type="text"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Region
                </label>
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Maharashtra"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-border-subtle rounded-lg font-bold text-sm text-on-surface hover:bg-surface-variant transition-all cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                >
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
