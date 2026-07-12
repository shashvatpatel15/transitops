import React, { useState } from 'react';
import { api } from '../services/api';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('FLEET_MANAGER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

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

    // Call DRF Auth Endpoint
    api.login(email, password, role)
      .then(res => {
        onLogin(res.user);
      })
      .catch(err => {
        // Map 403 lockout errors and standard error codes
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
    <div className="min-h-screen w-screen flex bg-background text-on-surface">
      {/* Left Panel: Branded Dark Panel */}
      <section className="hidden lg:flex flex-col w-[45%] relative bg-background p-stack-lg border-r border-border-subtle overflow-hidden">
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Brand Header */}
          <div className="flex items-center gap-stack-sm mb-stack-lg">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-on-primary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_shipping
              </span>
            </div>
            <div>
              <h1 className="font-headline-md text-2xl font-bold text-primary tracking-tight m-0">TransitOps</h1>
              <p className="font-label-sm text-xs text-on-surface-variant m-0 uppercase tracking-wider">
                Smart Transport Operations Platform
              </p>
            </div>
          </div>

          {/* Active Role Highlight Description */}
          <div className="my-auto bg-surface-container/40 p-6 rounded-xl border border-border-subtle mb-8">
            <span className="text-primary uppercase text-xs font-bold tracking-widest block mb-2">Active Role Context</span>
            <p className="text-body-lg text-on-surface-variant font-medium leading-relaxed m-0">{getRoleInfo()}</p>
          </div>

          {/* Value Proposition / Bento Legend */}
          <div className="mt-auto">
            <h2 className="font-headline-sm text-lg text-on-surface mb-stack-md font-semibold">Role-Based Access</h2>
            <div className="grid grid-cols-2 gap-stack-md">
              {/* Fleet Manager */}
              <div
                onClick={() => setRole('FLEET_MANAGER')}
                className={`bento-card p-4 rounded-xl cursor-pointer ${role === 'FLEET_MANAGER' ? 'border-primary bg-surface-raised/80' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">dashboard</span>
                  <span className="font-label-md text-sm text-on-surface font-semibold">Fleet Manager</span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant opacity-80 leading-normal">
                  Control asset registers, drivers, and operational dashboards.
                </p>
              </div>

              {/* Dispatcher */}
              <div
                onClick={() => setRole('DISPATCHER')}
                className={`bento-card p-4 rounded-xl cursor-pointer ${role === 'DISPATCHER' ? 'border-primary bg-surface-raised/80' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary text-lg">route</span>
                  <span className="font-label-md text-sm text-on-surface font-semibold">Dispatcher</span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant opacity-80 leading-normal">
                  Dispatch trips, calculate distance, and assign vehicles.
                </p>
              </div>

              {/* Safety Officer */}
              <div
                onClick={() => setRole('SAFETY_OFFICER')}
                className={`bento-card p-4 rounded-xl cursor-pointer ${role === 'SAFETY_OFFICER' ? 'border-primary bg-surface-raised/80' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-success text-lg">verified_user</span>
                  <span className="font-label-md text-sm text-on-surface font-semibold">Safety Officer</span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant opacity-80 leading-normal">
                  Audit safety scores, license expirations, and logs.
                </p>
              </div>

              {/* Financial Analyst */}
              <div
                onClick={() => setRole('FINANCIAL_ANALYST')}
                className={`bento-card p-4 rounded-xl cursor-pointer ${role === 'FINANCIAL_ANALYST' ? 'border-primary bg-surface-raised/80' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-tertiary text-lg">account_balance_wallet</span>
                  <span className="font-label-md text-sm text-on-surface font-semibold">Financial Analyst</span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant opacity-80 leading-normal">
                  Track operational fuel costs, toll costs, and ROIs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background image */}
        <div
          className="absolute -right-20 bottom-0 w-full h-1/2 opacity-25 pointer-events-none bg-no-repeat bg-contain bg-bottom"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzfzscs8fuVHNOPmRApJ9nXKDqm276HlZT1YGDEqu6WFcRHD-IWovmOIIBxYq790HNGYuTRa9FKlpqcQn5ZipIIgBUvDX51TxmhrC01dvhROV2sLt6yKJRD0KW4q2q1mZGOhI5Dv4XVBALb9Snxd5NwBwIkvthBE0PT1bYBiEnbGz2ywvoa_ibKOnCfSZHVc4y3Yszv7Xdp9buF89e-RsJCNrOHDvJvlmgKvtLt-el4byekcHTnl-cRQ')"
          }}
        />
      </section>

      {/* Right Panel: Authentication Form */}
      <main className="w-full lg:w-[55%] flex flex-col justify-center items-center bg-surface-container-lowest p-container-padding relative">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 blur-[120px] rounded-full"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-stack-lg text-center lg:text-left">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-2">Sign In</h2>
            <p className="font-body-lg text-base text-on-surface-variant">Access your operational command center.</p>
          </div>

          {/* Alert States */}
          <div className="space-y-stack-sm mb-stack-lg">
            {error && (
              <div className="bg-danger/10 border border-danger/20 p-3 rounded-lg flex items-center gap-3 animate-pulse">
                <span className="material-symbols-outlined text-danger text-sm">error</span>
                <p className="font-label-md text-sm text-danger m-0">{error}</p>
              </div>
            )}
            {warning && (
              <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-warning text-sm">lock_clock</span>
                <p className="font-label-md text-sm text-warning m-0">{warning}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-stack-md">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block">
                Operational Role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-on-surface appearance-none focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DISPATCHER">Dispatcher</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="k.raven@transitops.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block">Password</label>
                <span
                  onClick={() => alert('Hint: Please check your registered credentials in the database settings.')}
                  className="font-label-sm text-xs text-primary hover:underline cursor-pointer"
                >
                  Forgot password?
                </span>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-12 pr-12 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                defaultChecked
                className="w-4 h-4 rounded border-border-subtle bg-surface-raised text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label htmlFor="remember" className="font-body-md text-xs text-on-surface-variant cursor-pointer selection:bg-transparent">
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-stack-md"
              type="submit"
            >
              <span>Sign In</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <div className="mt-stack-lg pt-stack-lg border-t border-border-subtle text-center">
            <p className="font-body-md text-xs text-on-surface-variant">
              Enterprise instance. Authorized personnel only.
              <br />
              <span className="text-secondary hover:underline cursor-pointer" onClick={() => alert('Support line: support@transitops.com')}>
                Need technical assistance?
              </span>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="absolute bottom-8 text-center w-full">
          <p className="font-label-sm text-[10px] text-muted opacity-50 tracking-widest uppercase">
            SYSTEM VERSION 4.2.0-STABLE • SERVER: US-EAST-1
          </p>
        </footer>
      </main>
    </div>
  );
}
