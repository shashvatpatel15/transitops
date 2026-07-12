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

  useEffect(() => {
    // Fetch analytics on mount
    api.getCostliestVehicles()
      .then(data => {
        setCostliestVehicles(data);
        setLoading(false);
        setAnimate(true);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const monthlyData = [
    { month: 'JAN', projected: '60%', actual: '75%', val: '₹42L' },
    { month: 'FEB', projected: '65%', actual: '70%', val: '₹38L' },
    { month: 'MAR', projected: '80%', actual: '85%', val: '₹51L' },
    { month: 'APR', projected: '70%', actual: '90%', val: '₹58L' },
    { month: 'MAY', projected: '85%', actual: '80%', val: '₹47L' },
    { month: 'JUN', projected: '90%', actual: '95%', val: '₹62L' }
  ];

  const handleExportCSV = (reportType) => {
    api.exportCSV(reportType)
      .catch(err => alert("Failed to export CSV report: " + err.message));
  };

  const chartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Actual',
        data: monthlyData.map(d => parseFloat(d.actual.replace('%', ''))),
        backgroundColor: '#0062a3',
        borderRadius: 4,
      },
      {
        label: 'Projected',
        data: monthlyData.map(d => parseFloat(d.projected.replace('%', ''))),
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
            const rawVal = monthlyData[context.dataIndex].val;
            return `${context.dataset.label}: ${context.raw}% (${rawVal})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#c7c6ca',
          font: {
            family: 'Outfit, sans-serif',
            size: 10,
            weight: 'bold',
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#c7c6ca',
          font: {
            family: 'Outfit, sans-serif',
            size: 10,
            weight: 'bold',
          }
        }
      }
    }
  };

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
            <span className="font-headline-md text-2xl font-bold text-on-surface">8.4</span>
            <span className="font-label-md text-xs text-on-surface-variant font-semibold">MPG</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">12% vs last month</span>
          </div>
        </div>
        
        <div className="bento-card p-6 rounded-xl border-l-4 border-l-info">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Fleet Utilization</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">92.8</span>
            <span className="font-label-md text-xs text-on-surface-variant font-semibold">%</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">4.2% optimized</span>
          </div>
        </div>

        <div className="bento-card p-6 rounded-xl border-l-4 border-l-danger">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Operational Cost</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">₹1.42Cr</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-danger">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">2.1% increase</span>
          </div>
        </div>

        <div className="bento-card p-6 rounded-xl border-l-4 border-l-success">
          <p className="font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-semibold">Vehicle ROI</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-on-surface">18.5</span>
            <span className="font-label-md text-xs text-on-surface-variant font-semibold">%</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm text-[11px] font-semibold">Above target</span>
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
            Showing 3 of 124 entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-xs border-b border-border-subtle">
              <tr>
                <th className="p-4 font-bold">Vehicle Group</th>
                <th className="p-4 text-center font-bold">Avg Fuel (MPG)</th>
                <th className="p-4 text-center font-bold">Utilization</th>
                <th className="p-4 text-center font-bold">Total Miles</th>
                <th className="p-4 text-right font-bold">Maint. Spend</th>
                <th className="p-4 text-right font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border-subtle font-medium">
              <tr className="hover:bg-surface-container-high transition-colors">
                <td className="p-4 text-on-surface">Heavy-Duty Haulers</td>
                <td className="p-4 text-center text-on-surface-variant">7.2</td>
                <td className="p-4 text-center text-on-surface-variant">94%</td>
                <td className="p-4 text-center text-on-surface-variant">124,500</td>
                <td className="p-4 text-right text-on-surface-variant">₹4,250</td>
                <td className="p-4 text-right text-success font-bold">₹32,100</td>
              </tr>
              <tr className="bg-surface-container-lowest/20 hover:bg-surface-container-high transition-colors">
                <td className="p-4 text-on-surface">Regional Distribution</td>
                <td className="p-4 text-center text-on-surface-variant">9.8</td>
                <td className="p-4 text-center text-on-surface-variant">88%</td>
                <td className="p-4 text-center text-on-surface-variant">85,200</td>
                <td className="p-4 text-right text-on-surface-variant">₹2,100</td>
                <td className="p-4 text-right text-success font-bold">₹24,400</td>
              </tr>
              <tr className="hover:bg-surface-container-high transition-colors">
                <td className="p-4 text-on-surface">Last-Mile Couriers</td>
                <td className="p-4 text-center text-on-surface-variant">14.5</td>
                <td className="p-4 text-center text-on-surface-variant">82%</td>
                <td className="p-4 text-center text-on-surface-variant">42,800</td>
                <td className="p-4 text-right text-on-surface-variant">₹850</td>
                <td className="p-4 text-right text-success font-bold">₹18,200</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
