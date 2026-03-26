import React, { useState, useEffect } from 'react';
import DashboardChart from '../components/DashboardChart.jsx';
import HistoryTable from '../components/HistoryTable.jsx';
import { Users, AlertTriangle, CheckCircle, Shield, Building2, MapPin, Mail, X, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '../components/StatCard.jsx';

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [failedTransactions, setFailedTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [platformActivity, setPlatformActivity] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalVerifiedFactories: 0,
    totalUsers: 0,
    totalCertificates: 0
  });
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [filterDate, setFilterDate] = useState(getTodayDate());
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingUsers();
    fetchFailedTransactions();
    fetchAdminStats();
    fetchPlatformActivity();
  }, [user, filterDate]);

  const fetchFailedTransactions = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch('http://localhost:5000/api/listings/failed', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFailedTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch failed transactions', error);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/pending', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch pending users', error);
    }
  };

  const fetchAdminStats = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin-stats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChartData(data.chartData);
        setSummaryStats(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats', error);
    }
  };

  const fetchPlatformActivity = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/auth/activity?date=${filterDate}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        setPlatformActivity(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch platform activity', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/approve/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        // Remove approved user from UI
        setPendingUsers(prev => prev.filter(u => u._id !== id));
        setSelectedUser(null); // Close modal on success
      }
    } catch (error) {
      console.error('Failed to approve user', error);
    }
  };


  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-industrial-900 via-industrial-800 to-industrial-900 rounded-2xl p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border border-industrial-800">
        <div>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">System Administration</h2>
          <p className="text-industrial-400 max-w-xl text-sm">Oversee platform activity, manage user verifications, and monitor the circular economy metrics across Sri Lanka.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          index={0}
          icon={AlertTriangle}
          label="Pending Approvals"
          value={pendingUsers.length}
          color="orange"
        />
        <StatCard
          index={1}
          icon={Building2}
          label="Verified Factories"
          value={summaryStats.totalVerifiedFactories}
          color="blue"
        />
        <StatCard
          index={2}
          icon={Users}
          label="Total Users Active"
          value={summaryStats.totalUsers.toLocaleString()}
          color="purple"
        />
        <StatCard
          index={3}
          icon={Shield}
          label="Certificates Issued"
          value={summaryStats.totalCertificates.toLocaleString()}
          color="nature"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[360px]">
          <DashboardChart
            title="Platform Traffic & Transactions"
            data={chartData}
            series1Name="Transactions"
            series2Name="New Users"
            series1Key="transactions"
            series2Key="newUsers"
          />
        </div>

        {/* Verification Queue Panel */}
        <div className="bg-industrial-900 rounded-2xl shadow-xl border border-industrial-800 overflow-hidden flex flex-col h-[360px]">
          <div className="p-5 border-b border-industrial-800 bg-industrial-950/50">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-orange-500" />
              Verification Queue
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-0.5 rounded-full ml-auto font-bold">{pendingUsers.length}</span>
            </h3>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
            {pendingUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-industrial-500">
                <CheckCircle size={48} className="text-nature-500/50 mb-3 opacity-50" />
                <p className="text-sm font-medium">All users verified!</p>
              </div>
            ) : (
              pendingUsers.map((u, idx) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUser(u)}
                  key={u._id}
                  className="flex items-center gap-4 p-4 border border-industrial-800 rounded-xl cursor-pointer hover:border-nature-500/50 hover:bg-industrial-800/50 transition-all group bg-industrial-950/30"
                >
                  <div className="w-12 h-12 bg-industrial-800 rounded-xl flex items-center justify-center text-industrial-400 font-bold shrink-0 group-hover:bg-nature-500/20 group-hover:text-nature-400 transition-colors border border-industrial-700">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate">{u.name}</div>
                    <div className="text-xs text-industrial-500 flex items-center gap-1 mt-0.5">
                      {u.role === 'company-seller' ? (
                        <><Building2 size={12} /> BR: <span className="font-mono text-industrial-400">{u.companyDetails?.brNumber}</span></>
                      ) : (
                        <><Shield size={12} /> Role: <span className="text-industrial-400 capitalize">{u.role}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-nature-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    &rarr;
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-industrial-900 rounded-2xl shadow-xl border border-industrial-800 p-6 overflow-hidden">
        <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} /> System Alerts: Failed Transactions
        </h3>
        {failedTransactions.length === 0 ? (
          <p className="text-industrial-400 text-sm">No failed transactions reported.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse table-auto">
              <thead className="text-xs text-industrial-400 uppercase bg-industrial-950/50 border-y border-industrial-800">
                <tr>
                  <th className="px-4 py-4 font-bold tracking-wider">Listing ID</th>
                  <th className="px-4 py-4 font-bold tracking-wider">Seller</th>
                  <th className="px-4 py-4 font-bold tracking-wider">Highest Bidder (Defaulted)</th>
                  <th className="px-4 py-4 font-bold tracking-wider">Failed Date</th>
                </tr>
              </thead>
              <tbody>
                {failedTransactions.map(t => {
                  let defaultingBuyer = 'Unknown Buyer';
                  let failedDate = new Date(t.updatedAt).toLocaleDateString();

                  // Prioritize newest default if available (even if reassigned)
                  if (t.defaultedBids && t.defaultedBids.length > 0) {
                    const latestDefault = t.defaultedBids[t.defaultedBids.length - 1];
                    defaultingBuyer = latestDefault.userId?.name || 'Unknown User';
                    failedDate = new Date(latestDefault.date).toLocaleDateString();
                  } else if (t.bids && t.bids.length > 0) {
                    // Fallback for direct status === 'failed_payment'
                    const highestBid = t.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                    defaultingBuyer = highestBid.userId?.name || 'Unknown User';
                  }

                  return (
                    <tr key={t._id} className="border-b border-industrial-800 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                      <td className="px-4 py-4 text-white font-mono">{t._id}</td>
                      <td className="px-4 py-4 text-industrial-300">{t.sellerId?.name || 'System Listing'}</td>
                      <td className="px-4 py-4 text-red-400 font-bold">{defaultingBuyer}</td>
                      <td className="px-4 py-4 text-industrial-400">{failedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-industrial-900 rounded-2xl shadow-xl border border-industrial-800 p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-industrial-400" /> Recent Platform Activity
          </h3>
          <div className="flex items-center gap-3 bg-industrial-950 px-4 py-2 rounded-xl border border-industrial-800">
            <span className="text-xs font-bold text-industrial-500 uppercase tracking-wider">Filter By Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none text-white text-sm font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
        <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <HistoryTable role="admin" data={platformActivity} />
        </div>
      </div>

      {/* User Details Popup Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-industrial-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", bounce: 0.5, duration: 0.6 }
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-50 bg-industrial-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-industrial-700"
            >
              <div className="bg-industrial-950/50 p-6 border-b border-industrial-800 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-nature-600 to-nature-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-nature-900/50 border border-nature-500/30">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{selectedUser.name}</h3>
                    <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold px-2.5 py-1 rounded-full mt-2">
                      <AlertTriangle size={12} /> Pending {selectedUser.role === 'company-seller' ? 'Factory' : 'Courier'} Verification
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-industrial-500 hover:text-white transition-colors bg-industrial-800/50 hover:bg-industrial-700 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><Mail size={14} /> Contact Email</p>
                    <p className="text-sm font-medium text-white">{selectedUser.email}</p>
                  </div>

                  {selectedUser.role === 'company-seller' ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><Building2 size={14} /> BR Number</p>
                      <p className="text-sm font-medium text-white font-mono bg-industrial-950 px-3 py-1.5 rounded-lg border border-industrial-800 inline-block shadow-inner">{selectedUser.companyDetails?.brNumber}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><Phone size={14} /> Contact Number</p>
                      <p className="text-sm font-medium text-white font-mono bg-industrial-950 px-3 py-1.5 rounded-lg border border-industrial-800 inline-block shadow-inner">{selectedUser.phoneNumber || "No contact info provided"}</p>
                    </div>
                  )}

                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><MapPin size={14} /> {selectedUser.role === 'company-seller' ? 'Registered Address' : 'Residential Address'}</p>
                    <p className="text-sm font-medium text-industrial-300 bg-industrial-950 p-4 rounded-xl border border-industrial-800 shadow-inner leading-relaxed">
                      {selectedUser.role === 'company-seller' ? selectedUser.companyDetails?.address : selectedUser.address || "Address not provided."}
                    </p>
                  </div>
                </div>

                <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 text-sm text-orange-200/90 flex gap-3 items-start">
                  <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-orange-400 block mb-1">Administrator Check Required</span>
                    {selectedUser.role === 'company-seller'
                      ? "Please verify the Business Registration number against the official government database before approving this factory."
                      : "Please contact the deliveryman and verify their residential address and identity before approval."}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-industrial-800 flex gap-4 bg-industrial-950/30">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 px-4 font-bold text-industrial-400 bg-industrial-800 hover:bg-industrial-700 hover:text-white rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApprove(selectedUser._id)}
                  className="flex-1 py-3 px-4 font-bold text-white bg-nature-600 hover:bg-nature-500 shadow-lg shadow-nature-900/50 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Approve {selectedUser.role === 'company-seller' ? 'Factory' : 'Courier'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
