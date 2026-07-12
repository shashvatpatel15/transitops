import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('FLEET_MANAGER');
  const [email, setEmail] = useState('k.raven@transitops.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // Auto-fill credentials when role changes
  useEffect(() => {
    switch (role) {
      case 'FLEET_MANAGER':
        setEmail('k.raven@transitops.com');
        setPassword('password123');
        break;
      case 'DISPATCHER':
        setEmail('s.jenkins@transitops.com');
        setPassword('password123');
        break;
      case 'SAFETY_OFFICER':
        setEmail('j.lee@transitops.com');
        setPassword('password123');
        break;
      case 'FINANCIAL_ANALYST':
        setEmail('finance@transitops.com');
        setPassword('password123');
        break;
      default:
        break;
    }
  }, [role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    
    if (!role) {
      setError('Please select an operational role.');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    api.login(email, password, role)
      .then(res => {
        onLogin(res.user);
      })
      .catch(err => {
        if (err.status === 403 || err.error === 'LOCKED') {
          setError(err.detail || 'Account locked. Try again in 15 minutes.');
        } else {
          setError(err.detail || 'Invalid credentials. Please verify your information.');
        }
      });
  };

  const getRoleInfo = () => {
    switch (role) {
      case 'FLEET_MANAGER':
        return 'Fleet Manager: Full administrative control over vehicle lifecycle and global logistics strategy.';
      case 'DISPATCHER':
        return 'Dispatcher: Real-time route optimization, driver assignment, and active trip monitoring.';
      case 'SAFETY_OFFICER':
        return 'Safety Officer: Compliance tracking, incident reporting, and driver behavior analytics.';
      case 'FINANCIAL_ANALYST':
        return 'Financial Analyst: Fuel spend audits, maintenance ROI, and operational cost forecasting.';
      default:
        return 'Select a role to see its description.';
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#0A0E1A] text-on-surface">
      {/* Left Panel: Branded Dark Panel */}
      <section className="hidden lg:flex flex-col w-[45%] relative bg-[#0D1527] p-12 border-r border-[#1E293B] overflow-hidden justify-between">
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_shipping
              </span>
            </div>
            <div>
              <h1 className="font-headline-md text-3xl font-extrabold text-white tracking-tight m-0">TransitOps</h1>
              <p className="font-label-sm text-[10px] text-primary-light m-0 uppercase tracking-widest font-bold">
                Smart Transport Operations Platform
              </p>
            </div>
          </div>

          {/* Active Role Highlight Description */}
          <div className="my-auto bg-[#131F37] p-8 rounded-2xl border border-[#233554] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <span className="text-primary uppercase text-xs font-bold tracking-widest block mb-2">Active Role Context</span>
            <p className="text-body-lg text-on-surface-variant font-medium leading-relaxed m-0 text-gray-300">{getRoleInfo()}</p>
          </div>

          {/* Value Proposition / Bento Legend */}
          <div className="mt-auto">
            <h2 className="font-headline-sm text-base text-gray-400 mb-4 font-bold tracking-wider uppercase">System Capabilities</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Fleet Manager */}
              <div
                onClick={() => setRole('FLEET_MANAGER')}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  role === 'FLEET_MANAGER' 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                    : 'border-[#1E293B] bg-[#111A2E] hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-primary text-base">dashboard</span>
                  <span className="font-label-md text-xs text-white font-bold">Fleet Management</span>
                </div>
                <p className="font-body-md text-[10px] text-gray-400 leading-relaxed">
                  Asset register control, analytics dashboards, and system config.
                </p>
              </div>

              {/* Dispatcher */}
              <div
                onClick={() => setRole('DISPATCHER')}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  role === 'DISPATCHER' 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                    : 'border-[#1E293B] bg-[#111A2E] hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-secondary text-base">route</span>
                  <span className="font-label-md text-xs text-white font-bold">Smart Dispatch</span>
                </div>
                <p className="font-body-md text-[10px] text-gray-400 leading-relaxed">
                  AI dispatch optimization, route calculation, and driver tracking.
                </p>
              </div>

              {/* Safety Officer */}
              <div
                onClick={() => setRole('SAFETY_OFFICER')}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  role === 'SAFETY_OFFICER' 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                    : 'border-[#1E293B] bg-[#111A2E] hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-success text-base">verified_user</span>
                  <span className="font-label-md text-xs text-white font-bold">Safety & Audit</span>
                </div>
                <p className="font-body-md text-[10px] text-gray-400 leading-relaxed">
                  Compliance tracking, driver safety scores, and logs auditing.
                </p>
              </div>

              {/* Financial Analyst */}
              <div
                onClick={() => setRole('FINANCIAL_ANALYST')}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  role === 'FINANCIAL_ANALYST' 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                    : 'border-[#1E293B] bg-[#111A2E] hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-tertiary text-base">account_balance_wallet</span>
                  <span className="font-label-md text-xs text-white font-bold">Financial Analytics</span>
                </div>
                <p className="font-body-md text-[10px] text-gray-400 leading-relaxed">
                  Audit fuel costs, compute ROI metrics, and export cost reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background grid and transit routing network visual effect */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <g stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.7">
              <path d="M50,150 Q120,80 200,180 T350,90 T480,220" />
              <path d="M30,380 Q180,310 320,420 T520,310" />
              <path d="M120,40 Q240,160 380,80 T490,280" />
            </g>
            <g fill="#38bdf8">
              <circle cx="50" cy="150" r="4.5" />
              <circle cx="120" cy="80" r="3.5" />
              <circle cx="200" cy="180" r="5" />
              <circle cx="350" cy="90" r="4.5" />
              <circle cx="480" cy="220" r="5" />
              <circle cx="30" cy="380" r="4.5" />
              <circle cx="180" cy="310" r="4" />
              <circle cx="320" cy="420" r="5" />
              <circle cx="520" cy="310" r="4.5" />
              <circle cx="120" cy="40" r="3.5" />
              <circle cx="240" cy="160" r="4.5" />
              <circle cx="380" cy="80" r="4" />
              <circle cx="490" cy="280" r="5" />
            </g>
          </svg>
        </div>
      </section>

      {/* Right Panel: Authentication Form */}
      <main className="w-full lg:w-[55%] flex flex-col justify-center items-center bg-[#070B14] p-8 lg:p-16 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#0F172A]/80 backdrop-blur-xl border border-[#1E293B] p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="font-headline-lg text-3xl font-extrabold text-white mb-2 tracking-tight">Sign In</h2>
            <p className="font-body-lg text-sm text-gray-400">Access your operational command center.</p>
          </div>

          {/* Alert States */}
          <div className="space-y-3 mb-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 p-3.5 rounded-xl flex items-center gap-3 animate-[shake_0.4s_ease-in-out]">
                <span className="material-symbols-outlined text-danger text-sm">error</span>
                <p className="font-label-md text-xs text-danger m-0 font-semibold">{error}</p>
              </div>
            )}
            {warning && (
              <div className="bg-warning/10 border border-warning/20 p-3.5 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-warning text-sm">lock_clock</span>
                <p className="font-label-md text-xs text-warning m-0 font-semibold">{warning}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Segmented Grid Role Selector */}
            <div className="space-y-2">
              <label className="font-label-sm text-xs text-gray-400 uppercase tracking-widest font-bold block">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'FLEET_MANAGER', label: 'Manager', icon: 'dashboard' },
                  { id: 'DISPATCHER', label: 'Dispatcher', icon: 'route' },
                  { id: 'SAFETY_OFFICER', label: 'Safety', icon: 'verified_user' },
                  { id: 'FINANCIAL_ANALYST', label: 'Finance', icon: 'account_balance_wallet' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs border transition-all duration-200 cursor-pointer ${
                      role === item.id
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                        : 'bg-[#1E293B]/40 border-[#334155]/60 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label-sm text-xs text-gray-400 uppercase tracking-widest font-bold block">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm placeholder:text-gray-600"
                  placeholder="name@transitops.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-label-sm text-xs text-gray-400 uppercase tracking-widest font-bold block">Password</label>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl pl-11 pr-12 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm placeholder:text-gray-600"
                  placeholder="••••••••"
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-6 cursor-pointer border-none"
              type="submit"
            >
              <span className="text-sm">Enter Command Center</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          {/* Demonstration Notice */}
          <div className="mt-6 pt-6 border-t border-[#1E293B] text-center">
            <p className="font-body-md text-[11px] text-gray-500 m-0 leading-relaxed">
              💡 Selecting a role auto-fills the correct credentials.
              <br />
              Authorized Personnel Only.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="absolute bottom-6 text-center w-full">
          <p className="font-label-sm text-[9px] text-gray-600 tracking-widest uppercase m-0">
            SYSTEM VERSION 4.2.0-STABLE • SECURE LOGISTICS PROTOCOL
          </p>
        </footer>
      </main>
    </div>
  );
}
