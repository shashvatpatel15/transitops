import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Settings() {
  const [rbacUsers, setRbacUsers] = useState([
    { name: 'Raven K.', email: 'k.raven@transitops.com', role: 'Fleet Manager', status: 'Active', permissions: 'Full Admin Access' },
    { name: 'Marcus Thorne', email: 'm.thorne@transitops.com', role: 'Fleet Manager', status: 'Active', permissions: 'Manage Assets & Dispatch' },
    { name: 'Sarah Jenkins', email: 's.jenkins@transitops.com', role: 'Dispatcher', status: 'Active', permissions: 'Manage Trips Only' },
    { name: 'Jordan Lee', email: 'j.lee@transitops.com', role: 'Safety Officer', status: 'Active', permissions: 'Safety Compliance Auditor' }
  ]);

  const [settings, setSettings] = useState({
    autoNotify: true,
    strictDispatch: true,
    restrictHours: false,
    debugMode: false,
    currency: 'INR',
    distance_unit: 'km'
  });
  const [rbacMatrix, setRbacMatrix] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSettings(),
      api.getRbacMatrix()
    ]).then(([settingsData, matrixData]) => {
      setSettings(settingsData);
      setRbacMatrix(matrixData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    api.updateSettings(updated).catch(err => console.error(err));
  };

  const handleSave = (e) => {
    e.preventDefault();
    api.updateSettings(settings)
      .then(() => {
        alert('System settings configuration successfully synced with server!');
      })
      .catch(err => alert(err.detail || 'Failed to save settings.'));
  };

  return (
    <div className="flex-grow space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-3xl font-bold text-on-surface m-0">Settings &amp; RBAC</h2>
        <p className="font-body-md text-sm text-on-surface-variant mt-1 m-0">
          Configure security hierarchy, system preferences, and user role permission access.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Side: General Preference Settings */}
          <div className="lg:col-span-5 bento-card p-6 rounded-xl flex flex-col justify-between">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                <span className="material-symbols-outlined text-primary text-2xl">settings_applications</span>
                <h3 className="text-base font-bold text-on-surface m-0">Platform Preferences</h3>
              </div>

              {/* Toggle options */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-semibold m-0">Auto-notify CDL Renewals</p>
                    <p className="font-body-md text-xs text-on-surface-variant opacity-70 m-0">
                      Send automated alert notifications 30 days before expiration.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('autoNotify')}
                    className={`w-11 h-6 rounded-full transition-all relative border-none cursor-pointer ${settings.autoNotify ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-background absolute top-1 transition-all ${settings.autoNotify ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-semibold m-0">Strict Load Validation</p>
                    <p className="font-body-md text-xs text-on-surface-variant opacity-70 m-0">
                      Block dispatching of trips that exceed vehicle maximum weight limits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('strictDispatch')}
                    className={`w-11 h-6 rounded-full transition-all relative border-none cursor-pointer ${settings.strictDispatch ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-background absolute top-1 transition-all ${settings.strictDispatch ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-semibold m-0">Restrict Off-Hours Dispatch</p>
                    <p className="font-body-md text-xs text-on-surface-variant opacity-70 m-0">
                      Prevent scheduling of new dispatches between 10:00 PM and 4:00 AM.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('restrictHours')}
                    className={`w-11 h-6 rounded-full transition-all relative border-none cursor-pointer ${settings.restrictHours ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-background absolute top-1 transition-all ${settings.restrictHours ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-semibold m-0">Debug Event Logging</p>
                    <p className="font-body-md text-xs text-on-surface-variant opacity-70 m-0">
                      Log background transaction states and API response streams.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('debugMode')}
                    className={`w-11 h-6 rounded-full transition-all relative border-none cursor-pointer ${settings.debugMode ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-background absolute top-1 transition-all ${settings.debugMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-on-surface-variant font-bold uppercase mb-1.5">Currency</label>
                    <select
                      value={settings.currency || 'USD'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full bg-surface-container border border-border-subtle rounded px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant font-bold uppercase mb-1.5">Distance Unit</label>
                    <select
                      value={settings.distance_unit || 'km'}
                      onChange={(e) => setSettings({ ...settings, distance_unit: e.target.value })}
                      className="w-full bg-surface-container border border-border-subtle rounded px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      <option value="km">Kilometer (km)</option>
                      <option value="mi">Miles (mi)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer text-sm"
                >
                  Save Settings Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: RBAC Matrix List */}
          <div className="lg:col-span-7 bento-card p-6 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">shield_person</span>
                  <h3 className="text-base font-bold text-on-surface m-0">Role Permissions (RBAC)</h3>
                </div>
                <button
                  onClick={() => {
                    const name = prompt("Enter User Name:");
                    const email = prompt("Enter User Email:");
                    const role = prompt("Enter Role Title (e.g. Dispatcher):");
                    const permissions = prompt("Enter permission description:");
                    if (name && email && role) {
                      setRbacUsers([...rbacUsers, { name, email, role, status: 'Active', permissions: permissions || 'Read Access' }]);
                    }
                  }}
                  className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-on-primary transition-all rounded font-bold text-xs cursor-pointer bg-transparent"
                >
                  + Add User
                </button>
              </div>

              {/* Display Matrix static reference from server */}
              <div className="overflow-x-auto mb-6 bg-surface-container-low/40 rounded-lg p-4 border border-border-subtle/50">
                <h4 className="text-xs uppercase font-bold text-on-surface mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">table_chart</span>
                  RBAC Feature Scopes Matrix
                </h4>
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-on-surface-variant">
                      <th className="pb-2">Role</th>
                      <th className="pb-2 text-center">Fleet</th>
                      <th className="pb-2 text-center">Drivers</th>
                      <th className="pb-2 text-center">Trips</th>
                      <th className="pb-2 text-center">Maint.</th>
                      <th className="pb-2 text-center">Expenses</th>
                      <th className="pb-2 text-center">Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/40 text-on-surface">
                    {rbacMatrix.map((matrixRow, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-2 text-primary font-bold">{matrixRow.role}</td>
                        <td className="py-2 text-center uppercase">{matrixRow.fleet}</td>
                        <td className="py-2 text-center uppercase">{matrixRow.drivers}</td>
                        <td className="py-2 text-center uppercase">{matrixRow.trips}</td>
                        <td className="py-2 text-center uppercase">{matrixRow.maint}</td>
                        <td className="py-2 text-center uppercase">{matrixRow.fuel}</td>
                        <td className="py-2 text-center uppercase">{matrixRow.analytics}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase text-on-surface-variant font-bold border-b border-border-subtle/50 pb-2">
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5">Scope / Permissions</th>
                      <th className="py-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50 text-sm font-medium text-on-surface">
                    {rbacUsers.map((user, idx) => (
                      <tr key={idx} className="group hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="text-on-surface font-semibold">{user.name}</span>
                            <span className="text-xs text-on-surface-variant font-medium">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] uppercase font-bold text-primary">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-on-surface-variant">{user.permissions}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Remove access for ${user.name}?`)) {
                                setRbacUsers(rbacUsers.filter((_, i) => i !== idx));
                              }
                            }}
                            className="text-on-surface-variant hover:text-danger bg-transparent border-none cursor-pointer"
                            title="Revoke User Access"
                          >
                            <span className="material-symbols-outlined text-base block">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-border-subtle bg-primary/5 p-4 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
              <p className="font-body-md text-xs text-on-surface-variant m-0 leading-relaxed">
                <strong>Security Protocol Warning:</strong> Altering RBAC scopes triggers instance audit logs. Users must authenticate again if their roles are altered during active sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
