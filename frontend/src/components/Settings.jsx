import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Settings() {
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load setting fallbacks from backend on mount
    api.getSettings()
      .then(settingsData => {
        if (settingsData.currency) {
          setCurrency(settingsData.currency === 'INR' ? 'INR (Rs)' : settingsData.currency);
        }
        if (settingsData.distance_unit) {
          setDistanceUnit(settingsData.distance_unit === 'km' ? 'Kilometers' : settingsData.distance_unit);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const backendPayload = {
      currency: currency.includes('INR') ? 'INR' : currency,
      distance_unit: distanceUnit.toLowerCase().includes('kilo') ? 'km' : distanceUnit
    };
    api.updateSettings(backendPayload)
      .then(() => {
        alert('System settings changes successfully saved!');
      })
      .catch(err => alert(err.detail || 'Failed to save settings.'));
  };

  return (
    <div className="flex-grow space-y-6">
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Side: General Preference Settings */}
          <div className="lg:col-span-5 bento-card p-6 rounded-xl flex flex-col justify-between">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="pb-4">
                <h3 className="text-lg font-bold text-on-surface uppercase tracking-wider m-0">General</h3>
              </div>

              <div className="space-y-5">
                {/* Depot Name */}
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Depot Name</label>
                  <input
                    type="text"
                    required
                    value={depotName}
                    onChange={(e) => setDepotName(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none outline-none text-sm font-medium"
                    placeholder="Enter Depot Name"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Currency</label>
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none outline-none text-sm font-medium"
                    placeholder="e.g. INR (Rs)"
                  />
                </div>

                {/* Distance Unit */}
                <div className="space-y-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Distance Unit</label>
                  <input
                    type="text"
                    required
                    value={distanceUnit}
                    onChange={(e) => setDistanceUnit(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-lg py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none outline-none text-sm font-medium"
                    placeholder="e.g. Kilometers"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-auto px-6 py-3.5 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer text-sm shadow-md"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: RBAC Matrix */}
          <div className="lg:col-span-7 bento-card p-6 rounded-xl flex flex-col justify-between">
            <div>
              <div className="pb-4 mb-6">
                <h3 className="text-lg font-bold text-on-surface uppercase tracking-wider m-0">Role-Based Access (RBAC)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-medium border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-on-surface-variant uppercase font-label-sm text-xs">
                      <th className="pb-3 font-bold">Role</th>
                      <th className="pb-3 text-center font-bold">Fleet</th>
                      <th className="pb-3 text-center font-bold">Drivers</th>
                      <th className="pb-3 text-center font-bold">Trips</th>
                      <th className="pb-3 text-center font-bold">Fuel/Exp.</th>
                      <th className="pb-3 text-center font-bold">Analytics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50 text-on-surface">
                    <tr className="hover:bg-white/5">
                      <td className="py-4 font-bold text-on-surface">Fleet Manager</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="py-4 font-bold text-on-surface">Dispatcher</td>
                      <td className="py-4 text-center text-on-surface-variant/70 font-semibold">View</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="py-4 font-bold text-on-surface">Safety Officer</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                      <td className="py-4 text-center text-on-surface-variant/70 font-semibold">View</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                    </tr>
                    <tr className="hover:bg-white/5">
                      <td className="py-4 font-bold text-on-surface">Financial Analyst</td>
                      <td className="py-4 text-center text-on-surface-variant/70 font-semibold">View</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-on-surface-variant/40">—</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                      <td className="py-4 text-center text-primary font-extrabold">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
