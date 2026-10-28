import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">
                Campus<span className="text-emerald-600">Find</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              The official centralized campus lost and found portal designed to reconnect students, faculty, and campus visitors with their missing belongings quickly and safely.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              Web Technology IA3 Project &bull; Built with MERN Stack &bull; 2026
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Explore Portal
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/lost-items" className="hover:text-emerald-600 transition-colors">
                  Lost Items Directory
                </Link>
              </li>
              <li>
                <Link to="/found-items" className="hover:text-emerald-600 transition-colors">
                  Found Items Directory
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-emerald-600 transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-emerald-600 transition-colors">
                  Report a Found Item
                </Link>
              </li>
              <li>
                <Link to="/my-reports" className="hover:text-emerald-600 transition-colors">
                  Student Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus safety note */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Campus Safety Tip
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              When meeting to reclaim or hand over property, always arrange to meet in well-lit public campus locations such as the Student Center or Library front desk, and verify student ID before exchange.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>&copy; {new Date().getFullYear()} CampusFind. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-emerald-700 font-medium">Safe &bull; Verified &bull; Student-Centric</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
