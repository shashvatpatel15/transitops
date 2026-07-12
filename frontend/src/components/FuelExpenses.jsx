import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function FuelExpenses({ onViewChange }) {
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lists state
  const [fuelLogs, setFuelLogs] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);

  // Log Form states
  const [fuelVehicle, setFuelVehicle] = useState('TRK-204 (Kenworth T680)');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  const [expTrip, setExpTrip] = useState('');
  const [expVehicle, setExpVehicle] = useState('TRK-204');
  const [expToll, setExpToll] = useState('');
  const [expMaint, setExpMaint] = useState('');
  const [expOther, setExpOther] = useState('');
  const [expStatus, setExpStatus] = useState('Paid');

  const fetchFuelAndExpenses = () => {
    setLoading(true);
    Promise.all([
      api.getFuelLogs(),
      api.getExpenses()
    ]).then(([fuelData, expensesData]) => {
      setFuelLogs(Array.isArray(fuelData) ? fuelData : fuelData.results || []);
      setOtherExpenses(Array.isArray(expensesData) ? expensesData : expensesData.results || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFuelAndExpenses();
  }, []);

  const handleLogFuel = (e) => {
    e.preventDefault();
    if (!fuelLiters || !fuelCost) return;

    const payload = {
      vehicle: fuelVehicle,
      liters: parseFloat(fuelLiters),
      cost: parseFloat(fuelCost),
      date: new Date().toISOString().split('T')[0]
    };

    api.createFuelLog(payload)
      .then(() => {
        setShowFuelModal(false);
        setFuelLiters('');
        setFuelCost('');
        fetchFuelAndExpenses();
        alert('Fuel log registered successfully.');
      })
      .catch(err => alert(err.detail || 'Failed to log fuel.'));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expTrip) return;

    const payload = {
      trip_code: expTrip.startsWith('#') ? expTrip : `#${expTrip}`,
      vehicle: expVehicle,
      toll: parseFloat(expToll) || 0.00,
      maint: parseFloat(expMaint) || 0.00,
      other: parseFloat(expOther) || 0.00,
      status: expStatus,
      date: new Date().toISOString().split('T')[0]
    };

    api.createExpense(payload)
      .then(() => {
        setShowExpenseModal(false);
        setExpTrip('');
        setExpToll('');
        setExpMaint('');
        setExpOther('');
        fetchFuelAndExpenses();
        alert('Incidental expense registered successfully.');
      })
      .catch(err => alert(err.detail || 'Failed to register expense.'));
  };

  // Sticky footer calculations based on fetched lists
  const fuelTotal = fuelLogs.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);
  const maintenanceTotal = otherExpenses.reduce((acc, curr) => acc + parseFloat(curr.maint || 0), 0);
  const incidentals = otherExpenses.reduce((acc, curr) => acc + parseFloat(curr.toll || 0) + parseFloat(curr.other || 0), 0);
  const grandTotal = fuelTotal + maintenanceTotal + incidentals;

  return (
    <div className="flex-grow space-y-6 relative pb-[120px]">
      {/* Dashboard Header Section */}
      <section className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-2xl font-bold text-on-surface m-0">Expense Overview</h2>
          <p className="font-body-md text-sm text-on-surface-variant m-0">Real-time fuel monitoring and operational spending.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
            <span className="font-label-md text-xs font-semibold text-on-surface">Oct 1 - Oct 31, 2023</span>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
        </div>
      ) : (
        <>
          {/* Fuel Logs Section */}
          <section className="glass-card rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">local_gas_station</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface m-0">Fuel Logs</h3>
              </div>
              <button
                onClick={() => setShowFuelModal(true)}
                className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-on-primary transition-all font-bold rounded-lg flex items-center gap-2 cursor-pointer text-xs bg-transparent"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                + Log Fuel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Vehicle</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Date</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Liters</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Cost</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {fuelLogs.map((log, idx) => {
                    const vehicleName = log.vehicle_details ? log.vehicle_details.name_model : log.vehicle;
                    return (
                      <tr key={log.id || idx} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">local_shipping</span>
                          </div>
                          <span className="font-body-md text-sm text-on-surface font-semibold">{vehicleName}</span>
                        </td>
                        <td className="px-6 py-4 font-body-md text-xs text-on-surface-variant">{log.date}</td>
                        <td className="px-6 py-4 font-body-md text-sm text-on-surface">{parseFloat(log.liters).toLocaleString()} L</td>
                        <td className="px-6 py-4 font-body-md text-sm font-bold text-primary">₹{parseFloat(log.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.status === 'Verified' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                            {log.status || 'Verified'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Other Expenses Section */}
          <section className="glass-card rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-info">receipt_long</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface m-0">Other Expenses</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-4 py-2 border border-border-subtle text-on-surface hover:bg-surface-container-highest transition-all font-bold rounded-lg flex items-center gap-2 cursor-pointer text-xs bg-transparent"
              >
                <span className="material-symbols-outlined text-[18px]">receipt</span>
                + Add Expense
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Trip ID</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Vehicle</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Toll</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Maint.</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Other</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Total</th>
                    <th className="px-6 py-4 font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {otherExpenses.map((exp, idx) => (
                    <tr key={exp.id || idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-body-md text-sm text-primary font-bold">{exp.trip_code || `#TP-${exp.id}`}</td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface">{exp.vehicle}</td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface">₹{parseFloat(exp.toll || 0).toFixed(2)}</td>
                      <td className={`px-6 py-4 font-body-md text-sm ${parseFloat(exp.maint || 0) > 0 ? 'text-warning font-semibold' : 'text-on-surface'}`}>
                        ₹{parseFloat(exp.maint || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-body-md text-sm text-on-surface">₹{parseFloat(exp.other || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 font-body-md text-sm font-bold text-on-surface">
                        ₹{(parseFloat(exp.toll || 0) + parseFloat(exp.maint || 0) + parseFloat(exp.other || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${exp.status === 'Paid' ? 'bg-success/10 text-success border-success/20' : 'bg-info/10 text-info border-info/20'}`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Sticky Footer Summary */}
      <footer className="fixed bottom-0 right-0 w-[calc(100%-240px)] bg-surface-container-lowest border-t border-outline-variant p-4 z-40 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between px-container-padding max-w-7xl mx-auto gap-4">
          <div className="flex flex-wrap gap-stack-lg justify-center sm:justify-start">
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Current Fuel Total</span>
              <span className="font-headline-sm text-lg text-primary font-bold">₹{fuelTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="hidden sm:block w-[1px] h-10 bg-outline-variant"></div>
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Maintenance Total</span>
              <span className="font-headline-sm text-lg text-on-surface font-bold">₹{maintenanceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="hidden sm:block w-[1px] h-10 bg-outline-variant"></div>
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Incidentals</span>
              <span className="font-headline-sm text-lg text-on-surface font-bold">₹{incidentals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 px-6 py-2.5 rounded-xl flex items-center gap-6">
            <div className="text-right">
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold m-0">Total Operational Cost</p>
              <p className="font-body-md text-on-surface-variant italic text-[9px] opacity-60 m-0">Fuel + Maintenance + Incidentals</p>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-headline-md text-xl text-primary font-extrabold tracking-tight">
                ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={() => onViewChange('analytics')}
              className="bg-primary hover:scale-105 active:scale-95 text-on-primary p-2 rounded-lg transition-transform border-none cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Fuel Log Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface m-0">Log Fuel Intake</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer">
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>
            <form onSubmit={handleLogFuel} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Vehicle</label>
                <select value={fuelVehicle} onChange={(e) => setFuelVehicle(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                  <option>TRK-204 (Kenworth T680)</option>
                  <option>TRK-112 (Freightliner)</option>
                  <option>TRK-405 (Volvo VNL)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Liters</label>
                  <input type="number" step="0.1" required value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="350"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Cost (₹)</label>
                  <input type="number" step="0.01" required value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="680.00"/>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowFuelModal(false)} className="flex-1 py-3 border border-border-subtle rounded-lg font-bold text-sm text-on-surface hover:bg-surface-variant transition-all bg-transparent cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer">Log Fuel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border-subtle rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-low flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface m-0">Add Incidental Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer">
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Trip ID</label>
                  <input type="text" required value={expTrip} onChange={(e) => setExpTrip(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="TP-9410"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Vehicle</label>
                  <input type="text" required value={expVehicle} onChange={(e) => setExpVehicle(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="TRK-204"/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Tolls (₹)</label>
                  <input type="number" step="0.01" value={expToll} onChange={(e) => setExpToll(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-2 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="50.00"/>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Maint. (₹)</label>
                  <input type="number" step="0.01" value={expMaint} onChange={(e) => setExpMaint(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-2 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="0.00"/>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">Other (₹)</label>
                  <input type="number" step="0.01" value={expOther} onChange={(e) => setExpOther(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-2 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="20.00"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Status</label>
                <select value={expStatus} onChange={(e) => setExpStatus(e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                  <option value="Paid">Paid</option>
                  <option value="In Review">In Review</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 border border-border-subtle rounded-lg font-bold text-sm text-on-surface hover:bg-surface-variant transition-all cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
