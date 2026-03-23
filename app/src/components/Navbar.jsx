import React, { useState, useEffect } from 'react';
import { Leaf, Recycle, Menu, LogOut, User, Bell, Check, BellRing, Info, AlertCircle, ShoppingCart, Award, FileCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logoUrl from '../assets/logo(v2.2).png';

export default function Navbar({ toggleUpload, showUpload }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (user?.token) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch(e) { console.error('Failed to load notifications', e); }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch(e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`http://localhost:5000/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch(e) {}
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'auction_won': 
      case 'auction_sold': return <Award size={16} className="text-nature-500" />;
      case 'outbid': 
      case 'ending_soon': return <AlertCircle size={16} className="text-orange-500" />;
      case 'certificate': 
      case 'agreement_created': return <FileCheck size={16} className="text-blue-500" />;
      case 'admin_alert': return <BellRing size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-industrial-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isDashboard = location.pathname.includes('dashboard');

  return (
    <nav className="fixed w-full z-50 bg-industrial-950/80 backdrop-blur-md border-b border-industrial-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center justify-center p-1 rounded-lg">
              <img src={logoUrl} alt="WasteWise Logo" className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight font-sans">WasteWise</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {!isDashboard && (
              <>
                <button onClick={() => navigate('/marketplace')} className="text-industrial-300 hover:text-nature-400 font-medium transition-colors">Marketplace</button>
                <button onClick={() => navigate('/')} className="text-industrial-300 hover:text-nature-400 font-medium transition-colors">Compliance</button>
                <button onClick={() => navigate('/')} className="text-industrial-300 hover:text-nature-400 font-medium transition-colors">Logistics</button>
              </>
            )}
            {isDashboard && <span className="text-industrial-300 font-medium px-4 py-1 bg-industrial-900 rounded-full flex items-center gap-2 border border-industrial-800">
              <User size={14} /> {user?.name} ({user?.role})
            </span>}
          </div>

          <div className="flex items-center gap-4">
             {user ? (
               <>
                 <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)} 
                      className={`relative p-2 rounded-full transition-all ${showDropdown ? 'bg-industrial-800 text-white' : 'text-industrial-400 hover:text-white hover:bg-industrial-800/50'}`}
                      title="Notifications"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full min-w-[20px] h-5 px-1.5 bg-red-500 text-[10px] font-bold text-white items-center justify-center border-2 border-industrial-950 shadow-lg">
                            {displayCount}
                          </span>
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 mt-3 w-80 bg-industrial-900 border border-industrial-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                        >
                          <div className="p-4 border-b border-industrial-800/50 bg-industrial-950/30 flex justify-between items-center">
                            <div>
                               <h3 className="font-bold text-white text-sm">Notifications</h3>
                               <p className="text-[10px] text-industrial-500 font-medium uppercase tracking-wider">{unreadCount} unread messages</p>
                            </div>
                            {unreadCount > 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                                className="text-xs font-bold text-nature-500 hover:text-nature-400 transition-colors py-1.5 px-3 rounded-xl hover:bg-nature-500/10 border border-transparent hover:border-nature-500/20"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                          
                          <div className="max-h-96 overflow-y-auto custom-scrollbar bg-industrial-900">
                            {notifications.length === 0 ? (
                              <div className="p-10 text-center">
                                <Bell size={32} className="mx-auto text-industrial-700 mb-2 opacity-20" />
                                <p className="text-industrial-500 text-sm font-medium">No activity yet</p>
                              </div>
                            ) : (
                               <div className="divide-y divide-industrial-800/50">
                                 {notifications.slice(0, 10).map(n => {
                                   const isExpanded = expandedId === n._id;
                                   return (
                                     <div 
                                       key={n._id} 
                                       onClick={() => setExpandedId(isExpanded ? null : n._id)}
                                       className={`group relative p-4 flex gap-4 cursor-pointer overflow-hidden transition-colors ${!n.isRead ? 'bg-industrial-800/50 hover:bg-industrial-800/70' : 'bg-transparent hover:bg-industrial-800/20'}`}
                                     >
                                       {!n.isRead && (
                                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-nature-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] z-10" />
                                       )}
                                       
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${!n.isRead ? 'bg-industrial-800 border border-industrial-700' : 'bg-industrial-900/50'}`}>
                                         {getNotificationIcon(n.type)}
                                       </div>
                                       
                                       <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start mb-0.5">
                                           <div className={`text-sm leading-snug transition-all duration-200 overflow-hidden ${isExpanded ? 'text-white h-auto' : (n.isRead ? 'text-industrial-400 line-clamp-2 h-10' : 'text-white font-medium line-clamp-2 h-10')}`}>
                                             {n.message}
                                           </div>
                                         </div>
                                         <div className="flex items-center justify-between mt-2">
                                           <span className="text-[10px] text-industrial-500 font-medium tracking-tight">
                                             {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                           </span>
                                           
                                           <div className="flex items-center gap-2">
                                             {!n.isRead && (
                                               <button 
                                                 onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n._id); }} 
                                                 className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 bg-nature-500 text-white rounded-lg transition-all hover:bg-nature-400"
                                                 title="Mark as read"
                                               >
                                                 <Check size={14} strokeWidth={3} />
                                               </button>
                                             )}
                                             <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-industrial-800' : 'opacity-0 group-hover:opacity-100'}`}>
                                               {isExpanded ? <ChevronUp size={14} className="text-industrial-300" /> : <ChevronDown size={14} className="text-industrial-500" />}
                                             </div>
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                            )}
                          </div>
                          
                          {notifications.length > 0 && (
                            <div className="p-3 bg-industrial-950/80 border-t border-industrial-800/50 text-center">
                               <button 
                                  onClick={() => { setShowDropdown(false); navigate('/notifications'); }}
                                  className="text-[10px] font-bold text-industrial-400 hover:text-white transition-all uppercase tracking-[0.2em] flex items-center justify-center mx-auto gap-2 group"
                               >
                                 See all activity <span className="group-hover:translate-x-1 transition-transform inline-block">&rarr;</span>
                               </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                 {user.role === 'company-seller' && (
                    <button 
                        onClick={user.isApproved ? toggleUpload : null}
                        disabled={!user.isApproved}
                        className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full transition-all shadow-md ${!user.isApproved ? 'bg-industrial-800 text-industrial-500 cursor-not-allowed border border-industrial-700' : 'bg-nature-600 hover:bg-nature-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'}`}
                        title={!user.isApproved ? "Account pending admin approval" : "Sell Waste"}
                    >
                    <Leaf size={18} />
                    <span className="font-medium">{showUpload ? 'Close Portal' : 'Sell Waste'}</span>
                    </button>
                 )}
                 <button onClick={handleLogout} className="p-2 text-industrial-400 hover:text-red-400 transition-colors" title="Logout">
                   <LogOut size={20} />
                 </button>
               </>
             ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 bg-industrial-800 text-white rounded-lg font-medium hover:bg-industrial-700 transition-colors border border-industrial-700"
                >
                  Log In
                </button>
             )}
             
             <button className="p-2 md:hidden text-industrial-400">
               <Menu />
             </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
