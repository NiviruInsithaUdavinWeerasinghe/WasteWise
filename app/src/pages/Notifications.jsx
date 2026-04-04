import React, { useState, useEffect } from 'react';
import { Bell, Check, Award, AlertCircle, FileCheck, BellRing, Info, Trash2, Archive, ArrowLeft, CreditCard, Handshake, FileSignature, Clock, XCircle, TrendingDown, ShieldCheck, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  useEffect(() => {
    if (user?.token) fetchNotifications(currentPage);
  }, [user, currentPage]);

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotalPages(data.pages || 1);
        setTotalNotifications(data.total || 0);
      }
    } catch(e) { 
      console.error('Failed to load notifications', e); 
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch(e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch(e) {}
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        // Instead of just filtering local state, re-fetch to pull in next available notification
        fetchNotifications(currentPage);
      }
    } catch(e) {}
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'auction_won': 
      case 'auction_sold': return <Award size={20} className="text-nature-500" />;
      case 'auction_lost':
      case 'auction_ended_empty': return <XCircle size={20} className="text-red-400" />;
      case 'outbid': return <TrendingDown size={20} className="text-orange-500" />;
      case 'ending_soon': return <Clock size={20} className="text-yellow-500" />;
      case 'certificate': return <ShieldCheck size={20} className="text-nature-400" />;
      case 'agreement_created':
      case 'contract_proposed': return <FileSignature size={20} className="text-blue-500" />;
      case 'contract_signed':
      case 'contract_established': return <Handshake size={20} className="text-cyan-400" />;
      case 'payment_received': return <CreditCard size={20} className="text-emerald-500" />;
      case 'payment_defaulted': return <AlertTriangle size={20} className="text-red-500" />;
      case 'admin_alert': return <BellRing size={20} className="text-red-500" />;
      case 'marketplace_alert': return <ShoppingCart size={20} className="text-purple-400" />;
      default: return <Info size={20} className="text-industrial-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-industrial-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-industrial-900 border border-industrial-800 text-industrial-400 hover:text-white transition-colors"
             >
                <ArrowLeft size={20} />
             </button>
             <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-3xl font-bold text-white tracking-tight">Notification Center</h1>
                    {totalNotifications > 0 && (
                       <span className="px-2.5 py-0.5 rounded-full bg-industrial-800 text-industrial-400 text-sm font-bold border border-industrial-700 shadow-inner">
                          {totalNotifications}
                       </span>
                    )}
                </div>
                <p className="text-industrial-500 mt-1 font-medium">Manage all your alerts and activity logs</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={handleMarkAllAsRead}
                className="px-6 py-2.5 rounded-xl bg-nature-600 hover:bg-nature-700 text-white font-bold transition-all shadow-lg shadow-nature-900/20 active:scale-95 flex items-center gap-2"
             >
                <Check size={18} /> Mark all as read
             </button>
          </div>
        </div>

        <div className="bg-industrial-900 rounded-2xl border border-industrial-800 shadow-xl overflow-hidden">
          {loading ? (
             <div className="p-20 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-nature-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-industrial-500 font-medium">Loading activity...</p>
             </div>
          ) : notifications.length === 0 ? (
             <div className="p-20 text-center">
                <div className="w-20 h-20 bg-industrial-800 rounded-full flex items-center justify-center mx-auto mb-6 text-industrial-600 border border-industrial-700 shadow-inner">
                   <Archive size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inbox is clean!</h3>
                <p className="text-industrial-500 max-w-xs mx-auto">You don't have any notifications at the moment. We'll alert you when something happens.</p>
             </div>
          ) : (
             <div className="divide-y divide-industrial-800/50">
                {notifications.map((n, i) => (
                   <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={n._id} 
                      className={`group relative p-6 flex gap-6 transition-all ${!n.isRead ? 'bg-industrial-800/10 hover:bg-industrial-800/20' : 'hover:bg-industrial-800/10'}`}
                   >
                      {!n.isRead && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-nature-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] z-10 ${i === 0 ? 'rounded-tl-2xl' : ''}`} />
                      )}

                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-industrial-800 border border-industrial-700 shadow-lg shadow-black/20' : 'bg-industrial-950/50'}`}>
                         {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <span className={`text-xs font-bold uppercase tracking-widest ${!n.isRead ? 'text-nature-500' : 'text-industrial-500'}`}>{n.type?.replace('_', ' ')}</span>
                            <span className="text-xs text-industrial-500 font-medium">{new Date(n.createdAt).toLocaleString()}</span>
                         </div>
                         <h4 className={`text-lg transition-colors leading-relaxed ${!n.isRead ? 'text-white font-bold' : 'text-industrial-400 font-medium'}`}>{n.message}</h4>
                      </div>
                      <div className="flex flex-col gap-2 justify-center">
                        {!n.isRead && (
                          <button 
                             onClick={() => handleMarkAsRead(n._id)}
                             className="p-3 rounded-xl bg-nature-500 text-white hover:bg-nature-400 transition-all shadow-lg shadow-nature-900/40 active:scale-90"
                             title="Mark as read"
                          >
                             <Check size={20} strokeWidth={3} />
                          </button>
                        )}
                        <button 
                           onClick={() => handleDeleteNotification(n._id)}
                           className="p-3 rounded-xl bg-industrial-800 text-industrial-400 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                           title="Delete notification"
                        >
                           <Trash2 size={20} />
                        </button>
                      </div>
                   </motion.div>
                ))}
              </div>
           )}

           {/* Pagination Controls */}
           {totalPages > 1 && (
              <div className="p-6 bg-industrial-950/30 border-t border-industrial-800/50 flex items-center justify-between">
                 <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold ${currentPage === 1 ? 'border-industrial-800 text-industrial-600 cursor-not-allowed' : 'border-industrial-700 bg-industrial-800 text-industrial-300 hover:text-white hover:bg-industrial-700 active:scale-95'}`}
                 >
                    <ArrowLeft size={18} /> Previous
                 </button>
                 
                 <div className="flex items-center gap-2">
                    <span className="text-industrial-500 text-sm font-bold uppercase tracking-widest">Page</span>
                    <span className="w-10 h-10 rounded-lg bg-nature-600/20 border border-nature-600/30 flex items-center justify-center text-nature-500 font-bold">
                       {currentPage}
                    </span>
                    <span className="text-industrial-500 text-sm font-bold uppercase tracking-widest px-2">of</span>
                    <span className="text-industrial-300 text-sm font-bold">{totalPages}</span>
                 </div>

                 <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold ${currentPage === totalPages ? 'border-industrial-800 text-industrial-600 cursor-not-allowed' : 'border-industrial-700 bg-industrial-800 text-industrial-300 hover:text-white hover:bg-industrial-700 active:scale-95'}`}
                 >
                    Next <div className="rotate-180"><ArrowLeft size={18} /></div>
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
