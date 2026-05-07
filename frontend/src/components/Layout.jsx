import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, PiggyBank, HandCoins, AlertTriangle,
  CalendarCheck, BookOpen, BarChart3, Settings, LogOut,
  Menu, X, ChevronRight, Bell, Shield, ShieldCheck
} from 'lucide-react';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/members', label: 'Members', icon: Users, managerOnly: true },
  { to: '/app/savings', label: 'Savings', icon: PiggyBank },
  { to: '/app/loans', label: 'Loans', icon: HandCoins },
  { to: '/app/penalties', label: 'Penalties', icon: AlertTriangle },
  { to: '/app/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/app/accounting', label: 'Accounting', icon: BookOpen, managerOnly: true },
  { to: '/app/reports', label: 'Reports', icon: BarChart3, managerOnly: true },
  { to: '/app/settings', label: 'Settings', icon: Settings, managerOnly: true },
  { to: '/app/audit', label: 'Audit Trail', icon: Shield, managerOnly: true },
];

export default function Layout() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const visibleNav = navItems.filter((item) => !item.managerOnly || isManager);

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <PiggyBank size={28} />
            {sidebarOpen && <span>CommSave</span>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Role badge in sidebar */}
        {sidebarOpen && (
          <div className={`sidebar-role-badge ${isManager ? 'srb-manager' : 'srb-member'}`}>
            {isManager ? <ShieldCheck size={14} /> : <Users size={14} />}
            <span>{isManager ? 'Manager Portal' : 'Member Portal'}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? label : ''}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="nav-arrow" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className={`avatar ${isManager ? 'avatar-manager' : ''}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
          </div>
          <div className="topbar-right">
            <div className={`topbar-role ${isManager ? 'tr-manager' : 'tr-member'}`}>
              {isManager ? <ShieldCheck size={15} /> : <Users size={15} />}
              <span>{isManager ? 'Manager' : 'Member'}</span>
            </div>
            <button className="icon-btn" title="Notifications">
              <Bell size={20} />
            </button>
            <div className="topbar-user">
              <div className={`avatar sm ${isManager ? 'avatar-manager' : ''}`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user?.name}</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
