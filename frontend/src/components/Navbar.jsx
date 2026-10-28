import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../utils/userSlice';
import api from '../utils/api';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network failure on logout
    }
    dispatch(logout());
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
      isActive
        ? 'bg-emerald-50 text-emerald-800 font-semibold'
        : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-2.5 text-base font-medium rounded-xl transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-800 font-semibold'
        : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Campus<span className="text-emerald-600">Find</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-3xs font-semibold tracking-wider text-emerald-700 uppercase bg-emerald-50 border border-emerald-200/60 rounded-full">
                  Portal
                </span>
              </div>
              <p className="text-3xs text-slate-400 font-medium tracking-wide hidden sm:block">
                Campus Lost &amp; Found Network
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/lost-items" className={navLinkClass}>
              Lost Items
            </NavLink>
            <NavLink to="/found-items" className={navLinkClass}>
              Found Items
            </NavLink>
            <NavLink to="/report-lost" className={navLinkClass}>
              Report Lost
            </NavLink>
            <NavLink to="/report-found" className={navLinkClass}>
              Report Found
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-reports" className={navLinkClass}>
                My Reports
              </NavLink>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/my-reports"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user?.name || 'Student'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md cursor-pointer"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle mobile navigation menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <NavLink
            to="/"
            end
            className={mobileNavLinkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/lost-items"
            className={mobileNavLinkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Lost Items
          </NavLink>
          <NavLink
            to="/found-items"
            className={mobileNavLinkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Found Items
          </NavLink>
          <NavLink
            to="/report-lost"
            className={mobileNavLinkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Report Lost Item
          </NavLink>
          <NavLink
            to="/report-found"
            className={mobileNavLinkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Report Found Item
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/my-reports"
              className={mobileNavLinkClass}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Reports
            </NavLink>
          )}

          <div className="pt-4 mt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
