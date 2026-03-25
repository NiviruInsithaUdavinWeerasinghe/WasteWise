import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'individual', // default role
    phoneNumber: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === 'company-seller') {
      payload.companyDetails = {
        brNumber: formData.brNumber,
        address: formData.address
      };
    }

    if (formData.role === 'deliveryman') {
      payload.phoneNumber = formData.phoneNumber;
      payload.address = formData.address;
    }

    const result = await register(payload);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-industrial-950 flex flex-col items-center justify-center p-4">
      {/* Return to home link */}
      <Link to="/" className="absolute top-6 left-6 text-industrial-400 hover:text-white transition-colors text-sm font-medium">
        &larr; Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-industrial-900 rounded-2xl border border-industrial-800 p-8 shadow-2xl mt-12"
      >
        <div className="text-center mb-8">
          <div className="bg-nature-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-industrial-400">Join WasteWise to participate in the circular economy</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center text-red-500 text-sm">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-industrial-300 mb-2">Full Name / Company Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-industrial-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-industrial-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-industrial-300 mb-2">Account Type</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
            >
              <option value="individual">Individual</option>
              <option value="company-seller">Factory (Seller)</option>
              <option value="company-buyer">Recycler (Buyer)</option>
              <option value="deliveryman">Deliveryman</option>
            </select>
          </div>

          {formData.role === 'company-seller' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-industrial-300 mb-2">Business Registration (BR) Number</label>
                <input
                  type="text"
                  name="brNumber"
                  value={formData.brNumber || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
                  placeholder="e.g. PV 12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-industrial-300 mb-2">Company Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
                  placeholder="123 Industrial Park, Colombo"
                />
              </div>
            </motion.div>
          )}

          {formData.role === 'deliveryman' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-industrial-300 mb-2">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
                  placeholder="e.g. +94 77 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-industrial-300 mb-2">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-nature-500 transition-shadow shadow-inner"
                  placeholder="Street, City"
                />
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-nature-500 hover:bg-nature-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-industrial-400">
          <p>Already have an account? <Link to="/login" className="text-nature-400 cursor-pointer hover:underline">Sign in instead</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
