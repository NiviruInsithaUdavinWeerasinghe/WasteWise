import React from 'react';
import { Leaf, Recycle, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ toggleUpload, showUpload }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isDashboard = location.pathname.includes('dashboard');

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-industrial-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-nature-600 p-2 rounded-lg text-white shadow-lg shadow-nature-200">
              <Recycle size={24} />
            </div>
            <span className="text-2xl font-bold text-industrial-900 tracking-tight font-sans">WasteWise</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {!isDashboard && (
              <>
                <button onClick={() => navigate('/marketplace')} className="text-industrial-600 hover:text-nature-600 font-medium transition-colors">Marketplace</button>
                <button onClick={() => navigate('/')} className="text-industrial-600 hover:text-nature-600 font-medium transition-colors">Compliance</button>
                <button onClick={() => navigate('/')} className="text-industrial-600 hover:text-nature-600 font-medium transition-colors">Logistics</button>
              </>
            )}
            {isDashboard && <span className="text-industrial-400 font-medium px-4 py-1 bg-industrial-50 rounded-full flex items-center gap-2">
              <User size={14} /> {user?.name} ({user?.role})
            </span>}
          </div>

          <div className="flex items-center gap-4">
             {user ? (
               <>
                 {user.role === 'company-seller' && (
                    <button 
                        onClick={toggleUpload}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-nature-600 hover:bg-nature-700 text-white rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                    <Leaf size={18} />
                    <span className="font-medium">{showUpload ? 'Close Portal' : 'Sell Waste'}</span>
                    </button>
                 )}
                 <button onClick={handleLogout} className="p-2 text-industrial-600 hover:text-red-600 transition-colors" title="Logout">
                   <LogOut size={20} />
                 </button>
               </>
             ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 bg-industrial-900 text-white rounded-lg font-medium hover:bg-industrial-800 transition-colors"
                >
                  Log In
                </button>
             )}
             
             <button className="p-2 md:hidden text-industrial-600">
               <Menu />
             </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
