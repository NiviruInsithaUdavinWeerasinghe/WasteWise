import React, { useState } from 'react';
import Marketplace from './pages/Marketplace';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import IndividualDashboard from './pages/IndividualDashboard';
import Notifications from './pages/Notifications';
import UploadWizard from './components/UploadWizard';
import { AnimatePresence, motion } from 'framer-motion';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Or unauthorized page
  }

  return children;
}

function RoleBasedDashboard({ onOpenUpload }) {
  const { user } = useAuth();
  
  switch(user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'company-seller': return <SellerDashboard onOpenUpload={onOpenUpload} />;
    case 'company-buyer': return <BuyerDashboard />;
    case 'individual': return <IndividualDashboard />;
    default: return <Navigate to="/" />;
  }
}



function AppContent() {
  const [showUpload, setShowUpload] = useState(false);
  
  return (
    <div className="bg-industrial-950 text-industrial-100 min-h-screen flex flex-col">
      <Navbar toggleUpload={() => setShowUpload(!showUpload)} showUpload={showUpload} />
      
      <main className="flex-grow pt-16 relative">
          <Routes>
            <Route path="/" element={<Home onOpenUpload={() => setShowUpload(true)} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/notifications" element={<Notifications />} />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <RoleBasedDashboard onOpenUpload={() => setShowUpload(true)} />
                </div>
              </PrivateRoute>
            } />
          </Routes>
        
        {/* Modal Overlay for Upload (Global) */}
        <AnimatePresence>
          {showUpload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowUpload(false)}
                 className="absolute inset-0 bg-industrial-900/60 backdrop-blur-sm"
               />
               <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative z-50 w-full max-w-2xl"
               >
                 <button 
                   onClick={() => setShowUpload(false)}
                   className="absolute -top-12 right-0 text-white hover:text-nature-300 font-medium"
                 >
                   Close (Esc)
                 </button>
                 <UploadWizard />
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
