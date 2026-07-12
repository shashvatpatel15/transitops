import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Fleet from './components/Fleet';
import Drivers from './components/Drivers';
import Trips from './components/Trips';
import Maintenance from './components/Maintenance';
import FuelExpenses from './components/FuelExpenses';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null); // { role: 'FLEET_MANAGER', email: '...' }
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, fleet, drivers, trips, maintenance, fuel, analytics, settings
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLightTheme, setIsLightTheme] = useState(false);

  const toggleTheme = () => {
    const nextVal = !isLightTheme;
    setIsLightTheme(nextVal);
    document.documentElement.classList.toggle('light', nextVal);
  };

  useEffect(() => {
    // Restore session on mount
    api.getMe()
      .then(currentUser => {
        setUser(currentUser);
        if (currentUser.role === 'SAFETY_OFFICER') {
          setActiveTab('drivers');
        } else {
          setActiveTab('dashboard');
        }
      })
      .catch(() => {
        // No active session
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    if (userInfo.role === 'SAFETY_OFFICER') {
      setActiveTab('drivers');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of the session?')) {
      api.logout().finally(() => {
        setUser(null);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
          <span className="font-label-sm text-sm uppercase tracking-widest text-on-surface-variant font-bold">Synchronizing Instance...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render the Login/Authentication page
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Map role slug to readable name
  const getRoleLabel = () => {
    switch (user.role) {
      case 'FLEET_MANAGER':
        return 'Fleet Manager';
      case 'DISPATCHER':
        return 'Dispatcher';
      case 'SAFETY_OFFICER':
        return 'Safety Officer';
      case 'FINANCIAL_ANALYST':
        return 'Financial Analyst';
      default:
        return 'Operator';
    }
  };

  // Search input placeholder based on active tab
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'fleet':
        return 'Search registry, VIN or model...';
      case 'drivers':
        return 'Search drivers, license or score...';
      case 'trips':
        return 'Search trips, drivers, or vehicles...';
      case 'maintenance':
        return 'Search maintenance logs or vehicles...';
      case 'fuel':
        return 'Search fleet or transactions...';
      default:
        return 'Search fleet, trips, or drivers...';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onViewChange={setActiveTab} />;
      case 'fleet':
        return <Fleet user={user} />;
      case 'drivers':
        return <Drivers user={user} />;
      case 'trips':
        return <Trips user={user} />;
      case 'maintenance':
        return <Maintenance user={user} />;
      case 'fuel':
        return <FuelExpenses onViewChange={setActiveTab} />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={setActiveTab} />;
    }
  };

  const isTabAllowed = (tabName) => {
    if (!user || !user.role) return false;
    switch (user.role) {
      case 'FLEET_MANAGER':
        // ✓ Fleet, ✓ Drivers, — Trips, — Fuel/Exp, ✓ Analytics
        return ['dashboard', 'fleet', 'drivers', 'analytics', 'settings'].includes(tabName);
      case 'DISPATCHER':
        // View Fleet, — Drivers, ✓ Trips, — Fuel/Exp, — Analytics
        return ['dashboard', 'fleet', 'trips', 'settings'].includes(tabName);
      case 'SAFETY_OFFICER':
        // — Fleet, ✓ Drivers, View Trips, — Fuel/Exp, — Analytics
        return ['drivers', 'trips', 'settings'].includes(tabName);
      case 'FINANCIAL_ANALYST':
        // View Fleet, — Drivers, — Trips, ✓ Fuel/Exp, ✓ Analytics
        return ['dashboard', 'fleet', 'fuel', 'analytics', 'settings'].includes(tabName);
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* SideNavBar */}
      <aside className="w-sidebar-width h-screen fixed left-0 top-0 bg-surface-container border-r border-outline-variant flex flex-col py-stack-md z-40">
        <div className="px-6 mb-8">
          <h1 className="font-headline-md text-xl font-bold text-primary m-0">TransitOps</h1>
          <p className="font-body-md text-xs text-on-surface-variant opacity-70 m-0 uppercase tracking-wider">Fleet Management</p>
        </div>

        <nav className="flex-1 space-y-1">
          {/* Dashboard */}
          {isTabAllowed('dashboard') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">dashboard</span>
              <span className="font-label-md text-sm font-semibold">Dashboard</span>
            </button>
          )}

          {/* Fleet */}
          {isTabAllowed('fleet') && (
            <button
              onClick={() => setActiveTab('fleet')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'fleet'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">local_shipping</span>
              <span className="font-label-md text-sm font-semibold">Fleet</span>
            </button>
          )}

          {/* Drivers */}
          {isTabAllowed('drivers') && (
            <button
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'drivers'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">person</span>
              <span className="font-label-md text-sm font-semibold">Drivers</span>
            </button>
          )}

          {/* Trips */}
          {isTabAllowed('trips') && (
            <button
              onClick={() => setActiveTab('trips')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'trips'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">route</span>
              <span className="font-label-md text-sm font-semibold">Trips</span>
            </button>
          )}

          {/* Maintenance */}
          {isTabAllowed('maintenance') && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">build</span>
              <span className="font-label-md text-sm font-semibold">Maintenance</span>
            </button>
          )}

          {/* Fuel & Expenses */}
          {isTabAllowed('fuel') && (
            <button
              onClick={() => setActiveTab('fuel')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'fuel'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">local_gas_station</span>
              <span className="font-label-md text-sm font-semibold">Fuel &amp; Expenses</span>
            </button>
          )}

          {/* Analytics */}
          {isTabAllowed('analytics') && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'analytics'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">analytics</span>
              <span className="font-label-md text-sm font-semibold">Analytics</span>
            </button>
          )}

          {/* Settings */}
          {isTabAllowed('settings') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center px-4 py-3 group transition-all text-left border-none cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined mr-3 block">settings</span>
              <span className="font-label-md text-sm font-semibold">Settings</span>
            </button>
          )}
        </nav>

        {user.role === 'DISPATCHER' && (
          <div className="px-4 mt-auto">
            <button
              onClick={() => setActiveTab('trips')}
              className="w-full bg-primary hover:brightness-110 text-on-primary py-3 px-4 rounded font-bold font-label-md text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[20px] block">add_task</span>
              New Dispatch
            </button>
          </div>
        )}
      </aside>

      {/* TopNavBar */}
      <header className="h-header-height fixed top-0 right-0 w-[calc(100%-240px)] z-30 bg-surface border-b border-outline-variant flex justify-between items-center px-container-padding">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative w-full max-w-md group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-border-subtle rounded-lg py-2 pl-10 pr-4 font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/50"
              placeholder={getSearchPlaceholder()}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all bg-transparent border-none cursor-pointer"
            onClick={toggleTheme}
            title={isLightTheme ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <span className="material-symbols-outlined block">
              {isLightTheme ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full relative transition-all bg-transparent border-none cursor-pointer"
            onClick={() => alert('Operational alerts are synchronized.')}
          >
            <span className="material-symbols-outlined block">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-surface"></span>
          </button>
          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all bg-transparent border-none cursor-pointer"
            onClick={() => alert('Help documents can be read in TransitOps Wiki.')}
          >
            <span className="material-symbols-outlined block">help</span>
          </button>

          <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>

          <div className="flex items-center gap-3 pl-2 cursor-pointer group" onClick={handleLogout} title="Click to log out">
            <div className="text-right">
              <p className="font-label-md text-sm font-bold text-on-surface m-0 group-hover:text-primary transition-colors">{user.first_name ? `${user.first_name} ${(user.last_name || '')[0] || ''}.` : user.email}</p>
              <p className="font-label-sm text-[10px] text-on-surface-variant opacity-70 m-0 uppercase tracking-wider">
                {getRoleLabel()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-primary/20 transition-transform group-hover:scale-105 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{(user.first_name || user.email || '?')[0].toUpperCase()}{(user.last_name || '')[0]?.toUpperCase() || ''}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-[240px] mt-[64px] p-container-padding min-h-[calc(100vh-64px)] flex-1 overflow-x-hidden flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
}
