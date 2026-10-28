import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ItemCard from '../components/ItemCard';
import LoadingState from '../components/LoadingState';

export default function HomePage() {
  const [stats, setStats] = useState({
    activeLost: 0,
    activeFound: 0,
    totalReclaimed: 0,
    totalProcessed: 0
  });
  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.stats || {});
          setRecentLost(res.data.recentLost || []);
          setRecentFound(res.data.recentFound || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/60 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Official Campus Community Portal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Lost something on campus? <br />
              <span className="text-emerald-600">Let's get it back to you.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              CampusFind connects students, professors, and staff to report missing belongings and match found items across campus lecture halls, libraries, cafeterias, and labs.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/report-lost"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Report a Lost Item
              </Link>
              <Link
                to="/report-found"
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Report a Found Item
              </Link>
              <Link
                to="/lost-items"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all cursor-pointer"
              >
                Browse Directory
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative background grid and blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden opacity-40">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Live Campus Statistics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-500">
                {stats.activeLost}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Active Lost Items
              </p>
            </div>

            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
                {stats.activeFound}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Active Found Items
              </p>
            </div>

            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-600">
                {stats.totalReclaimed}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Belongings Reclaimed
              </p>
            </div>

            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-800">
                {stats.totalProcessed}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                Total Reports Filed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How It Works" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
            Simple 3-Step Process
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How CampusFind Works
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Whether you misplaced your notebook, keys, or student ID card, our campus directory helps reunite you quickly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-lg flex items-center justify-center mb-4 border border-emerald-100">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Post a Report</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create a lost or found report in seconds. Specify the category, last seen location, distinguishing features, and upload a clear photograph.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-lg flex items-center justify-center mb-4 border border-emerald-100">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Search &amp; Connect</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Search real-time database records by keyword, location, and category. Find matching items and contact the finder safely.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-lg flex items-center justify-center mb-4 border border-emerald-100">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Safely Reclaim</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Coordinate a handover at a verified campus station (e.g. Library front desk or Student Center). Mark the item as resolved or returned.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Lost Reports */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Recently Reported Lost Items
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Help your fellow students locate their misplaced belongings.
            </p>
          </div>
          <Link
            to="/lost-items"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            View All Lost Items &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingState message="Loading recent lost items..." />
        ) : recentLost.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentLost.map((item) => (
              <ItemCard key={item._id} item={item} type="lost" />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-sm text-slate-500">No lost items reported recently.</p>
          </div>
        )}
      </section>

      {/* Recent Found Reports */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Recently Found Belongings
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Check if someone found an item you recently lost.
            </p>
          </div>
          <Link
            to="/found-items"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            View All Found Items &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingState message="Loading recent found items..." />
        ) : recentFound.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentFound.map((item) => (
              <ItemCard key={item._id} item={item} type="found" />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-sm text-slate-500">No found items reported recently.</p>
          </div>
        )}
      </section>

      {/* Reclaim CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-emerald-700 to-teal-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Found someone's item on campus?
            </h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              It takes less than two minutes to file a found item report. Help return essential textbooks, ID cards, and electronics to their rightful owners.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/report-found"
              className="px-6 py-3 bg-white text-emerald-800 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
            >
              Report Found Item
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
