import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Building2, MapPin, Camera, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import { API_BASE_URL } from '../config/api';

export default function Account() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [address, setAddress] = useState(user?.companyDetails?.address || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await uploadFileToCloudinary(file);
      setProfilePhoto(data.secure_url);
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to upload photo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name,
          profilePhoto,
          phoneNumber,
          companyDetails: {
            address
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedFields = {
          name: data.name,
          profilePhoto: data.profilePhoto,
          phoneNumber: data.phoneNumber,
          companyDetails: data.companyDetails
        };
        updateUser(updatedFields);
        setMessage({ type: 'success', text: 'Profile updated successfully! All changes are now live.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
      }
    } catch (error) {
       console.error(error);
       setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setMessage({ type: 'error', text: 'New passwords do not match.' });
    }
    
    setIsChangingPassword(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password.' });
      }
    } catch (error) {
       console.error(error);
       setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-industrial-900 rounded-2xl border border-industrial-800 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-industrial-950 to-industrial-900 p-8 border-b border-industrial-800">
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                 <div className="w-32 h-32 rounded-3xl bg-industrial-800 border-2 border-industrial-700 overflow-hidden shadow-2xl flex items-center justify-center relative">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-industrial-600" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                         <div className="w-8 h-8 border-4 border-nature-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                 </div>
                 <label className="absolute -bottom-2 -right-2 p-2 bg-nature-600 hover:bg-nature-500 text-white rounded-xl cursor-pointer shadow-lg transition-all active:scale-95 border border-nature-400/30 group-hover:scale-110">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                 </label>
              </div>
              <div className="text-center md:text-left">
                 <h1 className="text-3xl font-black text-white tracking-tight">{user?.name}</h1>
                 <p className="text-industrial-400 font-medium flex items-center justify-center md:justify-start gap-2 mt-1 lowercase">
                    <span className="bg-industrial-800 px-3 py-0.5 rounded-full text-xs font-bold border border-industrial-700">{user?.role?.replace('company-', '')}</span>
                    <span className="text-industrial-600">&bull;</span>
                    {user?.email}
                 </p>
              </div>
           </div>
        </div>

        <div className="p-8">
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-nature-500/10 text-nature-400 border-nature-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
            >
              {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
              <p className="text-sm font-bold">{message.text}</p>
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14}/> Display Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:border-nature-500 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2 opacity-60">
                <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14}/> Email Address (Locked)
                </label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-industrial-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14}/> Registered Address
                </label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:border-nature-500 outline-none transition-all shadow-inner"
                  placeholder="Street address, city, country"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-nature-500">📞</span> Contact Number
                </label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:border-nature-500 outline-none transition-all shadow-inner"
                  placeholder="e.g. +94 77 123 4567"
                />
              </div>

              {user?.role === 'company-seller' && (
                <div className="space-y-2 opacity-60">
                  <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14}/> Business Registration (Read-only)
                  </label>
                  <input 
                    type="text" 
                    disabled
                    value={user?.companyDetails?.brNumber || 'N/A'}
                    className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-industrial-400 cursor-not-allowed font-mono"
                  />
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-industrial-800 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving || isUploading}
                className="flex items-center gap-2 bg-nature-600 hover:bg-nature-500 disabled:bg-industrial-800 disabled:text-industrial-600 disabled:cursor-not-allowed text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg shadow-nature-900/40 active:scale-95"
              >
                {isSaving ? 'Saving Changes...' : <><Save size={18}/> Save Profile</>}
              </button>
            </div>
          </form>

          {/* Password Change Section */}
          <div className="mt-12 pt-8 border-t border-industrial-800">
             <h3 className="text-lg font-bold text-white mb-6">Security & Authentication</h3>
             <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest">Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:border-nature-500 outline-none transition-all shadow-inner"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:border-nature-500 outline-none transition-all shadow-inner"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-industrial-500 uppercase tracking-widest">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-white focus:border-nature-500 outline-none transition-all shadow-inner"
                      />
                   </div>
                </div>
                <div className="flex justify-end">
                   <button 
                     type="submit" 
                     disabled={isChangingPassword}
                     className="bg-industrial-800 hover:bg-industrial-700 text-white font-bold py-2 px-6 rounded-lg transition-all border border-industrial-700"
                   >
                     {isChangingPassword ? 'Changing...' : 'Update Password'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}
