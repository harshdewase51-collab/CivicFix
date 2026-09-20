import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, PlusCircle, LayoutDashboard, FileText, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon-box">
            <ShieldCheck size={22} />
          </div>
          <span>CivicFix</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={17} /> Admin Dashboard
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

              {/* User Profile Pill & Logout */}
              <div className="user-badge">
                <span>{user?.name}</span>
                <span className={`role-pill ${isAdmin ? 'admin' : ''}`}>
                  {user?.role}
                </span>
              </div>

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
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
