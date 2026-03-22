import React, { useState, useEffect } from 'react';
import DashboardChart from '../components/DashboardChart.jsx';
import HistoryTable from '../components/HistoryTable.jsx';
import { Users, AlertTriangle, CheckCircle, Shield, Building2, MapPin, Mail, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [failedTransactions, setFailedTransactions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingSellers();
    fetchFailedTransactions();
  }, [user]);

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

  const fetchPendingSellers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/pending', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingSellers(data);
      }
    } catch (error) {
      console.error('Failed to fetch pending sellers', error);
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
        // Remove approved seller from UI
        setPendingSellers(prev => prev.filter(s => s._id !== id));
        setSelectedSeller(null); // Close modal on success
      }
    } catch (error) {
      console.error('Failed to approve seller', error);
    }
  };

  const customStats = [
    { label: 'Pending Approvals', val: pendingSellers.length, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Total Verified Factories', val: '142', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Users Active', val: '2,894', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Certificates Issued', val: '15,300+', icon: Shield, color: 'text-nature-400', bg: 'bg-nature-500/10' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-industrial-900 via-industrial-800 to-industrial-900 rounded-2xl p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border border-industrial-800">
         <div>
           <h2 className="text-3xl font-bold mb-2 tracking-tight">System Administration</h2>
           <p className="text-industrial-400 max-w-xl text-sm">Oversee platform activity, manage user verifications, and monitor the circular economy metrics across Sri Lanka.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {customStats.map((stat, i) => (
          <div key={i} className="bg-industrial-900 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-industrial-800 flex items-center gap-4 group">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-industrial-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-white mt-1">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <DashboardChart title="Platform Traffic & Transactions" />
        </div>
        
        {/* Verification Queue Panel */}
        <div className="bg-industrial-900 rounded-2xl shadow-xl border border-industrial-800 overflow-hidden flex flex-col h-[400px]">
           <div className="p-5 border-b border-industrial-800 bg-industrial-950/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                 <Shield size={18} className="text-orange-500" />
                 Verification Queue
                 <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-0.5 rounded-full ml-auto font-bold">{pendingSellers.length}</span>
              </h3>
           </div>
           
           <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
              {pendingSellers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-industrial-500">
                   <CheckCircle size={48} className="text-nature-500/50 mb-3 opacity-50" />
                   <p className="text-sm font-medium">All factories verified!</p>
                </div>
              ) : (
                pendingSellers.map((seller, idx) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSeller(seller)}
                    key={seller._id} 
                    className="flex items-center gap-4 p-4 border border-industrial-800 rounded-xl cursor-pointer hover:border-nature-500/50 hover:bg-industrial-800/50 transition-all group bg-industrial-950/30"
                  >
                     <div className="w-12 h-12 bg-industrial-800 rounded-xl flex items-center justify-center text-industrial-400 font-bold shrink-0 group-hover:bg-nature-500/20 group-hover:text-nature-400 transition-colors border border-industrial-700">
                       {seller.name.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="font-bold text-sm text-white truncate">{seller.name}</div>
                       <div className="text-xs text-industrial-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} /> BR: <span className="font-mono text-industrial-400">{seller.companyDetails?.brNumber}</span>
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
                        let defaultingBuyer = 'Unknown';
                        if (t.bids && t.bids.length > 0) {
                           const highestBid = t.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                           defaultingBuyer = highestBid.userId?.name || 'Unknown User';
                        }
                        return (
                           <tr key={t._id} className="border-b border-industrial-800 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                              <td className="px-4 py-4 text-white font-mono">{t._id}</td>
                              <td className="px-4 py-4 text-industrial-300">{t.sellerId?.name}</td>
                              <td className="px-4 py-4 text-red-400 font-bold">{defaultingBuyer}</td>
                              <td className="px-4 py-4 text-industrial-400">{new Date(t.updatedAt).toLocaleDateString()}</td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      <div className="bg-industrial-900 rounded-2xl shadow-xl border border-industrial-800 p-6 overflow-hidden">
         <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Users size={18} className="text-industrial-400" /> Recent Platform Activity
         </h3>
         <HistoryTable role="admin" />
      </div>

      {/* Seller Details Popup Modal */}
      <AnimatePresence>
         {selectedSeller && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedSeller(null)}
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
                           {selectedSeller.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white">{selectedSeller.name}</h3>
                           <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold px-2.5 py-1 rounded-full mt-2">
                              <AlertTriangle size={12} /> Pending Verification
                           </span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedSeller(null)} className="text-industrial-500 hover:text-white transition-colors bg-industrial-800/50 hover:bg-industrial-700 p-2 rounded-full">
                        <X size={20}/>
                     </button>
                  </div>

                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><Mail size={14}/> Contact Email</p>
                           <p className="text-sm font-medium text-white">{selectedSeller.email}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><Building2 size={14}/> BR Number</p>
                           <p className="text-sm font-medium text-white font-mono bg-industrial-950 px-3 py-1.5 rounded-lg border border-industrial-800 inline-block shadow-inner">{selectedSeller.companyDetails?.brNumber}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                           <p className="text-xs font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1"><MapPin size={14}/> Registered Address</p>
                           <p className="text-sm font-medium text-industrial-300 bg-industrial-950 p-4 rounded-xl border border-industrial-800 shadow-inner leading-relaxed">{selectedSeller.companyDetails?.address || "Address not provided during registration."}</p>
                        </div>
                     </div>
                     
                     <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 text-sm text-orange-200/90 flex gap-3 items-start">
                        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <span className="font-bold text-orange-400 block mb-1">Administrator Check Required</span>
                          Please verify the Business Registration number against the official government database before approving this factory.
                        </div>
                     </div>
                  </div>

                  <div className="p-6 border-t border-industrial-800 flex gap-4 bg-industrial-950/30">
                     <button 
                       onClick={() => setSelectedSeller(null)}
                       className="flex-1 py-3 px-4 font-bold text-industrial-400 bg-industrial-800 hover:bg-industrial-700 hover:text-white rounded-xl transition-all"
                     >
                       Close
                     </button>
                     <button 
                       onClick={() => handleApprove(selectedSeller._id)}
                       className="flex-1 py-3 px-4 font-bold text-white bg-nature-600 hover:bg-nature-500 shadow-lg shadow-nature-900/50 rounded-xl transition-all flex items-center justify-center gap-2"
                     >
                       <CheckCircle size={18} /> Approve Factory
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
