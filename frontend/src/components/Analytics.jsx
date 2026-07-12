import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const [animate, setAnimate] = useState(false);
  const [costliestVehicles, setCostliestVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // DB Data states
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenances, setMaintenances] = useState([]);

  useEffect(() => {
    // Fetch all analytics and operational data on mount
    Promise.all([
      api.getCostliestVehicles().catch(err => {
        console.error("Costliest Vehicles failed:", err);
        return [];
      }),
      api.getTrips().catch(err => {
        console.error("Trips failed:", err);
        return [];
      }),
      api.getVehicles().catch(err => {
        console.error("Vehicles failed:", err);
        return [];
      }),
      api.getFuelLogs().catch(err => {
        console.error("Fuel Logs failed:", err);
        return [];
      }),
      api.getExpenses().catch(err => {
        console.error("Expenses failed:", err);
        return [];
      }),
      api.getMaintenance().catch(err => {
        console.error("Maintenance failed:", err);
        return [];
      })
    ]).then(([costliest, tripsData, vehiclesData, fuelData, expensesData, maintData]) => {
      setCostliestVehicles(costliest);
      setTrips(Array.isArray(tripsData) ? tripsData : tripsData.results || []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.results || []);
      setFuelLogs(Array.isArray(fuelData) ? fuelData : fuelData.results || []);
      setExpenses(Array.isArray(expensesData) ? expensesData : expensesData.results || []);
      setMaintenances(Array.isArray(maintData) ? maintData : maintData.results || []);
      setLoading(false);
      setAnimate(true);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleExportCSV = (reportType) => {
    api.exportCSV(reportType)
      .catch(err => alert("Failed to export CSV report: " + err.message));
  };

  // ─── DYNAMIC METRICS COMPUTATIONS ───
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  
  // 1. Fuel Efficiency
  const totalDistance = completedTrips.reduce((acc, t) => acc + parseFloat(t.planned_distance_km || 0), 0);
  const totalFuel = completedTrips.reduce((acc, t) => acc + parseFloat(t.fuel_consumed_liters || 0), 0);
  const fuelEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : '8.4';

  // 2. Fleet Utilization
  const activeVehicles = vehicles.filter(v => v.status === 'ON_TRIP' || v.status === 'IN_TRANSIT').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'IN_SHOP').length;
  const nonRetired = vehicles.filter(v => v.status !== 'RETIRED').length;
  const utilizationPct = nonRetired > 0 ? ((activeVehicles + inShopVehicles) / nonRetired * 100).toFixed(1) : '0.0';

  // 3. Operational Cost
  const fuelCostSum = fuelLogs.reduce((acc, f) => acc + parseFloat(f.cost || 0), 0);
  const incidentalCostSum = expenses.reduce((acc, e) => acc + parseFloat(e.toll || 0) + parseFloat(e.maint || 0) + parseFloat(e.other || 0), 0);
  const maintCostSum = maintenances.reduce((acc, m) => acc + parseFloat(m.cost || 0), 0);
  const totalCost = fuelCostSum + incidentalCostSum + maintCostSum;
  const formattedCost = totalCost >= 10000000 
    ? `₹${(totalCost / 10000000).toFixed(2)}Cr` 
    : totalCost >= 100000 
      ? `₹${(totalCost / 100000).toFixed(1)}L`
      : `₹${totalCost.toLocaleString()}`;

  // 4. Vehicle ROI
  const totalRevenue = completedTrips.reduce((acc, t) => acc + parseFloat(t.revenue || 0), 0);
  const roiPct = totalCost > 0 ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(1) : '0.0';

  // ─── MONTHLY REVENUE CHART CALCULATIONS ───
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthlyStats = months.map(m => ({ month: m, actual: 0, projected: 0, val: '₹0' }));
  
  trips.forEach(t => {
    const dateStr = t.completed_at || t.created_at;
    if (!dateStr) return;
    const date = new Date(dateStr);
    const monthName = months[date.getMonth()];
    const stat = monthlyStats.find(s => s.month === monthName);
    if (stat) {
      const tripRev = parseFloat(t.revenue || 0);
      if (t.status === 'COMPLETED') {
        stat.actual += tripRev;
      }
      stat.projected += tripRev || (parseFloat(t.planned_distance_km || 0) * 30);
    }
  });

  const currentMonth = new Date().getMonth();
  const startMonthIdx = (currentMonth - 5 + 12) % 12;
  const displayMonths = [];
  for (let i = 0; i < 6; i++) {
    const idx = (startMonthIdx + i) % 12;
    const dm = { ...monthlyStats[idx] };
    dm.val = dm.actual >= 100000 ? `₹${(dm.actual / 100000).toFixed(1)}L` : `₹${dm.actual.toLocaleString()}`;
    displayMonths.push(dm);
  }

  const chartData = {
    labels: displayMonths.map(d => d.month),
    datasets: [
      {
        label: 'Actual',
        data: displayMonths.map(d => d.actual),
        backgroundColor: '#0062a3',
        borderRadius: 4,
      },
      {
        label: 'Projected',
        data: displayMonths.map(d => d.projected),
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(28, 27, 31, 0.95)',
        titleColor: '#e3e2e6',
        bodyColor: '#c7c6ca',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const rawVal = displayMonths[context.dataIndex].val;
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()} (${rawVal})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#c7c6ca',
          font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' }
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#c7c6ca',
          font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' }
        }
      }
    }
  };

  // ─── FLEET PERFORMANCE LOG GROUPING ───
  const groups = {};
  vehicles.forEach(v => {
    const type = v.type || 'Other';
    if (!groups[type]) {
      groups[type] = { type, vehicles: [], trips: [], fuelLogs: [], maintenances: [] };
    }
    groups[type].vehicles.push(v);
  });

  trips.forEach(t => {
    const vehicleReg = t.vehicle_details?.registration_number;
    if (!vehicleReg) return;
    const v = vehicles.find(veh => veh.registration_number === vehicleReg);
    if (v && groups[v.type]) {
      groups[v.type].trips.push(t);
    }
  });

  fuelLogs.forEach(f => {
    const vehicleReg = f.vehicle_details?.registration_number || f.vehicle;
    const v = vehicles.find(veh => veh.registration_number === vehicleReg);
    if (v && groups[v.type]) {
      groups[v.type].fuelLogs.push(f);
    }
  });

  maintenances.forEach(m => {
    const vehicleReg = m.vehicle_details?.registration_number;
    if (!vehicleReg) return;
    const v = vehicles.find(veh => veh.registration_number === vehicleReg);
    if (v && groups[v.type]) {
      groups[v.type].maintenances.push(m);
    }
  });

  const performanceData = Object.values(groups).map(g => {
    const completed = g.trips.filter(t => t.status === 'COMPLETED');
    const dist = completed.reduce((acc, t) => acc + parseFloat(t.planned_distance_km || 0), 0);
    const fuel = completed.reduce((acc, t) => acc + parseFloat(t.fuel_consumed_liters || 0), 0);
    const avgFuel = fuel > 0 ? (dist / fuel).toFixed(1) : '—';

    const active = g.vehicles.filter(v => v.status === 'ON_TRIP' || v.status === 'IN_TRANSIT').length;
    const inShop = g.vehicles.filter(v => v.status === 'IN_SHOP').length;
    const nonRet = g.vehicles.filter(v => v.status !== 'RETIRED').length;
    const util = nonRet > 0 ? Math.round(((active + inShop) / nonRet) * 100) : 0;

    const totalMaintCost = g.maintenances.reduce((acc, m) => acc + parseFloat(m.cost || 0), 0);
    const revenue = completed.reduce((acc, t) => acc + parseFloat(t.revenue || 0), 0);

    return {
      groupName: g.type,
      avgFuel: avgFuel !== '—' ? `${avgFuel} km/L` : '—',
      utilization: `${util}%`,
      totalMiles: `${dist.toLocaleString()} km`,
      maintSpend: `₹${totalMaintCost.toLocaleString()}`,
      revenue: `₹${revenue.toLocaleString()}`
    };
  });

  return (
    <div className="flex-grow space-y-6">
      {/* Page Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface m-0">Performance Reports</h2>
          <p className="font-body-md text-sm text-on-surface-variant m-0 mt-1">
            Real-time data synchronization from all fleet assets.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-xs font-semibold bg-transparent cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 30 Days
          </button>
          <select
            onChange={(e) => handleExportCSV(e.target.value)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded font-label-md text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer outline-none"
            defaultValue=""
          >
            <option value="" disabled>Export Report</option>
            <option value="fuel">Fuel Efficiency CSV</option>
            <option value="cost">Operational Cost CSV</option>
            <option value="roi">Vehicle ROI CSV</option>
            <option value="utilization">Fleet Utilization CSV</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bento-card p-6 rounded-xl border-l-4 border-l-primary">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Fuel Efficiency</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">{fuelEfficiency}</span>
            <span className="font-label-md text-xs text-on-surface-variant font-semibold">km/L</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">Sync Active</span>
          </div>
        </div>
        
        <div className="bento-card p-6 rounded-xl border-l-4 border-l-info">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Fleet Utilization</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">{utilizationPct}</span>
            <span className="font-label-md text-xs text-on-surface-variant font-semibold">%</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">Optimized</span>
          </div>
        </div>

        <div className="bento-card p-6 rounded-xl border-l-4 border-l-danger">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Operational Cost</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">{formattedCost}</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-on-surface-variant/70">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="font-label-sm text-[11px] font-semibold">Fuel + Maint + Incidental</span>
          </div>
        </div>

        <div className="bento-card p-6 rounded-xl border-l-4 border-l-success">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Vehicle ROI</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">{roiPct}</span>
            <span className="font-label-md text-xs text-on-surface-variant font-semibold">%</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">Overall Margin</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-8 bento-card p-6 rounded-xl overflow-hidden relative flex flex-col justify-between min-h-[400px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface m-0">Monthly Revenue</h3>
              <p className="font-body-md text-sm text-on-surface-variant m-0">Projected vs Actual revenue performance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="font-label-sm text-xs text-on-surface-variant font-semibold">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
                <span className="font-label-sm text-xs text-on-surface-variant font-semibold">Projected</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-[250px] w-full relative">
            {animate && <Bar data={chartData} options={chartOptions} />}
          </div>
          <div className="h-4"></div>
        </div>

        {/* Top Costliest Vehicles Horizontal Chart */}
        <div className="lg:col-span-4 bento-card p-6 rounded-xl flex flex-col justify-between min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <span className="material-symbols-outlined text-primary text-2xl animate-spin">sync</span>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface m-0">Costliest Vehicles</h3>
                <p className="font-body-md text-sm text-on-surface-variant mb-6 m-0">Highest maintenance & fuel spend</p>
                
                <div className="space-y-5">
                  {costliestVehicles.map((v, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between font-label-md text-xs font-semibold">
                        <span className="text-on-surface">{v.label}</span>
                        <span className="text-on-surface-variant">{v.cost}</span>
                      </div>
                      <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-danger h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: animate ? `${v.pct}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-border-subtle">
                <div className="flex items-start gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                  <p className="font-label-sm text-[10px] italic leading-relaxed m-0 opacity-70">
                    Vehicle ROI Calculation: (Total Revenue Generated - Total Operating Costs) / Total Operating Costs × 100
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detailed Stats Table Section */}
      <div className="bento-card rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-container-low/40">
          <h3 className="font-headline-sm text-base font-bold m-0">Fleet Performance Log</h3>
          <span className="px-3 py-1 bg-surface-container-highest border border-border-subtle rounded text-[10px] font-bold text-on-surface-variant">
            Showing {performanceData.length} entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-xs border-b border-border-subtle">
              <tr>
                <th className="p-4 font-bold">Vehicle Group</th>
                <th className="p-4 text-center font-bold">Avg Fuel</th>
                <th className="p-4 text-center font-bold">Utilization</th>
                <th className="p-4 text-center font-bold">Total Distance</th>
                <th className="p-4 text-right font-bold">Maint. Spend</th>
                <th className="p-4 text-right font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border-subtle font-medium">
              {performanceData.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-container-high transition-colors">
                  <td className="p-4 text-on-surface">{row.groupName}s</td>
                  <td className="p-4 text-center text-on-surface-variant">{row.avgFuel}</td>
                  <td className="p-4 text-center text-on-surface-variant">{row.utilization}</td>
                  <td className="p-4 text-center text-on-surface-variant">{row.totalMiles}</td>
                  <td className="p-4 text-right text-on-surface-variant">{row.maintSpend}</td>
                  <td className="p-4 text-right text-success font-bold">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
