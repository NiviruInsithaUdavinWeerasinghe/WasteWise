import React, { useState, useEffect } from 'react';
import { Leaf, Recycle, Menu, LogOut, User, Bell, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logoUrl from '../assets/logo(v2.2).png';

export default function Navbar({ toggleUpload, showUpload }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user?.token) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) setNotifications(await res.json());
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
                   <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-industrial-400 hover:text-white transition-colors" title="Notifications">
                     <Bell size={20} />
                     {unreadCount > 0 && <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">{unreadCount}</span>}
                   </button>
                   {showDropdown && (
                     <div className="absolute right-0 mt-3 w-80 bg-industrial-900 border border-industrial-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                       <div className="p-4 border-b border-industrial-800 bg-industrial-950/50 flex justify-between items-center">
                         <h3 className="font-bold text-white">Notifications</h3>
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                         {notifications.length === 0 ? (
                           <p className="p-6 text-center text-industrial-500 text-sm">No new notifications.</p>
                         ) : notifications.map(n => (
                           <div key={n._id} className={`p-4 border-b border-industrial-800 flex gap-3 ${!n.isRead ? 'bg-industrial-800/30 border-l-2 border-l-nature-500' : ''}`}>
                             <div className="flex-1">
                               <p className="text-sm text-industrial-200">{n.message}</p>
                               <span className="text-[10px] text-industrial-500 mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
                             </div>
                             {!n.isRead && (
                               <button onClick={() => handleMarkAsRead(n._id)} className="text-nature-500 hover:text-nature-400 p-1 self-start" title="Mark as read">
                                 <Check size={16} />
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
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
