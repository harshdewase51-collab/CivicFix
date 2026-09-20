import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import { 
  ShieldCheck, 
  LogOut, 
  PlusCircle, 
  LayoutDashboard, 
  FileText, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-link" onClick={() => setMobileOpen(false)}>
          <div className="brand-icon-box">
            <ShieldCheck size={22} />
          </div>
          <span>CivicFix</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={17} /> Operations
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={17} /> Dashboard
                  </Link>
                  <Link
                    to="/reports"
                    className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                  >
                    <FileText size={17} /> My Reports
                  </Link>
                  <Link
                    to="/report"
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <PlusCircle size={15} /> Report Problem
                  </Link>
                </>
              )}

              {/* Profile Link with Avatar */}
              <Link
                to="/profile"
                className="user-badge"
                style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="View Profile & Settings"
              >
                <UserAvatar user={user} size={26} />
                <span>{user?.name}</span>
                <span className={`role-pill ${isAdmin ? 'admin' : ''}`}>
                  {user?.role}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign out"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/login"
                className={`btn btn-secondary btn-sm ${isActive('/login') ? 'active' : ''}`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <div className="mobile-toggle-wrapper">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="mobile-dropdown">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Appearance:</span>
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard size={18} /> Operations Center
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard size={18} /> My Civic Space
                  </Link>
                  <Link
                    to="/report"
                    className={`nav-link ${isActive('/report') ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <PlusCircle size={18} /> Report a Problem
                  </Link>
                  <Link
                    to="/reports"
                    className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <FileText size={18} /> My Reports
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <UserAvatar user={user} size={24} />
                <span>Profile & Settings ({user?.name})</span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', marginTop: '0.5rem' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/" className="nav-link" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link to="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
