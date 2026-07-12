import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Drivers({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLicNum, setNewLicNum] = useState('');
  const [newLicCat, setNewLicCat] = useState('Heavy Truck');
  const [newExpiry, setNewExpiry] = useState(new Date().toISOString().split('T')[0]);
  const [newContact, setNewContact] = useState('');
  const [newSafety, setNewSafety] = useState('100');
  
  // List state
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = () => {
    setLoading(true);
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== 'All Statuses') params.status = statusFilter;

    api.getDrivers(params)
      .then(data => {
        setDrivers(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDrivers();
  }, [searchTerm, statusFilter]);

  const handleAddDriver = (e) => {
    e.preventDefault();
    if (!newName || !newLicNum || !newContact) {
      alert('Name, License Number, and Contact Number are required!');
      return;
    }

    const payload = {
      name: newName,
      license_number: newLicNum,
      license_category: newLicCat,
      license_expiry_date: newExpiry,
      contact_number: newContact,
      safety_score: parseInt(newSafety) || 100,
      status: 'AVAILABLE'
    };

    api.createDriver(payload)
      .then(() => {
        alert('Driver profile successfully registered!');
        setShowAddModal(false);
        fetchDrivers();
        
        // Reset form
        setNewName('');
        setNewLicNum('');
        setNewLicCat('Heavy Truck');
        setNewContact('');
        setNewSafety('100');
      })
      .catch(err => {
        if (err.field === 'license_number') {
          alert('License Number already exists in the system!');
        } else {
          alert(err.detail || 'Failed to create driver profile.');
        }
      });
  };

  const handleUpdateSafetyScore = (id, currentScore, currentStatus) => {
    const scoreStr = prompt("Enter new safety score (0-100):", currentScore);
    if (scoreStr === null) return;
    const score = parseInt(scoreStr);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('Please enter a valid score between 0 and 100.');
      return;
    }

    let status = currentStatus;
    if (score < 50) {
      const confirmSuspend = confirm("Safety score is critically low. Do you want to SUSPEND this driver?");
      if (confirmSuspend) {
        status = 'SUSPENDED';
      }
    } else if (currentStatus === 'SUSPENDED') {
      const confirmReinstate = confirm("Re-instate suspended driver to AVAILABLE?");
      if (confirmReinstate) {
        status = 'AVAILABLE';
      }
    }

    api.updateSafetyScore(id, score, status)
      .then(() => {
        alert('Driver safety score updated.');
        fetchDrivers();
      })
      .catch(err => alert(err.detail || 'Failed to update safety score.'));
  };

  // Stats calculation
  const totalDrivers = drivers.length;
  const activeCount = drivers.filter(d => d.status === 'AVAILABLE' || d.status === 'ON_TRIP').length;
  const expiredLicenses = drivers.filter(d => !d.is_license_valid).length;

  return (
    <div className="flex-grow space-y-6">
      {/* Page Header Area */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-1">Driver Directory</h2>
          <p className="font-body-md text-sm text-on-surface-variant">Monitor credentials, compliance ratings, and safety scores.</p>
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
              placeholder="Search drivers, license or score..."
            />
          </div>

          <div className="flex bg-surface-container-low rounded-xl border border-border-subtle p-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-on-surface font-label-md text-xs focus:ring-0 cursor-pointer px-3 outline-none"
            >
              <option>All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ON_TRIP">ON TRIP</option>
              <option value="OFF_DUTY">OFF DUTY</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          {(user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:brightness-110 shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-stack-md">
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">Active Operators</p>
          <p className="text-3xl font-bold text-primary m-0">{activeCount || 110}</p>
        </div>
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">Licensing Alerts</p>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold m-0 ${expiredLicenses > 0 ? 'text-danger' : 'text-on-surface'}`}>{expiredLicenses || 2}</p>
            {expiredLicenses > 0 && (
              <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded font-bold uppercase">
                Action Required
              </span>
            )}
          </div>
        </div>
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">Compliance Rating</p>
          <p className="text-3xl font-bold text-success m-0">98.5%</p>
        </div>
        <div className="bg-surface-raised p-4 rounded-xl border border-border-subtle">
          <p className="text-on-surface-variant font-label-sm text-xs uppercase mb-2 font-semibold">Training Completion</p>
          <p className="text-3xl font-bold text-info m-0">100%</p>
        </div>
      </div>

      {/* Registry Table */}
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
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Driver Name</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">License ID</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Category</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Expiry Date</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Contact</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Safety Score</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-xs text-on-secondary-container">
                            {driver.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <span className="font-body-md text-sm text-on-surface font-semibold">{driver.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">{driver.license_number}</td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">{driver.license_category}</td>
                      <td className="px-6 py-4">
                        <span className={`font-body-md text-sm font-semibold ${driver.is_license_valid ? 'text-on-surface-variant' : 'text-danger'}`}>
                          {driver.license_expiry_date}
                          {!driver.is_license_valid && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-danger/10 text-danger border border-danger/25">
                              EXPIRED
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface-variant">{driver.contact_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-body-md text-sm font-bold ${driver.safety_score >= 90 ? 'text-success' : driver.safety_score >= 70 ? 'text-warning' : 'text-danger'}`}>
                            {driver.safety_score}
                          </span>
                          <div className="w-16 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${driver.safety_score >= 90 ? 'bg-success' : driver.safety_score >= 70 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${driver.safety_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            driver.status === 'AVAILABLE'
                              ? 'bg-success/15 text-success border-success/30'
                              : driver.status === 'ON_TRIP'
                              ? 'bg-info/15 text-info border-info/30'
                              : driver.status === 'SUSPENDED'
                              ? 'bg-danger/15 text-danger border-danger/30'
                              : 'bg-muted/15 text-on-surface-variant border-outline-variant/30'
                          }`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER') ? (
                          <button
                            onClick={() => handleUpdateSafetyScore(driver.id, driver.safety_score, driver.status)}
                            className="bg-transparent text-primary hover:brightness-110 px-3 py-1.5 rounded border border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold cursor-pointer"
                          >
                            Audit Score
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant font-bold italic opacity-60">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-on-surface-variant opacity-75">
                      No driver profiles found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface m-0">Add New Driver Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Driver Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Alex Mercer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    License Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newLicNum}
                    onChange={(e) => setNewLicNum(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                    placeholder="DL-992011A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Category
                  </label>
                  <select
                    value={newLicCat}
                    onChange={(e) => setNewLicCat(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Light Cargo">Light Cargo</option>
                    <option value="Hazmat">Hazmat</option>
                    <option value="Cold Chain">Cold Chain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Initial Safety Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSafety}
                    onChange={(e) => setNewSafety(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  required
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  placeholder="+1 455-0922"
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
                  Add Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
