import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Factory, Truck, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role, role === 'admin' ? 'Admin User' : 'Demo User');
    navigate('/dashboard');
  };

  const roles = [
    { id: 'company-seller', label: 'Factory (Seller)', icon: Factory, color: 'bg-nature-500', desc: 'Sell waste, get certs' },
    { id: 'company-buyer', label: 'Recycler (Buyer)', icon: Truck, color: 'bg-blue-500', desc: 'Bid on bulk materials' },
    { id: 'individual', label: 'Individual', icon: User, color: 'bg-orange-500', desc: 'Small scale scrap' },
    { id: 'admin', label: 'Platform Admin', icon: ShieldCheck, color: 'bg-industrial-700', desc: 'Manage system' },
  ];

  return (
    <div className="min-h-screen bg-industrial-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to WasteWise</h1>
          <p className="text-industrial-400">Select your role to access the industrial circular economy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleLogin(role.id)}
              className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left transition-all hover:scale-105"
            >
              <div className={`${role.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <role.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{role.label}</h3>
              <p className="text-sm text-industrial-400">{role.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
